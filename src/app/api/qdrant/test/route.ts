import { NextResponse } from 'next/server';
import { testConnection, initializeCollection, deleteImagesByDirectory, getAllImageVectors } from '@/lib/qdrant';
import { NextRequest } from 'next/server';

export async function GET() {
  try {
    // Test connection to Qdrant
    const isConnected = await testConnection();
    
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Failed to connect to Qdrant. Make sure it\'s running on http://localhost:6333' },
        { status: 500 }
      );
    }

    // Initialize the collection
    await initializeCollection();

    return NextResponse.json({
      success: true,
      message: 'Successfully connected to Qdrant and initialized collection',
    });
  } catch (error) {
    console.error('Qdrant test error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to Qdrant', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, directoryPath } = body;

    if (action === 'delete-directory') {
      if (!directoryPath) {
        return NextResponse.json(
          { error: 'Directory path is required for delete action' },
          { status: 400 }
        );
      }

      // Get all vectors before deletion for comparison
      const beforeDeletion = await getAllImageVectors(1000);
      
      // Delete images by directory
      const result = await deleteImagesByDirectory(directoryPath);
      
      // Get all vectors after deletion
      const afterDeletion = await getAllImageVectors(1000);

      return NextResponse.json({
        success: true,
        message: `Tested directory deletion for: ${directoryPath}`,
        deletedCount: result.deletedCount,
        beforeCount: beforeDeletion.length,
        afterCount: afterDeletion.length,
        result
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "delete-directory" with directoryPath' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Qdrant test POST error:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 