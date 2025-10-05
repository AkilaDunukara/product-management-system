#!/bin/bash

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "================================================"
echo "Product Management System - Service Startup"
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

echo "🗄️  Step 2: Setting up Backend API..."
echo "------------------------------------------------"
cd "$PROJECT_ROOT/backend"

if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp config.env.template .env
    echo "⚠️  Please review and update .env file with your configuration"
fi

if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

echo "Building backend..."
npm run build

echo "✅ Backend setup complete"
echo ""

echo "📢 Step 3: Setting up Notification Service..."
echo "------------------------------------------------"
cd "$PROJECT_ROOT/notification-service"

if [ ! -d "node_modules" ]; then
    echo "Installing notification service dependencies..."
    npm install
fi

echo "Building notification service..."
npm run build

echo "✅ Notification service setup complete"
echo ""

echo "📊 Step 4: Setting up Analytics Service..."
echo "------------------------------------------------"
cd "$PROJECT_ROOT/analytics-service"

if [ ! -d "node_modules" ]; then
    echo "Installing analytics service dependencies..."
    npm install
fi

echo "Building analytics service..."
npm run build

echo "✅ Analytics service setup complete"
echo ""

echo "🎨 Step 5: Setting up Frontend..."
echo "------------------------------------------------"
cd "$PROJECT_ROOT/frontend"

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo "Building frontend..."
npm run build

echo "✅ Frontend setup complete"
echo ""

echo "================================================"
echo "🚀 Starting All Services..."
echo "================================================"
echo ""

echo "Starting Backend API on port 3001..."
cd "$PROJECT_ROOT/backend"
npm start > "$PROJECT_ROOT/logs/backend.log" 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

sleep 3

echo "Starting Notification Service..."
cd "$PROJECT_ROOT/notification-service"
npm start > "$PROJECT_ROOT/logs/notification-service.log" 2>&1 &
NOTIFICATION_PID=$!
echo "Notification Service PID: $NOTIFICATION_PID"

sleep 2

echo "Starting Analytics Service..."
cd "$PROJECT_ROOT/analytics-service"
npm start > "$PROJECT_ROOT/logs/analytics-service.log" 2>&1 &
ANALYTICS_PID=$!
echo "Analytics Service PID: $ANALYTICS_PID"

sleep 2

echo "Starting Frontend on port 5173..."
cd "$PROJECT_ROOT/frontend"
npm run preview > "$PROJECT_ROOT/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "================================================"
echo "✅ All Services Started Successfully!"
echo "================================================"
echo ""
echo "Service URLs:"
echo "  Backend API:          http://localhost:3001"
echo "  Frontend:             http://localhost:5173"
echo "  API Health Check:     http://localhost:3001/health"
echo ""
echo "Process IDs:"
echo "  Backend:              $BACKEND_PID"
echo "  Notification Service: $NOTIFICATION_PID"
echo "  Analytics Service:    $ANALYTICS_PID"
echo "  Frontend:             $FRONTEND_PID"
echo ""
echo "Logs are available in: $PROJECT_ROOT/logs/"
echo ""
echo "To stop all services, run:"
echo "  ./stop-services.sh"
echo ""
echo "To view logs:"
echo "  tail -f logs/backend.log"
echo "  tail -f logs/notification-service.log"
echo "  tail -f logs/analytics-service.log"
echo "  tail -f logs/frontend.log"
echo ""

cat > "$PROJECT_ROOT/.service-pids" << EOF
BACKEND_PID=$BACKEND_PID
NOTIFICATION_PID=$NOTIFICATION_PID
ANALYTICS_PID=$ANALYTICS_PID
FRONTEND_PID=$FRONTEND_PID
EOF

echo "Process IDs saved to .service-pids"
echo ""
echo "🎉 Setup complete! Access the application at http://localhost:5173"
