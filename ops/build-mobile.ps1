$ErrorActionPreference = 'Stop'

$frontendPath = 'C:\Users\VISHNU~1\OneDrive\Desktop\gurukool\frontend'

if (-not (Test-Path $frontendPath)) {
  throw "Frontend path not found: $frontendPath"
}

Set-Location $frontendPath

npm run build
if ($LASTEXITCODE -ne 0) {
  throw 'Frontend production build failed.'
}

npm run cap:sync
if ($LASTEXITCODE -ne 0) {
  throw 'Capacitor sync failed.'
}

Write-Host 'Mobile web assets are built and synced. Open Android Studio or Xcode for store signing.'
