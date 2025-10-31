import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { getTenantFromRequest } from '@/lib/tenant';
import { NextRequest } from 'next/server';
import MediaIngestTable from '@/components/MediaIngestTable';

interface MediaIngestPageProps {
  searchParams: {
    status?: string;
    kind?: string;
    page?: string;
  };
}

async function getMediaData(clientId: string, searchParams: MediaIngestPageProps['searchParams']) {
  const page = parseInt(searchParams.page || '1');
  const limit = 200;
  const offset = (page - 1) * limit;

  // Build where clause for filtering
  const where: any = {
    clientId: clientId,
  };

  if (searchParams.status) {
    where.status = searchParams.status;
  }

  if (searchParams.kind) {
    where.kind = searchParams.kind;
  }

  // Get media data with product information
  const [media, totalCount] = await Promise.all([
    prisma.media.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: limit,
      skip: offset,
    }),
    prisma.media.count({
      where,
    }),
  ]);

  // Get status counts for summary
  const statusCounts = await prisma.media.groupBy({
    by: ['status'],
    where: {
      clientId: clientId,
    },
    _count: {
      status: true,
    },
  });

  // Get kind counts for summary
  const kindCounts = await prisma.media.groupBy({
    by: ['kind'],
    where: {
      clientId: clientId,
    },
    _count: {
      kind: true,
    },
  });

  return {
    media,
    totalCount,
    statusCounts: statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>),
    kindCounts: kindCounts.reduce((acc, item) => {
      acc[item.kind] = item._count.kind;
      return acc;
    }, {} as Record<string, number>),
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      hasNext: page < Math.ceil(totalCount / limit),
      hasPrev: page > 1,
    },
  };
}

export default async function MediaIngestPage({ searchParams }: MediaIngestPageProps) {
  // Note: In a real implementation, you'd need to get the clientId from the request
  // For now, we'll use a placeholder - this should be handled by middleware or auth
  const clientId = 'placeholder-client-id'; // TODO: Get from authenticated user context

  const data = await getMediaData(clientId, searchParams);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-[10px]">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Media Ingest Status</h1>
          <p className="mt-2 text-gray-600">
            Monitor and manage media processing status for your products
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Media</p>
                <p className="text-2xl font-semibold text-gray-900">{data.totalCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">{data.statusCounts.completed || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">{data.statusCounts.pending || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Failed</p>
                <p className="text-2xl font-semibold text-gray-900">{data.statusCounts.failed || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status-filter"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                defaultValue={searchParams.status || ''}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div>
              <label htmlFor="kind-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                id="kind-filter"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                defaultValue={searchParams.kind || ''}
              >
                <option value="">All Types</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={() => {
                  // Reset filters
                  window.location.href = '/dashboard/media-ingest';
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Media Table */}
        <Suspense fallback={<div className="text-center py-8">Loading media data...</div>}>
          <MediaIngestTable 
            media={data.media} 
            pagination={data.pagination}
            currentFilters={{
              status: searchParams.status,
              kind: searchParams.kind,
            }}
          />
        </Suspense>
      </div>
    </div>
  );
}
