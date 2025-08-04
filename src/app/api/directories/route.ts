import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_DIRECTORIES, getDirectoryStats, validateDirectory, generateDirectoryId } from '@/lib/directoryScanner';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const CONFIG_FILE = join(process.cwd(), 'data', 'directories.json');

// Load directory configurations from file
async function loadDirectoryConfigs() {
  try {
    const data = await readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return default directories
    return DEFAULT_DIRECTORIES;
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

// GET - List all directory configurations with stats
export async function GET() {
  try {
    const configs = await loadDirectoryConfigs();
    const stats = await getDirectoryStats(configs);
    
    return NextResponse.json({
      directories: stats,
      totalDirectories: stats.length,
      enabledDirectories: stats.filter(d => d.enabled).length,
      totalImages: stats.reduce((sum, d) => sum + (d.imageCount || 0), 0)
    });
  } catch (error) {
    console.error('Error loading directories:', error);
    return NextResponse.json(
      { error: 'Failed to load directories' },
      { status: 500 }
    );
  }
}

// POST - Add or update directory configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, directory } = body;
    
    if (action === 'add' || action === 'update') {
      // Validate required fields
      if (!directory.name || !directory.path) {
        return NextResponse.json(
          { error: 'Name and path are required' },
          { status: 400 }
        );
      }
      
      // Validate directory path
      const validation = await validateDirectory(directory.path);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }
      
      const configs = await loadDirectoryConfigs();
      
      if (action === 'add') {
        // Generate unique ID
        const id = generateDirectoryId(directory.name, directory.path);
        
        // Check if directory already exists
        const exists = configs.find((d: any) => d.path === directory.path);
        if (exists) {
          return NextResponse.json(
            { error: 'Directory already exists' },
            { status: 400 }
          );
        }
        
        const newConfig = {
          id,
          path: directory.path,
          name: directory.name,
          enabled: directory.enabled ?? true,
          recursive: directory.recursive ?? false,
          extensions: directory.extensions ?? ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
        };
        
        configs.push(newConfig);
      } else {
        // Update existing directory
        const index = configs.findIndex((d: any) => d.id === directory.id);
        if (index === -1) {
          return NextResponse.json(
            { error: 'Directory not found' },
            { status: 404 }
          );
        }
        
        configs[index] = {
          ...configs[index],
          ...directory
        };
      }
      
      await saveDirectoryConfigs(configs);
      
      return NextResponse.json({
        success: true,
        message: `Directory ${action === 'add' ? 'added' : 'updated'} successfully`,
        directory: action === 'add' ? configs[configs.length - 1] : configs.find((d: any) => d.id === directory.id)
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error managing directories:', error);
    return NextResponse.json(
      { error: 'Failed to manage directories' },
      { status: 500 }
    );
  }
} 