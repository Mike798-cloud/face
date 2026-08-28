@echo off
setlocal
cd /d "%~dp0\.."
chcp 65001 >nul

echo [1/8] Node / npm
node -v || goto :fail
npm -v || goto :fail

echo [2/8] Install locked dependencies
call npm install || goto :fail

echo [3/8] Restore original hand-painted artwork
call npm run sync:art || goto :fail

echo [4/8] Release asset / source audit
call npm run audit || goto :fail

echo [5/8] Verify versions
call npm ls phaser typescript vite || goto :fail

echo [6/8] TypeScript
call npm run typecheck || goto :fail

echo [7/8] Logic regression
call npm run test:logic || goto :fail

echo [8/8] Production build
call npm run build || goto :fail

if not exist dist\index.html goto :fail
powershell -NoProfile -ExecutionPolicy Bypass -Command "$bad=Get-ChildItem dist -Recurse -File | Where-Object {$_.Length -eq 0 -and $_.Name -ne '.nojekyll'}; if($bad){$bad|Format-Table FullName,Length; exit 1}"
if errorlevel 1 goto :fail

echo.
echo PASS: original art / audit / typecheck / logic / build completed.
echo Run "npm run preview" and complete the full playthrough before pushing.
exit /b 0

:fail
echo.
echo FAILED. Do not deploy this package yet.
exit /b 1
