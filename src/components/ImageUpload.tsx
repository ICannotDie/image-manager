import { useDropzone } from "react-dropzone";

interface ImageUploadProps {
  onDrop: (acceptedFiles: File[]) => void;
  isUploading: boolean;
}

export default function ImageUpload({ onDrop, isUploading }: ImageUploadProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp']
    },
    multiple: true
  });

  return (
    <div className="p-3">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed p-3 text-center cursor-pointer transition-all duration-200
          ${isDragActive 
            ? 'border-green-400 bg-gray-800' 
            : 'border-gray-600 hover:border-gray-500'
          }
          ${isUploading ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-2">
          <div className="w-6 h-6 mx-auto bg-gray-800 flex items-center justify-center">
            <img 
              src="/images/icons/icons8-drag-and-drop-100.png"
              alt="Upload icon"
              className="w-4 h-4"
            />
          </div>
          
          <div>
            <h3 className="text-xs font-bold text-white mb-1 tracking-wide">
              {isUploading ? 'UPLOADING...' : isDragActive ? 'DROP IMAGES HERE' : 'DRAG & DROP IMAGES'}
            </h3>
            <p className="text-gray-400 text-xs">
              {isUploading 
                ? 'Processing files...'
                : 'or click to browse files'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 