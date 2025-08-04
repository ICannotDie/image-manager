import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import { join } from 'path';

export async function DELETE(request: NextRequest) {
  try {
    const { filename } = await request.json();
    
    if (!filename) {
      return NextResponse.json(
        { error: 'Filename is required' },
        { status: 400 }
      );
    }
    
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    const filepath = join(uploadDir, filename);
    
    try {
      await unlink(filepath);
      return NextResponse.json({
        message: 'File deleted successfully',
        filename: filename
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      return NextResponse.json(
        { error: 'File not found or could not be deleted' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error in delete endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
} 