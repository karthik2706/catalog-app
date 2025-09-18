#!/bin/bash

# Embedding Service Smoke Test
# This script tests the FastAPI embedding service endpoints
# Run with: chmod +x tests/embedding_smoke.sh && ./tests/embedding_smoke.sh

set -e  # Exit on any error

# Configuration
EMBEDDING_SERVICE_URL="${EMBEDDING_SERVICE_URL:-http://localhost:8000}"
SAMPLE_IMAGE_PATH="${SAMPLE_IMAGE_PATH:-tests/sample-image.jpg}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Test functions
test_health_endpoint() {
    log_info "Testing health endpoint..."
    
    local response=$(curl -s -w "\n%{http_code}" "${EMBEDDING_SERVICE_URL}/health")
    local body=$(echo "$response" | head -n -1)
    local status_code=$(echo "$response" | tail -n 1)
    
    if [ "$status_code" -eq 200 ]; then
        log_success "Health endpoint returned 200"
        echo "Response: $body"
        
        # Check if model is loaded
        if echo "$body" | grep -q '"model_loaded": true'; then
            log_success "Model is loaded"
        else
            log_warning "Model is not loaded"
        fi
        
        # Check device
        local device=$(echo "$body" | grep -o '"device": "[^"]*"' | cut -d'"' -f4)
        log_info "Running on device: $device"
        
    else
        log_error "Health endpoint returned $status_code"
        echo "Response: $body"
        return 1
    fi
}

test_root_endpoint() {
    log_info "Testing root endpoint..."
    
    local response=$(curl -s -w "\n%{http_code}" "${EMBEDDING_SERVICE_URL}/")
    local body=$(echo "$response" | head -n -1)
    local status_code=$(echo "$response" | tail -n 1)
    
    if [ "$status_code" -eq 200 ]; then
        log_success "Root endpoint returned 200"
        echo "Response: $body"
    else
        log_error "Root endpoint returned $status_code"
        echo "Response: $body"
        return 1
    fi
}

create_sample_image() {
    log_info "Creating sample image for testing..."
    
    # Create a simple test image using ImageMagick if available
    if command -v convert &> /dev/null; then
        convert -size 100x100 xc:blue -fill white -pointsize 20 -gravity center -annotate +0+0 "TEST" "$SAMPLE_IMAGE_PATH"
        log_success "Created sample image: $SAMPLE_IMAGE_PATH"
    else
        log_warning "ImageMagick not available, using placeholder"
        # Create a minimal JPEG file (1x1 pixel)
        printf '\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xc0\x00\x11\x08\x00\x01\x00\x01\x01\x01\x11\x00\x02\x11\x01\x03\x11\x01\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x08\xff\xc4\x00\x14\x10\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xda\x00\x0c\x03\x01\x00\x02\x11\x03\x11\x00\x3f\x00\xaa\xff\xd9' > "$SAMPLE_IMAGE_PATH"
        log_success "Created minimal JPEG: $SAMPLE_IMAGE_PATH"
    fi
}

test_embed_image_endpoint() {
    log_info "Testing embed-image endpoint..."
    
    # Check if sample image exists
    if [ ! -f "$SAMPLE_IMAGE_PATH" ]; then
        log_warning "Sample image not found, creating one..."
        create_sample_image
    fi
    
    # Test the embed-image endpoint
    local response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -F "file=@$SAMPLE_IMAGE_PATH" \
        "${EMBEDDING_SERVICE_URL}/embed-image")
    
    local body=$(echo "$response" | head -n -1)
    local status_code=$(echo "$response" | tail -n 1)
    
    if [ "$status_code" -eq 200 ]; then
        log_success "Embed-image endpoint returned 200"
        
        # Check response structure
        if echo "$body" | grep -q '"embedding"'; then
            log_success "Response contains embedding field"
        else
            log_error "Response missing embedding field"
            return 1
        fi
        
        # Check embedding dimension
        local embedding_length=$(echo "$body" | grep -o '"embedding": \[.*\]' | grep -o ',' | wc -l)
        if [ "$embedding_length" -eq 511 ]; then  # 512 elements = 511 commas
            log_success "Embedding has correct dimension (512)"
        else
            log_warning "Embedding dimension may be incorrect (expected 512, got $((embedding_length + 1)))"
        fi
        
        # Check model info
        if echo "$body" | grep -q '"model": "CLIP-ViT-B/32"'; then
            log_success "Correct model reported"
        else
            log_warning "Model info may be incorrect"
        fi
        
        echo "Sample response:"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        
    else
        log_error "Embed-image endpoint returned $status_code"
        echo "Response: $body"
        return 1
    fi
}

test_invalid_file_type() {
    log_info "Testing invalid file type handling..."
    
    # Create a text file
    echo "This is not an image" > /tmp/test.txt
    
    local response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -F "file=@/tmp/test.txt" \
        "${EMBEDDING_SERVICE_URL}/embed-image")
    
    local body=$(echo "$response" | head -n -1)
    local status_code=$(echo "$response" | tail -n 1)
    
    if [ "$status_code" -eq 400 ]; then
        log_success "Invalid file type correctly rejected (400)"
        echo "Response: $body"
    else
        log_warning "Invalid file type handling may need improvement (got $status_code)"
        echo "Response: $body"
    fi
    
    # Cleanup
    rm -f /tmp/test.txt
}

test_empty_file() {
    log_info "Testing empty file handling..."
    
    # Create an empty file
    touch /tmp/empty.jpg
    
    local response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -F "file=@/tmp/empty.jpg" \
        "${EMBEDDING_SERVICE_URL}/embed-image")
    
    local body=$(echo "$response" | head -n -1)
    local status_code=$(echo "$response" | tail -n 1)
    
    if [ "$status_code" -eq 400 ]; then
        log_success "Empty file correctly rejected (400)"
        echo "Response: $body"
    else
        log_warning "Empty file handling may need improvement (got $status_code)"
        echo "Response: $body"
    fi
    
    # Cleanup
    rm -f /tmp/empty.jpg
}

test_large_file() {
    log_info "Testing large file handling..."
    
    # Create a large file (10MB)
    dd if=/dev/zero of=/tmp/large.jpg bs=1M count=10 2>/dev/null
    
    local response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -F "file=@/tmp/large.jpg" \
        "${EMBEDDING_SERVICE_URL}/embed-image")
    
    local body=$(echo "$response" | head -n -1)
    local status_code=$(echo "$response" | tail -n 1)
    
    if [ "$status_code" -eq 200 ]; then
        log_success "Large file processed successfully"
    elif [ "$status_code" -eq 413 ]; then
        log_success "Large file correctly rejected (413 - Payload Too Large)"
    else
        log_warning "Large file handling returned $status_code"
    fi
    
    echo "Response: $body"
    
    # Cleanup
    rm -f /tmp/large.jpg
}

# Performance test
test_performance() {
    log_info "Testing performance with multiple requests..."
    
    local start_time=$(date +%s)
    local success_count=0
    local total_requests=5
    
    for i in $(seq 1 $total_requests); do
        local response=$(curl -s -w "\n%{http_code}" \
            -X POST \
            -F "file=@$SAMPLE_IMAGE_PATH" \
            "${EMBEDDING_SERVICE_URL}/embed-image")
        
        local status_code=$(echo "$response" | tail -n 1)
        if [ "$status_code" -eq 200 ]; then
            ((success_count++))
        fi
    done
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local avg_time=$((duration * 1000 / total_requests))  # Convert to milliseconds
    
    log_info "Performance test results:"
    echo "  Total requests: $total_requests"
    echo "  Successful: $success_count"
    echo "  Failed: $((total_requests - success_count))"
    echo "  Total time: ${duration}s"
    echo "  Average time per request: ${avg_time}ms"
    
    if [ "$success_count" -eq "$total_requests" ]; then
        log_success "All performance tests passed"
    else
        log_warning "Some performance tests failed"
    fi
}

# Main test execution
main() {
    echo "=========================================="
    echo "Embedding Service Smoke Test"
    echo "=========================================="
    echo "Service URL: $EMBEDDING_SERVICE_URL"
    echo "Sample Image: $SAMPLE_IMAGE_PATH"
    echo ""
    
    # Check if service is reachable
    if ! curl -s --connect-timeout 5 "${EMBEDDING_SERVICE_URL}/health" > /dev/null; then
        log_error "Cannot reach embedding service at $EMBEDDING_SERVICE_URL"
        log_info "Make sure the service is running:"
        log_info "  cd services/embedding_service"
        log_info "  python app.py"
        exit 1
    fi
    
    # Run tests
    test_health_endpoint
    echo ""
    
    test_root_endpoint
    echo ""
    
    test_embed_image_endpoint
    echo ""
    
    test_invalid_file_type
    echo ""
    
    test_empty_file
    echo ""
    
    test_large_file
    echo ""
    
    test_performance
    echo ""
    
    # Cleanup
    if [ -f "$SAMPLE_IMAGE_PATH" ]; then
        rm -f "$SAMPLE_IMAGE_PATH"
        log_info "Cleaned up sample image"
    fi
    
    echo "=========================================="
    log_success "All tests completed!"
    echo "=========================================="
}

# Run main function
main "$@"
