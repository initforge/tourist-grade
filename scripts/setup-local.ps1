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
  if (!(Test-Path $envPath)) {
    throw "Missing backend\\.env at $envPath"
  }

  $content = Get-Content $envPath -Raw
  foreach ($key in @('PAYOS_CLIENT_ID', 'PAYOS_API_KEY', 'PAYOS_CHECKSUM_KEY')) {
    if ($content -notmatch "(?m)^$key=.+") {
      throw "backend\\.env is missing $key"
    }
  }

  return $envPath
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

function Ensure-NamedTunnel($cloudflaredPath, $name, $hostname) {
  $certPath = Join-Path $env:USERPROFILE '.cloudflared\cert.pem'
  if (!(Test-Path $certPath)) {
    throw "Missing Cloudflare cert at $certPath. Run: cloudflared tunnel login"
  }

  $tunnel = Get-TunnelInfo $cloudflaredPath $name
  if (!$tunnel) {
    Write-Host "Creating named tunnel $name ..."
    $createResult = Invoke-Cloudflared $cloudflaredPath @('tunnel', 'create', $name)
    if ($createResult.ExitCode -ne 0) {
      throw "cloudflared tunnel create failed: $($createResult.StdErr.Trim())"
    }
    $tunnel = Get-TunnelInfo $cloudflaredPath $name
  }

  if (!$tunnel) {
    throw "Could not create named tunnel $name."
  }

  $credentialsFile = Join-Path $env:USERPROFILE ".cloudflared\$($tunnel.id).json"
  if (!(Test-Path $credentialsFile)) {
    throw "Missing tunnel credentials file: $credentialsFile"
  }

  $routeResult = Invoke-Cloudflared $cloudflaredPath @('tunnel', 'route', 'dns', $name, $hostname)
  if ($routeResult.ExitCode -ne 0 -and $routeResult.StdErr -notmatch 'already exists') {
    throw "cloudflared tunnel route dns failed: $($routeResult.StdErr.Trim())"
  }

  return @{
    Id = $tunnel.id
    Name = $name
    Hostname = $hostname
    CredentialsFile = $credentialsFile
  }
}

Write-Step 'Check backend env'
$envPath = Ensure-EnvFile

Write-Step 'Check Docker'
docker version | Out-Null

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
docker compose up -d --build
Wait-HttpOk 'http://localhost:4000/health' 90

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

$tunnel = Ensure-NamedTunnel $cloudflared $TunnelName $TunnelHostname
$config = @"
tunnel: $($tunnel.Id)
credentials-file: $($tunnel.CredentialsFile)
ingress:
  - hostname: $($tunnel.Hostname)
    service: http://localhost:4000
  - service: http_status:404
"@
Set-Content -Encoding UTF8 $configPath $config

$process = Start-Process -FilePath $cloudflared -ArgumentList @('tunnel', '--config', $configPath, 'run', $TunnelName) -RedirectStandardOutput $outLog -RedirectStandardError $errLog -WindowStyle Hidden -PassThru
Set-Content -Encoding UTF8 $pidFile $process.Id

$tunnelUrl = "https://$TunnelHostname"
Write-Host "Tunnel URL: $tunnelUrl" -ForegroundColor Green

$webhookUrl = "$tunnelUrl/api/v1/payments/payos/webhook"
Write-Step 'Write PAYOS_WEBHOOK_URL to backend env'
Set-EnvValue $envPath 'PAYOS_WEBHOOK_URL' $webhookUrl

Write-Step 'Wait for public tunnel health'
Wait-HttpOk "$tunnelUrl/health" 60

Write-Step 'Restart backend for new webhook URL'
docker compose up -d --build backend
Wait-HttpOk 'http://localhost:4000/health' 90

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
