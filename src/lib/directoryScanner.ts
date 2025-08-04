import { readdir, stat } from 'fs/promises';
import { join } from 'path';

export interface ImageFile {
  id: string;
  filename: string;
  originalName: string;
  filepath: string;
  size: number;
  type: string;
  uploadDate: string;
  directory: string;
  relativePath: string;
}

export interface DirectoryConfig {
  id: string;
  path: string;
  name: string;
  enabled: boolean;
  recursive?: boolean;
  extensions?: string[];
  lastScanned?: string;
  imageCount?: number;
}

// Default directories to scan (empty - users add their own directories)
export const DEFAULT_DIRECTORIES: DirectoryConfig[] = [];

// Scan a single directory for images
export async function scanDirectory(config: DirectoryConfig): Promise<ImageFile[]> {
  const images: ImageFile[] = [];
  
  async function scanDirectoryRecursive(dirPath: string, relativePath: string = ''): Promise<void> {
    try {
      const files = await readdir(dirPath);
      
      for (const filename of files) {
        const filepath = join(dirPath, filename);
        const stats = await stat(filepath);
        
        if (stats.isFile()) {
          const extension = filename.split('.').pop()?.toLowerCase();
          
          if (extension && config.extensions?.includes(extension)) {
            const fullRelativePath = relativePath ? `${relativePath}/${filename}` : filename;
            // Create a simple, short ID using hash of filename
            const { createHash } = await import('crypto');
            const hash = createHash('md5').update(filename).digest('hex').substring(0, 8);
            const id = `${config.id}-${hash}`;
            const imageFile: ImageFile = {
              id,
              filename,
              originalName: filename,
              filepath,
              size: stats.size,
              type: `image/${extension}`,
              uploadDate: stats.mtime.toISOString(),
              directory: config.name,
              relativePath: fullRelativePath
            };
            
            images.push(imageFile);
          }
        } else if (stats.isDirectory() && config.recursive) {
          // Recursively scan subdirectories
          const subRelativePath = relativePath ? `${relativePath}/${filename}` : filename;
          await scanDirectoryRecursive(filepath, subRelativePath);
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error);
    }
  }
  
  await scanDirectoryRecursive(config.path);
  return images;
}

// Scan multiple directories
export async function scanAllDirectories(
  directories: DirectoryConfig[] = DEFAULT_DIRECTORIES
): Promise<ImageFile[]> {
  const allImages: ImageFile[] = [];
  
  for (const config of directories) {
    if (config.enabled) {
      try {
        const images = await scanDirectory(config);
        allImages.push(...images);
      } catch (error) {
        console.error(`Failed to scan directory ${config.path}:`, error);
      }
    }
  }
  
  return allImages;
}

// Get directory statistics
export async function getDirectoryStats(directories: DirectoryConfig[] = DEFAULT_DIRECTORIES) {
  const stats = [];
  
  for (const config of directories) {
    if (config.enabled) {
      try {
        const images = await scanDirectory(config);
        stats.push({
          ...config,
          imageCount: images.length,
          totalSize: images.reduce((sum, img) => sum + img.size, 0),
          lastScanned: new Date().toISOString()
        });
      } catch (error) {
        stats.push({
          ...config,
          imageCount: 0,
          totalSize: 0,
          lastScanned: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }
  
  return stats;
}

// Validate directory path
export async function validateDirectory(path: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const stats = await stat(path);
    if (!stats.isDirectory()) {
      return { valid: false, error: 'Path is not a directory' };
    }
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Directory does not exist or is not accessible' };
  }
}

// Generate unique ID for directory
export function generateDirectoryId(name: string, path: string): string {
  const sanitizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const pathHash = path.split(/[\\/]/).pop() || 'dir';
  // Create a shorter, safer ID
  return `${sanitizedName}-${pathHash}`.replace(/--+/g, '-').replace(/^-|-$/g, '');
} 