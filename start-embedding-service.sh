#!/bin/bash

# Start Real CLIP Embedding Service
# This script starts the real CLIP embedding service in a virtual environment

echo "🚀 Starting Real CLIP Embedding Service..."

# Check if virtual environment exists
if [ ! -d "embedding-env" ]; then
    echo "❌ Virtual environment not found. Please run setup first:"
    echo "   python3 -m venv embedding-env"
    echo "   source embedding-env/bin/activate"
    echo "   pip install -r embedding-requirements.txt"
    exit 1
fi

# Activate virtual environment and start service
source embedding-env/bin/activate
python3 real-embedding-service.py
