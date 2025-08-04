import { UploadedFile } from './types';

interface ImageThumbnailProps {
  file: UploadedFile;
  onDelete: (filename: string) => void;
  onSimilaritySearch?: (filename: string) => void;
}

export default function ImageThumbnail({ file, onDelete, onSimilaritySearch }: ImageThumbnailProps) {
  return (
    <div className="border border-gray-600 bg-gray-800 p-0.5 relative group flex flex-col">
      <div className="w-full bg-gray-700 border border-gray-600 mb-0.5 flex items-center justify-center overflow-hidden relative flex-shrink-0">
        <img 
          src={file.path} 
          alt={file.originalName}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to icon if image fails to load
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
        <svg 
          width="8"
          height="8"
          className="text-gray-400 hidden" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        
        {/* Delete button overlaid on image */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(file.filename);
          }}
          className="absolute top-0 right-0 bg-red-600 text-white text-sm px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-700 z-10"
          title="Delete image"
          style={{ position: 'absolute', top: '0', right: '0' }}
        >
          ×
        </button>

        {/* Similarity Search button overlaid on image */}
        {onSimilaritySearch && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSimilaritySearch(file.filename);
            }}
            className="absolute top-0 left-0 bg-blue-600 text-white text-sm px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-blue-700 z-10"
            title="Find similar images"
            style={{ position: 'absolute', top: '0', left: '0' }}
          >
            🔍
          </button>
        )}
      </div>
      <div className="px-2 flex flex-col justify-end flex-shrink-0">
        <p className="text-xs text-gray-300 break-words font-mono leading-tight mb-0 mt-2" title={file.originalName}>
          {file.originalName}
        </p>
        <p className="text-xs text-gray-500 font-mono mt-0 mb-2">
          {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>                        
    </div>
  );
} 