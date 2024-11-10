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

  const handlePasteImage = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/')) {
            const blob = await clipboardItem.getType(type);
            const imageUrl = URL.createObjectURL(blob);
            updateNode(nodeId, { imageUrl }, isLeftDiagram);
            break;
          }
        }
      }
    } catch (err) {
      alert('Please copy an image to your clipboard first!');
    }
    onClose();
  };

  const handleEditImage = () => {
    const newImageUrl = prompt('Enter image URL:');
    if (newImageUrl) {
      updateNode(nodeId, { imageUrl: newImageUrl }, isLeftDiagram);
    }
    onClose();
  };

  const handleRemoveImage = () => {
    updateNode(nodeId, { imageUrl: undefined }, isLeftDiagram);
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
      >
        <Clipboard className="w-4 h-4" />
        Paste Image from Clipboard
      </button>
      <button
        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
        onClick={handleEditImage}
      >
        <Image className="w-4 h-4" />
        Enter Image URL
      </button>
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