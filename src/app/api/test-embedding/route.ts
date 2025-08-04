import { NextRequest, NextResponse } from 'next/server';
import { generateImageEmbedding } from '@/lib/embeddingGenerator';
import { join } from 'path';
import { access } from 'fs/promises';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imagePath } = body;

    if (!imagePath) {
      return NextResponse.json(
        { error: 'imagePath is required' },
        { status: 400 }
      );
    }

    // Check if the image file exists
    try {
      await access(imagePath);
    } catch (error) {
      return NextResponse.json(
        { error: `Image file not found: ${imagePath}` },
        { status: 404 }
      );
    }

    console.log(`Testing embedding generation for: ${imagePath}`);
    
    // Generate embedding
    const embedding = await generateImageEmbedding(imagePath);
    
    // Validate the embedding
    if (!Array.isArray(embedding) || embedding.length !== 1000) {
      return NextResponse.json(
        { error: `Invalid embedding: expected array of length 1000, got ${Array.isArray(embedding) ? embedding.length : typeof embedding}` },
        { status: 500 }
      );
    }

    // Check for invalid values
    const hasInvalidValues = embedding.some(val => !Number.isFinite(val));
    if (hasInvalidValues) {
      return NextResponse.json(
        { error: 'Embedding contains invalid values (NaN or infinite)' },
        { status: 500 }
      );
    }

    // Calculate statistics
    const min = Math.min(...embedding);
    const max = Math.max(...embedding);
    const mean = embedding.reduce((sum, val) => sum + val, 0) / embedding.length;
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));

    return NextResponse.json({
      success: true,
      embedding: {
        length: embedding.length,
        sample: embedding.slice(0, 10), // First 10 values
        statistics: {
          min,
          max,
          mean,
          magnitude,
          isNormalized: Math.abs(magnitude - 1.0) < 0.01
        }
      }
    });

  } catch (error) {
    console.error('Error testing embedding generation:', error);
    return NextResponse.json(
      { error: `Failed to generate embedding: ${error}` },
      { status: 500 }
    );
  }
} 