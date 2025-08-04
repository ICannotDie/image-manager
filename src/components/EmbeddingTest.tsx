'use client';

import { useState } from 'react';

interface EmbeddingTestProps {
  className?: string;
}

interface EmbeddingResult {
  length: number;
  sample: number[];
  statistics: {
    min: number;
    max: number;
    mean: number;
    magnitude: number;
    isNormalized: boolean;
  };
}

export default function EmbeddingTest({ className = '' }: EmbeddingTestProps) {
  const [imagePath, setImagePath] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EmbeddingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testEmbedding = async () => {
    if (!imagePath.trim()) {
      setError('Please enter an image path');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/test-embedding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imagePath }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to test embedding');
      }

      setResult(data.embedding);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`p-6 bg-white rounded-lg shadow-md ${className}`}>
      <h2 className="text-xl font-semibold mb-4">Embedding Generator Test</h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="imagePath" className="block text-sm font-medium text-gray-700 mb-2">
            Image Path
          </label>
          <input
            id="imagePath"
            type="text"
            value={imagePath}
            onChange={(e) => setImagePath(e.target.value)}
            placeholder="Enter full path to image file"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={testEmbedding}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Testing...' : 'Test Embedding'}
        </button>

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {result && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="font-semibold text-green-800 mb-2">Embedding Generated Successfully!</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Length:</strong> {result.length}</p>
              <p><strong>Sample Values:</strong> [{result.sample.join(', ')}...]</p>
              <p><strong>Min:</strong> {result.statistics.min.toFixed(6)}</p>
              <p><strong>Max:</strong> {result.statistics.max.toFixed(6)}</p>
              <p><strong>Mean:</strong> {result.statistics.mean.toFixed(6)}</p>
              <p><strong>Magnitude:</strong> {result.statistics.magnitude.toFixed(6)}</p>
              <p><strong>Normalized:</strong> {result.statistics.isNormalized ? 'Yes' : 'No'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 