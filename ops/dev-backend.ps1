$ErrorActionPreference = 'Stop'

$rootPath = 'C:\Users\VISHNU~1\OneDrive\Desktop\gurukool'
$backendPath = Join-Path $rootPath 'backend'
$logPath = Join-Path $rootPath 'ops\backend-dev.out.log'

Set-Location $backendPath
& 'C:\Program Files\nodejs\npm.cmd' run dev *> $logPath
