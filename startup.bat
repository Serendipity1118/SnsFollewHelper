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

rem Open the browser a few seconds later, once the server is listening.
start "" /b powershell -NoProfile -Command "Start-Sleep -Seconds 3; Start-Process '%URL%'"

echo [startup] %URL%  (Ctrl+C to stop)
call npm start
goto :eof

:error
echo [startup] Failed to start.
pause
exit /b 1
