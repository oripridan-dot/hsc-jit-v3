#!/bin/bash
# Development environment setup script

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    log_info "Creating .env file..."
    cat > .env << 'EOF'
# API Configuration
GEMINI_API_KEY=your-api-key-here

# Database Configuration
POSTGRES_DB=hsc_jit
POSTGRES_USER=admin
POSTGRES_PASSWORD=changeme

# Redis Configuration
REDIS_URL=redis://redis:6379

# Environment
PYTHONUNBUFFERED=1
NODE_ENV=development
EOF
    log_warn ".env created with default values - update GEMINI_API_KEY with your actual API key"
fi

# Install Python dependencies
log_info "Installing Python dependencies..."
cd backend
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
cd ..

# Install Node dependencies
log_info "Installing Node dependencies..."
cd frontend
npm install -g pnpm
pnpm install
cd ..

log_info "Development environment setup complete!"
log_info "To start services, run: docker-compose up -d"
