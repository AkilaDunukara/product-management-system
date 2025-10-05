#!/bin/bash

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "================================================"
echo "Stopping Product Management System Services"
echo "================================================"
echo ""

if [ -f "$PROJECT_ROOT/.service-pids" ]; then
    source "$PROJECT_ROOT/.service-pids"
    
    echo "Stopping services..."
    
    if [ ! -z "$BACKEND_PID" ]; then
        echo "Stopping Backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null || echo "Backend already stopped"
    fi
    
    if [ ! -z "$NOTIFICATION_PID" ]; then
        echo "Stopping Notification Service (PID: $NOTIFICATION_PID)..."
        kill $NOTIFICATION_PID 2>/dev/null || echo "Notification Service already stopped"
    fi
    
    if [ ! -z "$ANALYTICS_PID" ]; then
        echo "Stopping Analytics Service (PID: $ANALYTICS_PID)..."
        kill $ANALYTICS_PID 2>/dev/null || echo "Analytics Service already stopped"
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        echo "Stopping Frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null || echo "Frontend already stopped"
    fi
    
    rm "$PROJECT_ROOT/.service-pids"
    echo ""
    echo "✅ All services stopped"
else
    echo "⚠️  No PID file found. Attempting to kill by process name..."
    pkill -f "node.*backend" || true
    pkill -f "node.*notification-service" || true
    pkill -f "node.*analytics-service" || true
    pkill -f "vite.*preview" || true
    echo "✅ Processes terminated"
fi

echo ""
read -p "Do you want to stop Docker infrastructure services? (y/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd "$PROJECT_ROOT/backend"
    echo "Stopping Docker services..."
    docker-compose down
    echo "✅ Docker services stopped"
else
    echo "Docker services left running"
fi

echo ""
echo "================================================"
echo "Shutdown complete"
echo "================================================"
