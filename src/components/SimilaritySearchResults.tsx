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

interface SimilaritySearchResultsProps {
  results: SimilarityResult[];
  queryImage: string;
  isLoading: boolean;
}

export default function SimilaritySearchResults({ results, queryImage, isLoading }: SimilaritySearchResultsProps) {
  if (isLoading) {
    return (
      <div className="mt-3">
        <h3 className="text-xs font-bold text-white mb-2 tracking-wide border-b border-gray-600 pb-1">
          SIMILARITY SEARCH RESULTS
        </h3>
        <div className="text-gray-500 text-xs font-mono text-center py-4">
          Searching for similar images...
        </div>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="mt-3">
        <h3 className="text-xs font-bold text-white mb-2 tracking-wide border-b border-gray-600 pb-1">
          SIMILARITY SEARCH RESULTS
        </h3>
        <div className="text-gray-500 text-xs font-mono text-center py-4">
          No similar images found
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <h3 className="text-xs font-bold text-white mb-2 tracking-wide border-b border-gray-600 pb-1">
        SIMILARITY SEARCH RESULTS ({results.length})
      </h3>
      <div className="space-y-3">
        {results.map((result, index) => (
          <div key={result.id} className="border border-gray-600 bg-gray-800 p-3 rounded">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-blue-400 font-mono">
                #{index + 1}
              </span>
            </div>
            
            <div className="text-xs text-gray-400 space-y-2">
              <div className="text-green-400 font-mono">
                {(result.score * 100).toFixed(1)}% match
              </div>
              
              <div>
                <p className="font-mono truncate" title={result.payload.filepath}>
                  {result.payload.filepath}
                </p>
              </div>
              
              <div>
                <p className="font-mono">
                  {result.payload.size ? `${(result.payload.size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 