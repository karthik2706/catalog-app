#!/usr/bin/env python3
"""
Mock Embedding Service for Visual Search
This provides a simple mock service that returns random embeddings for testing
"""

import json
import random
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import base64
import io

class MockEmbeddingHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {
                "status": "healthy",
                "model_loaded": True,
                "device": "cpu",
                "service": "mock-embedding-service"
            }
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_POST(self):
        if self.path == '/embed-image':
            # Generate a random 512-dimensional embedding
            embedding = [random.uniform(-1, 1) for _ in range(512)]
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            response = {
                "embedding": embedding,
                "model": "mock-clip-vit-b32",
                "device": "cpu"
            }
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def log_message(self, format, *args):
        # Suppress default logging
        pass

if __name__ == '__main__':
    print("🚀 Starting Mock Embedding Service on http://localhost:8000")
    print("📋 Available endpoints:")
    print("   GET  /health - Health check")
    print("   POST /embed-image - Generate mock embedding")
    
    server = HTTPServer(('localhost', 8000), MockEmbeddingHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Stopping Mock Embedding Service")
        server.shutdown()
