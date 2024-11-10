import React, { useState, useEffect } from 'react';
import { Save, Upload, Download, Share2, Library, Plus } from 'lucide-react';
import { useDiagramStore } from '../store/diagramStore';

export default function SaveControls() {
  const { 
    saveDiagram,
    loadDiagram,
    deleteDiagram,
    exportDiagram,
    importDiagram,
    loadAllDiagrams,
    savedDiagrams,
    currentDiagramId,
    isLoading
  } = useDiagramStore();

  const [showLibrary, setShowLibrary] = useState(false);
  const [diagramName, setDiagramName] = useState('');
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    loadAllDiagrams();
  }, [loadAllDiagrams]);

  useEffect(() => {
    // Check for diagram ID in URL
    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get('diagram');
    if (sharedId) {
      loadDiagram(sharedId);
    }
  }, [loadDiagram]);

  const handleSave = async () => {
    const name = prompt('Enter a name for your diagram:', diagramName);
    if (name) {
      try {
        const id = await saveDiagram(name);
        setDiagramName(name);
        // Update URL with diagram ID
        const url = new URL(window.location.href);
        url.searchParams.set('diagram', id);
        window.history.pushState({}, '', url);
      } catch (error) {
        alert('Failed to save diagram. Please try again.');
      }
    }
  };

  const handleShare = () => {
    if (!currentDiagramId) {
      alert('Please save the diagram first');
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set('diagram', currentDiagramId);
    setShareUrl(url.toString());
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            importDiagram(JSON.parse(content));
          } catch (error) {
            alert('Invalid diagram file');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleExport = () => {
    const data = exportDiagram();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${diagramName || 'diagram'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <button
          onClick={() => setShowLibrary(prev => !prev)}
          className="flex items-center gap-2 px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          title="Open Library"
        >
          <Library className="w-4 h-4" />
          Library
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          title="Save Diagram"
        >
          <Save className="w-4 h-4" />
          Save
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
          title="Share Diagram"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
          title="Export to File"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
        <button
          onClick={handleImport}
          className="flex items-center gap-2 px-3 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
          title="Import from File"
        >
          <Upload className="w-4 h-4" />
          Import
        </button>
      </div>

      {/* Library Panel */}
      {showLibrary && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-xl p-4 z-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Diagram Library</h3>
            <button
              onClick={() => setShowLibrary(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-2">
            <button
              onClick={() => {
                setDiagramName('');
                importDiagram({
                  leftNodes: [],
                  rightNodes: [],
                  leftEdges: [],
                  rightEdges: [],
                  nodeRelations: {},
                });
                setShowLibrary(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Diagram
            </button>
            
            {isLoading ? (
              <div className="text-center py-4 text-gray-500">Loading...</div>
            ) : savedDiagrams.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No saved diagrams</div>
            ) : (
              savedDiagrams.map(diagram => (
                <div
                  key={diagram.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                >
                  <div>
                    <div className="font-medium">{diagram.name}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(diagram.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        try {
                          await loadDiagram(diagram.id);
                          setDiagramName(diagram.name);
                          setShowLibrary(false);
                          // Update URL
                          const url = new URL(window.location.href);
                          url.searchParams.set('diagram', diagram.id);
                          window.history.pushState({}, '', url);
                        } catch (error) {
                          alert('Failed to load diagram. Please try again.');
                        }
                      }}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      Load
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to delete this diagram?')) {
                          try {
                            await deleteDiagram(diagram.id);
                          } catch (error) {
                            alert('Failed to delete diagram. Please try again.');
                          }
                        }
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Share URL Dialog */}
      {shareUrl && (
        <div className="absolute right-0 top-12 w-96 bg-white rounded-lg shadow-xl p-4 z-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Share Diagram</h3>
            <button
              onClick={() => setShareUrl('')}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2 border rounded-md"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(shareUrl);
                alert('URL copied to clipboard!');
              }}
              className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}