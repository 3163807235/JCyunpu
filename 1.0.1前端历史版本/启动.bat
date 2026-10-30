@echo off
setlocal EnableExtensions
cd /d "%~dp0"

title JCyunpu Frontend Dev
echo ========================================
echo   JCyunpu Frontend - Dev Server
echo   Mock login SMS code: 123456
echo   URL: http://localhost:3006
echo ========================================
echo.

if not exist "%~dp0package.json" (
  echo [ERROR] package.json not found.
  echo Put this script in J:\JCyunpu\frontend
  goto :fail
)

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js not found. Install Node.js ^>= 20.19
  echo https://nodejs.org/
  goto :fail
)

echo [INFO] Node.js:
node -v
echo.

where pnpm >nul 2>&1
if errorlevel 1 (
  echo [INFO] pnpm not found, trying corepack...
  corepack enable >nul 2>&1
  corepack prepare pnpm@latest --activate >nul 2>&1
)

where pnpm >nul 2>&1
if errorlevel 1 (
  echo [INFO] corepack failed, installing pnpm via npm...
  call npm install -g pnpm
)

where pnpm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] pnpm install failed. Run: npm install -g pnpm
  goto :fail
)

echo [INFO] pnpm:
call pnpm -v
echo.

if not exist "%~dp0node_modules\." (
  echo [INFO] Installing dependencies...
  call pnpm install
  if errorlevel 1 (
    echo [ERROR] pnpm install failed
    goto :fail
  )
  echo.
) else (
  echo [INFO] node_modules found, skip install
  echo.
)

echo [INFO] Starting Vite...
echo [INFO] Close this window to stop the server
echo ----------------------------------------
echo.

call pnpm dev
if errorlevel 1 (
  echo.
  echo [ERROR] Dev server exited with error
  goto :fail
)

echo.
echo [INFO] Server stopped
pause
exit /b 0

:fail
echo.
pause
exit /b 1
