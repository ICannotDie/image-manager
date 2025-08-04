import { NextRequest, NextResponse } from 'next/server';
import { generateImageEmbedding } from '../../../lib/embeddingGenerator';
import { searchSimilarImages } from '../../../lib/qdrant';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const { filename } = await request.json();

    if (!filename) {
      return NextResponse.json(
        { error: 'Filename is required' },
        { status: 400 }
      );
    }

    // Construct the full path to the uploaded image
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    const imagePath = join(uploadDir, filename);

    // Check if the image file exists
    if (!existsSync(imagePath)) {
      return NextResponse.json(
        { error: 'Image file not found' },
        { status: 404 }
      );
    }

    // Generate embedding for the query image
    console.log(`Generating embedding for: ${imagePath}`);
    const queryEmbedding = await generateImageEmbedding(imagePath);

    // Search for similar images in Qdrant
    console.log('Searching for similar images...');
    const searchResults = await searchSimilarImages(queryEmbedding, 10, 0.5);

    // Debug: Log all search results to see filepaths
    console.log('All search results:');
    searchResults.forEach((result, index) => {
      console.log(`${index + 1}. Filepath: ${result.payload?.filepath || 'No filepath'}`);
    });

    // Filter out images from public/images and public/uploads directories
    const filteredResults = searchResults.filter(result => {
      const filepath = result.payload?.filepath as string;
      if (!filepath) {
        console.log('Excluding: No filepath found');
        return false;
      }
      
      const normalizedPath = filepath.replace(/\\/g, '/'); // Normalize path separators
      
      const isPublicImages = normalizedPath.includes('/public/images') || 
                           normalizedPath.includes('public/images') ||
                           normalizedPath.includes('\\public\\images');
      
      const isPublicUploads = normalizedPath.includes('/public/uploads') || 
                             normalizedPath.includes('public/uploads') ||
                             normalizedPath.includes('\\public\\uploads');
      
      // Also exclude the query image itself
      const isQueryImage = result.payload?.filename === filename;
      
      const shouldExclude = isPublicImages || isPublicUploads || isQueryImage;
      
      if (shouldExclude) {
        console.log(`Excluding: ${filepath}${isQueryImage ? ' (query image)' : ''}`);
      }
      
      return !shouldExclude;
    });

    // Take top 4 results
    const topResults = filteredResults.slice(0, 4);

    console.log(`Found ${topResults.length} similar images after filtering`);

    return NextResponse.json({
      success: true,
      results: topResults,
      queryImage: filename
    });

  } catch (error) {
    console.error('Error in similarity search:', error);
    return NextResponse.json(
      { error: 'Failed to perform similarity search' },
      { status: 500 }
    );
  }
} 