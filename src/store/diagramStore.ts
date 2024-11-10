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

interface DiagramState {
  leftNodes: Node[];
  rightNodes: Node[];
  leftEdges: Edge[];
  rightEdges: Edge[];
  nodeRelations: Record<string, string[]>;
  highlightedNodes: string[];
  currentDiagramName: string;
  savedDiagrams: Array<{ id: string; name: string }>;
  isLoading: boolean;
  error: string | null;
  onNodesChange: (changes: NodeChange[], isLeftDiagram: boolean) => void;
  onEdgesChange: (changes: EdgeChange[], isLeftDiagram: boolean) => void;
  onConnect: (connection: Connection, isLeftDiagram: boolean) => void;
  setHighlightedNodes: (nodeIds: string[]) => void;
  addNode: (node: Node, isLeftDiagram: boolean) => void;
  updateNode: (nodeId: string, data: Partial<{ label: string; imageUrl?: string }>, isLeftDiagram: boolean) => void;
  deleteNode: (nodeId: string, isLeftDiagram: boolean) => void;
  updateNodeRelations: (sourceId: string, targetId: string) => void;
  saveDiagram: (name: string) => Promise<string>;
  loadDiagram: (id: string) => Promise<void>;
  loadAllDiagrams: () => Promise<void>;
  deleteDiagram: (id: string) => Promise<void>;
  clearError: () => void;
}

const initialState = {
  leftNodes: [
    {
      id: 'l1',
      type: 'custom',
      position: { x: 100, y: 100 },
      data: { label: 'Process 1' },
    },
    {
      id: 'l2',
      type: 'custom',
      position: { x: 100, y: 300 },
      data: { label: 'Process 2' },
    },
  ],
  rightNodes: [
    {
      id: 'r1',
      type: 'custom',
      position: { x: 100, y: 100 },
      data: { label: 'Task 1' },
    },
    {
      id: 'r2',
      type: 'custom',
      position: { x: 100, y: 300 },
      data: { label: 'Task 2' },
    },
  ],
  leftEdges: [],
  rightEdges: [],
  nodeRelations: {
    l1: ['r1'],
    l2: ['r2'],
    r1: ['l1'],
    r2: ['l2'],
  },
  highlightedNodes: [],
  currentDiagramName: 'Untitled Diagram',
  savedDiagrams: [],
  isLoading: false,
  error: null,
};

export const useDiagramStore = create<DiagramState>()(
  persist(
    (set, get) => ({
      ...initialState,

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

      setHighlightedNodes: (nodeIds) => {
        set({ highlightedNodes: nodeIds });
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
        
        const updatedNodes = nodes.filter(node => node.id !== nodeId);
        const updatedEdges = edges.filter(
          edge => edge.source !== nodeId && edge.target !== nodeId
        );

        const relations = { ...get().nodeRelations };
        delete relations[nodeId];
        Object.keys(relations).forEach(key => {
          relations[key] = relations[key].filter(id => id !== nodeId);
        });

        set({
          [isLeftDiagram ? 'leftNodes' : 'rightNodes']: updatedNodes,
          [isLeftDiagram ? 'leftEdges' : 'rightEdges']: updatedEdges,
          nodeRelations: relations,
        });
      },

      updateNodeRelations: (sourceId, targetId) => {
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

      saveDiagram: async (name) => {
        set({ isLoading: true, error: null });
        try {
          const state = get();
          const response = await fetch('/api/diagrams', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name,
              data: {
                leftNodes: state.leftNodes,
                rightNodes: state.rightNodes,
                leftEdges: state.leftEdges,
                rightEdges: state.rightEdges,
                nodeRelations: state.nodeRelations,
              },
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to save diagram');
          }

          const { id } = await response.json();
          set({ currentDiagramName: name });
          await get().loadAllDiagrams();
          return id;
        } catch (error) {
          set({ error: 'Failed to save diagram' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      loadDiagram: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`/api/diagrams/${id}`);
          if (!response.ok) {
            throw new Error('Failed to load diagram');
          }

          const { name, data } = await response.json();
          set({
            ...data,
            currentDiagramName: name,
          });
        } catch (error) {
          set({ error: 'Failed to load diagram' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      loadAllDiagrams: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/diagrams');
          if (!response.ok) {
            throw new Error('Failed to load diagrams');
          }
          const diagrams = await response.json();
          set({ savedDiagrams: diagrams });
        } catch (error) {
          set({ error: 'Failed to load diagrams' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      deleteDiagram: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`/api/diagrams/${id}`, {
            method: 'DELETE',
          });
          if (!response.ok) {
            throw new Error('Failed to delete diagram');
          }
          await get().loadAllDiagrams();
        } catch (error) {
          set({ error: 'Failed to delete diagram' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
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