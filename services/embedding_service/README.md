# Visual Search Embedding Service

A FastAPI microservice that provides CLIP ViT-B/32 embeddings for visual similarity search. This service processes images and returns L2-normalized 512-dimensional vectors suitable for cosine similarity search in PostgreSQL with pgvector.

## Features

- **CLIP ViT-B/32 Model**: State-of-the-art vision-language model for image understanding
- **L2 Normalized Embeddings**: 512-dimensional vectors optimized for cosine similarity
- **FastAPI**: High-performance async web framework
- **Docker Support**: Containerized deployment with health checks
- **GPU Support**: Automatic CUDA detection and utilization

## Quick Start

### Using Docker (Recommended)

```bash
# Build the image
docker build -t embedding-service .

# Run the container
docker run -p 8000:8000 embedding-service
```

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run the service
python app.py
```

The service will be available at `http://localhost:8000`

## API Endpoints

### Health Check

Check if the service is running and the model is loaded:

```bash
curl -X GET "http://localhost:8000/health"
```

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "device": "cuda"
}
```

### Generate Image Embedding

Upload an image to get its CLIP embedding:

```bash
curl -X POST "http://localhost:8000/embed-image" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@path/to/your/image.jpg"
```

**Response:**
```json
{
  "embedding": [0.1234, -0.5678, 0.9012, ...],  // 512 float values
  "model": "CLIP-ViT-B/32",
  "device": "cuda"
}
```

### Service Information

Get basic service information:

```bash
curl -X GET "http://localhost:8000/"
```

## Usage Examples

### Python Client

```python
import requests
import json

# Health check
response = requests.get("http://localhost:8000/health")
print(response.json())

# Generate embedding
with open("image.jpg", "rb") as f:
    files = {"file": f}
    response = requests.post("http://localhost:8000/embed-image", files=files)
    
embedding = response.json()["embedding"]
print(f"Generated {len(embedding)}-dimensional embedding")
```

### JavaScript/Node.js Client

```javascript
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

// Health check
const healthResponse = await axios.get('http://localhost:8000/health');
console.log(healthResponse.data);

// Generate embedding
const form = new FormData();
form.append('file', fs.createReadStream('image.jpg'));

const embeddingResponse = await axios.post('http://localhost:8000/embed-image', form, {
  headers: form.getHeaders()
});

const embedding = embeddingResponse.data.embedding;
console.log(`Generated ${embedding.length}-dimensional embedding`);
```

## Integration with Stock Mind

This service is designed to work with the Stock Mind visual search system:

1. **Image Upload**: When users upload product images, they're sent to this service
2. **Embedding Generation**: The service returns normalized 512-dimensional vectors
3. **Vector Storage**: Embeddings are stored in PostgreSQL with pgvector
4. **Similarity Search**: Cosine similarity queries find matching products

## Performance

- **Model Loading**: ~2-3 seconds on first startup
- **Inference Speed**: ~50-100ms per image (GPU), ~200-500ms (CPU)
- **Memory Usage**: ~1.5GB RAM for the model
- **Concurrent Requests**: Handles multiple requests efficiently

## Configuration

### Environment Variables

- `CUDA_VISIBLE_DEVICES`: Control GPU usage (e.g., "0" for first GPU)
- `LOG_LEVEL`: Set logging level (DEBUG, INFO, WARNING, ERROR)

### Docker Configuration

The Dockerfile creates a minimal image with:
- Python 3.11 slim base
- Non-root user for security
- Health check endpoint
- Optimized layer caching

## Development

### Running Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio

# Run tests
pytest
```

### Building for Production

```bash
# Build optimized image
docker build -t embedding-service:latest .

# Run with resource limits
docker run -d \
  --name embedding-service \
  --memory=2g \
  --cpus=2 \
  -p 8000:8000 \
  embedding-service:latest
```

## Troubleshooting

### Common Issues

1. **CUDA Out of Memory**: Reduce batch size or use CPU mode
2. **Model Loading Fails**: Check internet connection for model download
3. **Invalid Image Format**: Ensure images are in supported formats (JPEG, PNG, etc.)

### Logs

Check container logs:
```bash
docker logs embedding-service
```

### Health Check

The service includes a health check that verifies:
- Service is responding
- Model is loaded
- Device is available

## License

This service is part of the Stock Mind platform and follows the same licensing terms.
