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
set URL=http://127.0.0.1:%PORT%

rem Fail early (before opening the browser) if another process already listens on the port.
powershell -NoProfile -Command "$c = Get-NetTCPConnection -LocalPort %PORT% -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1; if ($c) { $p = Get-CimInstance Win32_Process -Filter ('ProcessId=' + $c.OwningProcess); Write-Host ('[startup] Port %PORT% is already in use by PID ' + $c.OwningProcess + ': ' + $p.CommandLine); exit 1 }; exit 0"
if errorlevel 1 (
  echo [startup] Stop that process, or use another port: set PORT=8788 ^&^& startup.bat
  echo [startup] If you change the port, also update the server URL in the Chrome extension options.
  goto :error
)

rem Wait until the server is listening, then show the URL and open the browser.
start "" /b powershell -NoProfile -Command "for ($i = 0; $i -lt 60; $i++) { try { $t = New-Object Net.Sockets.TcpClient; $t.Connect('127.0.0.1', %PORT%); $t.Close(); Write-Host ''; Write-Host '[startup] Ready: %URL%  (Ctrl+C to stop)'; Start-Process '%URL%'; exit 0 } catch { Start-Sleep -Seconds 1 } }; Write-Host '[startup] Server did not respond within 60 seconds. Open %URL% manually after it starts.'"

echo [startup] Starting %URL% ...
call npm start
goto :eof

:error
echo [startup] Failed to start.
pause
exit /b 1
