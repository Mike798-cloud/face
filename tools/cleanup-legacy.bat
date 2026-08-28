@echo off
setlocal
cd /d "%~dp0\.."
chcp 65001 >nul

echo [cleanup] Remove obsolete pre-Vite runtime files
node scripts\cleanup-legacy.mjs
if errorlevel 1 exit /b 1

echo PASS: legacy assets/game.js, assets/game.css and duplicate assets tree are absent.
exit /b 0
