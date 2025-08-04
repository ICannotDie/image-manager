"use client";

import { Header, Toast, ImageUpload, ImageGrid, useImageUpload } from "../components";
import EmbeddingTest from "../components/EmbeddingTest";

export default function Home() {
  const {
    uploadedFiles,
    isUploading,
    uploadMessage,
    isLoading,
    onDrop,
    deleteImage,
  } = useImageUpload();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Toast Notification */}
      <Toast message={uploadMessage} isVisible={!!uploadMessage} />

      <div className="container mx-auto px-4 py-4">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <Header />

          {/* Drag and Drop Area */}
          <ImageUpload 
            onDrop={onDrop}
            isUploading={isUploading}
          />

          {/* Uploaded Files List */}
          <ImageGrid 
            files={uploadedFiles}
            onDelete={deleteImage}
            isLoading={isLoading}
          />

          {/* Embedding Test Component */}
          <div className="mt-8">
            <EmbeddingTest />
          </div>
        </div>
      </div>
    </div>
  );
}
