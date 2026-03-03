import React from 'react';
import { DiscordWebhookMessage, DiscordEmbed } from '@/types';
import { Plus, Trash2, Undo, Redo } from 'lucide-react';

interface BlockEditorProps {
  message: DiscordWebhookMessage;
  onChange: (message: DiscordWebhookMessage) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

const ContentBlock = ({ message, onChange }: { message: DiscordWebhookMessage, onChange: (updates: Partial<DiscordWebhookMessage>) => void }) => (
  <div className="bg-cyan-50 dark:bg-cyan-900/30 border border-cyan-200 dark:border-cyan-500/50 rounded-lg p-3 mb-4">
    <div className="text-xs font-bold text-cyan-700 dark:text-cyan-400 mb-1 uppercase tracking-wider">Message Content</div>
    <textarea
      value={message.content || ''}
      onChange={(e) => onChange({ content: e.target.value })}
      className="w-full bg-zinc-100 dark:bg-black/20 border border-cyan-200 dark:border-cyan-500/30 rounded p-2 text-sm text-zinc-900 dark:text-cyan-100 focus:outline-none focus:border-cyan-500"
      rows={3}
      placeholder="Type message..."
    />
  </div>
);

const EmbedBlock = ({ embed, index, message, onChange }: { embed: DiscordEmbed, index: number, message: DiscordWebhookMessage, onChange: (updates: Partial<DiscordWebhookMessage>) => void }) => {
  const updateEmbed = (updates: Partial<DiscordEmbed>) => {
    const newEmbeds = [...(message.embeds || [])];
    newEmbeds[index] = { ...newEmbeds[index], ...updates };
    onChange({ embeds: newEmbeds });
  };

  const removeEmbed = () => {
    const newEmbeds = [...(message.embeds || [])];
    newEmbeds.splice(index, 1);
    onChange({ embeds: newEmbeds });
  };

  return (
    <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-500/50 rounded-lg p-3 mb-2 ml-4 relative group">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500 rounded-l-lg"></div>
      <div className="flex justify-between items-center mb-2 pl-2">
        <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">Embed #{index + 1}</span>
        <button onClick={removeEmbed} className="text-purple-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
      </div>
      
      <div className="space-y-2 pl-2">
        <input
          type="text"
          value={embed.title || ''}
          onChange={(e) => updateEmbed({ title: e.target.value })}
          className="w-full bg-zinc-100 dark:bg-black/20 border border-purple-200 dark:border-purple-500/30 rounded p-2 text-sm text-zinc-900 dark:text-purple-100 placeholder-purple-300/30 focus:outline-none focus:border-purple-500"
          placeholder="Title"
        />
        <textarea
          value={embed.description || ''}
          onChange={(e) => updateEmbed({ description: e.target.value })}
          className="w-full bg-zinc-100 dark:bg-black/20 border border-purple-200 dark:border-purple-500/30 rounded p-2 text-sm text-zinc-900 dark:text-purple-100 placeholder-purple-300/30 focus:outline-none focus:border-purple-500"
          rows={2}
          placeholder="Description"
        />
        
        {/* Fields Block Area */}
        <div className="mt-2 space-y-2">
          {embed.fields?.map((field, fIndex) => (
            <div key={fIndex} className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-500/50 rounded p-2 ml-4 flex gap-2 items-center">
               <div className="w-1 h-full bg-green-500 rounded-full"></div>
               <input
                  value={field.name}
                  onChange={(e) => {
                      const newFields = [...(embed.fields || [])];
                      newFields[fIndex] = { ...field, name: e.target.value };
                      updateEmbed({ fields: newFields });
                  }}
                  className="flex-1 bg-transparent border-b border-green-500/30 text-xs text-zinc-900 dark:text-green-100 focus:outline-none"
                  placeholder="Field Name"
               />
               <input
                  value={field.value}
                  onChange={(e) => {
                      const newFields = [...(embed.fields || [])];
                      newFields[fIndex] = { ...field, value: e.target.value };
                      updateEmbed({ fields: newFields });
                  }}
                  className="flex-1 bg-transparent border-b border-green-500/30 text-xs text-zinc-900 dark:text-green-100 focus:outline-none"
                  placeholder="Field Value"
               />
               <button 
                  onClick={() => {
                      const newFields = [...(embed.fields || [])];
                      newFields.splice(fIndex, 1);
                      updateEmbed({ fields: newFields });
                  }}
                  className="text-green-600 dark:text-green-400 hover:text-red-400"
               >
                   <Trash2 className="w-3 h-3" />
               </button>
            </div>
          ))}
          <button
              onClick={() => updateEmbed({ fields: [...(embed.fields || []), { name: 'New Field', value: 'Value', inline: true }] })}
              className="ml-4 text-xs text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300 flex items-center gap-1"
          >
              <Plus className="w-3 h-3" /> Add Field Block
          </button>
        </div>
      </div>
    </div>
  );
};

export const BlockEditor: React.FC<BlockEditorProps> = ({ message, onChange, onUndo, onRedo, canUndo, canRedo }) => {
  
  const updateMessage = (updates: Partial<DiscordWebhookMessage>) => {
    onChange({ ...message, ...updates });
  };

  return (
    <div className="h-full bg-zinc-50 dark:bg-[#1e1e1e] rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col">
      <div className="bg-white dark:bg-[#252526] px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
        <span className="text-zinc-500 dark:text-zinc-400 text-sm font-bold uppercase tracking-widest">Block Stack</span>
        <div className="flex items-center gap-2">
           {onUndo && (
             <button onClick={onUndo} disabled={!canUndo} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-30">
               <Undo className="w-3 h-3" />
             </button>
           )}
           {onRedo && (
             <button onClick={onRedo} disabled={!canRedo} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-30">
               <Redo className="w-3 h-3" />
             </button>
           )}
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 custom-scrollbar">
        <div className="max-w-2xl mx-auto">
            {/* Root Block */}
            <div className="bg-white dark:bg-zinc-800 border-2 border-zinc-300 dark:border-zinc-600 rounded-xl p-4 shadow-xl">
                <div className="flex items-center gap-2 mb-4 border-b border-zinc-200 dark:border-zinc-700 pb-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="ml-2 font-mono text-sm text-zinc-600 dark:text-zinc-300">webhook_message</span>
                </div>

                <ContentBlock message={message} onChange={updateMessage} />

                <div className="space-y-2">
                    {message.embeds?.map((embed, index) => (
                        <EmbedBlock key={index} embed={embed} index={index} message={message} onChange={updateMessage} />
                    ))}
                </div>

                <button
                    onClick={() => updateMessage({ embeds: [...(message.embeds || []), { title: 'New Embed', description: '', color: 0 }] })}
                    className="mt-4 w-full py-2 border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-500 hover:border-purple-500 hover:text-purple-500 transition-colors flex items-center justify-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Add Embed Block
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
