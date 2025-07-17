# Flowbit Setup Script for Windows PowerShell
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Flowbit Setup for Windows" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if command exists
function Test-Command($command) {
    try {
        Get-Command $command -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

if (-not (Test-Command "node")) {
    Write-Host "ERROR: Node.js is not installed. Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

if (-not (Test-Command "npm")) {
    Write-Host "ERROR: npm is not installed. Please install Node.js which includes npm." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

if (-not (Test-Command "docker")) {
    Write-Host "WARNING: Docker is not installed or not running. You'll need Docker for the full setup." -ForegroundColor Yellow
    Write-Host "Download Docker Desktop from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
}

Write-Host "Prerequisites check complete!" -ForegroundColor Green
Write-Host ""

# Install dependencies
Write-Host "Step 1: Installing root dependencies..." -ForegroundColor Yellow
try {
    npm install
    Write-Host "Root dependencies installed successfully!" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to install root dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Step 2: Installing API dependencies..." -ForegroundColor Yellow
try {
    Set-Location "api"
    npm install
    Write-Host "API dependencies installed successfully!" -ForegroundColor Green
    Set-Location ".."
} catch {
    Write-Host "ERROR: Failed to install API dependencies" -ForegroundColor Red
    Set-Location ".."
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Step 3: Installing Shell dependencies..." -ForegroundColor Yellow
try {
    Set-Location "shell"
    npm install
    Write-Host "Shell dependencies installed successfully!" -ForegroundColor Green
    Set-Location ".."
} catch {
    Write-Host "ERROR: Failed to install Shell dependencies" -ForegroundColor Red
    Set-Location ".."
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Step 4: Installing Support Tickets App dependencies..." -ForegroundColor Yellow
try {
    Set-Location "support-tickets-app"
    npm install
    Write-Host "Support Tickets App dependencies installed successfully!" -ForegroundColor Green
    Set-Location ".."
} catch {
    Write-Host "ERROR: Failed to install Support Tickets App dependencies" -ForegroundColor Red
    Set-Location ".."
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Step 5: Setting up environment file..." -ForegroundColor Yellow
if (-not (Test-Path "api\.env")) {
    Copy-Item "api\.env.example" "api\.env"
    Write-Host "Environment file created at api\.env" -ForegroundColor Green
} else {
    Write-Host "Environment file already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Make sure Docker Desktop is running" -ForegroundColor White
Write-Host "2. Run: docker-compose up -d" -ForegroundColor White
Write-Host "3. Wait 30-60 seconds for containers to start" -ForegroundColor White
Write-Host "4. Run: npm run seed" -ForegroundColor White
Write-Host "5. Open http://localhost:3000" -ForegroundColor White
Write-Host ""

Write-Host "Alternative (if Docker issues):" -ForegroundColor Yellow
Write-Host "1. Install MongoDB locally" -ForegroundColor White
Write-Host "2. Update MONGODB_URI in api\.env" -ForegroundColor White
Write-Host "3. Run: npm run dev" -ForegroundColor White
Write-Host "4. Run: npm run seed (in another terminal)" -ForegroundColor White
Write-Host ""

Write-Host "Demo accounts:" -ForegroundColor Cyan
Write-Host "- LogisticsCo: admin@logisticsco.com / password123" -ForegroundColor White
Write-Host "- RetailGmbH: admin@retailgmbh.com / password123" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to continue"
