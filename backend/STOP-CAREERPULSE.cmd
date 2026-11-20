@echo off
setlocal
set "CAREERPULSE_SERVER_DIR=%~dp0"
powershell -NoProfile -Command "$target = [IO.Path]::GetFullPath((Join-Path $env:CAREERPULSE_SERVER_DIR 'careerpulse.exe')); Get-Process -Name careerpulse -ErrorAction SilentlyContinue | Where-Object { $_.Path -and [IO.Path]::GetFullPath($_.Path) -eq $target } | Stop-Process"
pause
