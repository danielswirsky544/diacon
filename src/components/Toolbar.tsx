import React from 'react';
import { Plus, Image } from 'lucide-react';
import { useDiagramStore } from '../store/diagramStore';

interface ToolbarProps {
  isLeftDiagram: boolean;
}

export default function Toolbar({ isLeftDiagram }: ToolbarProps) {
  const { addNode } = useDiagramStore();

  const handleAddNode = (withImage: boolean = false) => {
    const diagramPrefix = isLeftDiagram ? 'l' : 'r';
    const nodeCount = isLeftDiagram 
      ? useDiagramStore.getState().leftNodes.length 
      : useDiagramStore.getState().rightNodes.length;
    
    addNode({
      id: `${diagramPrefix}${nodeCount + 1}`,
      type: 'custom',
      position: { x: Math.random() * 200, y: Math.random() * 200 },
      data: {
        label: `${isLeftDiagram ? 'Process' : 'Task'} ${nodeCount + 1}`,
        ...(withImage && {
          imageUrl: 'https://images.unsplash.com/photo-1706018133355-0608a54a5a4a?w=100&fit=crop'
        })
      }
    }, isLeftDiagram);
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleAddNode()}
        className="p-2 bg-white rounded-md shadow-sm hover:bg-gray-50 border border-gray-200"
        title="Add Text Node"
      >
        <Plus className="w-5 h-5 text-gray-600" />
      </button>
      <button
        onClick={() => handleAddNode(true)}
        className="p-2 bg-white rounded-md shadow-sm hover:bg-gray-50 border border-gray-200"
        title="Add Image Node"
      >
        <Image className="w-5 h-5 text-gray-600" />
      </button>
    </div>
  );
}