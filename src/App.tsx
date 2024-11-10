import React, { useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import DiagramCanvas from './components/DiagramCanvas';
import DiagramControls from './components/DiagramControls';
import { useDiagramStore } from './store/diagramStore';
import 'reactflow/dist/style.css';

function App() {
  const {
    leftNodes,
    rightNodes,
    leftEdges,
    rightEdges,
    nodeRelations,
    highlightedNodes,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setHighlightedNodes,
    loadDiagram,
    currentDiagramName,
  } = useDiagramStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const diagramId = params.get('diagram');
    if (diagramId) {
      loadDiagram(diagramId);
    }
  }, [loadDiagram]);

  const handleNodeHover = (nodeId: string | null) => {
    if (!nodeId) {
      setHighlightedNodes([]);
      return;
    }

    const relatedNodes = nodeRelations[nodeId] || [];
    setHighlightedNodes([nodeId, ...relatedNodes]);
  };

  return (
    <div className="w-full h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            {currentDiagramName}
          </h1>
          <DiagramControls />
        </div>
        
        <div className="grid grid-cols-2 gap-8 h-[800px]">
          <ReactFlowProvider>
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Process Flow</h2>
              <div className="h-[700px]">
                <DiagramCanvas
                  nodes={leftNodes}
                  edges={leftEdges}
                  onNodesChange={(changes) => onNodesChange(changes, true)}
                  onEdgesChange={(changes) => onEdgesChange(changes, true)}
                  onConnect={(connection) => onConnect(connection, true)}
                  onNodeHover={handleNodeHover}
                  highlightedNodes={highlightedNodes}
                  isLeftDiagram={true}
                />
              </div>
            </div>
          </ReactFlowProvider>

          <ReactFlowProvider>
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Task Flow</h2>
              <div className="h-[700px]">
                <DiagramCanvas
                  nodes={rightNodes}
                  edges={rightEdges}
                  onNodesChange={(changes) => onNodesChange(changes, false)}
                  onEdgesChange={(changes) => onEdgesChange(changes, false)}
                  onConnect={(connection) => onConnect(connection, false)}
                  onNodeHover={handleNodeHover}
                  highlightedNodes={highlightedNodes}
                  isLeftDiagram={false}
                />
              </div>
            </div>
          </ReactFlowProvider>
        </div>
      </div>
    </div>
  );
}

export default App;