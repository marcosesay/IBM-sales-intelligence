#!/bin/bash

# Sales Intelligence Briefing Tool - One-Command Setup
# This script does EVERYTHING - just provide your IBM Cloud API key when prompted

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Sales Intelligence Briefing Tool - Quick Start          ║"
echo "║   One-command setup - just provide your API key!          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }
print_prompt() { echo -e "${YELLOW}➜ $1${NC}"; }

# Detect OS
OS="$(uname -s)"
case "${OS}" in
    Linux*)     MACHINE=Linux;;
    Darwin*)    MACHINE=Mac;;
    *)          MACHINE="UNKNOWN";;
esac

print_info "Detected OS: $MACHINE"
echo ""

# Step 1: Install Node.js if needed
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    NODE_MAJOR=$(node -v | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -ge 18 ]; then
        print_success "Node.js $NODE_VERSION is already installed"
    else
        print_error "Node.js $NODE_VERSION is too old (need 18+)"
        print_info "Installing Node.js 20..."
        if [ "$MACHINE" = "Mac" ]; then
            if ! command -v brew &> /dev/null; then
                print_info "Installing Homebrew first..."
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            fi
            brew install node@20
        elif [ "$MACHINE" = "Linux" ]; then
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
            sudo apt-get install -y nodejs || sudo yum install -y nodejs
        fi
        print_success "Node.js installed"
    fi
else
    print_info "Installing Node.js 20..."
    if [ "$MACHINE" = "Mac" ]; then
        if ! command -v brew &> /dev/null; then
            print_info "Installing Homebrew first..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        fi
        brew install node@20
    elif [ "$MACHINE" = "Linux" ]; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs || sudo yum install -y nodejs
    fi
    print_success "Node.js installed"
fi

echo ""

# Step 2: Install pnpm
if command -v pnpm &> /dev/null; then
    print_success "pnpm is already installed"
else
    print_info "Installing pnpm..."
    npm install -g pnpm
    print_success "pnpm installed"
fi

echo ""

# Step 3: Install dependencies
print_info "Installing project dependencies (this may take a minute)..."
cd backend && pnpm install --silent && cd ..
cd frontend && pnpm install --silent && cd ..
print_success "All dependencies installed"

echo ""

# Step 4: Configure API key
if [ ! -f "backend/.env" ]; then
    print_info "Creating configuration file..."
    cp backend/.env.example backend/.env
    
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║              IBM Cloud API Key Required                   ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Get your API key from: https://cloud.ibm.com/iam/apikeys"
    echo ""
    
    read -p "$(echo -e ${YELLOW}Enter your IBM watsonx.ai API key: ${NC})" API_KEY
    
    if [ -z "$API_KEY" ]; then
        print_error "API key is required!"
        echo "Please run this script again and provide your API key."
        exit 1
    fi
    
    # Update .env file with API key
    if [ "$MACHINE" = "Mac" ]; then
        sed -i '' "s/WATSONX_API_KEY=.*/WATSONX_API_KEY=$API_KEY/" backend/.env
    else
        sed -i "s/WATSONX_API_KEY=.*/WATSONX_API_KEY=$API_KEY/" backend/.env
    fi
    
    print_success "API key configured"
    
    # Optional: Project ID
    echo ""
    read -p "$(echo -e ${YELLOW}Enter your Project ID (optional, press Enter to skip): ${NC})" PROJECT_ID
    
    if [ ! -z "$PROJECT_ID" ]; then
        if [ "$MACHINE" = "Mac" ]; then
            sed -i '' "s/WATSONX_PROJECT_ID=.*/WATSONX_PROJECT_ID=$PROJECT_ID/" backend/.env
        else
            sed -i "s/WATSONX_PROJECT_ID=.*/WATSONX_PROJECT_ID=$PROJECT_ID/" backend/.env
        fi
        print_success "Project ID configured"
    fi
else
    print_success "Configuration file already exists"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  Setup Complete! 🎉                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
print_success "Everything is ready to go!"
echo ""
echo "Starting the application now..."
echo ""

# Step 5: Start the application
print_info "Starting backend server..."
cd backend
pnpm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

sleep 3

if ps -p $BACKEND_PID > /dev/null; then
    print_success "Backend server started"
else
    print_error "Backend failed to start. Check backend.log"
    exit 1
fi

print_info "Starting frontend server..."
cd frontend
pnpm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

sleep 3

if ps -p $FRONTEND_PID > /dev/null; then
    print_success "Frontend server started"
else
    print_error "Frontend failed to start. Check frontend.log"
    kill $BACKEND_PID
    exit 1
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║            🚀 Application is Running! 🚀                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "  📱 Frontend: http://localhost:5173"
echo "  🔧 Backend:  http://localhost:3000"
echo ""
echo "  📋 Logs:"
echo "     Backend:  backend.log"
echo "     Frontend: frontend.log"
echo ""
print_info "Press Ctrl+C to stop both servers"
echo ""

# Cleanup function
cleanup() {
    echo ""
    print_info "Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    print_success "Servers stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Keep script running
wait

# Made with Bob
