$ErrorActionPreference = 'Stop'

$rootPath = 'C:\Users\VISHNU~1\OneDrive\Desktop\gurukool'
$frontendPath = Join-Path $rootPath 'frontend'
$logPath = Join-Path $rootPath 'ops\frontend-dev.out.log'

Set-Location $frontendPath
& 'C:\Program Files\nodejs\npm.cmd' run start -- --host 127.0.0.1 --port 8100 *> $logPath
