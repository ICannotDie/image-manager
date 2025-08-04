import { UploadedFile } from './types';
import ImageThumbnail from './ImageThumbnail';

interface ImageGridProps {
  files: UploadedFile[];
  onDelete: (filename: string) => void;
  onSimilaritySearch?: (filename: string) => void;
  isLoading: boolean;
}

export default function ImageGrid({ files, onDelete, onSimilaritySearch, isLoading }: ImageGridProps) {
  if (isLoading) return null;

  return (
    <div className="mt-3">
      <h3 className="text-xs font-bold text-white mb-2 tracking-wide border-b border-gray-600 pb-1">
        UPLOADED IMAGES ({files.length})
      </h3>
      {files.length === 0 ? (
        <p className="text-gray-500 text-xs font-mono text-center py-4">
          No images uploaded yet
        </p>
      ) : (
        <div className={`grid grid-cols-4 gap-2 ${files.length > 0 ? 'overflow-y-auto' : ''}`}>
          {files.map((file, index) => (
            <ImageThumbnail 
              key={index} 
              file={file} 
              onDelete={onDelete}
              onSimilaritySearch={onSimilaritySearch}
            />
          ))}
        </div>
      )}
    </div>
  );
} 