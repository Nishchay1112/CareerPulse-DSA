@echo off
setlocal
cd /d "%~dp0"
if not exist "%~dp0backend\careerpulse.exe" (
  echo Please extract the complete CareerPulse ZIP before opening this launcher.
  pause
  exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0backend\CHECK-PORT.ps1" -ExpectedExe "%~dp0backend\careerpulse.exe"
set "portStatus=%ERRORLEVEL%"
if "%portStatus%"=="2" (
  echo.
  echo This launcher will NOT connect you to a different account database.
  pause
  exit /b 1
)
if "%portStatus%"=="1" (
  if not exist "%~dp0backend\careerpulse.db" (
    echo.
    echo NOTE: No local account database exists in this project folder yet.
    echo If you registered in an older CareerPulse folder, first close this launcher
    echo and run RESTORE-OLD-ACCOUNT.cmd to select the OLD backend\careerpulse.db.
    echo Otherwise you can create a new account on the registration page.
    echo.
  )
  start "CareerPulse backend" /D "%~dp0backend" "%ComSpec%" /k call "%~dp0backend\START-CAREERPULSE.cmd"
)
powershell -NoProfile -Command "$ready=$false; for($i=0;$i -lt 25;$i++){try{$h=Invoke-RestMethod 'http://127.0.0.1:8081/api/health' -TimeoutSec 2;if($h.status -eq 'CareerPulse API is running'){$ready=$true;break}}catch{};Start-Sleep -Milliseconds 200};if(-not $ready){exit 1}"
if errorlevel 1 (
  echo The backend could not start. Check the backend window for an error.
  pause
  exit /b 1
)
start "" "http://127.0.0.1:8081/"
