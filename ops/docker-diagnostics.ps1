$ErrorActionPreference = 'Continue'

$workspace = Split-Path $PSScriptRoot -Parent
$dockerDiagnoseExe = 'C:\Program Files\Docker\Docker\resources\com.docker.diagnose.exe'
$logPath = Join-Path $PSScriptRoot 'docker-diagnostics.log'

Start-Transcript -Path $logPath -Force | Out-Null

Write-Host "=== Services ==="
Get-Service com.docker.service, LxssManager, vmcompute -ErrorAction Continue | Format-Table -AutoSize

Write-Host "`n=== WSL Status ==="
wsl --status

Write-Host "`n=== WSL Distros ==="
wsl -l -v

Write-Host "`n=== Windows Features ==="
Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux
Get-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform
Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V-All

if (Test-Path $dockerDiagnoseExe) {
  Write-Host "`n=== Docker Diagnose ==="
  & $dockerDiagnoseExe check
}

Stop-Transcript | Out-Null
