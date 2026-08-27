@echo off
setlocal
echo ==========================================
echo  🚀 Denchai-GIS 1-Click Git Push
echo ==========================================
powershell -ExecutionPolicy Bypass -File "%~dp0git-push.ps1" %*
pause
