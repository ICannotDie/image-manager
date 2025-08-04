import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, access } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files uploaded' },
        { status: 400 }
      );
    }

    const uploadDir = join(process.cwd(), 'public', 'uploads');
    
    // Ensure upload directory exists
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      console.error('Error creating upload directory:', error);
    }

    const savedFiles = [];
    const duplicateFiles = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        continue; // Skip non-image files
      }

      const filename = file.name;
      const filepath = join(uploadDir, filename);
      
      // Check if file already exists
      try {
        await access(filepath);
        // File exists, add to duplicates list
        duplicateFiles.push({
          originalName: file.name,
          reason: 'File already exists'
        });
        continue;
      } catch (error) {
        // File doesn't exist, proceed with upload
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      await writeFile(filepath, buffer);
      
      savedFiles.push({
        originalName: file.name,
        filename: filename,
        size: file.size,
        type: file.type,
        path: `/uploads/${filename}`
      });
    }

    return NextResponse.json({
      message: 'Upload completed',
      files: savedFiles,
      duplicates: duplicateFiles,
      uploaded: savedFiles.length,
      skipped: duplicateFiles.length
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    );
  }
} 