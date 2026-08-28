@echo off
setlocal
cd /d "%~dp0\.."
chcp 65001 >nul

echo [cleanup] Remove obsolete pre-Vite runtime files
if exist assets (
  rmdir /s /q assets
  if exist assets (
    echo FAILED: could not remove legacy assets directory.
    exit /b 1
  )
)
if exist scripts\sync-static-assets.mjs del /q scripts\sync-static-assets.mjs
if exist scripts\sync-static-assets.mjs (
  echo FAILED: could not remove scripts\sync-static-assets.mjs
  exit /b 1
)

echo PASS: legacy assets/game.js, assets/game.css and duplicate assets tree are absent.
exit /b 0
