$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Node = "C:\Users\nobod\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

Write-Host ""
Write-Host "Tennis Scout import server" -ForegroundColor Green
Write-Host "Workspace: $Root"
Write-Host ""

$existing = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -like "*server.js*" -and $_.CommandLine -like "*node*" }

foreach ($process in $existing) {
  try {
    Stop-Process -Id $process.ProcessId -Force
    Write-Host "Stopped existing server process $($process.ProcessId)."
  } catch {
    Write-Host "Could not stop existing process $($process.ProcessId): $($_.Exception.Message)" -ForegroundColor Yellow
  }
}

Set-Location $Root
Write-Host "Starting server at http://127.0.0.1:4174/index.html" -ForegroundColor Green
Write-Host "Keep this window open while importing Excel / CSV files."
Write-Host ""
& $Node server.js
