@echo off
setlocal
cd /d "%~dp0"
title Reset Desktop Pet Positions
echo ========================================================
echo   Resetting Desktop Pet and Button Positions...
echo ========================================================
echo.

node scripts\reset-positions.js

echo.
echo Position reset complete. You can now launch run.bat!
pause
