@echo off
title Student Dropout Prediction System - Startup Launcher
color 0A

echo =====================================================================
echo    STUDENT DROPOUT PREDICTION SYSTEM - ONE-CLICK LAUNCHER
echo =====================================================================
echo.

set SCRIPT_DIR=%~dp0student-dropout-system-main

:: 1. Start Python ML API
echo [*] Launching Python Flask ML API (Port 5000)...
start "EduGuard - ML API (Port 5000)" cmd /k "cd /d %SCRIPT_DIR%\ml_api && python app.py"

:: Give ML API a couple seconds to start
timeout /t 3 /nobreak >nul

:: 2. Start Node.js Backend Server
echo [*] Launching Node.js Backend Server (Port 3000)...
start "EduGuard - Backend Server (Port 3000)" cmd /k "cd /d %SCRIPT_DIR%\backend && npm start"

:: Give Backend a couple seconds to initialize
timeout /t 3 /nobreak >nul

:: 3. Open Frontend Portal in Default Browser
echo [*] Opening Web Portal in Default Browser...
start "" "%SCRIPT_DIR%\frontend\index.html"

echo.
echo =====================================================================
echo  [SUCCESS] All services started!
echo  - ML API:   http://localhost:5000
echo  - Backend:  http://localhost:3000
echo  - Frontend: Opened in browser (frontend\index.html)
echo =====================================================================
pause
