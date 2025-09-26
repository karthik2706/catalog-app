import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Individual API Key Management API
 * Handles updates and deletion of specific API keys
 */

// DELETE /api/admin/api-keys/[id] - Delete API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if API key exists
    const apiKey = await prisma.apiKey.findUnique({
      where: { id }
    });

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    // Delete API key
    await prisma.apiKey.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'API key deleted successfully'
    });

  } catch (error: any) {
    console.error('API key DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/api-keys/[id] - Update API key
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { name, isActive, permissions, expiresAt } = await request.json();

    // Check if API key exists
    const existingApiKey = await prisma.apiKey.findUnique({
      where: { id }
    });

    if (!existingApiKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    // Update API key
    const updatedApiKey = await prisma.apiKey.update({
      where: { id },
      data: {
        name,
        isActive,
        permissions,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        updatedAt: new Date()
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedApiKey,
      message: 'API key updated successfully'
    });

  } catch (error: any) {
    console.error('API key PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update API key' },
      { status: 500 }
    );
  }
}
