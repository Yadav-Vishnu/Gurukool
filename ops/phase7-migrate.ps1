$ErrorActionPreference = 'Stop'

$backendPath = 'C:\Users\VISHNU~1\OneDrive\Desktop\gurukool\backend'
$logPath = Join-Path $PSScriptRoot 'phase7-migrate.log'

Start-Transcript -Path $logPath -Force | Out-Null

try {
  if (-not (Test-Path $backendPath)) {
    throw "Backend path not found: $backendPath"
  }

  Set-Location $backendPath

  npm run migrate
  if ($LASTEXITCODE -ne 0) {
    throw 'Phase 7 migration failed.'
  }
}
finally {
  Stop-Transcript | Out-Null
}
