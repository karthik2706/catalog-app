#!/usr/bin/env python3
"""
FastAPI-based CLIP Embedding Service
Hardened with proper error handling, normalization, and health checks
"""

import os
import logging
import torch
import numpy as np
from typing import List
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from PIL import Image
from sentence_transformers import SentenceTransformer
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="CLIP Embedding Service", version="1.0.0")

# Global model variable
model = None
device = None

def load_model():
    """Load CLIP model with proper configuration"""
    global model, device
    
    if model is None:
        try:
            device = "cuda" if torch.cuda.is_available() else "cpu"
            logger.info(f"Loading CLIP model on {device}...")
            
            model = SentenceTransformer('clip-ViT-B-32')
            model.eval()  # Set to evaluation mode
            model = model.to(device)
            
            logger.info("CLIP model loaded successfully.")
        except Exception as e:
            logger.error(f"Error loading CLIP model: {e}")
            raise HTTPException(status_code=503, detail="Model loading failed")

def normalize_embedding(embedding: torch.Tensor) -> List[float]:
    """L2 normalize the embedding vector"""
    # Convert to numpy if tensor
    if isinstance(embedding, torch.Tensor):
        embedding = embedding.cpu().numpy()
    
    # L2 normalize: x = x / ||x||
    norm = np.linalg.norm(embedding)
    if norm == 0:
        raise ValueError("Cannot normalize zero vector")
    
    normalized = embedding / norm
    return normalized.tolist()

@app.on_event("startup")
async def startup_event():
    """Load model on startup"""
    load_model()

@app.get("/healthz")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "device": device,
        "model_name": "CLIP-ViT-B/32"
    }

@app.post("/embed-image")
async def embed_image(file: UploadFile = File(...)):
    """Generate CLIP embedding for uploaded image"""
    
    # Ensure model is loaded
    if model is None:
        load_model()
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Open image with PIL
        image = Image.open(io.BytesIO(file_content)).convert("RGB")
        
        # Generate embedding with torch.no_grad() for efficiency
        with torch.no_grad():
            embedding = model.encode(image, convert_to_tensor=True, normalize_embeddings=True)
            # Re-normalize with explicit L2 divide (idempotent)
            embedding = embedding / embedding.norm(p=2)
            embedding = embedding.to(dtype=torch.float32).cpu()
        
        # Convert to list
        normalized_embedding = embedding.tolist()
        
        # Validate embedding dimension
        if len(normalized_embedding) != 512:
            raise ValueError(f"Expected 512-dimensional embedding, got {len(normalized_embedding)}")
        
        return {
            "embedding": normalized_embedding,
            "model": "CLIP-ViT-B/32",
            "device": device,
            "normalized": True,
            "dimension": len(normalized_embedding)
        }
        
    except Exception as e:
        logger.error(f"Error processing image: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process image: {str(e)}")

if __name__ == "__main__":
    import io
    uvicorn.run(app, host="0.0.0.0", port=8000)
