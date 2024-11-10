import React, { useCallback, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNode from './CustomNode';
import Toolbar from './Toolbar';
import EdgeControls from './EdgeControls';

interface DiagramCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onNodeHover: (nodeId: string | null) => void;
  highlightedNodes: Set<string>;
  isLeftDiagram: boolean;
}

const nodeTypes = {
  custom: CustomNode,
};

export default function DiagramCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeHover,
  highlightedNodes,
  isLeftDiagram,
}: DiagramCanvasProps) {
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

  const handleNodeMouseEnter = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeHover(node.id);
    },
    [onNodeHover]
  );

  const handleNodeMouseLeave = useCallback(() => {
    onNodeHover(null);
  }, [onNodeHover]);

  const handleEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    setSelectedEdge(edge);
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedEdge(null);
  }, []);

  return (
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={nodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            isHighlighted: highlightedNodes.has(node.id),
          },
        }))}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeMouseEnter={handleNodeMouseEnter}
        onNodeMouseLeave={handleNodeMouseLeave}
        onEdgeClick={handleEdgeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <Panel position="top-left">
          <Toolbar isLeftDiagram={isLeftDiagram} />
        </Panel>
        {selectedEdge && (
          <EdgeControls
            edge={selectedEdge}
            isLeftDiagram={isLeftDiagram}
            onClose={() => setSelectedEdge(null)}
          />
        )}
      </ReactFlow>
    </div>
  );
}