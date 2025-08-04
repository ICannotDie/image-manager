"use client";

import { useState } from 'react';
import { Header, Toast, ImageUpload, ImageGrid, SimilaritySearchResults, useImageUpload } from "../components";

interface SimilarityResult {
  id: string;
  score: number;
  payload: {
    filename: string;
    filepath: string;
    uploadDate: string;
    description?: string;
    tags?: string[];
    directory?: string;
    relativePath?: string;
    size?: number;
    type?: string;
  };
}

export default function Home() {
  const {
    uploadedFiles,
    isUploading,
    uploadMessage,
    isLoading,
    onDrop,
    deleteImage,
  } = useImageUpload();

  const [similarityResults, setSimilarityResults] = useState<SimilarityResult[]>([]);
  const [queryImage, setQueryImage] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSimilaritySearch = async (filename: string) => {
    try {
      setIsSearching(true);
      setQueryImage(filename);
      setSimilarityResults([]);

      const response = await fetch('/api/similarity-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename }),
      });

      if (!response.ok) {
        throw new Error('Failed to perform similarity search');
      }

      const data = await response.json();
      
      if (data.success) {
        setSimilarityResults(data.results);
      } else {
        console.error('Similarity search failed:', data.error);
        setSimilarityResults([]);
      }
    } catch (error) {
      console.error('Error performing similarity search:', error);
      setSimilarityResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Toast Notification */}
      <Toast message={uploadMessage} isVisible={!!uploadMessage} />

      <div className="">
        <div className="mx-auto">
          {/* Header */}
          <Header />

          {/* Drag and Drop Area */}
          <ImageUpload 
            onDrop={onDrop}
            isUploading={isUploading}
          />

          {/* Main Content Area */}
          <div className="flex gap-8 mt-6">
            {/* Uploaded Files List - 2/3 width */}
            <div className="w-2/3">
              <ImageGrid 
                files={uploadedFiles}
                onDelete={deleteImage}
                onSimilaritySearch={handleSimilaritySearch}
                isLoading={isLoading}
              />
            </div>

            {/* Similarity Search Results - 1/3 width */}
            <div className="w-1/3">
              <SimilaritySearchResults 
                results={similarityResults}
                queryImage={queryImage}
                isLoading={isSearching}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
