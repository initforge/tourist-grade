param(
  [switch]$SkipCloudflaredInstall,
  [string]$TunnelName = 'travela-payos',
  [string]$TunnelHostname = 'payos.myproxypal.click'
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

function Write-Step($message) {
  Write-Host "`n==> $message" -ForegroundColor Cyan
}

function Find-Cloudflared {
  $cmd = Get-Command cloudflared -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }

  $known = @(
    'C:\Program Files\cloudflared\cloudflared.exe',
    'C:\Program Files (x86)\cloudflared\cloudflared.exe',
    "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Cloudflare.cloudflared_Microsoft.Winget.Source_8wekyb3d8bbwe\cloudflared.exe"
  )

  foreach ($path in $known) {
    if (Test-Path $path) { return $path }
  }

  return $null
}

function Ensure-EnvFile {
  $envPath = Join-Path $repoRoot 'backend\.env'
  $internalEnvPath = Join-Path $repoRoot 'backend\internal.local.env'
  if (!(Test-Path $envPath)) {
    if (Test-Path $internalEnvPath) {
      Copy-Item $internalEnvPath $envPath -Force
      Write-Host "Created backend\\.env from internal.local.env" -ForegroundColor Green
    } else {
      throw "Missing backend\\.env at $envPath"
    }
  }

  if (Test-Path $internalEnvPath) {
    Sync-InternalEnvValues $envPath $internalEnvPath
  }

  $content = Get-Content $envPath -Raw
  foreach ($key in @('PAYOS_CLIENT_ID', 'PAYOS_API_KEY', 'PAYOS_CHECKSUM_KEY')) {
    if ($content -notmatch "(?m)^$key=.+") {
      throw "backend\\.env is missing $key"
    }
  }

  return $envPath
}

function Get-EnvMap($path) {
  $map = @{}
  foreach ($rawLine in Get-Content $path) {
    $line = $rawLine.Trim()
    if ([string]::IsNullOrWhiteSpace($line) -or $line.StartsWith('#')) {
      continue
    }
    $parts = $line -split '=', 2
    if ($parts.Count -eq 2) {
      $map[$parts[0].Trim()] = $parts[1]
    }
  }
  return $map
}

function Set-EnvValue($path, $key, $value) {
  $lines = Get-Content $path
  $found = $false
  $next = foreach ($line in $lines) {
    if ($line -match "^$([regex]::Escape($key))=") {
      $found = $true
      "$key=$value"
    } else {
      $line
    }
  }
  if (!$found) { $next += "$key=$value" }
  Set-Content -Encoding UTF8 $path $next
}

function Sync-InternalEnvValues($envPath, $internalEnvPath) {
  $internalMap = Get-EnvMap $internalEnvPath
  if ($internalMap.Count -eq 0) { return }
  $currentMap = Get-EnvMap $envPath
  $keysToSync = @(
    'PAYOS_CLIENT_ID',
    'PAYOS_API_KEY',
    'PAYOS_CHECKSUM_KEY',
    'PAYOS_RETURN_URL',
    'PAYOS_CANCEL_URL',
    'PAYOS_WEBHOOK_URL',
    'CLOUDFLARE_TUNNEL_ID',
    'CLOUDFLARE_TUNNEL_NAME',
    'CLOUDFLARE_TUNNEL_HOSTNAME',
    'CLOUDFLARE_TUNNEL_CREDENTIALS_BASE64'
  )

  $changed = $false
  foreach ($key in $keysToSync) {
    if ($internalMap.ContainsKey($key) -and $currentMap[$key] -ne $internalMap[$key]) {
      Set-EnvValue $envPath $key $internalMap[$key]
      $changed = $true
    }
  }

  if ($changed) {
    Write-Host "Synced internal local env keys into backend\\.env" -ForegroundColor Green
  }
}

function Write-Utf8NoBom($path, $content) {
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($path, $content, $utf8NoBom)
}

function Wait-HttpOk($url, $seconds = 60) {
  $deadline = (Get-Date).AddSeconds($seconds)
  do {
    try {
      $response = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 5
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) { return }
    } catch {}
    Start-Sleep -Seconds 2
  } while ((Get-Date) -lt $deadline)
  throw "Could not reach $url after $seconds seconds."
}

function Test-HttpOk($url) {
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 5
    return ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300)
  } catch {
    return $false
  }
}

function Invoke-Docker($arguments, [switch]$AllowFailure) {
  $tempDir = Join-Path $repoRoot '.local'
  if (!(Test-Path $tempDir)) { New-Item -ItemType Directory $tempDir | Out-Null }
  $stdout = Join-Path $tempDir ('docker-call-' + [guid]::NewGuid().ToString() + '.out.log')
  $stderr = Join-Path $tempDir ('docker-call-' + [guid]::NewGuid().ToString() + '.err.log')

  try {
    $process = Start-Process -FilePath 'docker' -ArgumentList $arguments -RedirectStandardOutput $stdout -RedirectStandardError $stderr -Wait -PassThru -WindowStyle Hidden
    $stdoutText = if (Test-Path $stdout) { Get-Content $stdout -Raw } else { '' }
    $stderrText = if (Test-Path $stderr) { Get-Content $stderr -Raw } else { '' }
    $output = @()
    if ($stdoutText) { $output += $stdoutText.TrimEnd() }
    if ($stderrText) { $output += $stderrText.TrimEnd() }
    $exitCode = $process.ExitCode
  } finally {
    Remove-Item $stdout, $stderr -ErrorAction SilentlyContinue
  }

  if (!$AllowFailure -and $exitCode -ne 0) {
    $joined = if ($output) { ($output | Out-String).Trim() } else { '(no output)' }
    throw "docker $($arguments -join ' ') failed.`n$joined"
  }

  return @{
    ExitCode = $exitCode
    Output = $output
  }
}

function Get-BackendState {
  $result = Invoke-Docker @('inspect', '--format', '{{json .State}}', 'travela-backend') -AllowFailure
  if ($result.ExitCode -ne 0 -or !$result.Output) { return $null }
  $stateJson = ($result.Output | Out-String).Trim()
  if (!$stateJson) { return $null }
  return $stateJson | ConvertFrom-Json
}

function Show-BackendDiagnostics {
  Write-Warning 'Backend did not become reachable. Docker diagnostics:'
  $psResult = Invoke-Docker @('compose', 'ps') -AllowFailure
  if ($psResult.Output) { $psResult.Output | Out-Host }
  $stateResult = Invoke-Docker @('inspect', '--format', '{{json .State}}', 'travela-backend') -AllowFailure
  if ($stateResult.Output) {
    Write-Host "`n--- travela-backend state ---" -ForegroundColor Yellow
    $stateResult.Output | Out-Host
  }
  $portsResult = Invoke-Docker @('inspect', '--format', '{{json .NetworkSettings.Ports}}', 'travela-backend') -AllowFailure
  if ($portsResult.Output) {
    Write-Host "`n--- travela-backend published ports ---" -ForegroundColor Yellow
    $portsResult.Output | Out-Host
  }
  $internalHealthResult = Invoke-Docker @('exec', 'travela-backend', 'sh', '-lc', 'wget -q -O - http://127.0.0.1:4000/health') -AllowFailure
  if ($internalHealthResult.Output) {
    Write-Host "`n--- travela-backend internal /health ---" -ForegroundColor Yellow
    $internalHealthResult.Output | Out-Host
  }
  $logResult = Invoke-Docker @('compose', 'logs', '--tail=120', 'backend') -AllowFailure
  if ($logResult.Output) { $logResult.Output | Out-Host }
  try {
    $tcp4000 = Test-NetConnection -ComputerName 127.0.0.1 -Port 4000 -WarningAction SilentlyContinue
    Write-Host "`n--- host 127.0.0.1:4000 ---" -ForegroundColor Yellow
    $tcp4000 | Select-Object ComputerName,RemotePort,TcpTestSucceeded | Format-List | Out-Host
  } catch {}
}

function Wait-BackendReady($seconds = 300) {
  $deadline = (Get-Date).AddSeconds($seconds)
  $urls = @(
    'http://127.0.0.1:4000/health',
    'http://localhost:4000/health'
  )

  do {
    foreach ($url in $urls) {
      if (Test-HttpOk $url) {
        return $url
      }
    }

    $state = Get-BackendState
    if ($state -and -not $state.Running) {
      Show-BackendDiagnostics
      throw "Backend container is not running. ExitCode=$($state.ExitCode)"
    }

    Start-Sleep -Seconds 3
  } while ((Get-Date) -lt $deadline)

  Show-BackendDiagnostics
  throw "Backend did not become reachable after $seconds seconds on localhost or 127.0.0.1."
}

function Confirm-PayOSWebhook($token, $attempts = 5) {
  for ($attempt = 1; $attempt -le $attempts; $attempt++) {
    try {
      return Invoke-RestMethod -Method Post -Uri 'http://localhost:4000/api/v1/payments/payos/confirm-webhook' -Headers @{ Authorization = "Bearer $token" }
    } catch {
      if ($attempt -eq $attempts) { throw }
      Start-Sleep -Seconds (2 * $attempt)
    }
  }
}

function Get-CloudflareCertInfo($certPath) {
  if (!(Test-Path $certPath)) {
    return @{
      Valid = $false
      Reason = "Missing Cloudflare cert at $certPath"
    }
  }

  $raw = Get-Content $certPath -Raw
  if ([string]::IsNullOrWhiteSpace($raw)) {
    return @{
      Valid = $false
      Reason = "Cloudflare cert at $certPath is empty"
    }
  }

  $lines = Get-Content $certPath | Where-Object { $_ -and $_ -notmatch '^-----' }
  if (!$lines -or $lines.Count -eq 0) {
    return @{
      Valid = $false
      Reason = "Cloudflare cert at $certPath does not contain a valid Argo token payload"
    }
  }

  try {
    $payload = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String(($lines -join '')))
    $json = $payload | ConvertFrom-Json
    if (!$json.zoneID -or !$json.accountID -or !$json.apiToken) {
      return @{
        Valid = $false
        Reason = "Cloudflare cert at $certPath is missing zone/account/api token fields"
      }
    }

    return @{
      Valid = $true
      ZoneId = $json.zoneID
      AccountId = $json.accountID
    }
  } catch {
    return @{
      Valid = $false
      Reason = "Cloudflare cert at $certPath cannot be decoded. Re-run cloudflared tunnel login."
    }
  }
}

function Invoke-Cloudflared($cloudflaredPath, $arguments) {
  $tempDir = Join-Path $repoRoot '.local'
  if (!(Test-Path $tempDir)) { New-Item -ItemType Directory $tempDir | Out-Null }
  $stdout = Join-Path $tempDir ('cloudflared-call-' + [guid]::NewGuid().ToString() + '.out.log')
  $stderr = Join-Path $tempDir ('cloudflared-call-' + [guid]::NewGuid().ToString() + '.err.log')

  try {
    $process = Start-Process -FilePath $cloudflaredPath -ArgumentList $arguments -RedirectStandardOutput $stdout -RedirectStandardError $stderr -Wait -PassThru -WindowStyle Hidden
    $outText = if (Test-Path $stdout) { Get-Content $stdout -Raw } else { '' }
    $errText = if (Test-Path $stderr) { Get-Content $stderr -Raw } else { '' }
    return @{
      ExitCode = $process.ExitCode
      StdOut = $outText
      StdErr = $errText
    }
  } finally {
    Remove-Item $stdout, $stderr -ErrorAction SilentlyContinue
  }
}

function Get-TunnelInfo($cloudflaredPath, $name) {
  $result = Invoke-Cloudflared $cloudflaredPath @('tunnel', 'list', '--output', 'json')
  if (!$result.StdOut) { return $null }
  $jsonText = $result.StdOut.Trim()
  if (!$jsonText.StartsWith('[')) { return $null }
  $tunnels = $jsonText | ConvertFrom-Json
  return $tunnels | Where-Object { $_.name -eq $name } | Select-Object -First 1
}

function Get-MachineTunnelName($baseName) {
  $hostName = if ($env:COMPUTERNAME) { $env:COMPUTERNAME } else { 'host' }
  $userName = if ($env:USERNAME) { $env:USERNAME } else { 'user' }
  $suffix = ("$hostName-$userName").ToLower() -replace '[^a-z0-9-]', '-'
  $suffix = $suffix.Trim('-')
  if ([string]::IsNullOrWhiteSpace($suffix)) {
    $suffix = 'local'
  }
  return "$baseName-$suffix"
}

function Get-SecretTunnel($envSettings, $defaultName, $defaultHostname) {
  $tunnelId = $envSettings['CLOUDFLARE_TUNNEL_ID']
  $credentialsBase64 = $envSettings['CLOUDFLARE_TUNNEL_CREDENTIALS_BASE64']
  $hostname = $envSettings['CLOUDFLARE_TUNNEL_HOSTNAME']
  $configuredName = $envSettings['CLOUDFLARE_TUNNEL_NAME']

  if ([string]::IsNullOrWhiteSpace($tunnelId) -and [string]::IsNullOrWhiteSpace($credentialsBase64) -and [string]::IsNullOrWhiteSpace($hostname)) {
    return $null
  }

  foreach ($requiredKey in @('CLOUDFLARE_TUNNEL_ID', 'CLOUDFLARE_TUNNEL_HOSTNAME', 'CLOUDFLARE_TUNNEL_CREDENTIALS_BASE64')) {
    if ([string]::IsNullOrWhiteSpace($envSettings[$requiredKey])) {
      throw "backend\\.env is missing $requiredKey. For internal one-command setup, provide CLOUDFLARE_TUNNEL_ID, CLOUDFLARE_TUNNEL_HOSTNAME, and CLOUDFLARE_TUNNEL_CREDENTIALS_BASE64 together."
    }
  }

  try {
    $decoded = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($credentialsBase64))
    $json = $decoded | ConvertFrom-Json
  } catch {
    throw 'CLOUDFLARE_TUNNEL_CREDENTIALS_BASE64 is not valid base64 JSON.'
  }

  if (!$json.TunnelID -or !$json.TunnelSecret -or !$json.AccountTag) {
    throw 'CLOUDFLARE_TUNNEL_CREDENTIALS_BASE64 does not contain a valid Cloudflare tunnel credentials JSON payload.'
  }
  if ($json.TunnelID -ne $tunnelId) {
    throw "CLOUDFLARE_TUNNEL_ID ($tunnelId) does not match TunnelID inside CLOUDFLARE_TUNNEL_CREDENTIALS_BASE64 ($($json.TunnelID))."
  }

  $cloudflaredDir = Join-Path $repoRoot '.local\cloudflared'
  if (!(Test-Path $cloudflaredDir)) {
    New-Item -ItemType Directory -Path $cloudflaredDir -Force | Out-Null
  }
  $credentialsFile = Join-Path $cloudflaredDir "$tunnelId.json"
  Write-Utf8NoBom $credentialsFile $decoded

  return @{
    Id = $tunnelId
    Name = if ([string]::IsNullOrWhiteSpace($configuredName)) { $defaultName } else { $configuredName }
    Hostname = $hostname
    CredentialsFile = $credentialsFile
    ManagedBySecret = $true
  }
}

function Ensure-NamedTunnel($cloudflaredPath, $name, $hostname) {
  $certPath = Join-Path $env:USERPROFILE '.cloudflared\cert.pem'
  $certInfo = Get-CloudflareCertInfo $certPath
  if (!$certInfo.Valid) {
    throw "$($certInfo.Reason)`nFix: delete $certPath, run 'cloudflared tunnel login', finish browser authorization, then rerun scripts/setup-local.ps1"
  }

  $selectedName = $name
  $tunnel = Get-TunnelInfo $cloudflaredPath $selectedName
  $credentialsFile = $null

  if ($tunnel) {
    $credentialsFile = Join-Path $env:USERPROFILE ".cloudflared\$($tunnel.id).json"
    if (!(Test-Path $credentialsFile)) {
      $machineTunnelName = Get-MachineTunnelName $name
      Write-Warning "Tunnel '$selectedName' exists in Cloudflare account, but credentials file is missing on this machine."
      Write-Warning "Creating/using machine-specific tunnel '$machineTunnelName' instead and repointing DNS hostname '$hostname' to it."
      $selectedName = $machineTunnelName
      $tunnel = Get-TunnelInfo $cloudflaredPath $selectedName
      if ($tunnel) {
        $credentialsFile = Join-Path $env:USERPROFILE ".cloudflared\$($tunnel.id).json"
      } else {
        $credentialsFile = $null
      }
    }
  }

  if (!$tunnel) {
    Write-Host "Creating named tunnel $selectedName ..."
    $createResult = Invoke-Cloudflared $cloudflaredPath @('tunnel', 'create', $selectedName)
    if ($createResult.ExitCode -ne 0) {
      throw "cloudflared tunnel create failed: $($createResult.StdErr.Trim())"
    }
    $tunnel = Get-TunnelInfo $cloudflaredPath $selectedName
  }

  if (!$tunnel) {
    throw "Could not create named tunnel $selectedName."
  }

  $credentialsFile = Join-Path $env:USERPROFILE ".cloudflared\$($tunnel.id).json"
  if (!(Test-Path $credentialsFile)) {
    throw "Missing tunnel credentials file: $credentialsFile`nFix: re-run 'cloudflared tunnel login' or delete stale tunnel '$selectedName' and run setup again."
  }

  $routeResult = Invoke-Cloudflared $cloudflaredPath @('tunnel', 'route', 'dns', $selectedName, $hostname)
  if ($routeResult.ExitCode -ne 0 -and $routeResult.StdErr -notmatch 'already exists') {
    throw "cloudflared tunnel route dns failed: $($routeResult.StdErr.Trim())"
  }

  return @{
    Id = $tunnel.id
    Name = $selectedName
    Hostname = $hostname
    CredentialsFile = $credentialsFile
  }
}

Write-Step 'Check backend env'
$envPath = Ensure-EnvFile
$envSettings = Get-EnvMap $envPath

Write-Step 'Check Docker'
(Invoke-Docker @('version')).Output | Out-Null

Write-Step 'Check cloudflared'
$cloudflared = Find-Cloudflared
if (!$cloudflared -and !$SkipCloudflaredInstall) {
  Write-Host 'cloudflared not found, installing with winget...'
  winget install --id Cloudflare.cloudflared --accept-package-agreements --accept-source-agreements
  $cloudflared = Find-Cloudflared
}
if (!$cloudflared) {
  throw 'cloudflared not found. Install it first: winget install --id Cloudflare.cloudflared'
}
Write-Host "cloudflared: $cloudflared"

Write-Step 'Build and start Docker stack'
(Invoke-Docker @('compose', 'up', '-d', '--build', 'db', 'backend')).Output | Out-Host
$backendHealthUrl = Wait-BackendReady 300
Write-Host "Backend health URL: $backendHealthUrl" -ForegroundColor Green

Write-Step 'Start frontend after backend is ready'
(Invoke-Docker @('compose', 'up', '-d', '--build', 'frontend')).Output | Out-Host

Write-Step 'Start named Cloudflare tunnel'
$logDir = Join-Path $repoRoot '.local'
if (!(Test-Path $logDir)) { New-Item -ItemType Directory $logDir | Out-Null }
$outLog = Join-Path $logDir 'cloudflared.out.log'
$errLog = Join-Path $logDir 'cloudflared.err.log'
$pidFile = Join-Path $logDir 'cloudflared.pid'
$configPath = Join-Path $logDir 'cloudflared.config.yml'

if (Test-Path $pidFile) {
  $oldPid = Get-Content $pidFile -ErrorAction SilentlyContinue
  if ($oldPid) {
    Stop-Process -Id ([int]$oldPid) -ErrorAction SilentlyContinue
  }
}
Remove-Item $outLog, $errLog -ErrorAction SilentlyContinue

$secretTunnel = Get-SecretTunnel $envSettings $TunnelName $TunnelHostname
if ($secretTunnel) {
  Write-Host "Using internal Cloudflare tunnel credentials from backend\\.env for hostname $($secretTunnel.Hostname)." -ForegroundColor Green
  $tunnel = $secretTunnel
} else {
  $tunnel = Ensure-NamedTunnel $cloudflared $TunnelName $TunnelHostname
}

$config = @"
tunnel: $($tunnel.Id)
credentials-file: $($tunnel.CredentialsFile)
ingress:
  - hostname: $($tunnel.Hostname)
    service: http://localhost:4000
  - service: http_status:404
"@
Write-Utf8NoBom $configPath $config

$process = Start-Process -FilePath $cloudflared -ArgumentList @('tunnel', '--config', $configPath, 'run') -RedirectStandardOutput $outLog -RedirectStandardError $errLog -WindowStyle Hidden -PassThru
Set-Content -Encoding UTF8 $pidFile $process.Id

$tunnelUrl = "https://$($tunnel.Hostname)"
Write-Host "Tunnel URL: $tunnelUrl" -ForegroundColor Green

$webhookUrl = "$tunnelUrl/api/v1/payments/payos/webhook"
Write-Step 'Write PAYOS_WEBHOOK_URL to backend env'
Set-EnvValue $envPath 'PAYOS_WEBHOOK_URL' $webhookUrl

Write-Step 'Wait for public tunnel health'
Wait-HttpOk "$tunnelUrl/health" 60

Write-Step 'Restart backend for new webhook URL'
(Invoke-Docker @('compose', 'up', '-d', '--build', 'backend')).Output | Out-Host
$backendHealthUrl = Wait-BackendReady 300
Write-Host "Backend health URL: $backendHealthUrl" -ForegroundColor Green

Write-Step 'Refresh frontend after backend restart'
(Invoke-Docker @('compose', 'up', '-d', 'frontend')).Output | Out-Host

Write-Step 'Confirm webhook with PayOS'
try {
  $loginBody = @{ email = 'admin@travela.vn'; password = '123456' } | ConvertTo-Json
  $login = Invoke-RestMethod -Method Post -Uri 'http://localhost:4000/api/v1/auth/login' -ContentType 'application/json' -Body $loginBody
  $confirm = Confirm-PayOSWebhook $login.accessToken
  Write-Host "PayOS webhook confirmed: $($confirm.webhookUrl)" -ForegroundColor Green
} catch {
  Write-Warning "Webhook URL was written, but PayOS confirm still failed: $($_.Exception.Message)"
  Write-Warning 'Named tunnel is running. Check DNS propagation and PayOS config if needed.'
}

Write-Step 'Done'
Write-Host 'Frontend: http://localhost:8080' -ForegroundColor Green
Write-Host 'Backend:  http://localhost:4000/health' -ForegroundColor Green
Write-Host "Webhook:  $webhookUrl" -ForegroundColor Green
Write-Host 'To stop the tunnel:' -ForegroundColor Yellow
Write-Host "Stop-Process -Id $($process.Id)" -ForegroundColor Yellow
