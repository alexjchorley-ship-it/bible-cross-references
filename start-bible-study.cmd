@echo off
setlocal
cd /d "%~dp0"

echo.
echo ====================================================
echo Bible Study - private local reader
echo ====================================================
echo.
where node >nul 2>nul
if errorlevel 1 goto missing_node
for /f %%V in ('node -p "Number(process.versions.node.split('.')[0])"') do set "NODE_MAJOR=%%V"
if not defined NODE_MAJOR goto missing_node
if %NODE_MAJOR% LSS 24 goto missing_node

set "BASE_PATH=/"
set "SITE_ORIGIN=http://127.0.0.1:4173"

if /I "%~1"=="rebuild" (
  echo Refreshing generated app. Personal notes stay in your browser.
  if exist "dist" rmdir /s /q "dist"
)

if not exist "node_modules\.package-lock.json" (
  echo Installing project dependencies for this computer...
  call npm ci
  if errorlevel 1 goto failed
)

if not exist "dist\index.html" (
  echo Building the Bible text and study resources...
  echo The first build requires internet for the open datasets.
  call npm run build
  if errorlevel 1 goto failed
)

echo.
echo The app is served ONLY on your own computer.
echo Open: http://127.0.0.1:4173/
echo Keep this window open while using Bible Study.
echo Close it or press Ctrl+C to stop the local server.
echo.
start "" /B powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 3; Start-Process 'http://127.0.0.1:4173/'"
call npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
if errorlevel 1 goto failed
exit /b 0

:missing_node
echo Node.js version 24 or newer is required.
echo Install it from https://nodejs.org/ and run this file again.
pause
exit /b 1

:failed
echo.
echo Setup or startup failed. Read the error above before retrying.
echo Instructions: docs\RUN_LOCALLY.md
pause
exit /b 1
