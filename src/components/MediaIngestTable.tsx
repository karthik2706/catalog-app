'use client';

import { useState } from 'react';
import { Media, Product } from '@prisma/client';

interface MediaWithProduct extends Media {
  product: {
    id: string;
    name: string;
    sku: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface MediaIngestTableProps {
  media: MediaWithProduct[];
  pagination: Pagination;
  currentFilters: {
    status?: string;
    kind?: string;
  };
}

interface ReprocessResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export default function MediaIngestTable({ media, pagination, currentFilters }: MediaIngestTableProps) {
  const [reprocessing, setReprocessing] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const handleReprocess = async (mediaId: string) => {
    setReprocessing(prev => new Set(prev).add(mediaId));
    
    try {
      const response = await fetch(`/api/media/reprocess/${mediaId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result: ReprocessResponse = await response.json();

      if (result.success) {
        showToast('success', 'Media queued for reprocessing');
        // Refresh the page to show updated status
        window.location.reload();
      } else {
        showToast('error', result.error || 'Failed to reprocess media');
      }
    } catch (error) {
      console.error('Reprocess error:', error);
      showToast('error', 'Failed to reprocess media');
    } finally {
      setReprocessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(mediaId);
        return newSet;
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'processing':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getKindBadge = (kind: string) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    
    switch (kind) {
      case 'image':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case 'video':
        return `${baseClasses} bg-indigo-100 text-indigo-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return '-';
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const truncateS3Key = (s3Key: string) => {
    if (s3Key.length <= 50) return s3Key;
    return s3Key.substring(0, 47) + '...';
  };

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`rounded-md p-4 shadow-lg ${
            toast.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {toast.type === 'success' ? (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  toast.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {toast.message}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Media Files</h3>
            <div className="text-sm text-gray-500">
              Showing {media.length} of {pagination.totalPages * pagination.limit} files
            </div>
          </div>

          {media.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No media files</h3>
              <p className="mt-1 text-sm text-gray-500">
                {currentFilters.status || currentFilters.kind 
                  ? 'No media files match your current filters.'
                  : 'Upload some media files to get started.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Media
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dimensions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Updated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {media.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {item.kind === 'image' ? (
                              <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            ) : (
                              <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {truncateS3Key(item.s3Key)}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {item.id.toString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.product.name}</div>
                        <div className="text-sm text-gray-500">SKU: {item.product.sku}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getKindBadge(item.kind)}>
                          {item.kind}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadge(item.status)}>
                          {item.status}
                        </span>
                        {item.error && (
                          <div className="mt-1 text-xs text-red-600 max-w-xs truncate" title={item.error}>
                            {item.error}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.width && item.height ? `${item.width}×${item.height}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDuration(item.durationMs)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(item.updatedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleReprocess(item.id.toString())}
                          disabled={reprocessing.has(item.id.toString())}
                          className="text-blue-600 hover:text-blue-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          {reprocessing.has(item.id.toString()) ? (
                            <div className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processing...
                            </div>
                          ) : (
                            'Reprocess'
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  disabled={!pagination.hasPrev}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => {
                    const url = new URL(window.location.href);
                    url.searchParams.set('page', (pagination.page - 1).toString());
                    window.location.href = url.toString();
                  }}
                >
                  Previous
                </button>
                <button
                  disabled={!pagination.hasNext}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => {
                    const url = new URL(window.location.href);
                    url.searchParams.set('page', (pagination.page + 1).toString());
                    window.location.href = url.toString();
                  }}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing page <span className="font-medium">{pagination.page}</span> of{' '}
                    <span className="font-medium">{pagination.totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      disabled={!pagination.hasPrev}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => {
                        const url = new URL(window.location.href);
                        url.searchParams.set('page', (pagination.page - 1).toString());
                        window.location.href = url.toString();
                      }}
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      disabled={!pagination.hasNext}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => {
                        const url = new URL(window.location.href);
                        url.searchParams.set('page', (pagination.page + 1).toString());
                        window.location.href = url.toString();
                      }}
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
