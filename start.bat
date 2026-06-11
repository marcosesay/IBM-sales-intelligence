@echo off
REM Sales Intelligence Briefing Tool - Windows Start Script

echo ==================================================
echo Starting Sales Intelligence Briefing Tool
echo ==================================================
echo.

REM Check if .env file exists
if not exist "backend\.env" (
    echo [ERROR] backend\.env file not found!
    echo Please run setup.bat first to configure the application.
    pause
    exit /b 1
)

REM Start backend server in a new window
echo [INFO] Starting backend server...
start "Backend Server" cmd /k "cd backend && pnpm run dev"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend server in a new window
echo [INFO] Starting frontend server...
start "Frontend Server" cmd /k "cd frontend && pnpm run dev"

REM Wait a moment for frontend to start
timeout /t 3 /nobreak >nul

echo.
echo ==================================================
echo [OK] Application is running!
echo ==================================================
echo.
echo Access the application at:
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3000
echo.
echo Two terminal windows have been opened:
echo   - Backend Server
echo   - Frontend Server
echo.
echo [INFO] Close those windows to stop the servers
echo.
pause

@REM Made with Bob
