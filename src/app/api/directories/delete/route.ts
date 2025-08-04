import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Directory ID is required' },
        { status: 400 }
      );
    }
    
    const configs = await loadDirectoryConfigs();
    const index = configs.findIndex((d: any) => d.id === id);
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Directory not found' },
        { status: 404 }
      );
    }
    
    const deletedDirectory = configs[index];
    configs.splice(index, 1);
    
    await saveDirectoryConfigs(configs);
    
    return NextResponse.json({
      success: true,
      message: 'Directory deleted successfully',
      deletedDirectory
    });
  } catch (error) {
    console.error('Error deleting directory:', error);
    return NextResponse.json(
      { error: 'Failed to delete directory' },
      { status: 500 }
    );
  }
} 