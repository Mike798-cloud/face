@echo off
setlocal
cd /d "%~dp0\.."
chcp 65001 >nul

echo [1/9] Node / npm
node -v || goto :fail
npm -v || goto :fail

echo [2/9] GitHub Pages / lockfile deployment audit
node scripts\audit-deployment.mjs || goto :fail

echo [3/9] Install locked dependencies (same as GitHub Actions)
call npm ci || goto :fail

echo [4/9] Restore original hand-painted artwork
call npm run sync:art || goto :fail

echo [5/9] Release asset / source audit
call npm run audit || goto :fail

echo [6/9] Verify versions
call npm ls phaser typescript vite || goto :fail

echo [7/9] TypeScript
call npm run typecheck || goto :fail

echo [8/9] Logic regression
call npm run test:logic || goto :fail

echo [9/9] Production build
call npm run build || goto :fail

if not exist dist\index.html goto :fail
powershell -NoProfile -ExecutionPolicy Bypass -Command "$bad=Get-ChildItem dist -Recurse -File | Where-Object {$_.Length -eq 0 -and $_.Name -ne '.nojekyll'}; if($bad){$bad|Format-Table FullName,Length; exit 1}"
if errorlevel 1 goto :fail

echo.
echo PASS: deploy audit / locked install / original art / source audit / typecheck / logic / build completed.
echo Run "npm run preview" and complete the full playthrough before pushing.
exit /b 0

:fail
echo.
echo FAILED. Do not deploy this package yet.
exit /b 1
