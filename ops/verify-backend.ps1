$ErrorActionPreference = 'Stop'

$backendPath = 'C:\Users\VISHNU~1\OneDrive\Desktop\gurukool\backend'
$logPath = Join-Path $PSScriptRoot 'verify-backend.log'

Start-Transcript -Path $logPath -Force | Out-Null

try {
  if (-not (Test-Path $backendPath)) {
    throw "Backend path not found: $backendPath"
  }

  Set-Location $backendPath

  if (-not (Test-Path 'dist\app.js')) {
    throw 'Build output missing. Run npm run build in backend first.'
  }

  $listener = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
  if ($listener) {
    throw 'Port 3000 is already in use, so the backend verification cannot run cleanly.'
  }

  $processInfo = New-Object System.Diagnostics.ProcessStartInfo
  $processInfo.FileName = 'node'
  $processInfo.Arguments = 'dist/app.js'
  $processInfo.WorkingDirectory = $backendPath
  $processInfo.UseShellExecute = $false
  $processInfo.RedirectStandardOutput = $true
  $processInfo.RedirectStandardError = $true

  $process = New-Object System.Diagnostics.Process
  $process.StartInfo = $processInfo

  $null = $process.Start()

  try {
    $deadline = (Get-Date).AddSeconds(60)
    $response = $null

    do {
      Start-Sleep -Seconds 2

      try {
        $response = Invoke-WebRequest -Uri 'http://localhost:3000/health' -UseBasicParsing -TimeoutSec 2
        if ($response.StatusCode -eq 200) {
          break
        }
      }
      catch {
        if ($process.HasExited) {
          break
        }
      }
    } while ((Get-Date) -lt $deadline)

    if (-not $process.HasExited) {
      Start-Sleep -Seconds 2
      $process.Kill()
      $process.WaitForExit()
    }

    $stdout = $process.StandardOutput.ReadToEnd()
    $stderr = $process.StandardError.ReadToEnd()

    if (-not $response -or $response.StatusCode -ne 200) {
      throw "Backend health check failed.`nSTDOUT:`n$stdout`nSTDERR:`n$stderr"
    }

    Write-Output 'HEALTH_RESPONSE_START'
    Write-Output $response.Content
    Write-Output 'HEALTH_RESPONSE_END'
    Write-Output 'STDOUT_START'
    Write-Output $stdout
    Write-Output 'STDOUT_END'

    if (-not [string]::IsNullOrWhiteSpace($stderr)) {
      Write-Output 'STDERR_START'
      Write-Output $stderr
      Write-Output 'STDERR_END'
    }
  }
  finally {
    if (-not $process.HasExited) {
      $process.Kill()
      $process.WaitForExit()
    }

    $process.Dispose()
  }
}
finally {
  Stop-Transcript | Out-Null
}
