@echo off
setlocal
cd /d "%~dp0\.."
chcp 65001 >nul

echo [1/11] Remove legacy pre-Vite runtime
call tools\cleanup-legacy.bat || goto :fail

echo [2/11] Node / npm
node -v || goto :fail
npm -v || goto :fail

echo [3/11] GitHub Pages / lockfile deployment audit
node scripts\audit-deployment.mjs || goto :fail

echo [4/11] Install locked dependencies (same as GitHub Actions)
call npm ci --no-audit --no-fund || goto :fail

echo [5/11] Verify packaged hand-painted artwork
call npm run sync:art || goto :fail

echo [6/11] Release asset / source audit
call npm run audit || goto :fail

echo [7/11] Verify versions
call npm ls phaser typescript vite || goto :fail

echo [8/11] TypeScript
call npm run typecheck || goto :fail

echo [9/11] Logic + scene regression
call npm run test:logic || goto :fail

echo [10/11] Production build
call npm run build || goto :fail

echo [11/11] Built GitHub Pages path audit
call npm run audit:dist || goto :fail

echo.
echo PASS: cleanup / deploy audit / locked install / art / source audit / typecheck / regressions / build / dist audit completed.
echo Preview URL: http://127.0.0.1:4173/face/
echo Run "npm run preview" and complete the full playthrough before pushing.
exit /b 0

:fail
echo.
echo FAILED. Do not deploy this package yet.
exit /b 1
