# INDUSMIND AI - Docker Management script
# Usage: Run this script inside PowerShell to rebuild or restart the containers.

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  INDUSMIND AI - DOCKER CONTROL SCRIPT   " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Verify Docker daemon is running
Write-Host "[1/4] Checking Docker service health..." -ForegroundColor Yellow
try {
    & docker ps > $null
    Write-Host "✓ Docker service is running." -ForegroundColor Green
} catch {
    Write-Host "X Error: Docker daemon is not active. Please launch Docker Desktop." -ForegroundColor Red
    Exit 1
}

# 2. Options selector
Write-Host ""
Write-Host "Choose action:"
Write-Host "  1. Start containers (cached build)"
Write-Host "  2. Rebuild and Start containers"
Write-Host "  3. Stop and clean container volumes"
Write-Host "  4. Check running endpoints"
$choice = Read-Host "Select option (1-4)"

switch ($choice) {
    "1" {
        Write-Host "[2/4] Starting container network..." -ForegroundColor Yellow
        & docker-compose up -d
        Write-Host "✓ Containers launched in background." -ForegroundColor Green
    }
    "2" {
        Write-Host "[2/4] Rebuilding and starting container network..." -ForegroundColor Yellow
        & docker-compose up --build -d
        Write-Host "✓ Containers rebuilt and launched in background." -ForegroundColor Green
    }
    "3" {
        Write-Host "[2/4] Shutting down container network and clearing volumes..." -ForegroundColor Yellow
        & docker-compose down -v
        Write-Host "✓ Clean completed successfully." -ForegroundColor Green
        Exit 0
    }
    "4" {
        Write-Host "[2/4] Scanning container status..." -ForegroundColor Yellow
        & docker ps
        Exit 0
    }
    default {
        Write-Host "Invalid choice. Exiting." -ForegroundColor Red
        Exit 1
    }
}

# 3. Check health and endpoints
Write-Host ""
Write-Host "[3/4] Validating container ports..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/health" -Method Get
    Write-Host "✓ Backend API is operational: http://localhost:8000/api/health" -ForegroundColor Green
    Write-Host "  Database connection status: $($response.database)" -ForegroundColor Gray
} catch {
    Write-Host "⚠ Backend is still starting up or database connection is pending." -ForegroundColor DarkYellow
}

Write-Host "✓ Frontend client portal is available at: http://localhost:3000" -ForegroundColor Green
Write-Host "✓ Backend interactive Swagger is available at: http://localhost:8000/docs" -ForegroundColor Green

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Platform is up and running!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
