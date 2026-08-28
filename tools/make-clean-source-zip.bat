@echo off
setlocal
cd /d "%~dp0\.."
chcp 65001 >nul
set "OUT=%~dp0\..\face-v4.1-clean-source.zip"
if exist "%OUT%" del /q "%OUT%"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$root=(Resolve-Path '.').Path; $tmp=Join-Path $env:TEMP ('face-clean-'+[guid]::NewGuid()); New-Item -ItemType Directory $tmp|Out-Null; robocopy $root $tmp /E /XD node_modules dist .git /XF *.zip *.log >$null; Compress-Archive -Path (Join-Path $tmp '*') -DestinationPath '%OUT%' -CompressionLevel Optimal; Remove-Item $tmp -Recurse -Force"
echo Created: %OUT%
