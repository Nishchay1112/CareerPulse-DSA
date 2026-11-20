@echo off
setlocal
cd /d "%~dp0"
echo CareerPulse - http://127.0.0.1:8081/
echo Keep this window open while using the website.
echo Without a delivery webhook, OTP and recovery use clearly labelled local test codes.
careerpulse.exe
echo.
echo Backend stopped. Copy any error above if startup failed.
pause
