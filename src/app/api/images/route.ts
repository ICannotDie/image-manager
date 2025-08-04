import { NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    
    try {
      const files = await readdir(uploadDir);
      const imageFiles = [];
      
      for (const filename of files) {
        const filepath = join(uploadDir, filename);
        const stats = await stat(filepath);
        
        // Check if it's a file and has an image extension
        if (stats.isFile() && /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(filename)) {
          imageFiles.push({
            originalName: filename,
            filename: filename,
            size: stats.size,
            type: `image/${filename.split('.').pop()?.toLowerCase()}`,
            path: `/uploads/${filename}`
          });
        }
      }
      
      return NextResponse.json({
        files: imageFiles
      });
    } catch (error) {
      // Directory doesn't exist or can't be read
      return NextResponse.json({
        files: []
      });
    }
  } catch (error) {
    console.error('Error listing images:', error);
    return NextResponse.json(
      { error: 'Failed to list images' },
      { status: 500 }
    );
  }
} 