import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';

interface NodeData {
  label: string;
  imageData?: string;
  isHighlighted?: boolean;
}

interface DiagramNode extends Node {
  data: NodeData;
}

interface DiagramData {
  leftNodes: DiagramNode[];
  rightNodes: DiagramNode[];
  leftEdges: Edge[];
  rightEdges: Edge[];
  nodeRelations: Record<string, string[]>;
}

interface DiagramState extends DiagramData {
  currentDiagramName: string;
  isLoading: boolean;
  onNodesChange: (changes: NodeChange[], isLeftDiagram: boolean) => void;
  onEdgesChange: (changes: EdgeChange[], isLeftDiagram: boolean) => void;
  onConnect: (connection: Connection, isLeftDiagram: boolean) => void;
  setHighlightedNodes: (nodeIds: string[]) => void;
  addNode: (node: DiagramNode, isLeftDiagram: boolean) => void;
  updateNode: (nodeId: string, data: Partial<NodeData>, isLeftDiagram: boolean) => void;
  deleteNode: (nodeId: string, isLeftDiagram: boolean) => void;
  updateNodeRelations: (sourceId: string, targetId: string) => void;
  saveDiagram: (name: string) => Promise<string>;
  loadDiagram: (id: string) => Promise<void>;
  deleteDiagram: (id: string) => Promise<void>;
  exportDiagram: () => DiagramData;
  importDiagram: (data: DiagramData) => void;
}

const initialLeftNodes: DiagramNode[] = [
  {
    id: 'l1',
    type: 'custom',
    position: { x: 0, y: 0 },
    data: { label: 'Process 1' },
  },
  {
    id: 'l2',
    type: 'custom',
    position: { x: 0, y: 200 },
    data: { label: 'Process 2' },
  },
];

const initialRightNodes: DiagramNode[] = [
  {
    id: 'r1',
    type: 'custom',
    position: { x: 0, y: 0 },
    data: { label: 'Task 1' },
  },
  {
    id: 'r2',
    type: 'custom',
    position: { x: 0, y: 200 },
    data: { label: 'Task 2' },
  },
];

const initialNodeRelations: Record<string, string[]> = {
  l1: ['r1'],
  l2: ['r1', 'r2'],
  r1: ['l1', 'l2'],
  r2: ['l2'],
};

export const useDiagramStore = create<DiagramState>()(
  persist(
    (set, get) => ({
      leftNodes: initialLeftNodes,
      rightNodes: initialRightNodes,
      leftEdges: [
        { id: 'e1-2', source: 'l1', target: 'l2', type: 'smoothstep', animated: true }
      ],
      rightEdges: [
        { id: 'e1-2', source: 'r1', target: 'r2', type: 'smoothstep', animated: true }
      ],
      nodeRelations: initialNodeRelations,
      currentDiagramName: '',
      isLoading: false,

      onNodesChange: (changes, isLeftDiagram) => {
        set({
          [isLeftDiagram ? 'leftNodes' : 'rightNodes']: applyNodeChanges(
            changes,
            isLeftDiagram ? get().leftNodes : get().rightNodes
          ),
        });
      },

      onEdgesChange: (changes, isLeftDiagram) => {
        set({
          [isLeftDiagram ? 'leftEdges' : 'rightEdges']: applyEdgeChanges(
            changes,
            isLeftDiagram ? get().leftEdges : get().rightEdges
          ),
        });
      },

      onConnect: (connection, isLeftDiagram) => {
        const edgeType = 'smoothstep';
        const newEdge = {
          ...connection,
          id: `e${connection.source}-${connection.target}`,
          type: edgeType,
          animated: true,
        };

        set({
          [isLeftDiagram ? 'leftEdges' : 'rightEdges']: addEdge(
            newEdge,
            isLeftDiagram ? get().leftEdges : get().rightEdges
          ),
        });
      },

      addNode: (node, isLeftDiagram) => {
        const nodes = isLeftDiagram ? get().leftNodes : get().rightNodes;
        set({
          [isLeftDiagram ? 'leftNodes' : 'rightNodes']: [...nodes, node],
        });
      },

      updateNode: (nodeId, data, isLeftDiagram) => {
        const nodes = isLeftDiagram ? get().leftNodes : get().rightNodes;
        const updatedNodes = nodes.map(node => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: { ...node.data, ...data },
            };
          }
          return node;
        });
        set({
          [isLeftDiagram ? 'leftNodes' : 'rightNodes']: updatedNodes,
        });
      },

      deleteNode: (nodeId, isLeftDiagram) => {
        const nodes = isLeftDiagram ? get().leftNodes : get().rightNodes;
        const edges = isLeftDiagram ? get().leftEdges : get().rightEdges;
        
        // Remove node
        const updatedNodes = nodes.filter(node => node.id !== nodeId);
        
        // Remove connected edges
        const updatedEdges = edges.filter(
          edge => edge.source !== nodeId && edge.target !== nodeId
        );
        
        // Remove from relations
        const updatedRelations = { ...get().nodeRelations };
        delete updatedRelations[nodeId];
        Object.keys(updatedRelations).forEach(key => {
          updatedRelations[key] = updatedRelations[key].filter(id => id !== nodeId);
        });

        set({
          [isLeftDiagram ? 'leftNodes' : 'rightNodes']: updatedNodes,
          [isLeftDiagram ? 'leftEdges' : 'rightEdges']: updatedEdges,
          nodeRelations: updatedRelations,
        });
      },

      updateNodeRelations: (sourceId: string, targetId: string) => {
        const relations = { ...get().nodeRelations };
        if (!relations[sourceId]) relations[sourceId] = [];
        if (!relations[targetId]) relations[targetId] = [];
        
        if (!relations[sourceId].includes(targetId)) {
          relations[sourceId].push(targetId);
        }
        if (!relations[targetId].includes(sourceId)) {
          relations[targetId].push(sourceId);
        }
        
        set({ nodeRelations: relations });
      },

      setHighlightedNodes: (nodeIds) => {
        const leftNodes = get().leftNodes.map(node => ({
          ...node,
          data: { ...node.data, isHighlighted: nodeIds.includes(node.id) },
        }));
        
        const rightNodes = get().rightNodes.map(node => ({
          ...node,
          data: { ...node.data, isHighlighted: nodeIds.includes(node.id) },
        }));

        set({ leftNodes, rightNodes });
      },

      saveDiagram: async (name: string) => {
        const state = get();
        const diagramData = {
          leftNodes: state.leftNodes,
          rightNodes: state.rightNodes,
          leftEdges: state.leftEdges,
          rightEdges: state.rightEdges,
          nodeRelations: state.nodeRelations,
        };

        try {
          const response = await fetch('/api/diagrams', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, data: diagramData }),
          });

          if (!response.ok) throw new Error('Failed to save diagram');
          
          const { id } = await response.json();
          set({ currentDiagramName: name });
          return id;
        } catch (error) {
          console.error('Failed to save diagram:', error);
          throw error;
        }
      },

      loadDiagram: async (id: string) => {
        set({ isLoading: true });
        try {
          const response = await fetch(`/api/diagrams/${id}`);
          if (!response.ok) throw new Error('Failed to load diagram');
          
          const { name, data } = await response.json();
          set({
            ...data,
            currentDiagramName: name,
          });
        } catch (error) {
          console.error('Failed to load diagram:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      deleteDiagram: async (id: string) => {
        try {
          const response = await fetch(`/api/diagrams/${id}`, {
            method: 'DELETE',
          });
          if (!response.ok) throw new Error('Failed to delete diagram');
        } catch (error) {
          console.error('Failed to delete diagram:', error);
          throw error;
        }
      },

      exportDiagram: () => {
        const state = get();
        return {
          leftNodes: state.leftNodes,
          rightNodes: state.rightNodes,
          leftEdges: state.leftEdges,
          rightEdges: state.rightEdges,
          nodeRelations: state.nodeRelations,
        };
      },

      importDiagram: (data: DiagramData) => {
        set({
          ...data,
          currentDiagramName: '',
        });
      },
    }),
    {
      name: 'diagram-storage',
      partialize: (state) => ({
        leftNodes: state.leftNodes,
        rightNodes: state.rightNodes,
        leftEdges: state.leftEdges,
        rightEdges: state.rightEdges,
        nodeRelations: state.nodeRelations,
        currentDiagramName: state.currentDiagramName,
      }),
    }
  )
);