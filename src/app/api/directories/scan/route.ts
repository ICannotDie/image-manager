import { NextRequest, NextResponse } from 'next/server';
import { scanDirectory, DirectoryConfig } from '@/lib/directoryScanner';
import { storeImageVector, initializeCollection } from '@/lib/qdrant';
import { generateImageEmbedding } from '@/lib/embeddingGenerator';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { createReadStream } from 'fs';
import { pipeline } from 'stream/promises';

// Track ongoing scans
const ongoingScans = new Map<string, { 
  cancelled: boolean; 
  startTime: number;
  totalFiles: number;
  currentFile: number;
  currentFileName: string;
}>();

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

// Note: generateImageEmbedding is now imported from @/lib/embeddingGenerator

// Check if image exists in Qdrant by filepath
async function imageExistsInQdrant(filepath: string): Promise<boolean> {
  try {
    const { qdrantClient, IMAGE_COLLECTION_NAME } = await import('@/lib/qdrant');
    const results = await qdrantClient.scroll(IMAGE_COLLECTION_NAME, {
      filter: {
        must: [
          {
            key: 'filepath',
            match: { value: filepath }
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const directoryId = searchParams.get('directoryId');
    
    if (!directoryId) {
      return NextResponse.json(
        { error: 'Directory ID is required' },
        { status: 400 }
      );
    }
    
    const scanInfo = ongoingScans.get(directoryId);
    if (!scanInfo) {
      return NextResponse.json(
        { error: 'No scan in progress for this directory' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      cancelled: scanInfo.cancelled,
      totalFiles: scanInfo.totalFiles,
      currentFile: scanInfo.currentFile,
      currentFileName: scanInfo.currentFileName,
      progress: scanInfo.totalFiles > 0 ? Math.round((scanInfo.currentFile / scanInfo.totalFiles) * 100) : 0
    });
  } catch (error) {
    console.error('Error getting scan progress:', error);
    return NextResponse.json(
      { error: 'Failed to get scan progress' },
      { status: 500 }
    );
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
      ongoingScans.set(directoryId, { 
        cancelled: false, 
        startTime: Date.now(),
        totalFiles: 0,
        currentFile: 0,
        currentFileName: ''
      });

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
      
      // Update scan info with total files and initial progress
      const scanInfo = ongoingScans.get(directoryId);
      if (scanInfo) {
        scanInfo.totalFiles = images.length;
        scanInfo.currentFile = 0;
        scanInfo.currentFileName = 'Starting scan...';
        ongoingScans.set(directoryId, scanInfo);
      }
      
      let processedCount = 0;
      let addedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      // Small delay to ensure initial progress is visible
      await new Promise(resolve => setTimeout(resolve, 100));

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        try {
          // Check if scan has been cancelled
          const scanInfo = ongoingScans.get(directoryId);
          if (scanInfo && scanInfo.cancelled) {
            console.log(`Scan cancelled for directory ${directoryId}`);
            break;
          }

          // Update progress
          if (scanInfo) {
            scanInfo.currentFile = i + 1;
            scanInfo.currentFileName = image.filename;
            ongoingScans.set(directoryId, scanInfo);
          }

          console.log(`Processing image: ${image.filename} (${i + 1} of ${images.length})`);
          
                     // Check if image already exists in Qdrant
           const exists = await imageExistsInQdrant(image.filepath);
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
              if (!Array.isArray(embedding) || embedding.length !== 1000) {
                throw new Error(`Invalid embedding: expected array of length 1000, got ${Array.isArray(embedding) ? embedding.length : typeof embedding}`);
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

             // Get cancellation status before cleanup
       const finalScanInfo = ongoingScans.get(directoryId);
       const wasCancelled = finalScanInfo && finalScanInfo.cancelled;
       
       // Clean up scan tracking
       ongoingScans.delete(directoryId);

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