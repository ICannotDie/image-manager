import * as ort from 'onnxruntime-node';
import sharp from 'sharp';
import { join } from 'path';

// ResNet50 model configuration
const MODEL_PATH = join(process.cwd(), 'src', 'models', 'resnet50-v1-7.onnx');
const INPUT_SIZE = 224; // ResNet50 standard input size
const MEAN = [0.485, 0.456, 0.406]; // ImageNet mean values
const STD = [0.229, 0.224, 0.225]; // ImageNet std values

let session: ort.InferenceSession | null = null;

// Initialize the ONNX model session
async function initializeModel(): Promise<ort.InferenceSession> {
  if (!session) {
    try {
      console.log('Loading ResNet50 model...');
      session = await ort.InferenceSession.create(MODEL_PATH);
      console.log('ResNet50 model loaded successfully');
    } catch (error) {
      console.error('Error loading ResNet50 model:', error);
      throw new Error('Failed to load ResNet50 model');
    }
  }
  return session;
}

// Preprocess image for ResNet50
async function preprocessImage(imagePath: string): Promise<Float32Array> {
  try {
    // Load and resize image to 224x224
    const image = await sharp(imagePath)
      .resize(INPUT_SIZE, INPUT_SIZE, { fit: 'cover' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Convert to Float32Array and normalize
    const { data, info } = image;
    const channels = info.channels;
    const totalPixels = INPUT_SIZE * INPUT_SIZE;
    
    // ResNet50 expects NCHW format (batch, channels, height, width)
    const input = new Float32Array(3 * totalPixels);
    
    for (let y = 0; y < INPUT_SIZE; y++) {
      for (let x = 0; x < INPUT_SIZE; x++) {
        const pixelIndex = (y * INPUT_SIZE + x) * channels;
        
        // Normalize each channel with ImageNet mean and std
        for (let c = 0; c < 3; c++) {
          const value = data[pixelIndex + c] / 255.0;
          const normalizedValue = (value - MEAN[c]) / STD[c];
          input[c * totalPixels + y * INPUT_SIZE + x] = normalizedValue;
        }
      }
    }
    
    return input;
  } catch (error) {
    console.error('Error preprocessing image:', error);
    throw new Error('Failed to preprocess image');
  }
}

// Generate embedding using ResNet50
export async function generateImageEmbedding(imagePath: string): Promise<number[]> {
  try {
    // Initialize model if not already done
    const model = await initializeModel();
    
    // Preprocess the image
    const input = await preprocessImage(imagePath);
    
    // Create input tensor
    const inputTensor = new ort.Tensor('float32', input, [1, 3, INPUT_SIZE, INPUT_SIZE]);
    
    // Run inference
    const feeds = { [model.inputNames[0]]: inputTensor };
    const results = await model.run(feeds);
    
    // Get the output (last layer before classification)
    const outputName = model.outputNames[0];
    const output = results[outputName];
    
    // Convert to regular array and normalize
    const embedding = Array.from(output.data as Float32Array);
    
    // Log model output information for debugging
    console.log(`Model output shape: ${output.dims.join('x')}`);
    console.log(`Model output names: ${model.outputNames.join(', ')}`);
    
    // Normalize the embedding vector (L2 normalization for cosine similarity)
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    const normalizedEmbedding = embedding.map(val => val / magnitude);
    
    console.log(`Generated embedding with length: ${normalizedEmbedding.length}`);
    console.log(`Embedding range: ${Math.min(...normalizedEmbedding)} to ${Math.max(...normalizedEmbedding)}`);
    
    return normalizedEmbedding;
  } catch (error) {
    console.error('Error generating image embedding:', error);
    throw new Error(`Failed to generate embedding for ${imagePath}: ${error}`);
  }
}

// Generate embeddings for multiple images
export async function generateEmbeddingsForImages(imagePaths: string[]): Promise<Map<string, number[]>> {
  const embeddings = new Map<string, number[]>();
  
  for (const imagePath of imagePaths) {
    try {
      const embedding = await generateImageEmbedding(imagePath);
      embeddings.set(imagePath, embedding);
      console.log(`Generated embedding for: ${imagePath}`);
    } catch (error) {
      console.error(`Failed to generate embedding for ${imagePath}:`, error);
      // Continue with other images even if one fails
    }
  }
  
  return embeddings;
}

// Clean up model session
export async function cleanupModel(): Promise<void> {
  if (session) {
    await session.release();
    session = null;
    console.log('ResNet50 model session cleaned up');
  }
} 