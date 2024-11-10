import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useDiagramStore } from '../store/diagramStore';

interface RelationshipManagerProps {
  nodeId: string;
  isLeftDiagram: boolean;
  onClose: () => void;
}

export default function RelationshipManager({ nodeId, isLeftDiagram, onClose }: RelationshipManagerProps) {
  const { leftNodes, rightNodes, nodeRelations, updateNodeRelations } = useDiagramStore();
  const [selectedNode, setSelectedNode] = useState<string>('');

  const sourceNodes = isLeftDiagram ? rightNodes : leftNodes;
  const currentRelations = nodeRelations[nodeId] || [];

  const handleAddRelation = () => {
    if (selectedNode && !currentRelations.includes(selectedNode)) {
      updateNodeRelations(nodeId, selectedNode);
      setSelectedNode('');
    }
  };

  const handleRemoveRelation = (targetId: string) => {
    const updatedRelations = currentRelations.filter(id => id !== targetId);
    const newRelations = { ...nodeRelations };
    newRelations[nodeId] = updatedRelations;
    delete newRelations[targetId];
    useDiagramStore.setState({ nodeRelations: newRelations });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 min-w-[300px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Manage Relationships</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Add New Relationship
        </label>
        <div className="flex gap-2">
          <select
            value={selectedNode}
            onChange={(e) => setSelectedNode(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a node...</option>
            {sourceNodes
              .filter(node => !currentRelations.includes(node.id))
              .map(node => (
                <option key={node.id} value={node.id}>
                  {node.data.label}
                </option>
              ))}
          </select>
          <button
            onClick={handleAddRelation}
            disabled={!selectedNode}
            className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Current Relationships</h4>
        {currentRelations.length === 0 ? (
          <p className="text-sm text-gray-500">No relationships yet</p>
        ) : (
          <ul className="space-y-2">
            {currentRelations.map(targetId => {
              const targetNode = sourceNodes.find(node => node.id === targetId);
              return (
                <li key={targetId} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                  <span className="text-sm">{targetNode?.data.label}</span>
                  <button
                    onClick={() => handleRemoveRelation(targetId)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}