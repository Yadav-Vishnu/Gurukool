$ErrorActionPreference = 'Stop'

$workspace = Split-Path $PSScriptRoot -Parent
$dockerExe = 'C:\Program Files\Docker\Docker\resources\bin\docker.exe'
$logPath = Join-Path $PSScriptRoot 'docker-setup.log'
$dockerDesktopExe = 'C:\Program Files\Docker\Docker\Docker Desktop.exe'

function Invoke-DockerCommand {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Arguments
  )

  $stdoutPath = [System.IO.Path]::GetTempFileName()
  $stderrPath = [System.IO.Path]::GetTempFileName()

  try {
    $process = Start-Process -FilePath $dockerExe `
      -ArgumentList $Arguments `
      -NoNewWindow `
      -Wait `
      -PassThru `
      -RedirectStandardOutput $stdoutPath `
      -RedirectStandardError $stderrPath

    $stdout = if (Test-Path $stdoutPath) { Get-Content -Path $stdoutPath -Raw } else { '' }
    $stderr = if (Test-Path $stderrPath) { Get-Content -Path $stderrPath -Raw } else { '' }

    [pscustomobject]@{
      ExitCode = $process.ExitCode
      StdOut = $stdout
      StdErr = $stderr
    }
  }
  finally {
    Remove-Item $stdoutPath, $stderrPath -ErrorAction SilentlyContinue
  }
}

Start-Transcript -Path $logPath -Force | Out-Null

try {
  Set-Location $workspace

  if (-not (Test-Path $dockerExe)) {
    throw "Docker CLI not found at $dockerExe"
  }

  Get-Process 'Docker Desktop', 'com.docker.backend', 'com.docker.build' -ErrorAction SilentlyContinue |
    Stop-Process -Force -ErrorAction SilentlyContinue

  try {
    & wsl.exe --shutdown | Out-Null
  }
  catch {
    Write-Warning "WSL shutdown reported: $($_.Exception.Message)"
  }

  Start-Sleep -Seconds 3

  $service = Get-Service com.docker.service -ErrorAction SilentlyContinue
  if ($service -and $service.Status -ne 'Running') {
    Start-Service com.docker.service
  }

  Start-Process $dockerDesktopExe | Out-Null

  $deadline = (Get-Date).AddMinutes(8)
  $engineReady = $false
  do {
    $versionCheck = Invoke-DockerCommand -Arguments @('version', '--format', '{{.Server.Version}}')
    if ($versionCheck.ExitCode -eq 0 -and -not [string]::IsNullOrWhiteSpace($versionCheck.StdOut)) {
      Write-Output "Docker engine version: $($versionCheck.StdOut.Trim())"
      $engineReady = $true
      break
    }

    if (-not [string]::IsNullOrWhiteSpace($versionCheck.StdErr)) {
      Write-Output "Docker not ready yet: $($versionCheck.StdErr.Trim())"
    }

    Start-Sleep -Seconds 5
  } while ((Get-Date) -lt $deadline)

  if (-not $engineReady) {
    $finalVersionCheck = Invoke-DockerCommand -Arguments @('version')
    if (-not [string]::IsNullOrWhiteSpace($finalVersionCheck.StdOut)) {
      Write-Output $finalVersionCheck.StdOut.Trim()
    }
    if (-not [string]::IsNullOrWhiteSpace($finalVersionCheck.StdErr)) {
      Write-Output $finalVersionCheck.StdErr.Trim()
    }
    throw 'Docker engine did not become ready in the Administrator session.'
  }

  if (-not (Test-Path 'backend\.env')) {
    Copy-Item 'backend\.env.example' 'backend\.env'
  }

  $composeUp = Invoke-DockerCommand -Arguments @('compose', 'up', '-d')
  if (-not [string]::IsNullOrWhiteSpace($composeUp.StdOut)) {
    Write-Output $composeUp.StdOut.Trim()
  }
  if (-not [string]::IsNullOrWhiteSpace($composeUp.StdErr)) {
    Write-Output $composeUp.StdErr.Trim()
  }
  if ($composeUp.ExitCode -ne 0) {
    throw 'docker compose up -d failed.'
  }

  $portsReady = $false
  $portDeadline = (Get-Date).AddMinutes(3)
  do {
    $postgresReady = Test-NetConnection -ComputerName 'localhost' -Port 5432 -InformationLevel Quiet
    $redisReady = Test-NetConnection -ComputerName 'localhost' -Port 6379 -InformationLevel Quiet

    if ($postgresReady -and $redisReady) {
      $portsReady = $true
      break
    }

    Start-Sleep -Seconds 3
  } while ((Get-Date) -lt $portDeadline)

  if (-not $portsReady) {
    throw 'PostgreSQL and Redis ports did not become ready in time.'
  }

  npm --prefix backend run migrate
  if ($LASTEXITCODE -ne 0) {
    throw 'Database migration failed.'
  }

  npm --prefix backend run seed
  if ($LASTEXITCODE -ne 0) {
    throw 'Database seed failed.'
  }

  $composePs = Invoke-DockerCommand -Arguments @('compose', 'ps')
  if (-not [string]::IsNullOrWhiteSpace($composePs.StdOut)) {
    Write-Output $composePs.StdOut.Trim()
  }
  if (-not [string]::IsNullOrWhiteSpace($composePs.StdErr)) {
    Write-Output $composePs.StdErr.Trim()
  }
}
finally {
  Stop-Transcript | Out-Null
}
