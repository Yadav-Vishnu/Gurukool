$ErrorActionPreference = 'Stop'

$backendPath = 'C:\Users\VISHNU~1\OneDrive\Desktop\gurukool\backend'
$logPath = Join-Path $PSScriptRoot 'phase3-migrate-seed.log'

Start-Transcript -Path $logPath -Force | Out-Null

try {
  if (-not (Test-Path $backendPath)) {
    throw "Backend path not found: $backendPath"
  }

  Set-Location $backendPath

  npm run migrate
  if ($LASTEXITCODE -ne 0) {
    throw 'Phase 3 migration failed.'
  }

  npm run seed
  if ($LASTEXITCODE -ne 0) {
    throw 'Phase 3 seed failed.'
  }
}
finally {
  Stop-Transcript | Out-Null
}
