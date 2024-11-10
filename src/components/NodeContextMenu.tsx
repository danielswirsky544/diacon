import React, { useEffect, useRef, useState } from 'react';
import { Edit, Image, X, Clipboard, Trash2, Link } from 'lucide-react';
import { useDiagramStore } from '../store/diagramStore';
import RelationshipManager from './RelationshipManager';

interface NodeContextMenuProps {
  nodeId: string;
  position: { x: number; y: number };
  isLeftDiagram: boolean;
  onClose: () => void;
}

export default function NodeContextMenu({ nodeId, position, isLeftDiagram, onClose }: NodeContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const { updateNode, deleteNode } = useDiagramStore();

  const [showRelationships, setShowRelationships] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleEditLabel = () => {
    const newLabel = prompt('Enter new label:');
    if (newLabel) {
      updateNode(nodeId, { label: newLabel }, isLeftDiagram);
    }
    onClose();
  };

  const convertImageToBase64 = async (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handlePasteImage = async () => {
    setIsProcessing(true);
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/')) {
            const blob = await clipboardItem.getType(type);
            const base64Image = await convertImageToBase64(blob);
            updateNode(nodeId, { imageData: base64Image }, isLeftDiagram);
            break;
          }
        }
      }
    } catch (err) {
      console.error('Failed to paste image:', err);
      alert('Please copy an image to your clipboard first!');
    } finally {
      setIsProcessing(false);
      onClose();
    }
  };

  const handleUploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const base64Image = await convertImageToBase64(file);
      updateNode(nodeId, { imageData: base64Image }, isLeftDiagram);
    } catch (err) {
      console.error('Failed to upload image:', err);
      alert('Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
      onClose();
    }
  };

  const handleRemoveImage = () => {
    updateNode(nodeId, { imageData: undefined }, isLeftDiagram);
    onClose();
  };

  const handleDeleteNode = () => {
    if (window.confirm('Are you sure you want to delete this node?')) {
      deleteNode(nodeId, isLeftDiagram);
    }
    onClose();
  };

  if (showRelationships) {
    return (
      <div ref={menuRef} style={{ position: 'absolute', top: position.y, left: position.x }}>
        <RelationshipManager
          nodeId={nodeId}
          isLeftDiagram={isLeftDiagram}
          onClose={() => {
            setShowRelationships(false);
            onClose();
          }}
        />
      </div>
    );
  }

  return (
    <div
      ref={menuRef}
      className="absolute bg-white rounded-lg shadow-lg py-2 z-50"
      style={{ top: position.y, left: position.x }}
    >
      <button
        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
        onClick={handleEditLabel}
      >
        <Edit className="w-4 h-4" />
        Edit Label
      </button>
      <button
        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
        onClick={handlePasteImage}
        disabled={isProcessing}
      >
        <Clipboard className="w-4 h-4" />
        Paste Image from Clipboard
      </button>
      <label className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 cursor-pointer">
        <Image className="w-4 h-4" />
        Upload Image
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUploadImage}
          disabled={isProcessing}
        />
      </label>
      <button
        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
        onClick={handleRemoveImage}
      >
        <X className="w-4 h-4" />
        Remove Image
      </button>
      <div className="my-1 border-t border-gray-200"></div>
      <button
        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
        onClick={() => setShowRelationships(true)}
      >
        <Link className="w-4 h-4" />
        Manage Relationships
      </button>
      <button
        className="w-full px-4 py-2 text-left hover:bg-red-100 flex items-center gap-2 text-red-600"
        onClick={handleDeleteNode}
      >
        <Trash2 className="w-4 h-4" />
        Delete Node
      </button>
    </div>
  );
}