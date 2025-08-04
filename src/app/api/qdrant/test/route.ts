import { NextResponse } from 'next/server';
import { testConnection, initializeCollection } from '@/lib/qdrant';

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