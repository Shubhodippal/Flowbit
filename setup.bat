@echo off
echo ================================
echo Flowbit Setup for Windows
echo ================================
echo.

echo Step 1: Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install root dependencies
    pause
    exit /b 1
)

echo.
echo Step 2: Installing API dependencies...
cd api
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install API dependencies
    pause
    exit /b 1
)

echo.
echo Step 3: Installing Shell dependencies...
cd ..\shell
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install Shell dependencies
    pause
    exit /b 1
)

echo.
echo Step 4: Installing Support Tickets App dependencies...
cd ..\support-tickets-app
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install Support Tickets App dependencies
    pause
    exit /b 1
)

cd ..

echo.
echo Step 5: Setting up environment file...
if not exist "api\.env" (
    copy "api\.env.example" "api\.env"
    echo Environment file created at api\.env
) else (
    echo Environment file already exists
)

echo.
echo ================================
echo Setup Complete!
echo ================================
echo.
echo Next steps:
echo 1. Make sure Docker Desktop is running
echo 2. Run: docker-compose up -d
echo 3. Wait 30-60 seconds for containers to start
echo 4. Run: npm run seed
echo 5. Open http://localhost:3000
echo.
echo Demo accounts:
echo - LogisticsCo: admin@logisticsco.com / password123
echo - RetailGmbH: admin@retailgmbh.com / password123
echo.
pause
