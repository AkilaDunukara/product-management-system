#!/bin/bash

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "================================================"
echo "Product Management System - Development Mode"
echo "================================================"
echo ""

echo "📦 Step 1: Starting Infrastructure Services..."
echo "------------------------------------------------"
cd "$PROJECT_ROOT/backend"

if ! docker-compose ps | grep -q "Up"; then
    echo "Starting PostgreSQL, Redis, Kafka, Zookeeper, and LocalStack..."
    docker-compose up -d postgres redis zookeeper kafka localstack
    
    echo "⏳ Waiting for services to be ready (30 seconds)..."
    sleep 30
    
    echo "✅ Infrastructure services started"
else
    echo "✅ Infrastructure services already running"
fi

docker-compose ps
echo ""

echo "🔧 Step 2: Installing Dependencies..."
echo "------------------------------------------------"

cd "$PROJECT_ROOT/backend"
if [ ! -f ".env" ]; then
    cp config.env.template .env
    echo "⚠️  Created .env file from template"
fi
[ ! -d "node_modules" ] && npm install

cd "$PROJECT_ROOT/notification-service"
[ ! -d "node_modules" ] && npm install

cd "$PROJECT_ROOT/analytics-service"
[ ! -d "node_modules" ] && npm install

cd "$PROJECT_ROOT/frontend"
[ ! -d "node_modules" ] && npm install

echo "✅ Dependencies installed"
echo ""

echo "================================================"
echo "🚀 Starting Services in Development Mode..."
echo "================================================"
echo ""
echo "Services will run with auto-reload enabled."
echo "Logs will be displayed in separate terminal windows."
echo ""
echo "Press Ctrl+C in each terminal to stop a service."
echo ""

mkdir -p "$PROJECT_ROOT/logs"

echo "Starting Backend API (dev mode)..."
cd "$PROJECT_ROOT/backend"
gnome-terminal --title="Backend API" -- bash -c "npm run dev; exec bash" 2>/dev/null || \
xterm -title "Backend API" -e "npm run dev; bash" 2>/dev/null || \
osascript -e 'tell app "Terminal" to do script "cd '"$PROJECT_ROOT/backend"' && npm run dev"' 2>/dev/null || \
echo "⚠️  Could not open terminal. Run manually: cd backend && npm run dev"

sleep 3

echo "Starting Notification Service (dev mode)..."
cd "$PROJECT_ROOT/notification-service"
gnome-terminal --title="Notification Service" -- bash -c "npm run dev; exec bash" 2>/dev/null || \
xterm -title "Notification Service" -e "npm run dev; bash" 2>/dev/null || \
osascript -e 'tell app "Terminal" to do script "cd '"$PROJECT_ROOT/notification-service"' && npm run dev"' 2>/dev/null || \
echo "⚠️  Could not open terminal. Run manually: cd notification-service && npm run dev"

sleep 2

echo "Starting Analytics Service (dev mode)..."
cd "$PROJECT_ROOT/analytics-service"
gnome-terminal --title="Analytics Service" -- bash -c "npm run dev; exec bash" 2>/dev/null || \
xterm -title "Analytics Service" -e "npm run dev; bash" 2>/dev/null || \
osascript -e 'tell app "Terminal" to do script "cd '"$PROJECT_ROOT/analytics-service"' && npm run dev"' 2>/dev/null || \
echo "⚠️  Could not open terminal. Run manually: cd analytics-service && npm run dev"

sleep 2

echo "Starting Frontend (dev mode)..."
cd "$PROJECT_ROOT/frontend"
gnome-terminal --title="Frontend" -- bash -c "npm run dev; exec bash" 2>/dev/null || \
xterm -title "Frontend" -e "npm run dev; bash" 2>/dev/null || \
osascript -e 'tell app "Terminal" to do script "cd '"$PROJECT_ROOT/frontend"' && npm run dev"' 2>/dev/null || \
echo "⚠️  Could not open terminal. Run manually: cd frontend && npm run dev"

echo ""
echo "================================================"
echo "✅ Development Mode Started!"
echo "================================================"
echo ""
echo "Service URLs:"
echo "  Backend API:          http://localhost:3001"
echo "  Frontend:             http://localhost:5173"
echo "  API Health Check:     http://localhost:3001/health"
echo ""
echo "All services are running with auto-reload enabled."
echo ""
echo "To stop services:"
echo "  - Press Ctrl+C in each terminal window"
echo "  - Or run: ./stop-services.sh"
echo ""
