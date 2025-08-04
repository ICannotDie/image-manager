import { QdrantClient } from '@qdrant/js-client-rest';

// Initialize Qdrant client for local instance
export const qdrantClient = new QdrantClient({
  url: 'http://localhost:6333',
});

// Collection name for storing image vectors
export const IMAGE_COLLECTION_NAME = 'images';

// Vector size (this will depend on your embedding model)
// Common sizes: 384 (sentence-transformers), 768 (BERT), 1536 (OpenAI text-embedding-ada-002)
export const VECTOR_SIZE = 384;

// Initialize the collection if it doesn't exist
export async function initializeCollection() {
  try {
    // Check if collection exists
    const collections = await qdrantClient.getCollections();
    const collectionExists = collections.collections.some(
      (collection) => collection.name === IMAGE_COLLECTION_NAME
    );

    if (!collectionExists) {
      // Create collection with proper configuration
      await qdrantClient.createCollection(IMAGE_COLLECTION_NAME, {
        vectors: {
          size: VECTOR_SIZE,
          distance: 'Cosine', // or 'Euclidean', 'Dot'
        },
      });
      console.log(`Collection '${IMAGE_COLLECTION_NAME}' created successfully`);
    } else {
      console.log(`Collection '${IMAGE_COLLECTION_NAME}' already exists`);
    }
  } catch (error) {
    console.error('Error initializing Qdrant collection:', error);
    throw error;
  }
}

// Test connection to Qdrant
export async function testConnection() {
  try {
    const collections = await qdrantClient.getCollections();
    console.log('Successfully connected to Qdrant');
    console.log('Available collections:', collections.collections.map(c => c.name));
    return true;
  } catch (error) {
    console.error('Failed to connect to Qdrant:', error);
    return false;
  }
}

// Store image vector in Qdrant
export async function storeImageVector(
  id: string,
  vector: number[],
  metadata: {
    filename: string;
    filepath: string;
    uploadDate: string;
    description?: string;
    tags?: string[];
    directory?: string;
    relativePath?: string;
    size?: number;
    type?: string;
  }
) {
  try {
    // Use a simple numeric ID for Qdrant
    const pointId = Date.now() + Math.floor(Math.random() * 1000);
    
    // Create payload without the id field to avoid duplication
    const payload = { ...metadata };
    // Remove id from payload since it's already in the point
    if ('id' in payload) {
      delete (payload as any).id;
    }
    
    console.log(`Attempting to store point with ID: ${pointId}`);
    console.log(`Vector length: ${vector.length}, first few values: [${vector.slice(0, 3).join(', ')}...]`);
    
    // Ensure vector values are finite numbers
    const cleanVector = vector.map(val => {
      if (!Number.isFinite(val)) {
        console.warn(`Invalid vector value: ${val}, replacing with 0`);
        return 0;
      }
      return val;
    });
    
    await qdrantClient.upsert(IMAGE_COLLECTION_NAME, {
      points: [
        {
          id: pointId,
          vector: cleanVector,
          payload,
        },
      ],
    });
    console.log(`Stored vector for image: ${metadata.filename}`);
    return true;
  } catch (error) {
    console.error('Error storing image vector:', error);
    console.error('Error details:', {
      id,
      vectorLength: vector.length,
      vectorSample: vector.slice(0, 5),
      metadata
    });
    
    // Log the actual Qdrant error response if available
    if (error && typeof error === 'object' && 'data' in error) {
      console.error('Qdrant error response:', error.data);
    }
    
    throw error;
  }
}

// Search for similar images
export async function searchSimilarImages(
  queryVector: number[],
  limit: number = 10,
  scoreThreshold: number = 0.7
) {
  try {
    const results = await qdrantClient.search(IMAGE_COLLECTION_NAME, {
      vector: queryVector,
      limit,
      score_threshold: scoreThreshold,
      with_payload: true,
    });

    return results.map((result) => ({
      id: result.id,
      score: result.score,
      payload: result.payload,
    }));
  } catch (error) {
    console.error('Error searching similar images:', error);
    throw error;
  }
}

// Delete image vector from Qdrant
export async function deleteImageVector(id: string) {
  try {
    await qdrantClient.delete(IMAGE_COLLECTION_NAME, {
      points: [id],
    });
    console.log(`Deleted vector for image: ${id}`);
    return true;
  } catch (error) {
    console.error('Error deleting image vector:', error);
    throw error;
  }
}

// Get all image vectors (for debugging)
export async function getAllImageVectors(limit: number = 100) {
  try {
    const results = await qdrantClient.scroll(IMAGE_COLLECTION_NAME, {
      limit,
      with_payload: true,
      with_vector: false, // Don't return vectors to save bandwidth
    });

    return results.points.map((point) => ({
      id: point.id,
      payload: point.payload,
    }));
  } catch (error) {
    console.error('Error getting all image vectors:', error);
    throw error;
  }
} 