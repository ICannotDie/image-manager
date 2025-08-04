import { NextRequest, NextResponse } from 'next/server';
import * as ort from 'onnxruntime-node';
import { join } from 'path';
import { access } from 'fs/promises';

export async function GET() {
  try {
    const MODEL_PATH = join(process.cwd(), 'src', 'models', 'resnet50-v1-7.onnx');
    
    // Check if model file exists
    try {
      await access(MODEL_PATH);
      console.log(`Model file found at: ${MODEL_PATH}`);
    } catch (error) {
      return NextResponse.json(
        { error: `Model file not found at: ${MODEL_PATH}` },
        { status: 404 }
      );
    }

    // Try to load the model
    console.log('Attempting to load ResNet50 model...');
    const session = await ort.InferenceSession.create(MODEL_PATH);
    
    console.log('Model loaded successfully!');
    console.log('Input names:', session.inputNames);
    console.log('Output names:', session.outputNames);
    
    return NextResponse.json({
      success: true,
      model: {
        path: MODEL_PATH,
        inputNames: session.inputNames,
        outputNames: session.outputNames,
      }
    });

  } catch (error) {
    console.error('Error testing model loading:', error);
    return NextResponse.json(
      { error: `Failed to load model: ${error}` },
      { status: 500 }
    );
  }
} 