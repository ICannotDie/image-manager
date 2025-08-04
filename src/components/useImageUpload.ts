import { useState, useCallback, useEffect } from "react";
import { UploadedFile, UploadResponse } from "./types";

export function useImageUpload() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Load existing images on component mount
  useEffect(() => {
    const loadExistingImages = async () => {
      try {
        const response = await fetch('/api/images');
        if (response.ok) {
          const result = await response.json();
          setUploadedFiles(result.files);
        }
      } catch (error) {
        console.error('Error loading existing images:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingImages();
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true);
    setUploadMessage('');
    
    try {
      const formData = new FormData();
      acceptedFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result: UploadResponse = await response.json();
        setUploadedFiles(prev => [...prev, ...result.files]);
        
        // Show upload summary
        let message = '';
        if (result.uploaded > 0) {
          message += `Successfully uploaded ${result.uploaded} file${result.uploaded > 1 ? 's' : ''}. `;
        }
        if (result.skipped > 0) {
          message += `Skipped ${result.skipped} duplicate file${result.skipped > 1 ? 's' : ''}.`;
        }
        setUploadMessage(message);
        
        // Clear message after 5 seconds
        setTimeout(() => setUploadMessage(''), 5000);
      } else {
        console.error('Upload failed:', response.statusText);
        setUploadMessage('Upload failed. Please try again.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadMessage('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const deleteImage = async (filename: string) => {
    try {
      const response = await fetch('/api/images/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename }),
      });

      if (response.ok) {
        setUploadedFiles(prev => prev.filter(file => file.filename !== filename));
        setUploadMessage(`Deleted ${filename}`);
        setTimeout(() => setUploadMessage(''), 3000);
      } else {
        console.error('Delete failed:', response.statusText);
        setUploadMessage('Failed to delete file.');
      }
    } catch (error) {
      console.error('Delete error:', error);
      setUploadMessage('Failed to delete file.');
    }
  };

  return {
    uploadedFiles,
    isUploading,
    uploadMessage,
    isLoading,
    onDrop,
    deleteImage,
  };
} 