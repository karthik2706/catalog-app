'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { X, Upload, Search, Image as ImageIcon, Video, Clock, AlertCircle } from 'lucide-react';
import useFileInput from '@/hooks/useFileInput';

interface SearchResult {
  productId: string;
  productName: string;
  score: number;
  match: {
    type: 'image' | 'video';
    tsMs?: number;
    thumbUrl?: string;
  };
}

interface SearchByImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (file: File) => Promise<SearchResult[]>;
}

export default function SearchByImageModal({ isOpen, onClose, onSearch }: SearchByImageModalProps) {
  const router = useRouter();
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const fileInput = useFileInput({
    accept: 'image/jpeg,image/jpg,image/png,image/webp',
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    onError: (error) => setSearchError(error),
  });

  const handleSearch = useCallback(async () => {
    if (fileInput.files.length === 0) {
      setSearchError('Please select an image to search');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);

    try {
      const results = await onSearch(fileInput.files[0]);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchError(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  }, [fileInput.files, onSearch]);

  const handleProductClick = useCallback((productId: string) => {
    router.push(`/products/${productId}`);
    onClose();
  }, [router, onClose]);

  const handleClose = useCallback(() => {
    fileInput.clearFiles();
    setSearchResults([]);
    setSearchError(null);
    onClose();
  }, [fileInput, onClose]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    } else if (minutes > 0) {
      return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
    } else {
      return `${seconds}s`;
    }
  };

  const getMatchBadgeColor = (type: 'image' | 'video') => {
    return type === 'image' 
      ? 'bg-purple-100 text-purple-800' 
      : 'bg-indigo-100 text-indigo-800';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />
        
        {/* Modal */}
        <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Search className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Search by Image</h2>
                <p className="text-sm text-gray-500">Find similar products using visual search</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Upload Area */}
            {fileInput.files.length === 0 && (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  fileInput.isDragOver
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={fileInput.handleDragOver}
                onDragLeave={fileInput.handleDragLeave}
                onDrop={fileInput.handleDrop}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Drop an image here or click to browse
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Supports JPEG, PNG, and WebP up to 10MB
                </p>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={(e) => e.target.files && fileInput.handleFiles(e.target.files)}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  Choose File
                </label>
              </div>
            )}

            {/* File Preview */}
            {fileInput.files.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <img
                      src={fileInput.previewUrls[0]}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {fileInput.files[0].name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(fileInput.files[0].size)}
                    </p>
                  </div>
                  <button
                    onClick={() => fileInput.clearFiles()}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Error Display */}
            {searchError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                  <p className="text-sm text-red-800">{searchError}</p>
                </div>
              </div>
            )}

            {/* Search Button */}
            {fileInput.files.length > 0 && (
              <div className="mb-6">
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isSearching ? (
                    <>
                      <div className="animate-spin -ml-1 mr-3 h-5 w-5 text-white">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      Search Similar Products
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Found {searchResults.length} similar products
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map((result, index) => (
                    <div
                      key={`${result.productId}-${index}`}
                      onClick={() => handleProductClick(result.productId)}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 cursor-pointer transition-all duration-200"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {result.match.thumbUrl ? (
                            <img
                              src={result.match.thumbUrl}
                              alt={result.productName}
                              className="w-16 h-16 object-cover rounded-lg"
                              onLoad={() => {
                                console.log('Image loaded successfully:', result.productName);
                              }}
                              onError={(e) => {
                                console.log('Image failed to load:', result.productName, result.match.thumbUrl);
                                // Hide the image and show fallback icon
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center"
                            style={{ display: result.match.thumbUrl ? 'none' : 'flex' }}
                          >
                            {result.match.type === 'image' ? (
                              <ImageIcon className="w-8 h-8 text-gray-400" />
                            ) : (
                              <Video className="w-8 h-8 text-gray-400" />
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {result.productName}
                          </h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getMatchBadgeColor(result.match.type)}`}>
                              {result.match.type === 'image' ? (
                                <ImageIcon className="w-3 h-3 mr-1" />
                              ) : (
                                <Video className="w-3 h-3 mr-1" />
                              )}
                              {result.match.type}
                            </span>
                            {result.match.tsMs && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatDuration(result.match.tsMs)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Similarity: {Math.min(100, Math.max(0, Math.round((1 - result.score) * 50)))}%
                            {process.env.NODE_ENV !== 'production' && (
                              <span className="block text-xs text-gray-400">
                                score: {result.score.toFixed(4)}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {searchResults.length === 0 && !isSearching && fileInput.files.length > 0 && !searchError && (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No similar products found</h3>
                <p className="text-sm text-gray-500">
                  Try uploading a different image or check back later as we add more products.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
