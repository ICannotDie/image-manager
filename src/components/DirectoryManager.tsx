'use client';

import { useState, useEffect } from 'react';
import { DirectoryConfig } from '@/lib/directoryScanner';

interface DirectoryManagerProps {
  onClose: () => void;
}

interface DirectoryStats {
  directories: DirectoryConfig[];
  totalDirectories: number;
  enabledDirectories: number;
  totalImages: number;
}

export default function DirectoryManager({ onClose }: DirectoryManagerProps) {
  const [directories, setDirectories] = useState<DirectoryConfig[]>([]);
  const [stats, setStats] = useState<DirectoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDirectory, setEditingDirectory] = useState<DirectoryConfig | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    path: '',
    enabled: true,
    recursive: false,
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
  });
  const [scanningDirectories, setScanningDirectories] = useState<Set<string>>(new Set());
  const [scanResults, setScanResults] = useState<Record<string, any>>({});
  const [scanProgress, setScanProgress] = useState<Record<string, {
    totalFiles: number;
    currentFile: number;
    currentFileName: string;
    progress: number;
  }>>({});

  // Load directories on component mount
  useEffect(() => {
    loadDirectories();
  }, []);

  const loadDirectories = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/directories');
      if (response.ok) {
        const data = await response.json();
        setDirectories(data.directories);
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading directories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const action = editingDirectory ? 'update' : 'add';
      const directory = editingDirectory 
        ? { ...editingDirectory, ...formData }
        : formData;

      const response = await fetch('/api/directories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, directory })
      });

      if (response.ok) {
        await loadDirectories();
        resetForm();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving directory:', error);
      alert('Failed to save directory');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this directory? This will remove the directory configuration and delete all associated image records from the search database. Note: The actual directory and files on your computer will NOT be deleted.')) return;

    try {
      const response = await fetch(`/api/directories/delete?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const result = await response.json();
        await loadDirectories();
        
        // Show success message with additional info if available
        if (result.qdrantRecordsDeleted) {
          alert('Directory removed successfully. All associated image records have been deleted from the search database.');
        } else {
          alert('Directory removed successfully.');
        }
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting directory:', error);
      alert('Failed to delete directory');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      path: '',
      enabled: true,
      recursive: false,
      extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
    });
    setEditingDirectory(null);
    setShowAddForm(false);
  };

  const editDirectory = (directory: DirectoryConfig) => {
    setEditingDirectory(directory);
    setFormData({
      name: directory.name,
      path: directory.path,
      enabled: directory.enabled,
      recursive: directory.recursive || false,
      extensions: directory.extensions || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
    });
    setShowAddForm(true);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleScanDirectory = async (directoryId: string) => {
    try {
      setScanningDirectories(prev => new Set(prev).add(directoryId));
      
      const response = await fetch('/api/directories/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directoryId, action: 'start' })
      });

      const result = await response.json();
      
      if (response.ok) {
        // Start polling for progress
        const pollProgress = async () => {
          try {
            const progressResponse = await fetch(`/api/directories/scan?directoryId=${directoryId}`);
            if (progressResponse.ok) {
              const progressData = await progressResponse.json();
              setScanProgress(prev => ({
                ...prev,
                [directoryId]: {
                  totalFiles: progressData.totalFiles,
                  currentFile: progressData.currentFile,
                  currentFileName: progressData.currentFileName,
                  progress: progressData.progress
                }
              }));
              
              // Continue polling if scan is still active and not cancelled
              if (!progressData.cancelled && progressData.currentFile < progressData.totalFiles) {
                setTimeout(pollProgress, 1000); // Poll every second
              }
            } else if (progressResponse.status === 404) {
              // Scan completed or doesn't exist, stop polling
              console.log('Scan completed or not found, stopping polling');
            }
          } catch (error) {
            console.error('Error polling scan progress:', error);
          }
        };
        
        // Start polling immediately
        pollProgress();
        
        setScanResults(prev => ({
          ...prev,
          [directoryId]: result.results
        }));
        await loadDirectories(); // Refresh directory stats
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error scanning directory:', error);
      alert('Failed to scan directory');
    } finally {
      setScanningDirectories(prev => {
        const newSet = new Set(prev);
        newSet.delete(directoryId);
        return newSet;
      });
      // Clear progress when scan completes
      setScanProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[directoryId];
        return newProgress;
      });
    }
  };

  const handleStopScan = async (directoryId: string) => {
    try {
      const response = await fetch('/api/directories/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directoryId, action: 'stop' })
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('Stop scan response:', result.message);
        // Don't immediately remove from scanning state - wait for the scan to actually complete
        // The scan will complete and update the state when it finishes
      } else {
        console.error('Failed to stop scan:', result.error);
      }
    } catch (error) {
      console.error('Error stopping scan:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="bg-gray-900 border border-gray-600 p-8 rounded-lg">
          <div className="text-white text-lg">Loading directories...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-600 rounded-lg shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden transform transition-all mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 bg-gray-800 border-b border-gray-600">
          <div>
            <h2 className="text-xl font-semibold text-white">Directory Manager</h2>
            <p className="text-gray-400 text-sm mt-1">Configure directories to scan for images</p>
          </div>
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            X
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-800 p-4 rounded border border-gray-600">
                <div className="text-gray-400 text-sm">Total Directories</div>
                <div className="text-white text-xl font-bold">{stats.totalDirectories}</div>
              </div>
              <div className="bg-gray-800 p-4 rounded border border-gray-600">
                <div className="text-gray-400 text-sm">Enabled</div>
                <div className="text-white text-xl font-bold">{stats.enabledDirectories}</div>
              </div>
              <div className="bg-gray-800 p-4 rounded border border-gray-600">
                <div className="text-gray-400 text-sm">Total Images</div>
                <div className="text-white text-xl font-bold">{stats.totalImages}</div>
              </div>
            </div>
          )}

          {/* Add Directory Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              Add Directory
            </button>
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="bg-gray-800 border border-gray-600 p-6 rounded mb-6">
              <h3 className="text-white text-lg font-medium mb-4">
                {editingDirectory ? 'Edit Directory' : 'Add New Directory'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-500 text-white px-3 py-2 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 box-border"
                      placeholder="My Photos"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm mb-2">Path</label>
                    <input
                      type="text"
                      value={formData.path}
                      onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-500 text-white px-3 py-2 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 box-border"
                      placeholder="C:\Users\YourName\Pictures"
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.enabled}
                      onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-gray-300 text-sm">Enabled</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.recursive}
                      onChange={(e) => setFormData({ ...formData, recursive: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-gray-300 text-sm">Recursive</span>
                  </label>
                </div>
                <div className="flex space-x-4 pt-2">
                  <button
                    type="submit"
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                  >
                    {editingDirectory ? 'Update' : 'Add'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Directory List */}
          <div className="space-y-3">
            {directories.map((directory) => (
              <div key={directory.id} className="bg-gray-800 border border-gray-600 p-4 rounded">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-white font-medium">{directory.name}</h3>
                      <span className={`px-2 py-1 rounded text-xs ${
                        directory.enabled ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                      }`}>
                        {directory.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-2 font-mono">{directory.path}</p>
                    <div className="flex space-x-4 text-xs text-gray-400">
                      <span className='mr-4'>{directory.imageCount || 0} images</span>
                      <span className='mr-4'>{(directory as any).totalSize ? formatBytes((directory as any).totalSize) : '0 Bytes'}</span>
                      {directory.lastScanned && (
                        <span>Last scanned: {new Date(directory.lastScanned).toLocaleDateString()}</span>
                      )}
                    </div>
                    
                    {/* Scan Progress */}
                    {scanningDirectories.has(directory.id) && scanProgress[directory.id] && (
                      <div className="mt-3 p-3 bg-gray-700 rounded border border-gray-600">
                        <div className="text-xs text-gray-300 mb-2">
                          Scanning: {scanProgress[directory.id].currentFile} of {scanProgress[directory.id].totalFiles} files
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-2 mb-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${scanProgress[directory.id].progress}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-400 truncate">
                          Processing: {scanProgress[directory.id].currentFileName}
                        </div>
                      </div>
                    )}
                    

                    
                    {/* Scan Results */}
                    {scanResults[directory.id] && (
                      <div className="mt-3 p-3 bg-gray-700 rounded border border-gray-600">
                        <div className="text-xs text-gray-300 mb-2">
                          Scan Results: {scanResults[directory.id].cancelled && (
                            <span className="text-orange-400 ml-2">(Cancelled)</span>
                          )}
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <div className="text-green-400">
                            Added: {scanResults[directory.id].added}
                          </div>
                          <div className="text-blue-400">
                            Skipped: {scanResults[directory.id].skipped}
                          </div>
                          <div className="text-red-400">
                            Errors: {scanResults[directory.id].errors}
                          </div>
                          <div className="text-gray-400">
                            Total: {scanResults[directory.id].processed}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-3 ml-4">
                    {scanningDirectories.has(directory.id) ? (
                      <button
                        onClick={() => handleStopScan(directory.id)}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors flex items-center"
                      >
                        <svg className="w-3 h-3 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Stop
                      </button>
                    ) : (
                      <button
                        onClick={() => handleScanDirectory(directory.id)}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                      >
                        Scan
                      </button>
                    )}
                    <button
                      onClick={() => editDirectory(directory)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(directory.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {directories.length === 0 && !showAddForm && (
            <div className="text-center text-gray-400 py-8">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
              </svg>
              <p className="text-sm">No directories configured. Click "Add Directory" to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 