import React, { memo, useState, useCallback } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from 'reactflow';
import NodeContextMenu from './NodeContextMenu';

interface CustomNodeData {
  label: string;
  imageUrl?: string;
  isHighlighted: boolean;
}

function CustomNode({ id, data, isConnectable, selected }: NodeProps<CustomNodeData>) {
  const { label, imageUrl, isHighlighted } = data;
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const handleContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      const bounds = (event.target as HTMLElement).getBoundingClientRect();
      setContextMenu({ x: event.clientX - bounds.left, y: event.clientY - bounds.top });
    },
    []
  );

  return (
    <>
      <div
        onContextMenu={handleContextMenu}
        className={`group relative px-4 py-2 shadow-md rounded-md border-2 transition-all duration-200 min-w-[100px] min-h-[100px] flex items-center justify-center
          ${
            isHighlighted
              ? 'border-blue-500 bg-blue-50 shadow-blue-200'
              : 'border-gray-300 bg-white'
          }`}
      >
        <NodeResizer
          isVisible={selected}
          minWidth={100}
          minHeight={100}
          handleClassName="w-2 h-2 border-2 border-blue-500 bg-white rounded-full"
          lineClassName="border-blue-500"
        />
        <Handle
          type="target"
          position={Position.Top}
          className="w-2 h-2"
          isConnectable={isConnectable}
        />
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={label}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="font-medium text-sm">{label}</div>
        )}
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-2 h-2"
          isConnectable={isConnectable}
        />
      </div>
      {contextMenu && (
        <NodeContextMenu
          nodeId={id}
          position={contextMenu}
          isLeftDiagram={id.startsWith('l')}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}

export default memo(CustomNode);