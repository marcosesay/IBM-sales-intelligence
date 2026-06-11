@echo off
REM Sales Intelligence Briefing Tool - One-Command Setup for Windows
REM This script does EVERYTHING - just provide your IBM Cloud API key when prompted

echo ================================================================
echo    Sales Intelligence Briefing Tool - Quick Start
echo    One-command setup - just provide your API key!
echo ================================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed
    echo.
    echo Installing Node.js automatically...
    echo.
    
    REM Download Node.js installer
    echo Downloading Node.js LTS installer...
    powershell -Command "& {Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi' -OutFile '%TEMP%\nodejs-installer.msi'}"
    
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to download Node.js installer
        echo.
        echo Please install Node.js manually:
        echo   1. Go to https://nodejs.org
        echo   2. Download the LTS version ^(18.x or higher^)
        echo   3. Run the installer
        echo   4. Run this script again
        echo.
        pause
        exit /b 1
    )
    
    echo Installing Node.js...
    echo This will open an installer window - please follow the prompts
    echo.
    start /wait msiexec /i "%TEMP%\nodejs-installer.msi" /qn
    
    REM Clean up
    del "%TEMP%\nodejs-installer.msi"
    
    REM Refresh environment variables
    echo Refreshing environment...
    call refreshenv >nul 2>nul
    
    REM Check again
    where node >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Node.js installation may have failed
        echo Please close this window, open a new command prompt, and run this script again
        echo.
        pause
        exit /b 1
    )
    
    echo [OK] Node.js installed successfully!
    echo.
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [OK] Node.js is installed: %NODE_VERSION%

REM Check Node version
for /f "tokens=1 delims=." %%a in ("%NODE_VERSION:~1%") do set NODE_MAJOR=%%a
if %NODE_MAJOR% LSS 18 (
    echo [ERROR] Node.js version 18 or higher is required
    echo Current version: %NODE_VERSION%
    echo Please update from https://nodejs.org
    pause
    exit /b 1
)

echo.

REM Install pnpm if needed
where pnpm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Installing pnpm...
    call npm install -g pnpm
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install pnpm
        pause
        exit /b 1
    )
    echo [OK] pnpm installed
) else (
    echo [OK] pnpm is already installed
)

echo.

REM Install dependencies
echo [INFO] Installing project dependencies ^(this may take a minute^)...
cd backend
call pnpm install --silent
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install backend dependencies
    cd ..
    pause
    exit /b 1
)
cd ..

cd frontend
call pnpm install --silent
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install frontend dependencies
    cd ..
    pause
    exit /b 1
)
cd ..

echo [OK] All dependencies installed

echo.

REM Configure API key
if not exist "backend\.env" (
    echo [INFO] Creating configuration file...
    copy backend\.env.example backend\.env >nul
    
    echo.
    echo ================================================================
    echo               IBM Cloud API Key Required
    echo ================================================================
    echo.
    echo Get your API key from: https://cloud.ibm.com/iam/apikeys
    echo.
    
    set /p API_KEY="Enter your IBM watsonx.ai API key: "
    
    if "%API_KEY%"=="" (
        echo [ERROR] API key is required!
        echo Please run this script again and provide your API key.
        pause
        exit /b 1
    )
    
    REM Update .env file with API key
    powershell -Command "(gc backend\.env) -replace 'WATSONX_API_KEY=.*', 'WATSONX_API_KEY=%API_KEY%' | Out-File -encoding ASCII backend\.env"
    
    echo [OK] API key configured
    
    REM Optional: Project ID
    echo.
    set /p PROJECT_ID="Enter your Project ID ^(optional, press Enter to skip^): "
    
    if not "%PROJECT_ID%"=="" (
        powershell -Command "(gc backend\.env) -replace 'WATSONX_PROJECT_ID=.*', 'WATSONX_PROJECT_ID=%PROJECT_ID%' | Out-File -encoding ASCII backend\.env"
        echo [OK] Project ID configured
    )
) else (
    echo [OK] Configuration file already exists
)

echo.
echo ================================================================
echo                   Setup Complete! 🎉
echo ================================================================
echo.
echo [OK] Everything is ready to go!
echo.
echo Starting the application now...
echo.

REM Start backend server in new window
echo [INFO] Starting backend server...
start "Backend Server - Sales Intelligence Tool" cmd /k "cd backend && pnpm run dev"

REM Wait for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend server in new window
echo [INFO] Starting frontend server...
start "Frontend Server - Sales Intelligence Tool" cmd /k "cd frontend && pnpm run dev"

REM Wait for frontend to start
timeout /t 3 /nobreak >nul

echo.
echo ================================================================
echo             🚀 Application is Running! 🚀
echo ================================================================
echo.
echo   📱 Frontend: http://localhost:5173
echo   🔧 Backend:  http://localhost:3000
echo.
echo   Two terminal windows have been opened:
echo      - Backend Server
echo      - Frontend Server
echo.
echo   [INFO] Close those windows to stop the servers
echo.
echo   Open http://localhost:5173 in your browser to use the tool!
echo.
pause

@REM Made with Bob
