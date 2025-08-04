'use client';

import { useState } from 'react';
import DirectoryManager from './DirectoryManager';

export default function Header() {
  const [showDirectoryManager, setShowDirectoryManager] = useState(false);

  return (
    <>
      <div className="text-center mb-4">
        <div className="flex justify-between items-center mb-2">
          <div></div>
          <div>
            <h1 className="text-lg font-bold text-white mb-1 tracking-wider">
              IMAGE MANAGER
            </h1>
            <p className="text-gray-400 text-xs tracking-wide">
              local image vector search
            </p>
          </div>
          <button
            onClick={() => setShowDirectoryManager(true)}
            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
            title="Manage Directories"
          >
            📁 Directories
          </button>
        </div>
      </div>

      {showDirectoryManager && (
        <DirectoryManager onClose={() => setShowDirectoryManager(false)} />
      )}
    </>
  );
} 