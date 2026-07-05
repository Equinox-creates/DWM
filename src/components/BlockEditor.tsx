import React, { useState, useEffect } from 'react';
import { DiscordWebhookMessage, DiscordEmbed } from '@/types';
import { Plus, Trash2, Undo, Redo, ChevronDown, ChevronRight, MessageSquare, LayoutTemplate, User, Image as ImageIcon, PanelBottom, ListPlus, GripVertical, X, Search, Link, Hash, Clock, FileText, File, Type, HelpCircle } from 'lucide-react';
import { playButtonSound, playDeleteSound } from '@/utils/sounds';
import { intToHex, hexToInt } from '@/utils';
import { CustomColorPicker, CustomDatePicker } from './ui/CustomInputs';
import { DragDropContext, Droppable, Draggable, DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import { DocumentationModal } from './DocumentationModal';

const getIconForType = (type: string) => {
  switch(type) {
    case 'content': return <MessageSquare className="w-3.5 h-3.5 mr-2 opacity-80" />;
    case 'username': return <User className="w-3.5 h-3.5 mr-2 opacity-80" />;
    case 'avatar_url': return <ImageIcon className="w-3.5 h-3.5 mr-2 opacity-80" />;
    case 'embed': return <LayoutTemplate className="w-3.5 h-3.5 mr-2 opacity-80" />;
    case 'embed_title': return <Type className="w-3.5 h-3.5 mr-2 opacity-80" />;
    case 'embed_description': return <FileText className="w-3.5 h-3.5 mr-2 opacity-80" />;
    case 'embed_url': return <Link className="w-3.5 h-3.5 mr-2 opacity-80" />;
    case 'embed_timestamp': return <Clock className="w-3.5 h-3.5 mr-2 opacity-80" />;
    case 'embed_author_name': return <User className="w-3.5 h-3.5 mr-2 opacity-80" />;
    case 'embed_author_url': return <Link className="w-3.5 h-3.5 mr-2 opacity-80" />;
    case 'embed_author_icon': return <ImageIcon className="w-3.5 h-3.5 mr-2 opacity-80" />;
    case 'embed_image_url': return <ImageIcon className="w-3.5 h-3.5 mr-2 opacity-80" />;
    case 'embed_thumbnail_url': return <ImageIcon className="w-3.5 h-3.5 mr-2 opacity-80" />;
    case 'embed_footer_text': return <PanelBottom className="w-3.5 h-3.5 mr-2 opacity-80" />;
    case 'embed_footer_icon': return <ImageIcon className="w-3.5 h-3.5 mr-2 opacity-80" />;
    case 'field': return <ListPlus className="w-3.5 h-3.5 mr-2 opacity-80" />;
    default: return <div className="w-1.5 h-1.5 rounded-full bg-white/50 mr-2" />;
  }
};

const PaletteBlock = ({ color, title, type }: { color: string, title: string, type: string }) => {
  return (
    <div 
      className={`${color} text-white px-3 py-1.5 rounded flex items-center shadow-sm cursor-grab active:cursor-grabbing hover:brightness-110 transition-all text-xs font-bold border border-black/20 select-none`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('blockType', type);
        playButtonSound();
      }}
    >
      {getIconForType(type)}
      {title}
    </div>
  );
};

interface BlockEditorProps {
  message: DiscordWebhookMessage;
  onChange: (message: DiscordWebhookMessage) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

interface BlockInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  type?: string;
  multiline?: boolean;
}

const BlockInput = ({ value, onChange, placeholder, type = "text", multiline = false }: BlockInputProps) => {
  const baseClass = "w-full bg-white text-zinc-900 placeholder-zinc-400 border border-black/10 shadow-inner rounded-full px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-white/50 transition-all";
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${baseClass} rounded-xl resize-y min-h-[40px] leading-relaxed`}
        rows={2}
      />
    );
  }
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={baseClass}
    />
  );
};

const Bump = ({ color }: { color: string }) => (
  <div className={`absolute -bottom-2 left-4 w-10 h-2 ${color} z-20`} style={{ clipPath: 'polygon(0 0, 100% 0, 80% 100%, 20% 100%)' }} />
);

const Cutout = () => (
  <div className={`absolute top-0 left-4 w-10 h-2 bg-[#121212] z-0`} style={{ clipPath: 'polygon(0 0, 100% 0, 80% 100%, 20% 100%)' }} />
);

interface ScratchBlockProps {
  color: string;
  title: string;
  children?: React.ReactNode;
  onRemove?: () => void;
  isCBlock?: boolean;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  hasCutout?: boolean;
  isDraggable?: boolean;
}

const ScratchBlock = ({ color, title, children, onRemove, isCBlock = false, dragHandleProps, hasCutout = true, isDraggable = true }: ScratchBlockProps) => {
  return (
    <div className={`relative ${color} rounded-lg overflow-visible mb-0 z-10 hover:z-20 transition-all border border-black/10 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.2)]`}>
      {hasCutout && <Cutout />}
      <div className="flex justify-between items-center pt-2 pb-2 px-2 pl-3">
        <span className="text-white font-bold text-[13px] drop-shadow-sm flex items-center gap-2">
          {isDraggable && dragHandleProps && (
            <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing text-white/50 hover:text-white transition-colors">
              <GripVertical className="w-4 h-4" />
            </div>
          )}
          {title}
        </span>
        {onRemove && (
          <button onClick={onRemove} className="text-white/70 hover:text-white p-1 hover:bg-black/20 rounded-full transition-colors ml-4">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      {children && (
        <div className={`p-2 pt-0 ${isCBlock ? 'ml-4 border-l-8 border-black/10' : ''}`}>
          <div className="space-y-2">
            {children}
          </div>
        </div>
      )}
      <Bump color={color} />
    </div>
  );
};

const EmbedBlock = ({ embed, index, message, onChange, dragHandleProps, visibleBlocks, setVisibleBlocks }: { embed: DiscordEmbed, index: number, message: DiscordWebhookMessage, onChange: (updates: Partial<DiscordWebhookMessage>) => void, dragHandleProps?: DraggableProvidedDragHandleProps | null, visibleBlocks: Set<string>, setVisibleBlocks: React.Dispatch<React.SetStateAction<Set<string>>> }) => {
  const [expanded, setExpanded] = useState(true);

  const updateEmbed = (updates: Partial<DiscordEmbed>) => {
    const newEmbeds = [...(message.embeds || [])];
    newEmbeds[index] = { ...newEmbeds[index], ...updates };
    onChange({ embeds: newEmbeds });
  };

  const removeEmbed = () => {
    playDeleteSound();
    const newEmbeds = [...(message.embeds || [])];
    newEmbeds.splice(index, 1);
    onChange({ embeds: newEmbeds });
  };

  const isVisible = (key: string) => visibleBlocks.has(`embed-${index}-${key}`);
  const setVisible = (key: string, visible: boolean) => {
    setVisibleBlocks(prev => {
      const next = new Set(prev);
      if (visible) next.add(`embed-${index}-${key}`);
      else next.delete(`embed-${index}-${key}`);
      return next;
    });
  };

  return (
    <div 
      className="relative bg-[#9966FF] rounded-lg overflow-visible mb-0 z-10 hover:z-20 transition-all border border-black/10 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.2)]"
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const blockType = e.dataTransfer.getData('blockType');
        if (blockType === 'field') {
          playButtonSound();
          updateEmbed({ fields: [...(embed.fields || []), { name: 'New Field', value: 'Value', inline: true }] });
        } else if (blockType.startsWith('embed_')) {
          playButtonSound();
          setVisible(blockType.replace('embed_', ''), true);
        }
      }}
    >
      <Cutout />
      <div className="flex justify-between items-center pt-2 pb-2 px-2 pl-3 cursor-pointer hover:bg-black/10 transition-colors rounded-t-lg" onClick={() => setExpanded(!expanded)}>
        <span className="text-white font-bold text-[13px] drop-shadow-sm flex items-center gap-1 min-w-0 flex-1">
          {dragHandleProps && (
            <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing text-white/50 hover:text-white shrink-0 transition-colors" onClick={(e) => e.stopPropagation()}>
              <GripVertical className="w-4 h-4" />
            </div>
          )}
          {expanded ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
          <span className="shrink-0 tracking-wide">Embed {index + 1}</span>
          <span className="ml-2 text-white/60 text-[11px] font-normal truncate italic min-w-0 bg-black/10 px-2 py-0.5 rounded-full">
            {embed.title ? embed.title : 'Untitled'}
          </span>
        </span>
        <button onClick={(e) => { e.stopPropagation(); removeEmbed(); }} className="text-white/70 hover:text-white p-1 hover:bg-black/20 rounded-full transition-colors ml-4">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      
      {expanded && (
        <div className="p-2 pt-0 ml-4 border-l-8 border-black/10 flex flex-col gap-2">
          <div className="flex items-center gap-2 bg-black/10 p-2 rounded-lg">
            <span className="text-white text-[11px] font-bold uppercase tracking-wider ml-1">Theme Color</span>
            <CustomColorPicker 
              color={intToHex(embed.color || 0)} 
              onChange={(color) => updateEmbed({ color: hexToInt(color) || 0 })}
              hideHexInput
            />
          </div>

          {isVisible('title') && (
            <div className="relative group">
              <BlockInput value={embed.title || ''} onChange={(e) => updateEmbed({ title: e.target.value })} placeholder="Title" />
              <button onClick={() => { setVisible('title', false); updateEmbed({ title: undefined }); }} className="absolute -right-2 -top-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all shadow-md scale-75 group-hover:scale-100"><X className="w-3 h-3" /></button>
            </div>
          )}
          {isVisible('url') && (
            <div className="relative group">
              <BlockInput value={embed.url || ''} onChange={(e) => updateEmbed({ url: e.target.value })} placeholder="URL" />
              <button onClick={() => { setVisible('url', false); updateEmbed({ url: undefined }); }} className="absolute -right-2 -top-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all shadow-md scale-75 group-hover:scale-100"><X className="w-3 h-3" /></button>
            </div>
          )}
          {isVisible('description') && (
            <div className="relative group">
              <BlockInput value={embed.description || ''} onChange={(e) => updateEmbed({ description: e.target.value })} placeholder="Description" multiline />
              <button onClick={() => { setVisible('description', false); updateEmbed({ description: undefined }); }} className="absolute -right-2 -top-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all shadow-md scale-75 group-hover:scale-100"><X className="w-3 h-3" /></button>
            </div>
          )}
          
          {(isVisible('author_name') || isVisible('author_url') || isVisible('author_icon')) && (
            <ScratchBlock color="bg-[#FFBF00]" title="Author" isCBlock hasCutout={false} isDraggable={false}>
              {isVisible('author_name') && (
                <div className="relative group">
                  <BlockInput value={embed.author?.name || ''} onChange={(e) => updateEmbed({ author: { ...embed.author, name: e.target.value } })} placeholder="Author Name" />
                  <button onClick={() => { setVisible('author_name', false); updateEmbed({ author: { ...embed.author, name: '' } }); }} className="absolute -right-2 -top-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all shadow-md scale-75 group-hover:scale-100"><X className="w-3 h-3" /></button>
                </div>
              )}
              {isVisible('author_url') && (
                <div className="relative group">
                  <BlockInput value={embed.author?.url || ''} onChange={(e) => updateEmbed({ author: { ...embed.author, name: embed.author?.name || '', url: e.target.value } })} placeholder="Author URL" />
                  <button onClick={() => { setVisible('author_url', false); updateEmbed({ author: { ...embed.author, name: embed.author?.name || '', url: undefined } }); }} className="absolute -right-2 -top-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all shadow-md scale-75 group-hover:scale-100"><X className="w-3 h-3" /></button>
                </div>
              )}
              {isVisible('author_icon') && (
                <div className="relative group">
                  <BlockInput value={embed.author?.icon_url || ''} onChange={(e) => updateEmbed({ author: { ...embed.author, name: embed.author?.name || '', icon_url: e.target.value } })} placeholder="Author Icon URL" />
                  <button onClick={() => { setVisible('author_icon', false); updateEmbed({ author: { ...embed.author, name: embed.author?.name || '', icon_url: undefined } }); }} className="absolute -right-2 -top-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all shadow-md scale-75 group-hover:scale-100"><X className="w-3 h-3" /></button>
                </div>
              )}
            </ScratchBlock>
          )}

          {(isVisible('image_url') || isVisible('thumbnail_url')) && (
            <ScratchBlock color="bg-[#FF6680]" title="Images" isCBlock hasCutout={false} isDraggable={false}>
              {isVisible('image_url') && (
                <div className="relative group">
                  <BlockInput value={embed.image?.url || ''} onChange={(e) => updateEmbed({ image: { url: e.target.value } })} placeholder="Image URL" />
                  <button onClick={() => { setVisible('image_url', false); updateEmbed({ image: undefined }); }} className="absolute -right-2 -top-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all shadow-md scale-75 group-hover:scale-100"><X className="w-3 h-3" /></button>
                </div>
              )}
              {isVisible('thumbnail_url') && (
                <div className="relative group">
                  <BlockInput value={embed.thumbnail?.url || ''} onChange={(e) => updateEmbed({ thumbnail: { url: e.target.value } })} placeholder="Thumbnail URL" />
                  <button onClick={() => { setVisible('thumbnail_url', false); updateEmbed({ thumbnail: undefined }); }} className="absolute -right-2 -top-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all shadow-md scale-75 group-hover:scale-100"><X className="w-3 h-3" /></button>
                </div>
              )}
            </ScratchBlock>
          )}

          {(isVisible('footer_text') || isVisible('footer_icon') || isVisible('timestamp')) && (
            <ScratchBlock color="bg-[#FF8C1A]" title="Footer & Timestamp" isCBlock hasCutout={false} isDraggable={false}>
              {isVisible('footer_text') && (
                <div className="relative group">
                  <BlockInput value={embed.footer?.text || ''} onChange={(e) => updateEmbed({ footer: { ...embed.footer, text: e.target.value } })} placeholder="Footer Text" />
                  <button onClick={() => { setVisible('footer_text', false); updateEmbed({ footer: { ...embed.footer, text: '' } }); }} className="absolute -right-2 -top-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all shadow-md scale-75 group-hover:scale-100"><X className="w-3 h-3" /></button>
                </div>
              )}
              {isVisible('footer_icon') && (
                <div className="relative group">
                  <BlockInput value={embed.footer?.icon_url || ''} onChange={(e) => updateEmbed({ footer: { ...embed.footer, text: embed.footer?.text || '', icon_url: e.target.value } })} placeholder="Footer Icon URL" />
                  <button onClick={() => { setVisible('footer_icon', false); updateEmbed({ footer: { ...embed.footer, text: embed.footer?.text || '', icon_url: undefined } }); }} className="absolute -right-2 -top-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all shadow-md scale-75 group-hover:scale-100"><X className="w-3 h-3" /></button>
                </div>
              )}
              {isVisible('timestamp') && (
                <div className="bg-black/20 p-2 rounded-lg relative group mt-2 flex items-center justify-between">
                  <span className="text-white text-[11px] font-bold uppercase tracking-wider ml-1">Timestamp</span>
                  <CustomDatePicker 
                    value={embed.timestamp || ''} 
                    onChange={(val) => updateEmbed({ timestamp: val || undefined })} 
                  />
                  <button onClick={() => { setVisible('timestamp', false); updateEmbed({ timestamp: undefined }); }} className="absolute -right-2 -top-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all shadow-md scale-75 group-hover:scale-100"><X className="w-3 h-3" /></button>
                </div>
              )}
            </ScratchBlock>
          )}

          <div className="mt-2 space-y-2">
            <DragDropContext onDragEnd={(result) => {
              if (!result.destination) return;
              const newFields = Array.from(embed.fields || []);
              const [reorderedItem] = newFields.splice(result.source.index, 1);
              newFields.splice(result.destination.index, 0, reorderedItem);
              updateEmbed({ fields: newFields });
            }}>
              <Droppable droppableId={`fields-${index}`}>
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {embed.fields?.map((field, fIndex) => (
                      <Draggable key={`field-${fIndex}`} draggableId={`field-${fIndex}`} index={fIndex}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.draggableProps}>
                            <ScratchBlock 
                              color="bg-[#4CBF56]" 
                              title={`Field ${fIndex + 1}`} 
                              onRemove={() => {
                                playDeleteSound();
                                const newFields = [...(embed.fields || [])];
                                newFields.splice(fIndex, 1);
                                updateEmbed({ fields: newFields });
                              }}
                              isCBlock
                              dragHandleProps={provided.dragHandleProps}
                              hasCutout={false}
                            >
                              <BlockInput value={field.name} onChange={(e) => {
                                const newFields = [...(embed.fields || [])];
                                newFields[fIndex] = { ...field, name: e.target.value };
                                updateEmbed({ fields: newFields });
                              }} placeholder="Field Name" />
                              <BlockInput value={field.value} onChange={(e) => {
                                const newFields = [...(embed.fields || [])];
                                newFields[fIndex] = { ...field, value: e.target.value };
                                updateEmbed({ fields: newFields });
                              }} placeholder="Field Value" multiline />
                              <label className="flex items-center gap-2 text-white text-xs font-bold ml-2 cursor-pointer bg-black/10 px-3 py-1.5 rounded-full w-fit">
                                <input 
                                  type="checkbox" 
                                  checked={field.inline}
                                  onChange={(e) => {
                                    const newFields = [...(embed.fields || [])];
                                    newFields[fIndex] = { ...field, inline: e.target.checked };
                                    updateEmbed({ fields: newFields });
                                  }}
                                  className="accent-[#4CBF56] w-4 h-4 rounded"
                                />
                                Inline Field
                              </label>
                            </ScratchBlock>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            <button
                onClick={() => { playButtonSound(); updateEmbed({ fields: [...(embed.fields || []), { name: 'New Field', value: 'Value', inline: true }] }); }}
                className="w-full py-2 mt-2 bg-[#4CBF56] hover:bg-[#3da846] text-white text-xs font-bold rounded-lg shadow-sm border border-white/20 transition-all flex items-center justify-center gap-1 mx-auto"
                title="Add Field"
            >
                <Plus className="w-4 h-4 stroke-[2px]" /> 
                <span className="text-xs tracking-wide">Add Field</span>
            </button>
          </div>
        </div>
      )}
      <Bump color="bg-[#9966FF]" />
    </div>
  );
};

const CATEGORIES = [
  { id: 'message', name: 'Message', color: 'bg-[#4C97FF]', dot: 'bg-[#4C97FF]', icon: MessageSquare },
  { id: 'embeds', name: 'Embeds', color: 'bg-[#9966FF]', dot: 'bg-[#9966FF]', icon: LayoutTemplate },
  { id: 'author', name: 'Author', color: 'bg-[#FFBF00]', dot: 'bg-[#FFBF00]', icon: User },
  { id: 'images', name: 'Images', color: 'bg-[#FF6680]', dot: 'bg-[#FF6680]', icon: ImageIcon },
  { id: 'footer', name: 'Footer', color: 'bg-[#FF8C1A]', dot: 'bg-[#FF8C1A]', icon: PanelBottom },
  { id: 'fields', name: 'Fields', color: 'bg-[#4CBF56]', dot: 'bg-[#4CBF56]', icon: ListPlus },
];

export const BlockEditor: React.FC<BlockEditorProps> = ({ message, onChange, onUndo, onRedo, canUndo, canRedo }) => {
  const [activeCategory, setActiveCategory] = useState('message');
  const [visibleBlocks, setVisibleBlocks] = useState<Set<string>>(new Set(['content']));
  const [searchQuery, setSearchQuery] = useState('');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  
  // Initialize visible blocks based on message content
  useEffect(() => {
    const newVisible = new Set(visibleBlocks);
    if (message.content) newVisible.add('content');
    if (message.username) newVisible.add('username');
    if (message.avatar_url) newVisible.add('avatar_url');
    
    message.embeds?.forEach((embed, index) => {
      if (embed.title) newVisible.add(`embed-${index}-title`);
      if (embed.description) newVisible.add(`embed-${index}-description`);
      if (embed.url) newVisible.add(`embed-${index}-url`);
      if (embed.author?.name) newVisible.add(`embed-${index}-author_name`);
      if (embed.author?.url) newVisible.add(`embed-${index}-author_url`);
      if (embed.author?.icon_url) newVisible.add(`embed-${index}-author_icon`);
      if (embed.image?.url) newVisible.add(`embed-${index}-image_url`);
      if (embed.thumbnail?.url) newVisible.add(`embed-${index}-thumbnail_url`);
      if (embed.footer?.text) newVisible.add(`embed-${index}-footer_text`);
      if (embed.footer?.icon_url) newVisible.add(`embed-${index}-footer_icon`);
      if (embed.timestamp) newVisible.add(`embed-${index}-timestamp`);
    });
    
    setVisibleBlocks(newVisible);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateMessage = (updates: Partial<DiscordWebhookMessage>) => {
    onChange({ ...message, ...updates });
  };

  const addEmbed = () => {
    playButtonSound();
    updateMessage({ embeds: [...(message.embeds || []), { title: 'New Embed', description: '', color: 0 }] });
  };

  return (
    <div className="h-full bg-[#1e1e1e] rounded-xl overflow-hidden border border-zinc-800 flex flex-col shadow-2xl">
      <div className="bg-[#252526] px-4 py-2.5 border-b border-zinc-800 flex justify-between items-center shadow-sm z-10 relative">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center shadow-inner">
            <LayoutTemplate className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-zinc-200 text-sm font-bold uppercase tracking-widest">Block Workspace</span>
        </div>
        <div className="flex items-center gap-2 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800">
           <button onClick={() => { playButtonSound(); setIsHelpOpen(true); }} className="text-zinc-400 hover:text-white p-1.5 rounded hover:bg-zinc-700 transition-colors" title="Documentation">
             <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
           </button>
           <div className="w-px h-4 bg-zinc-700 mx-1" />
           {onUndo && (
             <button onClick={() => { playButtonSound(); onUndo(); }} disabled={!canUndo} className="text-zinc-400 hover:text-white p-1.5 rounded hover:bg-zinc-700 transition-colors disabled:opacity-30">
               <Undo className="w-3.5 h-3.5" />
             </button>
           )}
           {onRedo && (
             <button onClick={() => { playButtonSound(); onRedo(); }} disabled={!canRedo} className="text-zinc-400 hover:text-white p-1.5 rounded hover:bg-zinc-700 transition-colors disabled:opacity-30">
               <Redo className="w-3.5 h-3.5" />
             </button>
           )}
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Categories Sidebar */}
        <div className="w-20 bg-[#252526] border-r border-zinc-800 flex flex-col items-center py-4 gap-2 overflow-y-auto custom-scrollbar shadow-xl z-20">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => { playButtonSound(); setActiveCategory(cat.id); }}
              className={`w-16 flex flex-col items-center justify-center py-3 rounded-xl transition-all ${activeCategory === cat.id ? 'bg-[#333] shadow-inner border border-zinc-700' : 'hover:bg-[#2a2a2b] border border-transparent'}`}
            >
              <div className={`w-6 h-6 rounded-full ${cat.dot} flex items-center justify-center mb-1.5 shadow-sm`}>
                <cat.icon className="w-3 h-3 text-white/90" />
              </div>
              <span className="text-[10px] text-zinc-300 font-bold tracking-wide">{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Palette Sidebar */}
        <div className="w-56 bg-[#1e1e1e] border-r border-zinc-800 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-3 shadow-lg z-10">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search blocks..."
              className="w-full bg-[#252526] text-xs text-white placeholder-zinc-500 border border-zinc-800 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          
          <div className="text-[11px] text-zinc-400 mb-2 bg-[#252526] p-3 rounded-lg border border-zinc-800 flex items-start gap-2 shadow-inner">
            <LayoutTemplate className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>Drag blocks to the right panel to snap them into your webhook.</span>
          </div>
          
          {(!searchQuery || 'message'.includes(searchQuery.toLowerCase()) || 'content username avatar url'.includes(searchQuery.toLowerCase())) && (activeCategory === 'message' || searchQuery) && (
            <>
              <div className="text-[10px] font-bold text-zinc-500 mt-2 mb-1 uppercase tracking-widest pl-1">Message Properties</div>
              {(!searchQuery || 'set content'.includes(searchQuery.toLowerCase())) && <PaletteBlock color="bg-[#4C97FF]" title="Set Content" type="content" />}
              {(!searchQuery || 'set username bot'.includes(searchQuery.toLowerCase())) && <PaletteBlock color="bg-[#4C97FF]" title="Set Username" type="username" />}
              {(!searchQuery || 'set avatar url'.includes(searchQuery.toLowerCase())) && <PaletteBlock color="bg-[#4C97FF]" title="Set Avatar URL" type="avatar_url" />}
            </>
          )}
          {(!searchQuery || 'embed structure title description url timestamp'.includes(searchQuery.toLowerCase())) && (activeCategory === 'embeds' || searchQuery) && (
            <>
              <div className="text-[10px] font-bold text-zinc-500 mt-2 mb-1 uppercase tracking-widest pl-1">Embed Structure</div>
              {(!searchQuery || 'add embed block'.includes(searchQuery.toLowerCase())) && <PaletteBlock color="bg-[#9966FF]" title="Add Embed Block" type="embed" />}
              {(!searchQuery || 'set title'.includes(searchQuery.toLowerCase())) && <PaletteBlock color="bg-[#9966FF]" title="Set Title" type="embed_title" />}
              {(!searchQuery || 'set description'.includes(searchQuery.toLowerCase())) && <PaletteBlock color="bg-[#9966FF]" title="Set Description" type="embed_description" />}
              {(!searchQuery || 'set url'.includes(searchQuery.toLowerCase())) && <PaletteBlock color="bg-[#9966FF]" title="Set URL" type="embed_url" />}
              {(!searchQuery || 'set timestamp date time'.includes(searchQuery.toLowerCase())) && <PaletteBlock color="bg-[#9966FF]" title="Set Timestamp" type="embed_timestamp" />}
            </>
          )}
          {(!searchQuery || 'author details name url icon'.includes(searchQuery.toLowerCase())) && (activeCategory === 'author' || searchQuery) && (
            <>
              <div className="text-[10px] font-bold text-zinc-500 mt-2 mb-1 uppercase tracking-widest pl-1">Author Details</div>
              {(!searchQuery || 'set author name'.includes(searchQuery.toLowerCase())) && <PaletteBlock color="bg-[#FFBF00]" title="Set Author Name" type="embed_author_name" />}
              {(!searchQuery || 'set author url'.includes(searchQuery.toLowerCase())) && <PaletteBlock color="bg-[#FFBF00]" title="Set Author URL" type="embed_author_url" />}
              {(!searchQuery || 'set author icon'.includes(searchQuery.toLowerCase())) && <PaletteBlock color="bg-[#FFBF00]" title="Set Author Icon" type="embed_author_icon" />}
            </>
          )}
          {(!searchQuery || 'media elements images picture thumbnail'.includes(searchQuery.toLowerCase())) && (activeCategory === 'images' || searchQuery) && (
            <>
              <div className="text-[10px] font-bold text-zinc-500 mt-2 mb-1 uppercase tracking-widest pl-1">Media Elements</div>
              {(!searchQuery || 'set image url'.includes(searchQuery.toLowerCase())) && <PaletteBlock color="bg-[#FF6680]" title="Set Image URL" type="embed_image_url" />}
              {(!searchQuery || 'set thumbnail url'.includes(searchQuery.toLowerCase())) && <PaletteBlock color="bg-[#FF6680]" title="Set Thumbnail URL" type="embed_thumbnail_url" />}
            </>
          )}
          {(!searchQuery || 'footer area text icon'.includes(searchQuery.toLowerCase())) && (activeCategory === 'footer' || searchQuery) && (
            <>
              <div className="text-[10px] font-bold text-zinc-500 mt-2 mb-1 uppercase tracking-widest pl-1">Footer Area</div>
              {(!searchQuery || 'set footer text'.includes(searchQuery.toLowerCase())) && <PaletteBlock color="bg-[#FF8C1A]" title="Set Footer Text" type="embed_footer_text" />}
              {(!searchQuery || 'set footer icon'.includes(searchQuery.toLowerCase())) && <PaletteBlock color="bg-[#FF8C1A]" title="Set Footer Icon" type="embed_footer_icon" />}
            </>
          )}
          {(!searchQuery || 'grid fields add'.includes(searchQuery.toLowerCase())) && (activeCategory === 'fields' || searchQuery) && (
            <>
              <div className="text-[10px] font-bold text-zinc-500 mt-2 mb-1 uppercase tracking-widest pl-1">Grid Fields</div>
              {(!searchQuery || 'add field block'.includes(searchQuery.toLowerCase())) && <PaletteBlock color="bg-[#4CBF56]" title="Add Field Block" type="field" />}
            </>
          )}
        </div>

        {/* Workspace */}
        <div 
          className="flex-1 overflow-auto p-8 custom-scrollbar bg-[#121212] relative"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const blockType = e.dataTransfer.getData('blockType');
            if (!blockType) return;
            
            playButtonSound();
            if (blockType === 'embed') {
              addEmbed();
            } else if (['content', 'username', 'avatar_url'].includes(blockType)) {
              setVisibleBlocks(prev => new Set(prev).add(blockType));
            } else if (blockType.startsWith('embed_') || blockType === 'field') {
              // If dropped in workspace but not in an embed, add to the last embed
              if (message.embeds && message.embeds.length > 0) {
                const lastIndex = message.embeds.length - 1;
                if (blockType === 'field') {
                  const newEmbeds = [...message.embeds];
                  newEmbeds[lastIndex] = { 
                    ...newEmbeds[lastIndex], 
                    fields: [...(newEmbeds[lastIndex].fields || []), { name: 'New Field', value: 'Value', inline: true }] 
                  };
                  updateMessage({ embeds: newEmbeds });
                } else {
                  setVisibleBlocks(prev => new Set(prev).add(`embed-${lastIndex}-${blockType.replace('embed_', '')}`));
                }
              } else {
                // Create a new embed and add it there
                const newEmbed: DiscordEmbed = { color: 0 };
                if (blockType === 'field') {
                  newEmbed.fields = [{ name: 'New Field', value: 'Value', inline: true }];
                }
                updateMessage({ embeds: [newEmbed] });
                if (blockType !== 'field') {
                  setVisibleBlocks(prev => new Set(prev).add(`embed-0-${blockType.replace('embed_', '')}`));
                }
              }
            }
          }}
        >
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1.5px, transparent 0)', backgroundSize: '24px 24px' }} />
          
          <div className="max-w-4xl mx-auto relative z-10 pb-40 pl-8">
              <div className="bg-[#FFBF00] text-black border-2 border-[#cc9900] rounded-full px-6 py-2.5 shadow-lg inline-flex items-center gap-3 mb-1 relative z-10 hover:scale-105 transition-transform cursor-default">
                <div className="w-3 h-3 rounded-full bg-white shadow-inner" />
                <span className="font-extrabold text-[13px] uppercase tracking-wide">
                  When Webhook Executes
                </span>
                <Bump color="bg-[#FFBF00]" />
              </div>

              <div className="flex flex-col">
                {visibleBlocks.has('content') && (
                  <ScratchBlock color="bg-[#4C97FF]" title="Set Message Content" onRemove={() => { setVisibleBlocks(prev => { const next = new Set(prev); next.delete('content'); return next; }); updateMessage({ content: undefined }); }}>
                    <BlockInput 
                      value={message.content || ''} 
                      onChange={(e) => updateMessage({ content: e.target.value })} 
                      placeholder="Type message..." 
                      multiline 
                    />
                  </ScratchBlock>
                )}

                {visibleBlocks.has('username') && (
                  <ScratchBlock color="bg-[#4C97FF]" title="Override Bot Username" onRemove={() => { setVisibleBlocks(prev => { const next = new Set(prev); next.delete('username'); return next; }); updateMessage({ username: undefined }); }}>
                    <BlockInput 
                      value={message.username || ''} 
                      onChange={(e) => updateMessage({ username: e.target.value })} 
                      placeholder="Spidey Bot" 
                    />
                  </ScratchBlock>
                )}

                {visibleBlocks.has('avatar_url') && (
                  <ScratchBlock color="bg-[#4C97FF]" title="Override Avatar URL" onRemove={() => { setVisibleBlocks(prev => { const next = new Set(prev); next.delete('avatar_url'); return next; }); updateMessage({ avatar_url: undefined }); }}>
                    <BlockInput 
                      value={message.avatar_url || ''} 
                      onChange={(e) => updateMessage({ avatar_url: e.target.value })} 
                      placeholder="https://..." 
                    />
                  </ScratchBlock>
                )}

                <DragDropContext onDragEnd={(result) => {
                  if (!result.destination) return;
                  const newEmbeds = Array.from(message.embeds || []);
                  const [reorderedItem] = newEmbeds.splice(result.source.index, 1);
                  newEmbeds.splice(result.destination.index, 0, reorderedItem);
                  updateMessage({ embeds: newEmbeds });
                }}>
                  <Droppable droppableId="embeds">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef}>
                        {message.embeds?.map((embed, index) => (
                          <Draggable key={`embed-${index}`} draggableId={`embed-${index}`} index={index}>
                            {(provided) => (
                              <div ref={provided.innerRef} {...provided.draggableProps}>
                                <EmbedBlock 
                                  embed={embed} 
                                  index={index} 
                                  message={message} 
                                  onChange={updateMessage} 
                                  dragHandleProps={provided.dragHandleProps} 
                                  visibleBlocks={visibleBlocks}
                                  setVisibleBlocks={setVisibleBlocks}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>

                <div className="pt-4 flex justify-center mt-4 border-t border-dashed border-zinc-800 relative">
                  <Cutout />
                  <button
                      onClick={addEmbed}
                      className="w-full py-3.5 bg-[#252526] hover:bg-[#333] border-2 border-[#9966FF] text-[#9966FF] font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group"
                  >
                      <Plus className="w-5 h-5 stroke-[2.5px] group-hover:scale-110 transition-transform" /> 
                      <span className="text-[13px] tracking-wide uppercase">Add Embed Block</span>
                  </button>
                </div>
              </div>
          </div>
        </div>
      </div>

      <DocumentationModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        editorType="block"
      />
    </div>
  );
};
