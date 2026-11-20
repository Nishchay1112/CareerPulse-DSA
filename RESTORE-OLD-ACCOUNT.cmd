@echo off
setlocal
cd /d "%~dp0"
echo CareerPulse account database restore
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0RESTORE-OLD-ACCOUNT.ps1"
echo.
pause
