"""
FastAPI Embedding Service for Visual Search

This service provides CLIP ViT-B/32 embeddings for images and video frames.
It returns L2-normalized 512-dimensional vectors suitable for cosine similarity search.
"""

import io
import logging
from typing import List
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from PIL import Image
import torch
import clip
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Visual Search Embedding Service",
    description="CLIP ViT-B/32 embedding service for image similarity search",
    version="1.0.0"
)

# Global variables for model
device = "cuda" if torch.cuda.is_available() else "cpu"
model = None
preprocess = None

class EmbeddingResponse(BaseModel):
    embedding: List[float]
    model: str
    device: str

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    device: str

def load_model():
    """Load CLIP model and preprocessing function"""
    global model, preprocess
    
    try:
        logger.info(f"Loading CLIP model on {device}")
        model, preprocess = clip.load("ViT-B/32", device=device)
        model.eval()
        logger.info("CLIP model loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load CLIP model: {e}")
        raise e

def preprocess_image(image_bytes: bytes) -> torch.Tensor:
    """
    Preprocess image bytes for CLIP model
    
    Args:
        image_bytes: Raw image bytes
        
    Returns:
        Preprocessed image tensor
    """
    try:
        # Load image from bytes
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Preprocess for CLIP
        image_tensor = preprocess(image).unsqueeze(0).to(device)
        
        return image_tensor
    except Exception as e:
        logger.error(f"Failed to preprocess image: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid image format: {str(e)}")

def get_image_embedding(image_tensor: torch.Tensor) -> List[float]:
    """
    Generate CLIP embedding for image tensor
    
    Args:
        image_tensor: Preprocessed image tensor
        
    Returns:
        L2-normalized 512-dimensional embedding vector
    """
    try:
        with torch.no_grad():
            # Get image features
            image_features = model.encode_image(image_tensor)
            
            # L2 normalize the features
            image_features = image_features / image_features.norm(dim=-1, keepdim=True)
            
            # Convert to list and ensure it's 512 dimensions
            embedding = image_features.cpu().numpy().flatten().tolist()
            
            # Verify dimension
            if len(embedding) != 512:
                raise ValueError(f"Expected 512 dimensions, got {len(embedding)}")
            
            return embedding
    except Exception as e:
        logger.error(f"Failed to generate embedding: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate embedding: {str(e)}")

@app.on_event("startup")
async def startup_event():
    """Load model on startup"""
    load_model()

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        model_loaded=model is not None,
        device=device
    )

@app.post("/embed-image", response_model=EmbeddingResponse)
# TUNING:
# - Concurrency: 2-4 workers for CPU, 8-16 for GPU (adjust based on model size and memory)
# - Batching: Process 5-10 images per batch for better GPU utilization
# - Model loading: Use model caching and warm-up to reduce first-request latency
# - Memory: Monitor GPU memory usage, consider model quantization for production
# - Queue: Use Redis/RabbitMQ for request queuing and load balancing
async def embed_image(file: UploadFile = File(...)):
    """
    Generate CLIP embedding for uploaded image
    
    Args:
        file: Image file upload
        
    Returns:
        JSON response with 512-dimensional embedding vector
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Read file content
        image_bytes = await file.read()
        
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty file")
        
        # Preprocess image
        image_tensor = preprocess_image(image_bytes)
        
        # Generate embedding
        embedding = get_image_embedding(image_tensor)
        
        logger.info(f"Generated embedding for {file.filename} ({len(image_bytes)} bytes)")
        
        return EmbeddingResponse(
            embedding=embedding,
            model="CLIP-ViT-B/32",
            device=device
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error processing image: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "service": "Visual Search Embedding Service",
        "version": "1.0.0",
        "model": "CLIP-ViT-B/32",
        "device": device,
        "endpoints": {
            "health": "/health",
            "embed_image": "/embed-image"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
