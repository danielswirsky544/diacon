import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@libsql/client';
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
  highlightedNodes: Set<string>;
  onNodesChange: (changes: NodeChange[], isLeftDiagram: boolean) => void;
  onEdgesChange: (changes: EdgeChange[], isLeftDiagram: boolean) => void;
  onConnect: (connection: Connection, isLeftDiagram: boolean) => void;
  setHighlightedNodes: (nodeIds: string[]) => void;
  addNode: (node: Node, isLeftDiagram: boolean) => void;
  updateNode: (nodeId: string, data: Partial<{ label: string; imageUrl?: string }>, isLeftDiagram: boolean) => void;
  updateNodeRelations: (sourceId: string, targetId: string) => void;
  saveDiagram: (name: string) => Promise<void>;
  loadDiagram: (id: string) => Promise<void>;
  loadDiagrams: () => Promise<{ id: string; name: string }[]>;
}

const client = createClient({
  url: import.meta.env.VITE_DATABASE_URL || '',
  authToken: import.meta.env.VITE_DATABASE_AUTH_TOKEN || '',
});

const initialLeftNodes: Node[] = [
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

const initialRightNodes: Node[] = [
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
      highlightedNodes: new Set<string>(),

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
        set({ highlightedNodes: new Set(nodeIds) });
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
          await client.execute({
            sql: `INSERT INTO diagrams (name, data) VALUES (?, ?)`,
            args: [name, JSON.stringify(diagramData)],
          });
        } catch (error) {
          console.error('Failed to save diagram:', error);
          throw error;
        }
      },

      loadDiagram: async (id: string) => {
        try {
          const result = await client.execute({
            sql: `SELECT data FROM diagrams WHERE id = ?`,
            args: [id],
          });

          if (result.rows[0]) {
            const data = JSON.parse(result.rows[0].data as string);
            set({
              leftNodes: data.leftNodes,
              rightNodes: data.rightNodes,
              leftEdges: data.leftEdges,
              rightEdges: data.rightEdges,
              nodeRelations: data.nodeRelations,
            });
          }
        } catch (error) {
          console.error('Failed to load diagram:', error);
          throw error;
        }
      },

      loadDiagrams: async () => {
        try {
          const result = await client.execute({
            sql: `SELECT id, name FROM diagrams ORDER BY created_at DESC`,
          });
          return result.rows.map(row => ({
            id: row.id as string,
            name: row.name as string,
          }));
        } catch (error) {
          console.error('Failed to load diagrams:', error);
          throw error;
        }
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
      }),
    }
  )
);