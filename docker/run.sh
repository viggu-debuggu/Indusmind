#!/bin/bash
# INDUSMIND AI - Docker Management script for Bash/WSL/Linux
set -e

echo "========================================="
echo "  INDUSMIND AI - DOCKER CONTROL SCRIPT   "
echo "========================================="

# Check if Docker is running
echo "[1/4] Checking Docker service health..."
if ! docker ps > /dev/null 2>&1; then
    echo "X Error: Docker daemon is not active. Please launch Docker Desktop."
    exit 1
fi
echo "✓ Docker service is running."

echo ""
echo "Choose action:"
echo "  1. Start containers (cached build)"
echo "  2. Rebuild and Start containers"
echo "  3. Stop and clean container volumes"
echo "  4. Check running endpoints"
read -p "Select option (1-4): " choice

case $choice in
    1)
        echo "[2/4] Starting container network..."
        docker-compose up -d
        echo "✓ Containers launched in background."
        ;;
    2)
        echo "[2/4] Rebuilding and starting container network..."
        docker-compose up --build -d
        echo "✓ Containers rebuilt and launched in background."
        ;;
    3)
        echo "[2/4] Shutting down container network and clearing volumes..."
        docker-compose down -v
        echo "✓ Clean completed successfully."
        exit 0
        ;;
    4)
        echo "[2/4] Scanning container status..."
        docker ps
        exit 0
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "[3/4] Validating container ports..."
sleep 5

if curl -s http://localhost:8000/api/health > /dev/null; then
    db_status=$(curl -s http://localhost:8000/api/health | grep -o '"database":"[^"]*' | grep -o '[^"]*$')
    echo "✓ Backend API is operational: http://localhost:8000/api/health"
    echo "  Database connection status: $db_status"
else
    echo "⚠ Backend is still starting up or database connection is pending."
fi

echo "✓ Frontend client portal is available at: http://localhost:3000"
echo "✓ Backend interactive Swagger is available at: http://localhost:8000/docs"
echo ""
echo "========================================="
echo "Platform is up and running!"
echo "========================================="
