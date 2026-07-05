import React, { useCallback, useEffect, useState } from 'react';
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState, addEdge, Connection, Edge, Node, Handle, Position, useReactFlow, ReactFlowProvider, NodeProps } from 'reactflow';
import 'reactflow/dist/style.css';
import { DiscordWebhookMessage, DiscordEmbed, DiscordEmbedField } from '@/types';
import { intToHex, hexToInt } from '@/utils';
import { Trash2, Scissors, Undo, Redo, Plus, ChevronDown, Magnet, MessageSquare, Type, FileText, LayoutTemplate, Link, ListPlus, File, HelpCircle } from 'lucide-react';
import { playButtonSound, playDeleteSound } from '@/utils/sounds';
import { CustomColorPicker } from './ui/CustomInputs';
import { CustomDropdown } from './ui/CustomDropdown';
import { DocumentationModal } from './DocumentationModal';

// --- Custom Nodes ---

const MessageNode = () => {
  return (
    <div className="shadow-2xl rounded-md bg-[#2d2d2d] border border-[#1a1a1a] min-w-[200px] overflow-visible">
      <div className="bg-[#4a4a4a] px-3 py-1.5 rounded-t-md border-b border-[#1a1a1a] flex items-center justify-between">
        <div className="font-semibold text-[11px] text-white tracking-wide uppercase drop-shadow-md">Webhook Message</div>
      </div>
      <div className="p-3 space-y-3">
        <div className="relative flex items-center justify-end h-4">
          <div className="text-[11px] text-[#cccccc] mr-3">Content</div>
          <Handle type="target" position={Position.Left} id="content" className="!w-3.5 !h-3.5 !bg-[#63c76a] !border-2 !border-[#2d2d2d] !-ml-2 hover:!bg-white transition-colors" />
        </div>
        <div className="relative flex items-center justify-end h-4">
          <div className="text-[11px] text-[#cccccc] mr-3">Embeds</div>
          <Handle type="target" position={Position.Left} id="embeds" className="!w-3.5 !h-3.5 !bg-[#a881e6] !border-2 !border-[#2d2d2d] !-ml-2 hover:!bg-white transition-colors" />
        </div>
      </div>
    </div>
  );
};

const StringNode = ({ data, id }: NodeProps) => {
  const { setNodes } = useReactFlow();
  const deleteNode = () => setNodes((nds) => nds.filter((n) => n.id !== id));

  return (
    <div className="shadow-2xl rounded-md bg-[#2d2d2d] border border-[#1a1a1a] min-w-[220px] overflow-visible group">
      <div className="bg-[#5e81ac] px-3 py-1.5 rounded-t-md border-b border-[#1a1a1a] flex items-center justify-between">
        <div className="font-semibold text-[11px] text-white tracking-wide uppercase drop-shadow-md">{data.label}</div>
        <button onClick={() => { playDeleteSound(); deleteNode(); }} className="text-white/50 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
            <Trash2 className="w-3 h-3" />
        </button>
      </div>
      <div className="p-3">
        <textarea 
          className="w-full bg-[#1d1d1d] text-[11px] text-white p-2 rounded border border-[#3d3d3d] focus:border-[#5e81ac] focus:outline-none resize-y nodrag shadow-inner"
          value={data.value}
          onChange={(e) => data.onChange(id, e.target.value)}
          rows={3}
          placeholder="Enter text..."
        />
        <Handle type="source" position={Position.Right} className="!w-3.5 !h-3.5 !bg-[#63c76a] !border-2 !border-[#2d2d2d] !-mr-2 hover:!bg-white transition-colors" />
      </div>
    </div>
  );
};

const EmbedNode = ({ data, id }: NodeProps) => {
  const { setNodes } = useReactFlow();
  const deleteNode = () => setNodes((nds) => nds.filter((n) => n.id !== id));

  return (
    <div className="shadow-2xl rounded-md bg-[#2d2d2d] border border-[#1a1a1a] min-w-[240px] overflow-visible group">
      <div className="bg-[#a881e6] px-3 py-1.5 rounded-t-md border-b border-[#1a1a1a] flex items-center justify-between">
        <div className="font-semibold text-[11px] text-white tracking-wide uppercase drop-shadow-md">Embed</div>
        <button onClick={() => { playDeleteSound(); deleteNode(); }} className="text-white/50 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
            <Trash2 className="w-3 h-3" />
        </button>
      </div>
      
      <div className="p-3 space-y-2.5">
        <div className="flex items-center justify-between mb-3 bg-[#1d1d1d] p-1.5 rounded border border-[#3d3d3d] shadow-inner">
          <div className="text-[11px] text-[#cccccc] ml-1">Color</div>
          <CustomColorPicker 
            color={intToHex(data.color)} 
            onChange={(color) => data.onChange(id, hexToInt(color) || 0)}
            hideHexInput
          />
        </div>
        
        <div className="relative flex items-center h-4">
          <Handle type="target" position={Position.Left} id="title" className="!w-3.5 !h-3.5 !bg-[#63c76a] !border-2 !border-[#2d2d2d] !-ml-2 hover:!bg-white transition-colors" />
          <div className="text-[11px] text-[#cccccc] ml-4">Title</div>
        </div>
        <div className="relative flex items-center h-4">
          <Handle type="target" position={Position.Left} id="url" className="!w-3.5 !h-3.5 !bg-[#63c76a] !border-2 !border-[#2d2d2d] !-ml-2 hover:!bg-white transition-colors" />
          <div className="text-[11px] text-[#cccccc] ml-4">URL</div>
        </div>
        <div className="relative flex items-center h-4">
          <Handle type="target" position={Position.Left} id="description" className="!w-3.5 !h-3.5 !bg-[#63c76a] !border-2 !border-[#2d2d2d] !-ml-2 hover:!bg-white transition-colors" />
          <div className="text-[11px] text-[#cccccc] ml-4">Description</div>
        </div>
        <div className="relative flex items-center h-4">
          <Handle type="target" position={Position.Left} id="authorName" className="!w-3.5 !h-3.5 !bg-[#63c76a] !border-2 !border-[#2d2d2d] !-ml-2 hover:!bg-white transition-colors" />
          <div className="text-[11px] text-[#cccccc] ml-4">Author Name</div>
        </div>
        <div className="relative flex items-center h-4">
          <Handle type="target" position={Position.Left} id="authorUrl" className="!w-3.5 !h-3.5 !bg-[#63c76a] !border-2 !border-[#2d2d2d] !-ml-2 hover:!bg-white transition-colors" />
          <div className="text-[11px] text-[#cccccc] ml-4">Author URL</div>
        </div>
        <div className="relative flex items-center h-4">
          <Handle type="target" position={Position.Left} id="authorIcon" className="!w-3.5 !h-3.5 !bg-[#63c76a] !border-2 !border-[#2d2d2d] !-ml-2 hover:!bg-white transition-colors" />
          <div className="text-[11px] text-[#cccccc] ml-4">Author Icon URL</div>
        </div>
        <div className="relative flex items-center h-4">
          <Handle type="target" position={Position.Left} id="fields" className="!w-3.5 !h-3.5 !bg-[#ebcb8b] !border-2 !border-[#2d2d2d] !-ml-2 hover:!bg-white transition-colors" />
          <div className="text-[11px] text-[#cccccc] ml-4">Fields</div>
        </div>
        <div className="relative flex items-center h-4">
          <Handle type="target" position={Position.Left} id="image" className="!w-3.5 !h-3.5 !bg-[#63c76a] !border-2 !border-[#2d2d2d] !-ml-2 hover:!bg-white transition-colors" />
          <div className="text-[11px] text-[#cccccc] ml-4">Image URL</div>
        </div>
        <div className="relative flex items-center h-4">
          <Handle type="target" position={Position.Left} id="thumbnail" className="!w-3.5 !h-3.5 !bg-[#63c76a] !border-2 !border-[#2d2d2d] !-ml-2 hover:!bg-white transition-colors" />
          <div className="text-[11px] text-[#cccccc] ml-4">Thumbnail URL</div>
        </div>
        <div className="relative flex items-center h-4">
          <Handle type="target" position={Position.Left} id="footerText" className="!w-3.5 !h-3.5 !bg-[#63c76a] !border-2 !border-[#2d2d2d] !-ml-2 hover:!bg-white transition-colors" />
          <div className="text-[11px] text-[#cccccc] ml-4">Footer Text</div>
        </div>
        <div className="relative flex items-center h-4">
          <Handle type="target" position={Position.Left} id="footerIcon" className="!w-3.5 !h-3.5 !bg-[#63c76a] !border-2 !border-[#2d2d2d] !-ml-2 hover:!bg-white transition-colors" />
          <div className="text-[11px] text-[#cccccc] ml-4">Footer Icon URL</div>
        </div>
        <div className="relative flex items-center h-4">
          <Handle type="target" position={Position.Left} id="timestamp" className="!w-3.5 !h-3.5 !bg-[#63c76a] !border-2 !border-[#2d2d2d] !-ml-2 hover:!bg-white transition-colors" />
          <div className="text-[11px] text-[#cccccc] ml-4">Timestamp (ISO)</div>
        </div>

        <Handle type="source" position={Position.Right} className="!w-3.5 !h-3.5 !bg-[#a881e6] !border-2 !border-[#2d2d2d] !-mr-2 hover:!bg-white transition-colors" />
      </div>
    </div>
  );
};

const FieldNode = ({ data, id }: NodeProps) => {
  const { setNodes } = useReactFlow();
  const deleteNode = () => setNodes((nds) => nds.filter((n) => n.id !== id));

  return (
    <div className="shadow-2xl rounded-md bg-[#2d2d2d] border border-[#1a1a1a] min-w-[220px] overflow-visible group">
      <div className="bg-[#ebcb8b] px-3 py-1.5 rounded-t-md border-b border-[#1a1a1a] flex items-center justify-between">
        <div className="font-semibold text-[11px] text-[#2b2b2b] tracking-wide uppercase drop-shadow-sm">Field</div>
        <button onClick={() => { playDeleteSound(); deleteNode(); }} className="text-[#2b2b2b]/50 hover:text-[#2b2b2b] opacity-0 group-hover:opacity-100 transition-opacity">
            <Trash2 className="w-3 h-3" />
        </button>
      </div>
      <div className="p-3 space-y-3">
        <input 
          className="w-full bg-[#1d1d1d] text-[11px] text-white p-2 rounded border border-[#3d3d3d] focus:border-[#ebcb8b] focus:outline-none nodrag shadow-inner"
          placeholder="Name"
          value={data.name}
          onChange={(e) => data.onChange(id, { ...data, name: e.target.value })}
        />
        <textarea 
          className="w-full bg-[#1d1d1d] text-[11px] text-white p-2 rounded border border-[#3d3d3d] focus:border-[#ebcb8b] focus:outline-none resize-y nodrag shadow-inner"
          placeholder="Value"
          value={data.value}
          onChange={(e) => data.onChange(id, { ...data, value: e.target.value })}
          rows={2}
        />
        <label className="flex items-center gap-2 text-[11px] text-[#cccccc] bg-[#1d1d1d] p-1.5 rounded border border-[#3d3d3d] shadow-inner">
          <input 
            type="checkbox" 
            checked={data.inline}
            onChange={(e) => data.onChange(id, { ...data, inline: e.target.checked })}
            className="nodrag accent-[#ebcb8b]"
          />
          Inline
        </label>
      </div>
      <Handle type="source" position={Position.Right} className="!w-3.5 !h-3.5 !bg-[#ebcb8b] !border-2 !border-[#2d2d2d] !-mr-2 hover:!bg-white transition-colors" />
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
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [edgeType, setEdgeType] = useState<'default' | 'straight' | 'step' | 'smoothstep'>('smoothstep');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

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
    playButtonSound();
    if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        const state = history[newIndex];
        setNodes(state.nodes);
        setEdges(state.edges);
        setHistoryIndex(newIndex);
    }
  };

  const redo = () => {
    playButtonSound();
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

        // Image
        if (embed.image?.url) {
          const imageId = `image-${i}`;
          initialNodes.push({
            id: imageId,
            type: 'stringNode',
            position: { x: x - 600, y: embedY + 175 },
            data: { value: embed.image.url, label: 'Image URL', onChange: updateStringNode },
          });
          initialEdges.push({ id: `e-image-${i}`, source: imageId, target: embedId, targetHandle: 'image' });
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

      // Find URL
      const urlEdge = edges.find(e => e.target === embedNode.id && e.targetHandle === 'url');
      if (urlEdge) {
        const urlNode = nodes.find(n => n.id === urlEdge.source);
        if (urlNode) embed.url = urlNode.data.value;
      }

      // Find Description
      const descEdge = edges.find(e => e.target === embedNode.id && e.targetHandle === 'description');
      if (descEdge) {
        const descNode = nodes.find(n => n.id === descEdge.source);
        if (descNode) embed.description = descNode.data.value;
      }

      // Find Author
      const authorNameEdge = edges.find(e => e.target === embedNode.id && e.targetHandle === 'authorName');
      const authorUrlEdge = edges.find(e => e.target === embedNode.id && e.targetHandle === 'authorUrl');
      const authorIconEdge = edges.find(e => e.target === embedNode.id && e.targetHandle === 'authorIcon');
      
      if (authorNameEdge || authorUrlEdge || authorIconEdge) {
        embed.author = { name: '' };
        if (authorNameEdge) {
          const node = nodes.find(n => n.id === authorNameEdge.source);
          if (node) embed.author.name = node.data.value;
        }
        if (authorUrlEdge) {
          const node = nodes.find(n => n.id === authorUrlEdge.source);
          if (node) embed.author.url = node.data.value;
        }
        if (authorIconEdge) {
          const node = nodes.find(n => n.id === authorIconEdge.source);
          if (node) embed.author.icon_url = node.data.value;
        }
      }

      // Find Image
      const imageEdge = edges.find(e => e.target === embedNode.id && e.targetHandle === 'image');
      if (imageEdge) {
        const imageNode = nodes.find(n => n.id === imageEdge.source);
        if (imageNode) embed.image = { url: imageNode.data.value };
      }

      // Find Thumbnail
      const thumbnailEdge = edges.find(e => e.target === embedNode.id && e.targetHandle === 'thumbnail');
      if (thumbnailEdge) {
        const thumbnailNode = nodes.find(n => n.id === thumbnailEdge.source);
        if (thumbnailNode) embed.thumbnail = { url: thumbnailNode.data.value };
      }

      // Find Footer
      const footerTextEdge = edges.find(e => e.target === embedNode.id && e.targetHandle === 'footerText');
      const footerIconEdge = edges.find(e => e.target === embedNode.id && e.targetHandle === 'footerIcon');
      
      if (footerTextEdge || footerIconEdge) {
        embed.footer = { text: '' };
        if (footerTextEdge) {
          const node = nodes.find(n => n.id === footerTextEdge.source);
          if (node) embed.footer.text = node.data.value;
        }
        if (footerIconEdge) {
          const node = nodes.find(n => n.id === footerIconEdge.source);
          if (node) embed.footer.icon_url = node.data.value;
        }
      }

      // Find Timestamp
      const timestampEdge = edges.find(e => e.target === embedNode.id && e.targetHandle === 'timestamp');
      if (timestampEdge) {
        const timestampNode = nodes.find(n => n.id === timestampEdge.source);
        if (timestampNode) embed.timestamp = timestampNode.data.value;
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

    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const addNode = (type: string, label?: string) => {
    playButtonSound();
    const id = `${type}-${Date.now()}`;
    const newNode: Node = {
      id,
      type,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {}
    };

    if (type === 'stringNode') {
      newNode.data = { value: '', label: label || 'Text Node', onChange: updateStringNode };
    } else if (type === 'embedNode') {
      newNode.data = { color: 0, onChange: updateEmbedNode };
    } else if (type === 'fieldNode') {
      newNode.data = { name: 'Field', value: 'Value', inline: false, onChange: updateFieldNode };
    }

    setNodes((nds) => [...nds, newNode]);
    takeSnapshot();
    setShowAddMenu(false);
  };

  return (
    <div className={`h-full flex flex-col bg-zinc-50 dark:bg-[#1e1e1e] rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 ${cutMode ? 'cursor-crosshair' : ''}`}>
      <div className="bg-white dark:bg-[#252526] px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
        <div className="relative">
            <button 
              onClick={() => setShowAddMenu(!showAddMenu)} 
              className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600 text-white text-xs font-bold rounded hover:bg-cyan-700 transition-colors"
            >
              <Plus className="w-3 h-3" /> Add Node <ChevronDown className="w-3 h-3 ml-1" />
            </button>
            
            {showAddMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowAddMenu(false)} />
                <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl z-20 py-1 overflow-hidden">
                  <button onClick={() => addNode('stringNode', 'Content Node')} className="w-full text-left px-4 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-400" /> Content Node
                  </button>
                  <button onClick={() => addNode('stringNode', 'Title Node')} className="w-full text-left px-4 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    <Type className="w-3.5 h-3.5 text-zinc-400" /> Title Node
                  </button>
                  <button onClick={() => addNode('stringNode', 'Description Node')} className="w-full text-left px-4 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-zinc-400" /> Description Node
                  </button>
                  <button onClick={() => addNode('embedNode')} className="w-full text-left px-4 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    <LayoutTemplate className="w-3.5 h-3.5 text-purple-500" /> Embed Node
                  </button>
                  <button onClick={() => addNode('stringNode', 'URL Node')} className="w-full text-left px-4 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    <Link className="w-3.5 h-3.5 text-blue-500" /> URL Node
                  </button>
                  <button onClick={() => addNode('fieldNode')} className="w-full text-left px-4 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    <ListPlus className="w-3.5 h-3.5 text-green-500" /> Field Node
                  </button>
                  <button onClick={() => addNode('stringNode', 'File URL Node')} className="w-full text-left px-4 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    <File className="w-3.5 h-3.5 text-yellow-500" /> File URL Node
                  </button>
                </div>
              </>
            )}
        </div>
        <div className="flex gap-2 items-center">
            <button 
                onClick={() => { playButtonSound(); setSnapToGrid(!snapToGrid); }} 
                className={`p-1.5 rounded transition-colors ${snapToGrid ? 'bg-cyan-600/20 text-cyan-500' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                title="Snap to Grid"
            >
                <Magnet className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1" />
            <div className="w-32">
                <CustomDropdown
                    value={edgeType}
                    onChange={(val) => { playButtonSound(); setEdgeType(val as any); }}
                    options={[
                        { value: "smoothstep", label: "Smooth" },
                        { value: "default", label: "Bezier" },
                        { value: "straight", label: "Straight" },
                        { value: "step", label: "Step" }
                    ]}
                />
            </div>
            <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1" />
            <button 
                onClick={() => { playButtonSound(); setCutMode(!cutMode); }} 
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
            <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1" />
            <button 
                onClick={() => { playButtonSound(); setIsHelpOpen(true); }}
                className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded"
                title="Documentation"
            >
                <HelpCircle className="w-4 h-4 text-cyan-500" />
            </button>
        </div>
      </div>
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges.map(edge => ({ ...edge, type: edgeType }))}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeClick={onEdgeClick}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          snapToGrid={snapToGrid}
          snapGrid={[15, 15]}
          defaultEdgeOptions={{ type: edgeType, style: { strokeWidth: 2.5, stroke: '#888' }, animated: true }}
          deleteKeyCode={['Backspace', 'Delete']}
          proOptions={{ hideAttribution: true }}
          className="bg-[#1a1a1a]"
        >
          <Background color="#333" gap={15} size={1} className="opacity-50" />
          <MiniMap 
            nodeColor={(node) => {
              switch (node.type) {
                case 'messageNode': return '#63c76a';
                case 'stringNode': return '#5e81ac';
                case 'embedNode': return '#a881e6';
                case 'fieldNode': return '#ebcb8b';
                default: return '#fff';
              }
            }}
            maskColor="rgba(0,0,0,0.5)"
            className="!bg-[#2d2d2d] !border !border-[#1a1a1a] !rounded-md !overflow-hidden"
            nodeStrokeColor="rgba(255,255,255,0.1)"
            nodeBorderRadius={4}
          />
          <Controls className="!bg-[#2d2d2d] !border-[#1a1a1a] !shadow-2xl !rounded-md overflow-hidden [&>button]:!border-b [&>button]:!border-[#1a1a1a] [&>button]:!bg-[#2d2d2d] [&>button]:!fill-[#cccccc] hover:[&>button]:!bg-[#3d3d3d] hover:[&>button]:!fill-white transition-colors" />
        </ReactFlow>
      </div>
      <DocumentationModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        editorType="node"
      />
    </div>
  );
};

export const NodeEditor = (props: NodeEditorProps) => (
  <ReactFlowProvider>
    <NodeEditorContent {...props} />
  </ReactFlowProvider>
);
