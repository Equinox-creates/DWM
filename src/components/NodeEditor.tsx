import React, { useCallback, useEffect, useState } from 'react';
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState, addEdge, Connection, Edge, Node, Handle, Position, useReactFlow, ReactFlowProvider, NodeProps } from 'reactflow';
import 'reactflow/dist/style.css';
import { DiscordWebhookMessage, DiscordEmbed, DiscordEmbedField } from '@/types';
import { intToHex, hexToInt } from '@/utils';
import { Trash2, Scissors, Undo, Redo, Plus } from 'lucide-react';

// --- Custom Nodes ---

const MessageNode = () => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white dark:bg-zinc-800 border-2 border-cyan-500 min-w-[150px] relative group">
      <div className="font-bold text-sm mb-2 text-center border-b border-zinc-700 pb-1">Webhook Message</div>
      <div className="relative py-1">
        <Handle type="target" position={Position.Left} id="content" className="!bg-cyan-500" />
        <div className="text-xs text-zinc-500 dark:text-zinc-400 ml-2">Content (String)</div>
      </div>
      <div className="relative py-1">
        <Handle type="target" position={Position.Left} id="embeds" className="!bg-purple-500" style={{ top: '50%' }} />
        <div className="text-xs text-zinc-500 dark:text-zinc-400 ml-2">Embeds (List)</div>
      </div>
    </div>
  );
};

const StringNode = ({ data, id }: NodeProps) => {
  const { setNodes } = useReactFlow();
  const deleteNode = () => setNodes((nds) => nds.filter((n) => n.id !== id));

  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white dark:bg-zinc-800 border border-zinc-600 min-w-[200px] relative group">
      <div className="flex justify-between items-center mb-2">
        <div className="font-bold text-xs text-zinc-400">{data.label}</div>
        <button onClick={deleteNode} className="text-zinc-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
            <Trash2 className="w-3 h-3" />
        </button>
      </div>
      <textarea 
        className="w-full bg-zinc-900 text-xs text-white p-2 rounded border border-zinc-700 resize-y"
        value={data.value}
        onChange={(e) => data.onChange(id, e.target.value)}
        rows={3}
      />
      <Handle type="source" position={Position.Right} className="!bg-cyan-500" />
    </div>
  );
};

const EmbedNode = ({ data, id }: NodeProps) => {
  const { setNodes } = useReactFlow();
  const deleteNode = () => setNodes((nds) => nds.filter((n) => n.id !== id));

  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white dark:bg-zinc-800 border-2 border-purple-500 min-w-[180px] relative group">
      <div className="flex justify-between items-center mb-2 border-b border-zinc-700 pb-1">
        <div className="font-bold text-sm text-center flex-1">Embed</div>
        <button onClick={deleteNode} className="text-zinc-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 top-0">
            <Trash2 className="w-3 h-3" />
        </button>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <div className="text-xs">Color:</div>
        <input 
          type="color" 
          value={intToHex(data.color)} 
          onChange={(e) => data.onChange(id, hexToInt(e.target.value) || 0)}
          className="w-6 h-6 rounded cursor-pointer"
        />
      </div>
      
      <div className="relative py-1">
        <Handle type="target" position={Position.Left} id="title" className="!bg-cyan-500" />
        <div className="text-xs text-zinc-500 dark:text-zinc-400 ml-2">Title</div>
      </div>
      <div className="relative py-1">
        <Handle type="target" position={Position.Left} id="description" className="!bg-cyan-500" />
        <div className="text-xs text-zinc-500 dark:text-zinc-400 ml-2">Description</div>
      </div>
      <div className="relative py-1">
        <Handle type="target" position={Position.Left} id="fields" className="!bg-green-500" />
        <div className="text-xs text-zinc-500 dark:text-zinc-400 ml-2">Fields</div>
      </div>

      <Handle type="source" position={Position.Right} className="!bg-purple-500" />
    </div>
  );
};

const FieldNode = ({ data, id }: NodeProps) => {
  const { setNodes } = useReactFlow();
  const deleteNode = () => setNodes((nds) => nds.filter((n) => n.id !== id));

  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white dark:bg-zinc-800 border-2 border-green-500 min-w-[200px] relative group">
      <div className="flex justify-between items-center mb-2 border-b border-zinc-700 pb-1">
        <div className="font-bold text-sm text-center flex-1">Field</div>
        <button onClick={deleteNode} className="text-zinc-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 top-0">
            <Trash2 className="w-3 h-3" />
        </button>
      </div>
      <div className="space-y-2">
        <input 
          className="w-full bg-zinc-900 text-xs text-white p-1 rounded border border-zinc-700"
          placeholder="Name"
          value={data.name}
          onChange={(e) => data.onChange(id, { ...data, name: e.target.value })}
        />
        <textarea 
          className="w-full bg-zinc-900 text-xs text-white p-1 rounded border border-zinc-700"
          placeholder="Value"
          value={data.value}
          onChange={(e) => data.onChange(id, { ...data, value: e.target.value })}
          rows={2}
        />
        <label className="flex items-center gap-2 text-xs">
          <input 
            type="checkbox" 
            checked={data.inline}
            onChange={(e) => data.onChange(id, { ...data, inline: e.target.checked })}
          />
          Inline
        </label>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-green-500" />
    </div>
  );
};

const nodeTypes = {
  messageNode: MessageNode,
  stringNode: StringNode,
  embedNode: EmbedNode,
  fieldNode: FieldNode,
};

// --- Main Component ---

interface NodeEditorProps {
  message: DiscordWebhookMessage;
  onChange: (message: DiscordWebhookMessage) => void;
}

const NodeEditorContent: React.FC<NodeEditorProps> = ({ message, onChange }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  useReactFlow();
  
  // Undo/Redo State
  const [history, setHistory] = useState<{nodes: Node[], edges: Edge[]}[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [cutMode, setCutMode] = useState(false);

  // Snapshot helper
  const takeSnapshot = useCallback(() => {
    setHistory(prev => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push({ nodes, edges });
        return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  }, [nodes, edges, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        const state = history[newIndex];
        setNodes(state.nodes);
        setEdges(state.edges);
        setHistoryIndex(newIndex);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        const state = history[newIndex];
        setNodes(state.nodes);
        setEdges(state.edges);
        setHistoryIndex(newIndex);
    }
  };

  // --- Update Handlers ---

  const updateStringNode = (id: string, value: string) => {
    setNodes((nds) => nds.map((node) => {
      if (node.id === id) {
        return { ...node, data: { ...node.data, value } };
      }
      return node;
    }));
  };

  const updateEmbedNode = (id: string, color: number) => {
    setNodes((nds) => nds.map((node) => {
      if (node.id === id) {
        return { ...node, data: { ...node.data, color } };
      }
      return node;
    }));
  };

  const updateFieldNode = (id: string, fieldData: Partial<DiscordEmbedField>) => {
    setNodes((nds) => nds.map((node) => {
      if (node.id === id) {
        return { ...node, data: { ...node.data, ...fieldData } };
      }
      return node;
    }));
  };

  // --- Graph Initialization ---
  useEffect(() => {
    if (nodes.length > 0) return;

    const initialNodes: Node[] = [];
    const initialEdges: Edge[] = [];
    const x = 600;
    const y = 300;

    // 1. Message Node
    const messageNodeId = 'root-message';
    initialNodes.push({
      id: messageNodeId,
      type: 'messageNode',
      position: { x, y },
      data: { label: 'Webhook Message' },
    });

    // 2. Content Node
    if (message.content) {
      const contentId = 'content-node';
      initialNodes.push({
        id: contentId,
        type: 'stringNode',
        position: { x: x - 300, y: y - 100 },
        data: { value: message.content, label: 'Content', onChange: updateStringNode },
      });
      initialEdges.push({ id: 'e-content', source: contentId, target: messageNodeId, targetHandle: 'content' });
    }

    // 3. Embeds
    if (message.embeds) {
      message.embeds.forEach((embed, i) => {
        const embedId = `embed-${i}`;
        const embedY = y + (i * 300);
        initialNodes.push({
          id: embedId,
          type: 'embedNode',
          position: { x: x - 300, y: embedY },
          data: { color: embed.color || 0, onChange: updateEmbedNode },
        });
        initialEdges.push({ id: `e-embed-${i}`, source: embedId, target: messageNodeId, targetHandle: 'embeds' });

        // Title
        if (embed.title) {
          const titleId = `title-${i}`;
          initialNodes.push({
            id: titleId,
            type: 'stringNode',
            position: { x: x - 600, y: embedY - 50 },
            data: { value: embed.title, label: 'Title', onChange: updateStringNode },
          });
          initialEdges.push({ id: `e-title-${i}`, source: titleId, target: embedId, targetHandle: 'title' });
        }

        // Description
        if (embed.description) {
          const descId = `desc-${i}`;
          initialNodes.push({
            id: descId,
            type: 'stringNode',
            position: { x: x - 600, y: embedY + 100 },
            data: { value: embed.description, label: 'Description', onChange: updateStringNode },
          });
          initialEdges.push({ id: `e-desc-${i}`, source: descId, target: embedId, targetHandle: 'description' });
        }

        // Fields
        if (embed.fields) {
           embed.fields.forEach((field, fIndex) => {
             const fieldId = `field-${i}-${fIndex}`;
             initialNodes.push({
               id: fieldId,
               type: 'fieldNode',
               position: { x: x - 600, y: embedY + 250 + (fIndex * 150) },
               data: { ...field, onChange: updateFieldNode },
             });
             initialEdges.push({ id: `e-field-${i}-${fIndex}`, source: fieldId, target: embedId, targetHandle: 'fields' });
           });
        }
      });
    }

    setNodes(initialNodes);
    setEdges(initialEdges);
    // Initial snapshot
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistory([{ nodes: initialNodes, edges: initialEdges }]);
    setHistoryIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Graph Traversal to JSON ---
  useEffect(() => {
    if (nodes.length === 0) return;

    const newMessage: DiscordWebhookMessage = { ...message, embeds: [] };
    
    // Find Content
    const contentEdge = edges.find(e => e.target === 'root-message' && e.targetHandle === 'content');
    if (contentEdge) {
      const contentNode = nodes.find(n => n.id === contentEdge.source);
      if (contentNode) newMessage.content = contentNode.data.value;
    } else {
      newMessage.content = "";
    }

    // Find Embeds
    const embedEdges = edges.filter(e => e.target === 'root-message' && e.targetHandle === 'embeds');
    embedEdges.sort((a, b) => {
      const nodeA = nodes.find(n => n.id === a.source);
      const nodeB = nodes.find(n => n.id === b.source);
      return (nodeA?.position.y || 0) - (nodeB?.position.y || 0);
    });

    const newEmbeds: DiscordEmbed[] = [];

    embedEdges.forEach(edge => {
      const embedNode = nodes.find(n => n.id === edge.source);
      if (!embedNode) return;

      const embed: DiscordEmbed = {
        color: embedNode.data.color,
        fields: []
      };

      // Find Title
      const titleEdge = edges.find(e => e.target === embedNode.id && e.targetHandle === 'title');
      if (titleEdge) {
        const titleNode = nodes.find(n => n.id === titleEdge.source);
        if (titleNode) embed.title = titleNode.data.value;
      }

      // Find Description
      const descEdge = edges.find(e => e.target === embedNode.id && e.targetHandle === 'description');
      if (descEdge) {
        const descNode = nodes.find(n => n.id === descEdge.source);
        if (descNode) embed.description = descNode.data.value;
      }

      // Find Fields
      const fieldEdges = edges.filter(e => e.target === embedNode.id && e.targetHandle === 'fields');
      fieldEdges.sort((a, b) => {
        const nodeA = nodes.find(n => n.id === a.source);
        const nodeB = nodes.find(n => n.id === b.source);
        return (nodeA?.position.y || 0) - (nodeB?.position.y || 0);
      });

      fieldEdges.forEach(fEdge => {
        const fieldNode = nodes.find(n => n.id === fEdge.source);
        if (fieldNode) {
          embed.fields?.push({
            name: fieldNode.data.name,
            value: fieldNode.data.value,
            inline: fieldNode.data.inline
          });
        }
      });

      newEmbeds.push(embed);
    });

    newMessage.embeds = newEmbeds;
    onChange(newMessage);

  }, [nodes, edges]);

  const onConnect = useCallback((params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
      takeSnapshot();
  }, [setEdges, takeSnapshot]);

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    takeSnapshot();
  }, [setEdges, takeSnapshot]);

  const onNodeDragStop = useCallback(() => {
      takeSnapshot();
  }, [takeSnapshot]);

  const addNode = (type: string) => {
    const id = `${type}-${Date.now()}`;
    const newNode: Node = {
      id,
      type,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {}
    };

    if (type === 'stringNode') {
      newNode.data = { value: 'Text', label: 'Text Node', onChange: updateStringNode };
    } else if (type === 'embedNode') {
      newNode.data = { color: 0, onChange: updateEmbedNode };
    } else if (type === 'fieldNode') {
      newNode.data = { name: 'Field', value: 'Value', inline: false, onChange: updateFieldNode };
    }

    setNodes((nds) => [...nds, newNode]);
    takeSnapshot();
  };

  return (
    <div className={`h-full flex flex-col bg-zinc-50 dark:bg-[#1e1e1e] rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 ${cutMode ? 'cursor-crosshair' : ''}`}>
      <div className="bg-white dark:bg-[#252526] px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
        <div className="flex gap-2">
            <button onClick={() => addNode('stringNode')} className="flex items-center gap-1 px-2 py-1 bg-zinc-200 dark:bg-zinc-700 text-xs rounded hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-white"><Plus className="w-3 h-3" /> Text</button>
            <button onClick={() => addNode('embedNode')} className="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-700 text-xs rounded hover:bg-purple-200 dark:hover:bg-purple-600 text-purple-700 dark:text-white"><Plus className="w-3 h-3" /> Embed</button>
            <button onClick={() => addNode('fieldNode')} className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-700 text-xs rounded hover:bg-green-200 dark:hover:bg-green-600 text-green-700 dark:text-white"><Plus className="w-3 h-3" /> Field</button>
        </div>
        <div className="flex gap-2 items-center">
            <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1" />
            <button 
                onClick={() => setCutMode(!cutMode)} 
                className={`p-1.5 rounded transition-colors ${cutMode ? 'bg-red-500/20 text-red-500' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                title="Cut Mode (Click edge to delete)"
            >
                <Scissors className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1" />
            <button onClick={undo} disabled={historyIndex <= 0} className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded disabled:opacity-30">
                <Undo className="w-4 h-4" />
            </button>
            <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded disabled:opacity-30">
                <Redo className="w-4 h-4" />
            </button>
        </div>
      </div>
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeClick={onEdgeClick}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          deleteKeyCode={['Backspace', 'Delete']}
        >
          <Background color="#888" gap={16} className="dark:hidden" />
          <Background color="#333" gap={16} className="hidden dark:block" />
          <Controls className="!bg-white dark:!bg-[#1e1e1e] !border-zinc-200 dark:!border-zinc-700 [&>button]:!border-zinc-200 dark:[&>button]:!border-zinc-700 [&>button]:!fill-zinc-700 dark:[&>button]:!fill-zinc-400 hover:[&>button]:!bg-zinc-100 dark:hover:[&>button]:!bg-zinc-800" />
          <MiniMap style={{ background: 'transparent' }} nodeColor={() => '#888'} className="!bg-white dark:!bg-[#222] border border-zinc-200 dark:border-zinc-800" />
        </ReactFlow>
      </div>
    </div>
  );
};

export const NodeEditor = (props: NodeEditorProps) => (
  <ReactFlowProvider>
    <NodeEditorContent {...props} />
  </ReactFlowProvider>
);
