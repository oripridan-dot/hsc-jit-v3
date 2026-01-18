/**
 * Signal Flow Map - Visual Product Relationships
 * Shows: [Accessories] -> [PRODUCT] -> [Related/Output]
 */
import React, { useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls,
  Position
} from 'reactflow';
import type { Node, Edge, NodeTypes } from 'reactflow';
import 'reactflow/dist/style.css';

interface SignalFlowMapProps {
  product: any;
}

// Custom node component for products
const ProductNode = ({ data }: { data: any }) => (
  <div className="px-4 py-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-cyan-400/50 rounded-lg backdrop-blur-md shadow-lg">
    <div className="text-cyan-100 font-bold text-sm mb-1">{data.label}</div>
    {data.price && (
      <div className="text-cyan-400/70 text-xs">₪{data.price}</div>
    )}
  </div>
);

const AccessoryNode = ({ data }: { data: any }) => (
  <div className="px-3 py-2 bg-slate-800/80 border border-slate-600/50 rounded-md backdrop-blur-sm">
    <div className="text-slate-300 font-semibold text-xs">{data.label}</div>
    <div className="text-slate-500 text-[10px]">{data.type || 'Accessory'}</div>
  </div>
);

const RelatedNode = ({ data }: { data: any }) => (
  <div className="px-3 py-2 bg-emerald-900/30 border border-emerald-500/30 rounded-md backdrop-blur-sm">
    <div className="text-emerald-300 font-semibold text-xs">{data.label}</div>
    <div className="text-emerald-500/60 text-[10px]">{data.type || 'Related'}</div>
  </div>
);

const nodeTypes: NodeTypes = {
  product: ProductNode,
  accessory: AccessoryNode,
  related: RelatedNode
};

export const SignalFlowMap: React.FC<SignalFlowMapProps> = ({ product }) => {
  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    // Center node (the main product)
    nodes.push({
      id: 'main',
      type: 'product',
      position: { x: 400, y: 200 },
      data: { 
        label: product.name || product.title,
        price: product.price
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left
    });

    // Accessories (inputs) - left side
    const accessories = product.accessories || [];
    accessories.slice(0, 3).forEach((acc: any, idx: number) => {
      const nodeId = `acc-${idx}`;
      nodes.push({
        id: nodeId,
        type: 'accessory',
        position: { x: 50, y: 50 + (idx * 100) },
        data: { 
          label: acc.name || acc.title || 'Accessory',
          type: 'Required'
        },
        sourcePosition: Position.Right
      });
      
      edges.push({
        id: `e-${nodeId}`,
        source: nodeId,
        target: 'main',
        animated: true,
        style: { stroke: '#64748b', strokeWidth: 2 }
      });
    });

    // Related products (outputs) - right side
    const related = product.related || [];
    related.slice(0, 3).forEach((rel: any, idx: number) => {
      const nodeId = `rel-${idx}`;
      nodes.push({
        id: nodeId,
        type: 'related',
        position: { x: 750, y: 50 + (idx * 100) },
        data: { 
          label: rel.name || rel.title || 'Related',
          type: 'Compatible'
        },
        targetPosition: Position.Left
      });
      
      edges.push({
        id: `e-${nodeId}`,
        source: 'main',
        target: nodeId,
        animated: true,
        style: { stroke: '#10b981', strokeWidth: 2 }
      });
    });

    // If no accessories or related, add placeholder nodes
    if (accessories.length === 0) {
      nodes.push({
        id: 'acc-none',
        type: 'accessory',
        position: { x: 50, y: 150 },
        data: { label: 'No accessories found', type: 'Info' },
        sourcePosition: Position.Right
      });
    }

    if (related.length === 0) {
      nodes.push({
        id: 'rel-none',
        type: 'related',
        position: { x: 750, y: 150 },
        data: { label: 'No related products', type: 'Info' },
        targetPosition: Position.Left
      });
    }

    return { nodes, edges };
  }, [product]);

  return (
    <div className="h-64 w-full bg-slate-950/50 rounded-lg border border-slate-700/50 overflow-hidden relative">
      <div className="absolute top-2 left-2 z-10 text-[10px] text-cyan-400 font-mono font-bold tracking-wider">
        SIGNAL PATH VISUALIZATION
      </div>
      <div className="absolute top-2 right-2 z-10 text-[10px] text-slate-500 font-mono">
        {nodes.length - 1} Dependencies
      </div>
      <ReactFlow 
        nodes={nodes} 
        edges={edges} 
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          gap={16} 
          size={1} 
          color="#334155"
          style={{ opacity: 0.3 }}
        />
        <Controls 
          className="!bg-slate-800/80 !border-slate-600"
          showInteractive={false}
        />
      </ReactFlow>
    </div>
  );
};
