import React, { useEffect } from 'react';
import { Save, FolderOpen, Share2 } from 'lucide-react';
import { useDiagramStore } from '../store/diagramStore';

export default function DiagramControls() {
  const {
    currentDiagramName,
    savedDiagrams,
    saveDiagram,
    loadDiagram,
    loadAllDiagrams,
    setCurrentDiagramName,
    isLoading,
  } = useDiagramStore();

  useEffect(() => {
    loadAllDiagrams();
  }, [loadAllDiagrams]);

  const handleSave = async () => {
    const name = prompt('Enter diagram name:', currentDiagramName);
    if (name) {
      await saveDiagram(name);
    }
  };

  const handleLoad = async () => {
    const id = prompt('Enter diagram ID to load:');
    if (id) {
      await loadDiagram(id);
    }
  };

  const handleShare = () => {
    const currentUrl = window.location.href.split('?')[0];
    const shareUrl = `${currentUrl}?diagram=${currentDiagramName}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Share link copied to clipboard!');
  };

  return (
    <div className="absolute top-4 right-4 flex gap-2">
      <button
        onClick={handleSave}
        disabled={isLoading}
        className="p-2 bg-white rounded-md shadow-sm hover:bg-gray-50 border border-gray-200 flex items-center gap-2"
      >
        <Save className="w-5 h-5 text-gray-600" />
        <span>Save</span>
      </button>
      <button
        onClick={handleLoad}
        disabled={isLoading}
        className="p-2 bg-white rounded-md shadow-sm hover:bg-gray-50 border border-gray-200 flex items-center gap-2"
      >
        <FolderOpen className="w-5 h-5 text-gray-600" />
        <span>Load</span>
      </button>
      <button
        onClick={handleShare}
        disabled={isLoading}
        className="p-2 bg-white rounded-md shadow-sm hover:bg-gray-50 border border-gray-200 flex items-center gap-2"
      >
        <Share2 className="w-5 h-5 text-gray-600" />
        <span>Share</span>
      </button>
    </div>
  );
}