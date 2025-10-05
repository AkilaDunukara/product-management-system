#!/bin/bash

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "================================================"
echo "Product Management System - Log Viewer"
echo "================================================"
echo ""
echo "Select a service to view logs:"
echo ""
echo "  1) Backend API"
echo "  2) Notification Service"
echo "  3) Analytics Service"
echo "  4) Frontend"
echo "  5) All services (combined)"
echo "  6) Docker infrastructure logs"
echo "  0) Exit"
echo ""
read -p "Enter choice [0-6]: " choice

case $choice in
    1)
        echo "Viewing Backend API logs (Ctrl+C to exit)..."
        tail -f "$PROJECT_ROOT/logs/backend.log"
        ;;
    2)
        echo "Viewing Notification Service logs (Ctrl+C to exit)..."
        tail -f "$PROJECT_ROOT/logs/notification-service.log"
        ;;
    3)
        echo "Viewing Analytics Service logs (Ctrl+C to exit)..."
        tail -f "$PROJECT_ROOT/logs/analytics-service.log"
        ;;
    4)
        echo "Viewing Frontend logs (Ctrl+C to exit)..."
        tail -f "$PROJECT_ROOT/logs/frontend.log"
        ;;
    5)
        echo "Viewing all service logs (Ctrl+C to exit)..."
        tail -f "$PROJECT_ROOT/logs/"*.log
        ;;
    6)
        echo "Viewing Docker infrastructure logs (Ctrl+C to exit)..."
        cd "$PROJECT_ROOT/backend"
        docker-compose logs -f
        ;;
    0)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac
