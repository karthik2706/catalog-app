#!/usr/bin/env python3
"""
Real CLIP Embedding Service
This provides a real CLIP-based embedding service for image similarity search.
"""

import json
import io
import logging
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from PIL import Image
import torch
from sentence_transformers import SentenceTransformer
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RealEmbeddingHandler(BaseHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Initialize CLIP model
        self.model = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        super().__init__(*args, **kwargs)
    
    def load_model(self):
        """Load CLIP model if not already loaded"""
        if self.model is None:
            try:
                logger.info(f"Loading CLIP model on {self.device}...")
                # Use CLIP model from sentence-transformers
                self.model = SentenceTransformer('clip-ViT-B-32')
                self.model = self.model.to(self.device)
                logger.info("CLIP model loaded successfully")
            except Exception as e:
                logger.error(f"Failed to load CLIP model: {e}")
                raise e
    
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            try:
                self.load_model()
                response = {
                    "status": "healthy",
                    "model_loaded": True,
                    "device": self.device,
                    "model_name": "CLIP-ViT-B-32"
                }
            except Exception as e:
                response = {
                    "status": "unhealthy",
                    "model_loaded": False,
                    "device": self.device,
                    "error": str(e)
                }
            
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_POST(self):
        if self.path == '/embed-image':
            try:
                # Load model if not already loaded
                self.load_model()
                
                # Read the multipart form data
                content_length = self.headers.get('Content-Length')
                if not content_length:
                    self.send_response(400)
                    self.end_headers()
                    self.wfile.write(b'Missing Content-Length header')
                    return
                
                content_length = int(content_length)
                post_data = self.rfile.read(content_length)
                
                # Parse multipart form data
                boundary = self.headers.get('Content-Type', '').split('boundary=')[1]
                parts = post_data.split(f'--{boundary}'.encode())
                
                image_data = None
                for part in parts:
                    if b'Content-Disposition: form-data; name="file"' in part:
                        # Extract image data
                        header_end = part.find(b'\r\n\r\n')
                        if header_end != -1:
                            image_data = part[header_end + 4:]
                            # Remove trailing boundary
                            if image_data.endswith(b'\r\n'):
                                image_data = image_data[:-2]
                        break
                
                if image_data is None:
                    self.send_response(400)
                    self.end_headers()
                    self.wfile.write(b'No image file found in form data')
                    return
                
                # Process image
                try:
                    # Load image with PIL
                    image = Image.open(io.BytesIO(image_data))
                    
                    # Convert to RGB if necessary
                    if image.mode != 'RGB':
                        image = image.convert('RGB')
                    
                    # Resize image to standard size (224x224 for CLIP)
                    image = image.resize((224, 224))
                    
                    logger.info(f"Processing image: {image.size}, mode: {image.mode}")
                    
                except Exception as e:
                    logger.error(f"Failed to process image: {e}")
                    self.send_response(400)
                    self.end_headers()
                    self.wfile.write(f'Invalid image file: {str(e)}'.encode())
                    return
                
                # Generate embedding
                try:
                    # Convert PIL image to tensor and generate embedding
                    embedding = self.model.encode([image])
                    embedding_vector = embedding[0].tolist()
                    
                    # Normalize the vector (L2 normalization)
                    embedding_array = np.array(embedding_vector)
                    norm = np.linalg.norm(embedding_array)
                    normalized_embedding = (embedding_array / norm).tolist()
                    
                    logger.info(f"Generated embedding: {len(normalized_embedding)} dimensions")
                    
                except Exception as e:
                    logger.error(f"Failed to generate embedding: {e}")
                    self.send_response(500)
                    self.end_headers()
                    self.wfile.write(f'Embedding generation failed: {str(e)}'.encode())
                    return
                
                # Send response
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                
                response = {
                    "embedding": normalized_embedding,
                    "model": "CLIP-ViT-B-32",
                    "device": self.device,
                    "dimensions": len(normalized_embedding)
                }
                self.wfile.write(json.dumps(response).encode())
                
            except Exception as e:
                logger.error(f"Unexpected error: {e}")
                self.send_response(500)
                self.end_headers()
                self.wfile.write(f'Internal server error: {str(e)}'.encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def log_message(self, format, *args):
        # Suppress default logging
        pass

if __name__ == '__main__':
    try:
        server = HTTPServer(('localhost', 8000), RealEmbeddingHandler)
        print("Real CLIP embedding service starting on http://localhost:8000")
        print("Endpoints:")
        print("  GET  /health - Health check")
        print("  POST /embed-image - Generate CLIP embedding")
        print("Loading CLIP model... This may take a moment on first run.")
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down embedding service...")
        server.shutdown()
    except Exception as e:
        print(f"Failed to start service: {e}")
        exit(1)
