import { NextRequest, NextResponse } from 'next/server';
import { scanDirectory, DirectoryConfig } from '@/lib/directoryScanner';
import { storeImageVector, initializeCollection } from '@/lib/qdrant';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { createReadStream } from 'fs';
import { pipeline } from 'stream/promises';
import { createHash } from 'crypto';

// Track ongoing scans
const ongoingScans = new Map<string, { cancelled: boolean; startTime: number }>();

const CONFIG_FILE = join(process.cwd(), 'data', 'directories.json');

// Load directory configurations from file
async function loadDirectoryConfigs() {
  try {
    const data = await readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Save directory configurations to file
async function saveDirectoryConfigs(configs: any[]) {
  try {
    const { mkdir } = await import('fs/promises');
    const dir = join(process.cwd(), 'data');
    await mkdir(dir, { recursive: true });
    await writeFile(CONFIG_FILE, JSON.stringify(configs, null, 2));
  } catch (error) {
    console.error('Error saving directory configs:', error);
    throw error;
  }
}

// Generate embedding for image (placeholder - you'll need to implement actual embedding)
async function generateImageEmbedding(imagePath: string): Promise<number[]> {
  // This is a placeholder implementation
  // In a real implementation, you would:
  // 1. Load the image using a library like sharp or jimp
  // 2. Preprocess it (resize to standard size, normalize pixel values)
  // 3. Use a vision model like CLIP, ResNet, or a custom model
  // 4. Return the embedding vector
  
  // For now, we'll create a more sophisticated hash-based "embedding"
  // that takes into account file size and modification time for better uniqueness
  const { stat } = await import('fs/promises');
  const stats = await stat(imagePath);
  
  // Create a more unique hash based on path, size, and modification time
  const hashInput = `${imagePath}-${stats.size}-${stats.mtime.getTime()}`;
  const hash = createHash('sha256').update(hashInput).digest('hex');
  const vector = new Array(384).fill(0);
  
  // Convert hash to numbers and fill the vector with normalized values
  for (let i = 0; i < vector.length; i++) {
    const hashIndex = i % hash.length;
    const hashValue = parseInt(hash[hashIndex], 16);
    // Normalize to values between -1 and 1 (typical for cosine similarity)
    vector[i] = (hashValue / 15) * 2 - 1;
  }
  
  return vector;
}

// Check if image exists in Qdrant
async function imageExistsInQdrant(imageId: string): Promise<boolean> {
  try {
    const { qdrantClient, IMAGE_COLLECTION_NAME } = await import('@/lib/qdrant');
    const results = await qdrantClient.scroll(IMAGE_COLLECTION_NAME, {
      filter: {
        must: [
          {
            key: 'id',
            match: { value: imageId }
          }
        ]
      },
      limit: 1
    });
    return results.points.length > 0;
  } catch (error) {
    console.error('Error checking if image exists in Qdrant:', error);
    // If Qdrant is not available, assume image doesn't exist
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { directoryId, action } = body;

    if (action === 'start') {
      // Check if scan is already running
      if (ongoingScans.has(directoryId)) {
        return NextResponse.json(
          { error: 'Scan already in progress for this directory' },
          { status: 400 }
        );
      }

      // Start scanning
      const configs = await loadDirectoryConfigs();
      const directory = configs.find((d: any) => d.id === directoryId);
      
      if (!directory) {
        return NextResponse.json(
          { error: 'Directory not found' },
          { status: 404 }
        );
      }

      // Register this scan
      ongoingScans.set(directoryId, { cancelled: false, startTime: Date.now() });

      // Initialize Qdrant collection
      try {
        await initializeCollection();
        console.log('Qdrant collection initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Qdrant collection:', error);
        return NextResponse.json(
          { error: 'Failed to initialize Qdrant. Make sure Qdrant is running on localhost:6333' },
          { status: 500 }
        );
      }

      // Scan directory for images
      const images = await scanDirectory(directory);
      console.log(`Found ${images.length} images in directory: ${directory.path}`);
      console.log('Images found:', images.map(img => ({ filename: img.filename, filepath: img.filepath })));
      
      let processedCount = 0;
      let addedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      for (const image of images) {
        try {
          // Check if scan has been cancelled
          const scanInfo = ongoingScans.get(directoryId);
          if (scanInfo && scanInfo.cancelled) {
            console.log(`Scan cancelled for directory ${directoryId}`);
            break;
          }

          console.log(`Processing image: ${image.filename}`);
          
          // Check if image already exists in Qdrant
          const exists = await imageExistsInQdrant(image.id);
          console.log(`Image ${image.filename} exists in Qdrant: ${exists}`);
          
          if (!exists) {
            try {
              console.log(`Generating embedding for: ${image.filename}`);
              
              // Check if file exists
              const { access } = await import('fs/promises');
              try {
                await access(image.filepath);
                console.log(`File exists and is accessible: ${image.filepath}`);
              } catch (accessError) {
                console.error(`File not accessible: ${image.filepath}`, accessError);
                throw new Error(`File not accessible: ${image.filepath}`);
              }
              
              // Generate embedding
              const embedding = await generateImageEmbedding(image.filepath);
              console.log(`Embedding generated, length: ${embedding.length}`);
              
              // Validate embedding
              if (!Array.isArray(embedding) || embedding.length !== 384) {
                throw new Error(`Invalid embedding: expected array of length 384, got ${Array.isArray(embedding) ? embedding.length : typeof embedding}`);
              }
              
              // Check for NaN or infinite values
              const hasInvalidValues = embedding.some(val => !Number.isFinite(val));
              if (hasInvalidValues) {
                throw new Error('Embedding contains invalid values (NaN or infinite)');
              }
              
              console.log(`Embedding validation passed: ${embedding.length} values, range: ${Math.min(...embedding)} to ${Math.max(...embedding)}`);
              console.log(`Sample vector values: [${embedding.slice(0, 5).join(', ')}...]`);
              console.log(`Image ID: ${image.id}`);
              
              console.log(`Storing vector for: ${image.filename}`);
              // Store in Qdrant
              await storeImageVector(image.id, embedding, {
                filename: image.filename,
                filepath: image.filepath,
                uploadDate: image.uploadDate,
                directory: image.directory,
                relativePath: image.relativePath,
                size: image.size,
                type: image.type
              });
              
              console.log(`Successfully stored: ${image.filename}`);
              addedCount++;
            } catch (storeError) {
              console.error(`Error storing image ${image.filename}:`, storeError);
              errorCount++;
            }
          } else {
            console.log(`Skipping existing image: ${image.filename}`);
            skippedCount++;
          }
          
          processedCount++;
        } catch (error) {
          console.error(`Error processing image ${image.filename}:`, error);
          errorCount++;
        }
      }

      // Update directory's lastScanned timestamp
      const configIndex = configs.findIndex((d: any) => d.id === directoryId);
      if (configIndex !== -1) {
        configs[configIndex].lastScanned = new Date().toISOString();
        await saveDirectoryConfigs(configs);
      }

      // Clean up scan tracking
      ongoingScans.delete(directoryId);

      const scanInfo = ongoingScans.get(directoryId);
      const wasCancelled = scanInfo && scanInfo.cancelled;

      return NextResponse.json({
        success: true,
        message: wasCancelled ? 'Scan cancelled' : 'Scan completed successfully',
        results: {
          processed: processedCount,
          added: addedCount,
          skipped: skippedCount,
          errors: errorCount,
          cancelled: wasCancelled
        }
      });

    } else if (action === 'stop') {
      // Stop scanning
      const scanInfo = ongoingScans.get(directoryId);
      if (scanInfo) {
        scanInfo.cancelled = true;
        console.log(`Scan cancellation requested for directory ${directoryId}`);
        return NextResponse.json({
          success: true,
          message: 'Scan cancellation requested'
        });
      } else {
        return NextResponse.json({
          success: false,
          message: 'No active scan found for this directory'
        });
      }
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error scanning directory:', error);
    return NextResponse.json(
      { error: 'Failed to scan directory' },
      { status: 500 }
    );
  }
} 