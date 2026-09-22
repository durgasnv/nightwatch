@echo off
setlocal
cd /d "%~dp0"
title Desktop AI Pet Companion

echo ========================================================
echo   Starting Desktop AI Pet Companion (Batman Edition)
echo ========================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found on your system!
    echo Please install Node.js from https://nodejs.org
    echo.
    pause
    exit /b 1
)

if not exist "node_modules\electron" (
    echo [INFO] Installing required dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed!
        pause
        exit /b 1
    )
)

echo [INFO] Launching Desktop Batman Companion...
call npx electron .
if %errorlevel% neq 0 (
    echo.
    echo [INFO] Electron exited with code %errorlevel%
    pause
)
