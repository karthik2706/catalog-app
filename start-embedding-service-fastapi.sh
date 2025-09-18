#!/bin/bash

# Stop any existing embedding services
echo "Stopping existing embedding services..."
pkill -f "python3 mock-embedding-service.py"
pkill -f "python3 real-embedding-service.py"
pkill -f "python3 embedding-service-fastapi.py"
pkill -f "uvicorn"
sleep 2

echo "Starting FastAPI CLIP embedding service..."

# Check if virtual environment exists, if not, create it
if [ ! -d "embedding-env" ]; then
  echo "Creating virtual environment 'embedding-env'..."
  python3 -m venv embedding-env
fi

# Activate virtual environment
source embedding-env/bin/activate

# Install dependencies if not already installed
if [ ! -f "embedding-env/requirements_installed" ]; then
  echo "Installing Python dependencies from embedding-requirements.txt..."
  pip install -r embedding-requirements.txt
  touch embedding-env/requirements_installed
else
  echo "Python dependencies already installed."
fi

# Run the FastAPI embedding service in the background
python3 embedding-service-fastapi.py &
echo $! > embedding-service.pid
echo "FastAPI CLIP embedding service started with PID $(cat embedding-service.pid)"
echo "Access at http://localhost:8000"
echo "Health check: http://localhost:8000/healthz"
