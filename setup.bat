@echo off
REM Sales Intelligence Briefing Tool - Windows Setup Script

echo ==================================================
echo Sales Intelligence Briefing Tool - Setup
echo ==================================================
echo.

REM Check if Node.js is installed
echo Checking Node.js installation...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed
    echo.
    echo Please install Node.js from https://nodejs.org
    echo Download the LTS version ^(18.x or higher^)
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [OK] Node.js is installed: %NODE_VERSION%

REM Extract major version
for /f "tokens=1 delims=." %%a in ("%NODE_VERSION:~1%") do set NODE_MAJOR=%%a
if %NODE_MAJOR% LSS 18 (
    echo [ERROR] Node.js version 18 or higher is required
    echo Current version: %NODE_VERSION%
    echo Please update from https://nodejs.org
    pause
    exit /b 1
)

echo.

REM Check if pnpm is installed
echo Checking pnpm installation...
where pnpm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Installing pnpm...
    call npm install -g pnpm
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install pnpm
        pause
        exit /b 1
    )
    echo [OK] pnpm installed successfully
) else (
    for /f "tokens=*" %%i in ('pnpm -v') do set PNPM_VERSION=%%i
    echo [OK] pnpm is installed: %PNPM_VERSION%
)

echo.

REM Check if Git is installed
echo Checking Git installation...
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Git is not installed
    echo.
    echo Please install Git from https://git-scm.com
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('git --version') do set GIT_VERSION=%%i
echo [OK] Git is installed: %GIT_VERSION%

echo.
echo ==================================================
echo Installing Project Dependencies
echo ==================================================
echo.

REM Install backend dependencies
echo [INFO] Installing backend dependencies...
cd backend
call pnpm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install backend dependencies
    cd ..
    pause
    exit /b 1
)
echo [OK] Backend dependencies installed
cd ..

echo.

REM Install frontend dependencies
echo [INFO] Installing frontend dependencies...
cd frontend
call pnpm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install frontend dependencies
    cd ..
    pause
    exit /b 1
)
echo [OK] Frontend dependencies installed
cd ..

echo.
echo ==================================================
echo Environment Configuration
echo ==================================================
echo.

REM Check if .env file exists
if not exist "backend\.env" (
    echo [INFO] Creating .env file from template...
    copy backend\.env.example backend\.env >nul
    echo [OK] .env file created
    echo.
    echo [IMPORTANT] You need to configure your API credentials in backend\.env
    echo.
    echo Required configuration:
    echo   1. Get your IBM watsonx.ai API key from: https://cloud.ibm.com/iam/apikeys
    echo   2. Open backend\.env in a text editor
    echo   3. Replace 'your_watsonx_api_key_here' with your actual API key
    echo   4. Optionally add your Project ID
    echo.
    echo Opening .env file...
    start notepad backend\.env
    echo.
    pause
) else (
    echo [OK] .env file already exists
)

echo.
echo ==================================================
echo Setup Complete!
echo ==================================================
echo.
echo [OK] All prerequisites installed and configured
echo.
echo To start the application:
echo.
echo   Option 1: Use the start script ^(recommended^)
echo     start.bat
echo.
echo   Option 2: Start manually
echo     Terminal 1: cd backend ^&^& pnpm run dev
echo     Terminal 2: cd frontend ^&^& pnpm run dev
echo.
echo The application will be available at:
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3000
echo.
echo [INFO] For more information, see TEAM_ONBOARDING.md
echo.
pause

@REM Made with Bob
