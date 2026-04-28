param()

$ErrorActionPreference = 'Continue'
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$logDir = Join-Path $repoRoot '.local'
if (!(Test-Path $logDir)) {
  New-Item -ItemType Directory $logDir | Out-Null
}
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$logPath = Join-Path $logDir "doctor-local-$timestamp.log"

function Write-Section($title) {
  $line = "`n=== $title ==="
  $line | Tee-Object -FilePath $logPath -Append
}

function Write-Info($text) {
  $text | Tee-Object -FilePath $logPath -Append
}

function Invoke-CmdCapture($filePath, $arguments) {
  $stdout = Join-Path $logDir ('doctor-' + [guid]::NewGuid().ToString() + '.out.log')
  $stderr = Join-Path $logDir ('doctor-' + [guid]::NewGuid().ToString() + '.err.log')
  try {
    $process = Start-Process -FilePath $filePath -ArgumentList $arguments -RedirectStandardOutput $stdout -RedirectStandardError $stderr -Wait -PassThru -WindowStyle Hidden
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

function Invoke-DockerCapture($arguments) {
  return Invoke-CmdCapture 'docker' $arguments
}

function Get-CloudflareCertInfo($certPath) {
  if (!(Test-Path $certPath)) {
    return @{
      Valid = $false
      Reason = "missing"
    }
  }

  $raw = Get-Content $certPath -Raw
  if ([string]::IsNullOrWhiteSpace($raw)) {
    return @{
      Valid = $false
      Reason = "empty"
    }
  }

  $lines = Get-Content $certPath | Where-Object { $_ -and $_ -notmatch '^-----' }
  if (!$lines -or $lines.Count -eq 0) {
    return @{
      Valid = $false
      Reason = "no-payload"
    }
  }

  try {
    $payload = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String(($lines -join '')))
    $json = $payload | ConvertFrom-Json
    if (!$json.zoneID -or !$json.accountID -or !$json.apiToken) {
      return @{
        Valid = $false
        Reason = "missing-fields"
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
      Reason = "decode-failed"
    }
  }
}

function Show-Block($name, $result) {
  Write-Info("--- $name ---")
  Write-Info("ExitCode: $($result.ExitCode)")
  if ($result.StdOut) { Write-Info($result.StdOut.TrimEnd()) }
  if ($result.StdErr) { Write-Info($result.StdErr.TrimEnd()) }
}

Write-Section 'Machine'
Write-Info("Timestamp: $(Get-Date -Format s)")
Write-Info("Repo: $repoRoot")
Write-Info("User: $env:USERNAME")
Write-Info("OS: $([System.Environment]::OSVersion.VersionString)")
Write-Info("PowerShell: $($PSVersionTable.PSVersion)")

Write-Section 'Node'
try { Write-Info("node: $(node -v)") } catch { Write-Info("node: missing") }
try { Write-Info("npm: $(npm -v)") } catch { Write-Info("npm: missing") }

Write-Section 'Docker'
$dockerVersion = Invoke-DockerCapture @('version')
Show-Block 'docker version' $dockerVersion
$dockerPs = Invoke-DockerCapture @('compose', 'ps')
Show-Block 'docker compose ps' $dockerPs

Write-Section 'WSL'
try {
  $wslResult = Invoke-CmdCapture 'wsl' @('-l', '-v')
  Show-Block 'wsl -l -v' $wslResult
} catch {
  Write-Info('wsl command not available')
}

Write-Section 'Ports'
foreach ($port in @(4000, 5432, 8080)) {
  try {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction Stop | Select-Object LocalAddress,LocalPort,RemoteAddress,RemotePort,State,OwningProcess
    if ($connections) {
      Write-Info("--- port $port ---")
      $connections | Format-Table -AutoSize | Out-String | Tee-Object -FilePath $logPath -Append | Out-Host
    }
  } catch {
    Write-Info("port ${port}: no active listener or permission denied")
  }
}

Write-Section 'Env file'
$envPath = Join-Path $repoRoot 'backend\.env'
if (Test-Path $envPath) {
  $content = Get-Content $envPath -Raw
  foreach ($key in @('PAYOS_CLIENT_ID', 'PAYOS_API_KEY', 'PAYOS_CHECKSUM_KEY', 'PAYOS_WEBHOOK_URL')) {
    $present = [bool]($content -match "(?m)^$key=")
    Write-Info("$key present: $present")
  }
} else {
  Write-Info("Missing $envPath")
}

Write-Section 'Backend container'
$inspectFull = Invoke-DockerCapture @('inspect', 'travela-backend')
Show-Block 'docker inspect travela-backend' $inspectFull
$backendLogs = Invoke-DockerCapture @('compose', 'logs', '--tail=200', 'backend')
Show-Block 'docker compose logs backend' $backendLogs
$internalHealth = Invoke-DockerCapture @('exec', 'travela-backend', 'wget', '--spider', '-q', 'http://127.0.0.1:4000/health')
Show-Block 'backend internal health' $internalHealth

Write-Section 'HTTP reachability'
foreach ($url in @('http://127.0.0.1:4000/health', 'http://localhost:4000/health', 'http://localhost:8080')) {
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 10
    Write-Info("$url => $($response.StatusCode)")
  } catch {
    Write-Info("$url => FAILED: $($_.Exception.Message)")
  }
}

Write-Section 'Cloudflare'
$cloudflaredPaths = @(
  'C:\Program Files\cloudflared\cloudflared.exe',
  'C:\Program Files (x86)\cloudflared\cloudflared.exe'
)
$cloudflared = $cloudflaredPaths | Where-Object { Test-Path $_ } | Select-Object -First 1
if ($cloudflared) {
  Write-Info("cloudflared: $cloudflared")
  $cfVersion = Invoke-CmdCapture $cloudflared @('--version')
  Show-Block 'cloudflared --version' $cfVersion
  $certPath = "$env:USERPROFILE\.cloudflared\cert.pem"
  $certInfo = Get-CloudflareCertInfo $certPath
  Write-Info("cert.pem path: $certPath")
  Write-Info("cert.pem valid: $($certInfo.Valid)")
  if ($certInfo.Valid) {
    Write-Info("cert.pem zoneId: $($certInfo.ZoneId)")
    Write-Info("cert.pem accountId: $($certInfo.AccountId)")
  } else {
    Write-Info("cert.pem issue: $($certInfo.Reason)")
  }
} else {
  Write-Info('cloudflared: missing')
}

Write-Section 'Result'
Write-Info("Saved log: $logPath")
Write-Output $logPath
