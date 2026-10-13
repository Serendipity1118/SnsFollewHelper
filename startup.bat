@echo off
rem Start the follow-queue web service (web-service/) and open it in the browser.
setlocal
cd /d "%~dp0web-service" || goto :error

where npm >nul 2>nul || (
  echo [startup] npm not found. Install Node.js 22 or later.
  goto :error
)

if not exist node_modules (
  echo [startup] Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo [startup] npm install failed. Retrying with --ignore-scripts for better-sqlite3...
    call npm install --ignore-scripts || goto :error
  )
)

if not defined PORT set PORT=8787
set START_PORT=%PORT%

rem Pick the first free port from PORT upward (20 ports total).
set "CHOSEN_PORT="
for /f "delims=" %%P in ('powershell -NoProfile -Command "$base = [int]$env:START_PORT; $max = $base + 20; $chosen = $null; for ($p = $base; $p -lt $max; $p++) { if (@(Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue).Count -eq 0) { $chosen = $p; break } }; if (-not $chosen) { exit 1 }; if ($chosen -ne $base) { Write-Host ('[startup] Port ' + $base + ' is in use; using ' + $chosen + ' instead.'); Write-Host '[startup] If needed, update the server URL in the Chrome extension options.' }; Write-Output $chosen"') do set "CHOSEN_PORT=%%P"
if not defined CHOSEN_PORT (
  echo [startup] No free port found in range %START_PORT%..%START_PORT%+19.
  echo [startup] Stop the process using the port, or set PORT to another value and retry.
  goto :error
)
set "PORT=%CHOSEN_PORT%"

set URL=http://127.0.0.1:%PORT%

rem Wait until the server is listening, then show the URL and open the browser.
start "" /b powershell -NoProfile -Command "for ($i = 0; $i -lt 60; $i++) { try { $t = New-Object Net.Sockets.TcpClient; $t.Connect('127.0.0.1', %PORT%); $t.Close(); Write-Host ''; Write-Host '----------------------------------------'; Write-Host ('[startup] Ready: %URL%'); Write-Host '         (Ctrl+C in this window to stop)'; Write-Host '----------------------------------------'; Start-Process '%URL%'; exit 0 } catch { Start-Sleep -Seconds 1 } }; Write-Host ''; Write-Host '[startup] Server did not respond within 60 seconds.'; Write-Host ('[startup] Open manually when ready: %URL%')"

echo [startup] Starting server on port %PORT% ...
call npm start
goto :eof

:error
echo [startup] Failed to start.
pause
exit /b 1
