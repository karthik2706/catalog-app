#!/usr/bin/env python3
"""
Mock Embedding Service for Testing
This provides a simple mock service that returns fake embeddings for testing purposes.
"""

import json
import random
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
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
                "device": "cpu"
            }
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_POST(self):
        if self.path == '/embed-image':
            # Read the multipart form data
            content_length = self.headers.get('Content-Length')
            if not content_length:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b'Missing Content-Length header')
                return
                
            content_length = int(content_length)
            post_data = self.rfile.read(content_length)
            
            # Generate a fake 512-dimensional embedding
            fake_embedding = [random.uniform(-1, 1) for _ in range(512)]
            
            # Normalize the vector (L2 normalization)
            norm = sum(x*x for x in fake_embedding) ** 0.5
            normalized_embedding = [x/norm for x in fake_embedding]
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            response = {
                "embedding": normalized_embedding,
                "model": "CLIP-ViT-B/32",
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
    server = HTTPServer(('localhost', 8000), MockEmbeddingHandler)
    print("Mock embedding service running on http://localhost:8000")
    print("Endpoints:")
    print("  GET  /health - Health check")
    print("  POST /embed-image - Generate fake embedding")
    server.serve_forever()
