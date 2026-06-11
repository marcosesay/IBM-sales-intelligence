#!/bin/bash

# Sales Intelligence Briefing Tool - Automated Setup Script
# This script will install all prerequisites and set up the application

set -e  # Exit on error

echo "=================================================="
echo "Sales Intelligence Briefing Tool - Setup"
echo "=================================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Detect operating system
OS="$(uname -s)"
case "${OS}" in
    Linux*)     MACHINE=Linux;;
    Darwin*)    MACHINE=Mac;;
    CYGWIN*|MINGW*|MSYS*)    MACHINE=Windows;;
    *)          MACHINE="UNKNOWN:${OS}"
esac

print_info "Detected OS: $MACHINE"
echo ""

# Check if Node.js is installed
echo "Checking Node.js installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_success "Node.js is installed: $NODE_VERSION"
    
    # Check if version is 18 or higher
    NODE_MAJOR=$(node -v | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt 18 ]; then
        print_error "Node.js version 18 or higher is required. Current version: $NODE_VERSION"
        echo "Please update Node.js from https://nodejs.org"
        exit 1
    fi
else
    print_error "Node.js is not installed"
    echo ""
    echo "Installing Node.js..."
    
    if [ "$MACHINE" = "Mac" ]; then
        # Check if Homebrew is installed
        if ! command -v brew &> /dev/null; then
            print_info "Installing Homebrew..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        fi
        print_info "Installing Node.js via Homebrew..."
        brew install node
    elif [ "$MACHINE" = "Linux" ]; then
        print_info "Installing Node.js via package manager..."
        if command -v apt-get &> /dev/null; then
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
            sudo apt-get install -y nodejs
        elif command -v yum &> /dev/null; then
            curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
            sudo yum install -y nodejs
        else
            print_error "Could not detect package manager. Please install Node.js manually from https://nodejs.org"
            exit 1
        fi
    else
        print_error "Please install Node.js manually from https://nodejs.org"
        exit 1
    fi
    
    print_success "Node.js installed successfully"
fi

echo ""

# Check if pnpm is installed
echo "Checking pnpm installation..."
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm -v)
    print_success "pnpm is installed: $PNPM_VERSION"
else
    print_info "Installing pnpm..."
    npm install -g pnpm
    print_success "pnpm installed successfully"
fi

echo ""

# Check if Git is installed
echo "Checking Git installation..."
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    print_success "Git is installed: $GIT_VERSION"
else
    print_error "Git is not installed"
    echo ""
    if [ "$MACHINE" = "Mac" ]; then
        print_info "Installing Git via Homebrew..."
        brew install git
    elif [ "$MACHINE" = "Linux" ]; then
        print_info "Installing Git via package manager..."
        if command -v apt-get &> /dev/null; then
            sudo apt-get update && sudo apt-get install -y git
        elif command -v yum &> /dev/null; then
            sudo yum install -y git
        fi
    else
        print_error "Please install Git manually from https://git-scm.com"
        exit 1
    fi
    print_success "Git installed successfully"
fi

echo ""
echo "=================================================="
echo "Installing Project Dependencies"
echo "=================================================="
echo ""

# Install backend dependencies
print_info "Installing backend dependencies..."
cd backend
pnpm install
print_success "Backend dependencies installed"
cd ..

echo ""

# Install frontend dependencies
print_info "Installing frontend dependencies..."
cd frontend
pnpm install
print_success "Frontend dependencies installed"
cd ..

echo ""
echo "=================================================="
echo "Environment Configuration"
echo "=================================================="
echo ""

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    print_info "Creating .env file from template..."
    cp backend/.env.example backend/.env
    print_success ".env file created"
    echo ""
    print_info "IMPORTANT: You need to configure your API credentials in backend/.env"
    echo ""
    echo "Required configuration:"
    echo "  1. Get your IBM watsonx.ai API key from: https://cloud.ibm.com/iam/apikeys"
    echo "  2. Open backend/.env in a text editor"
    echo "  3. Replace 'your_watsonx_api_key_here' with your actual API key"
    echo "  4. Optionally add your Project ID"
    echo ""
    read -p "Press Enter to open the .env file in your default editor..."
    
    if [ "$MACHINE" = "Mac" ]; then
        open backend/.env
    elif [ "$MACHINE" = "Linux" ]; then
        if command -v xdg-open &> /dev/null; then
            xdg-open backend/.env
        else
            nano backend/.env
        fi
    fi
    
    echo ""
    read -p "Have you configured your API credentials? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Setup incomplete. Please configure your API credentials in backend/.env and run this script again."
        exit 1
    fi
else
    print_success ".env file already exists"
fi

echo ""
echo "=================================================="
echo "Setup Complete!"
echo "=================================================="
echo ""
print_success "All prerequisites installed and configured"
echo ""
echo "To start the application:"
echo ""
echo "  Option 1: Use the start script (recommended)"
echo "    ./start.sh"
echo ""
echo "  Option 2: Start manually"
echo "    Terminal 1: cd backend && pnpm run dev"
echo "    Terminal 2: cd frontend && pnpm run dev"
echo ""
echo "The application will be available at:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3000"
echo ""
print_info "For more information, see TEAM_ONBOARDING.md"
echo ""

# Made with Bob
