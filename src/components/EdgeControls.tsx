import React from 'react';
import { Edge, useReactFlow } from 'reactflow';
import { Trash2 } from 'lucide-react';
import { useDiagramStore } from '../store/diagramStore';

interface EdgeControlsProps {
  edge: Edge;
  isLeftDiagram: boolean;
  onClose: () => void;
}

export default function EdgeControls({ edge, isLeftDiagram, onClose }: EdgeControlsProps) {
  const { getNode } = useReactFlow();
  const { deleteEdge } = useDiagramStore();

  const sourceNode = getNode(edge.source);
  const targetNode = getNode(edge.target);

  if (!sourceNode || !targetNode) return null;

  // Calculate center point between nodes
  const centerX = (sourceNode.position.x + targetNode.position.x) / 2;
  const centerY = (sourceNode.position.y + targetNode.position.y) / 2;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this connection?')) {
      deleteEdge(edge.id, isLeftDiagram);
      onClose();
    }
  };

  return (
    <div
      className="absolute bg-white rounded-full shadow-lg p-2 cursor-pointer hover:bg-red-50 transition-colors duration-200 z-50"
      style={{
        transform: `translate(${centerX}px, ${centerY}px)`,
        pointerEvents: 'all'
      }}
      onClick={handleDelete}
    >
      <Trash2 className="w-4 h-4 text-red-500" />
    </div>
  );
}