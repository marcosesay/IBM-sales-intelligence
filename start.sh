#!/bin/bash

# Sales Intelligence Briefing Tool - Start Script
# This script starts both backend and frontend servers

echo "=================================================="
echo "Starting Sales Intelligence Briefing Tool"
echo "=================================================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo "Error: backend/.env file not found!"
    echo "Please run ./setup.sh first to configure the application."
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend server
print_info "Starting backend server..."
cd backend
pnpm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Check if backend started successfully
if ps -p $BACKEND_PID > /dev/null; then
    print_success "Backend server started (PID: $BACKEND_PID)"
else
    echo "Error: Backend server failed to start. Check backend.log for details."
    exit 1
fi

# Start frontend server
print_info "Starting frontend server..."
cd frontend
pnpm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait a moment for frontend to start
sleep 3

# Check if frontend started successfully
if ps -p $FRONTEND_PID > /dev/null; then
    print_success "Frontend server started (PID: $FRONTEND_PID)"
else
    echo "Error: Frontend server failed to start. Check frontend.log for details."
    kill $BACKEND_PID
    exit 1
fi

echo ""
echo "=================================================="
print_success "Application is running!"
echo "=================================================="
echo ""
echo "Access the application at:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3000"
echo ""
echo "Logs are being written to:"
echo "  Backend:  backend.log"
echo "  Frontend: frontend.log"
echo ""
print_info "Press Ctrl+C to stop both servers"
echo ""

# Wait for user to stop
wait

# Made with Bob
