import React, { useState, useEffect } from 'react';
import { DiscordWebhookMessage, DiscordEmbed } from '@/types';
import { Plus, Trash2, Undo, Redo, ChevronDown, ChevronRight, MessageSquare, LayoutTemplate, User, Image as ImageIcon, PanelBottom, ListPlus, GripVertical, X } from 'lucide-react';
import { playButtonSound, playDeleteSound } from '@/utils/sounds';
import { intToHex, hexToInt } from '@/utils';
import { CustomColorPicker, CustomDatePicker } from './ui/CustomInputs';
import { DragDropContext, Droppable, Draggable, DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';

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
  const baseClass = "w-full bg-black/20 text-white placeholder-white/50 border border-black/20 rounded-full px-3 py-1.5 text-xs focus:outline-none focus:bg-black/30 transition-colors";
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${baseClass} rounded-xl resize-y min-h-[60px]`}
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

interface ScratchBlockProps {
  color: string;
  title: string;
  children?: React.ReactNode;
  onRemove?: () => void;
  isCBlock?: boolean;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
}

const ScratchBlock = ({ color, title, children, onRemove, isCBlock = false, dragHandleProps }: ScratchBlockProps) => {
  return (
    <div className={`relative ${color} rounded-md shadow-sm border-l-8 border-black/20 overflow-visible mb-0 z-10 hover:z-20 transition-all`}>
      <div className="flex justify-between items-center pt-3 pb-2 px-2 pl-3">
        <span className="text-white font-bold text-sm drop-shadow-sm flex items-center gap-2">
          {dragHandleProps && (
            <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100">
              <GripVertical className="w-4 h-4" />
            </div>
          )}
          {title}
        </span>
        {onRemove && (
          <button onClick={onRemove} className="text-white/70 hover:text-white p-1 hover:bg-black/20 rounded">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      {children && (
        <div className={`p-2 pt-0 ${isCBlock ? 'ml-4 border-l-4 border-black/20' : ''}`}>
          <div className="space-y-1.5">
            {children}
          </div>
        </div>
      )}
      {/* Bottom Bump */}
      <div className={`absolute -bottom-2 left-4 w-12 h-2 ${color} rounded-b-sm border-b border-x border-black/20 z-20`} />
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
      className="relative bg-[#9966FF] rounded-md shadow-sm border-l-8 border-black/20 overflow-visible mb-0 z-10 hover:z-20 transition-all"
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
      <div className="flex justify-between items-center pt-3 pb-2 px-2 pl-3 cursor-pointer hover:bg-black/10" onClick={() => setExpanded(!expanded)}>
        <span className="text-white font-bold text-sm drop-shadow-sm flex items-center gap-1">
          {dragHandleProps && (
            <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100" onClick={(e) => e.stopPropagation()}>
              <GripVertical className="w-4 h-4" />
            </div>
          )}
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          Embed #{index + 1}
        </span>
        <button onClick={(e) => { e.stopPropagation(); removeEmbed(); }} className="text-white/70 hover:text-white p-1 hover:bg-black/20 rounded">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      
      {expanded && (
        <div className="p-2 pt-0 ml-4 border-l-4 border-black/20 flex flex-col">
          <div className="flex items-center gap-2 bg-black/10 p-1.5 rounded-full mb-1.5">
            <span className="text-white text-xs font-bold ml-2">Color:</span>
            <CustomColorPicker 
              color={intToHex(embed.color || 0)} 
              onChange={(color) => updateEmbed({ color: hexToInt(color) || 0 })}
              hideHexInput
            />
          </div>

          {isVisible('title') && (
            <div className="mb-1.5 relative group">
              <BlockInput value={embed.title || ''} onChange={(e) => updateEmbed({ title: e.target.value })} placeholder="Title" />
              <button onClick={() => { setVisible('title', false); updateEmbed({ title: undefined }); }} className="absolute -right-2 -top-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"><X className="w-3 h-3" /></button>
            </div>
          )}
          {isVisible('url') && (
            <div className="mb-1.5 relative group">
              <BlockInput value={embed.url || ''} onChange={(e) => updateEmbed({ url: e.target.value })} placeholder="URL" />
              <button onClick={() => { setVisible('url', false); updateEmbed({ url: undefined }); }} className="absolute -right-2 -top-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"><X className="w-3 h-3" /></button>
            </div>
          )}
          {isVisible('description') && (
            <div className="mb-1.5 relative group">
              <BlockInput value={embed.description || ''} onChange={(e) => updateEmbed({ description: e.target.value })} placeholder="Description" multiline />
              <button onClick={() => { setVisible('description', false); updateEmbed({ description: undefined }); }} className="absolute -right-2 -top-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"><X className="w-3 h-3" /></button>
            </div>
          )}
          
          {(isVisible('author_name') || isVisible('author_url') || isVisible('author_icon')) && (
            <ScratchBlock color="bg-[#FFBF00]" title="Author" isCBlock>
              {isVisible('author_name') && (
                <div className="relative group">
                  <BlockInput value={embed.author?.name || ''} onChange={(e) => updateEmbed({ author: { ...embed.author, name: e.target.value } })} placeholder="Author Name" />
                  <button onClick={() => { setVisible('author_name', false); updateEmbed({ author: { ...embed.author, name: '' } }); }} className="absolute -right-2 -top-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"><X className="w-3 h-3" /></button>
                </div>
              )}
              {isVisible('author_url') && (
                <div className="relative group">
                  <BlockInput value={embed.author?.url || ''} onChange={(e) => updateEmbed({ author: { ...embed.author, name: embed.author?.name || '', url: e.target.value } })} placeholder="Author URL" />
                  <button onClick={() => { setVisible('author_url', false); updateEmbed({ author: { ...embed.author, name: embed.author?.name || '', url: undefined } }); }} className="absolute -right-2 -top-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"><X className="w-3 h-3" /></button>
                </div>
              )}
              {isVisible('author_icon') && (
                <div className="relative group">
                  <BlockInput value={embed.author?.icon_url || ''} onChange={(e) => updateEmbed({ author: { ...embed.author, name: embed.author?.name || '', icon_url: e.target.value } })} placeholder="Author Icon URL" />
                  <button onClick={() => { setVisible('author_icon', false); updateEmbed({ author: { ...embed.author, name: embed.author?.name || '', icon_url: undefined } }); }} className="absolute -right-2 -top-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"><X className="w-3 h-3" /></button>
                </div>
              )}
            </ScratchBlock>
          )}

          {(isVisible('image_url') || isVisible('thumbnail_url')) && (
            <ScratchBlock color="bg-[#FF6680]" title="Images" isCBlock>
              {isVisible('image_url') && (
                <div className="relative group">
                  <BlockInput value={embed.image?.url || ''} onChange={(e) => updateEmbed({ image: { url: e.target.value } })} placeholder="Image URL" />
                  <button onClick={() => { setVisible('image_url', false); updateEmbed({ image: undefined }); }} className="absolute -right-2 -top-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"><X className="w-3 h-3" /></button>
                </div>
              )}
              {isVisible('thumbnail_url') && (
                <div className="relative group">
                  <BlockInput value={embed.thumbnail?.url || ''} onChange={(e) => updateEmbed({ thumbnail: { url: e.target.value } })} placeholder="Thumbnail URL" />
                  <button onClick={() => { setVisible('thumbnail_url', false); updateEmbed({ thumbnail: undefined }); }} className="absolute -right-2 -top-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"><X className="w-3 h-3" /></button>
                </div>
              )}
            </ScratchBlock>
          )}

          {(isVisible('footer_text') || isVisible('footer_icon') || isVisible('timestamp')) && (
            <ScratchBlock color="bg-[#FF8C1A]" title="Footer & Timestamp" isCBlock>
              {isVisible('footer_text') && (
                <div className="relative group">
                  <BlockInput value={embed.footer?.text || ''} onChange={(e) => updateEmbed({ footer: { ...embed.footer, text: e.target.value } })} placeholder="Footer Text" />
                  <button onClick={() => { setVisible('footer_text', false); updateEmbed({ footer: { ...embed.footer, text: '' } }); }} className="absolute -right-2 -top-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"><X className="w-3 h-3" /></button>
                </div>
              )}
              {isVisible('footer_icon') && (
                <div className="relative group">
                  <BlockInput value={embed.footer?.icon_url || ''} onChange={(e) => updateEmbed({ footer: { ...embed.footer, text: embed.footer?.text || '', icon_url: e.target.value } })} placeholder="Footer Icon URL" />
                  <button onClick={() => { setVisible('footer_icon', false); updateEmbed({ footer: { ...embed.footer, text: embed.footer?.text || '', icon_url: undefined } }); }} className="absolute -right-2 -top-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"><X className="w-3 h-3" /></button>
                </div>
              )}
              {isVisible('timestamp') && (
                <div className="bg-black/20 p-1.5 rounded-md relative group mt-2">
                  <span className="text-white text-xs font-bold ml-1 mb-1 block">Timestamp:</span>
                  <CustomDatePicker 
                    value={embed.timestamp || ''} 
                    onChange={(val) => updateEmbed({ timestamp: val || undefined })} 
                  />
                  <button onClick={() => { setVisible('timestamp', false); updateEmbed({ timestamp: undefined }); }} className="absolute -right-2 -top-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"><X className="w-3 h-3" /></button>
                </div>
              )}
            </ScratchBlock>
          )}

          <div className="mt-2">
            <DragDropContext onDragEnd={(result) => {
              if (!result.destination) return;
              const newFields = Array.from(embed.fields || []);
              const [reorderedItem] = newFields.splice(result.source.index, 1);
              newFields.splice(result.destination.index, 0, reorderedItem);
              updateEmbed({ fields: newFields });
            }}>
              <Droppable droppableId={`fields-${index}`}>
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
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
                              <label className="flex items-center gap-2 text-white text-xs font-bold ml-2">
                                <input 
                                  type="checkbox" 
                                  checked={field.inline}
                                  onChange={(e) => {
                                    const newFields = [...(embed.fields || [])];
                                    newFields[fIndex] = { ...field, inline: e.target.checked };
                                    updateEmbed({ fields: newFields });
                                  }}
                                  className="accent-white w-4 h-4"
                                />
                                Inline
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
                className="w-full py-1.5 mt-1 bg-[#4CBF56] hover:bg-[#3da846] text-white text-xs font-bold rounded-full shadow-sm border-b-4 border-black/20 transition-colors flex items-center justify-center gap-1"
            >
                <Plus className="w-3 h-3" /> Add Field
            </button>
          </div>
        </div>
      )}
      {/* Bottom Bump */}
      <div className="absolute -bottom-2 left-4 w-12 h-2 bg-[#9966FF] rounded-b-sm border-b border-x border-black/20 z-20" />
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

const PaletteBlock = ({ color, title, type }: { color: string, title: string, type: string }) => {
  return (
    <div 
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('blockType', type);
        e.dataTransfer.effectAllowed = 'copy';
      }}
      className={`${color} text-white text-xs font-bold px-3 py-2 rounded-full shadow-sm border-b-4 border-black/20 cursor-grab active:cursor-grabbing hover:brightness-110 transition-all`}
    >
      {title}
    </div>
  );
};

export const BlockEditor: React.FC<BlockEditorProps> = ({ message, onChange, onUndo, onRedo, canUndo, canRedo }) => {
  const [activeCategory, setActiveCategory] = useState('message');
  const [visibleBlocks, setVisibleBlocks] = useState<Set<string>>(new Set(['content']));
  
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
    <div className="h-full bg-[#1e1e1e] rounded-xl overflow-hidden border border-zinc-800 flex flex-col">
      <div className="bg-[#252526] px-4 py-2 border-b border-zinc-800 flex justify-between items-center">
        <span className="text-zinc-400 text-sm font-bold uppercase tracking-widest">Scratch Blocks</span>
        <div className="flex items-center gap-2">
           {onUndo && (
             <button onClick={() => { playButtonSound(); onUndo(); }} disabled={!canUndo} className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-700 transition-colors disabled:opacity-30">
               <Undo className="w-4 h-4" />
             </button>
           )}
           {onRedo && (
             <button onClick={() => { playButtonSound(); onRedo(); }} disabled={!canRedo} className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-700 transition-colors disabled:opacity-30">
               <Redo className="w-4 h-4" />
             </button>
           )}
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Categories Sidebar */}
        <div className="w-16 bg-[#252526] border-r border-zinc-800 flex flex-col items-center py-2 gap-1 overflow-y-auto custom-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => { playButtonSound(); setActiveCategory(cat.id); }}
              className={`w-14 h-14 flex flex-col items-center justify-center rounded-lg transition-colors ${activeCategory === cat.id ? 'bg-[#333]' : 'hover:bg-[#2a2a2b]'}`}
            >
              <div className={`w-4 h-4 rounded-full ${cat.dot} mb-1`} />
              <span className="text-[9px] text-zinc-300 font-medium">{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Palette Sidebar */}
        <div className="w-48 bg-[#1e1e1e] border-r border-zinc-800 p-3 overflow-y-auto custom-scrollbar flex flex-col gap-2">
          <div className="text-[10px] text-zinc-500 mb-2 italic bg-black/20 p-2 rounded border border-white/5">Drag blocks to the right panel to add them</div>
          
          {activeCategory === 'message' && (
            <>
              <div className="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Message Blocks</div>
              <PaletteBlock color="bg-[#4C97FF]" title="Set Content" type="content" />
              <PaletteBlock color="bg-[#4C97FF]" title="Set Username" type="username" />
              <PaletteBlock color="bg-[#4C97FF]" title="Set Avatar URL" type="avatar_url" />
            </>
          )}
          {activeCategory === 'embeds' && (
            <>
              <div className="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Embed Blocks</div>
              <PaletteBlock color="bg-[#9966FF]" title="Add Embed" type="embed" />
              <PaletteBlock color="bg-[#9966FF]" title="Set Title" type="embed_title" />
              <PaletteBlock color="bg-[#9966FF]" title="Set Description" type="embed_description" />
              <PaletteBlock color="bg-[#9966FF]" title="Set URL" type="embed_url" />
              <PaletteBlock color="bg-[#9966FF]" title="Set Timestamp" type="embed_timestamp" />
            </>
          )}
          {activeCategory === 'author' && (
            <>
              <div className="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Author Blocks</div>
              <PaletteBlock color="bg-[#FFBF00]" title="Set Author Name" type="embed_author_name" />
              <PaletteBlock color="bg-[#FFBF00]" title="Set Author URL" type="embed_author_url" />
              <PaletteBlock color="bg-[#FFBF00]" title="Set Author Icon" type="embed_author_icon" />
            </>
          )}
          {activeCategory === 'images' && (
            <>
              <div className="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Image Blocks</div>
              <PaletteBlock color="bg-[#FF6680]" title="Set Image URL" type="embed_image_url" />
              <PaletteBlock color="bg-[#FF6680]" title="Set Thumbnail URL" type="embed_thumbnail_url" />
            </>
          )}
          {activeCategory === 'footer' && (
            <>
              <div className="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Footer Blocks</div>
              <PaletteBlock color="bg-[#FF8C1A]" title="Set Footer Text" type="embed_footer_text" />
              <PaletteBlock color="bg-[#FF8C1A]" title="Set Footer Icon" type="embed_footer_icon" />
            </>
          )}
          {activeCategory === 'fields' && (
            <>
              <div className="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Field Blocks</div>
              <PaletteBlock color="bg-[#4CBF56]" title="Add Field" type="field" />
            </>
          )}
        </div>

        {/* Workspace */}
        <div 
          className="flex-1 overflow-auto p-6 custom-scrollbar bg-[#121212] relative"
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
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          
          <div className="max-w-3xl mx-auto relative z-10 pb-32">
              <div className="bg-[#FFBF00] rounded-t-xl px-4 py-2 border-b-4 border-black/20 inline-block mb-[-4px] relative z-10">
                <span className="text-white font-bold drop-shadow-sm flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-white/50" /> When webhook executes
                </span>
              </div>

              <div className="flex flex-col">
                {visibleBlocks.has('content') && (
                  <ScratchBlock color="bg-[#4C97FF]" title="Message Content" onRemove={() => { setVisibleBlocks(prev => { const next = new Set(prev); next.delete('content'); return next; }); updateMessage({ content: undefined }); }}>
                    <BlockInput 
                      value={message.content || ''} 
                      onChange={(e) => updateMessage({ content: e.target.value })} 
                      placeholder="Type message..." 
                      multiline 
                    />
                  </ScratchBlock>
                )}

                {visibleBlocks.has('username') && (
                  <ScratchBlock color="bg-[#4C97FF]" title="Bot Username" onRemove={() => { setVisibleBlocks(prev => { const next = new Set(prev); next.delete('username'); return next; }); updateMessage({ username: undefined }); }}>
                    <BlockInput 
                      value={message.username || ''} 
                      onChange={(e) => updateMessage({ username: e.target.value })} 
                      placeholder="Spidey Bot" 
                    />
                  </ScratchBlock>
                )}

                {visibleBlocks.has('avatar_url') && (
                  <ScratchBlock color="bg-[#4C97FF]" title="Avatar URL" onRemove={() => { setVisibleBlocks(prev => { const next = new Set(prev); next.delete('avatar_url'); return next; }); updateMessage({ avatar_url: undefined }); }}>
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

                <button
                    onClick={addEmbed}
                    className="w-full py-2 bg-[#9966FF] hover:bg-[#855cd6] text-white font-bold rounded-lg shadow-sm border-b-4 border-black/20 transition-colors flex items-center justify-center gap-2 mt-2"
                >
                    <Plus className="w-4 h-4" /> Add Embed
                </button>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};
