# ============================================
# LabSync-AI - Professional One-Command Startup
# ============================================
# This script starts the entire LabSync-AI system
# with a single command. Fully automated, zero-click.
# 
# Usage: .\start-all.ps1
# ============================================

$ErrorActionPreference = "Continue"

# Colors for pretty output
function Write-Header { param($text) Write-Host "`n==========================================" -ForegroundColor Cyan; Write-Host " $text" -ForegroundColor Cyan; Write-Host "==========================================" -ForegroundColor Cyan }
function Write-Step { param($text) Write-Host "[►] $text" -ForegroundColor Yellow }
function Write-Success { param($text) Write-Host "[✓] $text" -ForegroundColor Green }
function Write-Error { param($text) Write-Host "[✗] $text" -ForegroundColor Red }
function Write-Info { param($text) Write-Host "[i] $text" -ForegroundColor Gray }

Write-Header "LABSYNC-AI PROFESSIONAL AUTOMATION"
Write-Host "`n  Version: 1.0.0"
Write-Host "  Starting at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n"

# Get project root
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

# ============================================
# Step 1: Check Prerequisites
# ============================================
Write-Header "Checking Prerequisites"

# Check Node.js
Write-Step "Checking Node.js..."
try {
    $nodeVersion = node --version 2>$null
    Write-Success "Node.js $nodeVersion found"
} catch {
    Write-Error "Node.js not found! Please install Node.js from https://nodejs.org"
    exit 1
}

# Check npm
Write-Step "Checking npm..."
try {
    $npmVersion = npm --version 2>$null
    Write-Success "npm v$npmVersion found"
} catch {
    Write-Error "npm not found!"
    exit 1
}

# Check for .env file
Write-Step "Checking .env configuration..."
$envPath = Join-Path $ProjectRoot "backend\.env"
if (-not (Test-Path $envPath)) {
    Write-Info ".env not found, creating from template..."
    $exampleEnv = Join-Path $ProjectRoot "backend\.env.example"
    if (Test-Path $exampleEnv) {
        Copy-Item $exampleEnv $envPath
        Write-Success "Created .env from template"
        Write-Host "`n  ⚠️  IMPORTANT: Edit backend\.env to add your API keys:" -ForegroundColor Yellow
        Write-Host "     - GEMINI_API_KEY    : Get from https://makersuite.google.com/app/apikey" -ForegroundColor Yellow
        Write-Host "     - TELEGRAM_BOT_TOKEN: Get from @BotFather on Telegram" -ForegroundColor Yellow
        Write-Host ""
    }
} else {
    Write-Success ".env configuration found"
}

# ============================================
# Step 2: Install Dependencies
# ============================================
Write-Header "Installing Dependencies"

# Install agents dependencies
Write-Step "Installing agents dependencies..."
Set-Location (Join-Path $ProjectRoot "agents")
npm install --silent 2>$null
Write-Success "Agents dependencies installed"

# Install mcp-server dependencies  
Write-Step "Installing MCP server dependencies..."
Set-Location (Join-Path $ProjectRoot "mcp-server")
npm install --silent 2>$null
Write-Success "MCP server dependencies installed"

# Install backend dependencies
Write-Step "Installing backend dependencies..."
Set-Location (Join-Path $ProjectRoot "backend")
npm install --silent 2>$null
Write-Success "Backend dependencies installed"

# Install frontend dependencies
Write-Step "Installing frontend dependencies..."
Set-Location (Join-Path $ProjectRoot "frontend")
npm install --silent 2>$null
Write-Success "Frontend dependencies installed"

# ============================================
# Step 3: Build Packages
# ============================================
Write-Header "Building Packages"

# Build agents first (dependency for MCP server)
Write-Step "Building agents..."
Set-Location (Join-Path $ProjectRoot "agents")
npm run build 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Success "Agents built successfully"
} else {
    Write-Error "Agents build failed - check for TypeScript errors"
}

# Build MCP server (depends on agents)
Write-Step "Building MCP server..."
Set-Location (Join-Path $ProjectRoot "mcp-server")
npm run build 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Success "MCP server built successfully"
} else {
    Write-Error "MCP server build failed"
}

# Build backend
Write-Step "Building backend..."
Set-Location (Join-Path $ProjectRoot "backend")
npm run build 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Success "Backend built successfully"
} else {
    Write-Error "Backend build failed"
}

# ============================================
# Step 4: Start Services
# ============================================
Write-Header "Starting Services"

# Start backend in new window
Write-Step "Starting backend server..."
Set-Location (Join-Path $ProjectRoot "backend")
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ProjectRoot\backend'; Write-Host 'Starting Backend Server...' -ForegroundColor Cyan; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 3
Write-Success "Backend server starting on http://localhost:4000"

# Start frontend in new window
Write-Step "Starting frontend..."
Set-Location (Join-Path $ProjectRoot "frontend")
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ProjectRoot\frontend'; Write-Host 'Starting Frontend Server...' -ForegroundColor Cyan; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 3
Write-Success "Frontend starting on http://localhost:3000"

# ============================================
# Step 5: Final Summary
# ============================================
Set-Location $ProjectRoot

Write-Header "LABSYNC-AI IS RUNNING!"

Write-Host "`n  Services:" -ForegroundColor White
Write-Host "  ├─ Backend API:    http://localhost:4000" -ForegroundColor Green
Write-Host "  ├─ Frontend:       http://localhost:3000" -ForegroundColor Green
Write-Host "  └─ Health Check:   http://localhost:4000/health" -ForegroundColor Green

Write-Host "`n  Automation Flow:" -ForegroundColor White
Write-Host "  1. Send message to your Telegram bot" -ForegroundColor Gray
Write-Host "  2. Backend receives webhook automatically" -ForegroundColor Gray
Write-Host "  3. AI extracts meeting details (zero-click)" -ForegroundColor Gray
Write-Host "  4. AI designs budget (zero-click)" -ForegroundColor Gray
Write-Host "  5. Dashboard updates in real-time" -ForegroundColor Gray

Write-Host "`n  Press any key to open the dashboard..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Open browser
Start-Process "http://localhost:3000"

Write-Host "`n  Happy automating! 🚀`n" -ForegroundColor Magenta
