import React, { useState } from 'react';
import { DiscordWebhookMessage, DiscordEmbed, DiscordFile, DiscordComponent, DiscordButton } from '@/types';
import { intToHex, hexToInt, cn } from '@/utils';
import { Plus, Trash2, ChevronDown, ChevronUp, Image as ImageIcon, Link as LinkIcon, Type, Paperclip, MousePointerClick, Smile, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { v4 as uuidv4 } from 'uuid';
import { CustomSelect, CustomColorPicker } from './ui/CustomInputs';

interface EditorProps {
  message: DiscordWebhookMessage;
  onChange: (message: DiscordWebhookMessage) => void;
  webhookUrl: string;
  setWebhookUrl: (url: string) => void;
  onSend: () => void;
  isSending: boolean;
  addLog: (message: string, level?: 'info' | 'warn' | 'error' | 'success') => void;
  webhookData?: { name?: string, avatar?: string } | null;
  editingMessageId?: string | null;
  onCancelEdit?: () => void;
  autoCorrectEnabled?: boolean;
}

export const WebhookEditor: React.FC<EditorProps> = ({ message, onChange, webhookUrl, setWebhookUrl, onSend, isSending, addLog, webhookData, editingMessageId, onCancelEdit, autoCorrectEnabled }) => {

  const [loading, setLoading] = useState(false);
  const [pingEveryone, setPingEveryone] = useState(false);

  const updateMessage = (updates: Partial<DiscordWebhookMessage>) => {
    onChange({ ...message, ...updates });
  };

  // Handle Load button and Enter key
  const handleLoad = async () => {
    setLoading(true);
    // Simulate loading delay (replace with actual logic if needed)
    await new Promise((res) => setTimeout(res, 1200));
    setLoading(false);
    // Trigger webhook apply logic (simulate Enter)
    // You may want to call a prop or function here
    // For now, just call onSend if available
    if (onSend) onSend();
  };

  const handleWebhookInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleLoad();
    }
  };

  // Ping Everyone logic
  React.useEffect(() => {
    if (pingEveryone) {
      if (!message.content?.includes('[Ping: @everyone]')) {
        updateMessage({ content: `[Ping: @everyone]\n${message.content || ''}` });
      }
    } else {
      if (message.content?.includes('[Ping: @everyone]')) {
        updateMessage({ content: (message.content || '').replace(/^\[Ping: @everyone\]\n?/, '') });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pingEveryone]);

  const addEmbed = () => {
    const newEmbed: DiscordEmbed = {
      title: "New Embed",
      description: "Description here...",
      color: 3447003, // Blue-ish
    };
    updateMessage({ embeds: [...(message.embeds || []), newEmbed] });
    addLog("Added new embed", 'info');
  };

  const updateEmbed = (index: number, updates: Partial<DiscordEmbed>) => {
    const newEmbeds = [...(message.embeds || [])];
    newEmbeds[index] = { ...newEmbeds[index], ...updates };
    updateMessage({ embeds: newEmbeds });
  };

  const removeEmbed = (index: number) => {
    const newEmbeds = [...(message.embeds || [])];
    newEmbeds.splice(index, 1);
    updateMessage({ embeds: newEmbeds });
    addLog(`Removed embed #${index + 1}`, 'warn');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: DiscordFile[] = Array.from(e.target.files).map(file => ({
        id: uuidv4(),
        name: file.name,
        file: file,
        dataUrl: URL.createObjectURL(file)
      }));
      updateMessage({ files: [...(message.files || []), ...newFiles] });
      addLog(`Uploaded ${newFiles.length} file(s)`, 'success');
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...(message.files || [])];
    const removed = newFiles.splice(index, 1);
    updateMessage({ files: newFiles });
    addLog(`Removed file: ${removed[0].name}`, 'warn');
  };

  const addComponent = () => {
    // Add a new Action Row with one button
    const newComponent: DiscordComponent = {
      type: 1,
      components: [
        {
          type: 2,
          style: 1,
          label: "New Button",
          custom_id: uuidv4(),
          disabled: false
        }
      ]
    };
    updateMessage({ components: [...(message.components || []), newComponent] });
  };

  const updateComponent = (rowIndex: number, btnIndex: number, updates: Partial<DiscordButton>) => {
    const newComponents = [...(message.components || [])];
    const newRow = { ...newComponents[rowIndex] };
    const newButtons = [...newRow.components];
    newButtons[btnIndex] = { ...newButtons[btnIndex], ...updates };
    newRow.components = newButtons;
    newComponents[rowIndex] = newRow;
    updateMessage({ components: newComponents });
  };

  const addButtonToRow = (rowIndex: number) => {
    const newComponents = [...(message.components || [])];
    const newRow = { ...newComponents[rowIndex] };
    if (newRow.components.length >= 5) return;
    
    newRow.components = [
        ...newRow.components,
        {
            type: 2,
            style: 1,
            label: "New Button",
            custom_id: uuidv4(),
            disabled: false
        }
    ];
    newComponents[rowIndex] = newRow;
    updateMessage({ components: newComponents });
  };

  const removeComponentRow = (index: number) => {
    const newComponents = [...(message.components || [])];
    newComponents.splice(index, 1);
    updateMessage({ components: newComponents });
  };

  const removeButton = (rowIndex: number, btnIndex: number) => {
    const newComponents = [...(message.components || [])];
    const newRow = { ...newComponents[rowIndex] };
    const newButtons = [...newRow.components];
    
    newButtons.splice(btnIndex, 1);
    newRow.components = newButtons;
    
    if (newButtons.length === 0) {
        newComponents.splice(rowIndex, 1);
    } else {
        newComponents[rowIndex] = newRow;
    }
    updateMessage({ components: newComponents });
  };

  return (
    <div className="space-y-6 text-sm pb-20">
      
      {/* Editing Banner */}
      {editingMessageId && (
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center justify-between shadow-sm"
        >
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="font-bold">Editing Message Mode</span>
                <span className="hidden sm:inline text-zinc-400 mx-2">|</span>
                <span className="hidden sm:inline font-mono text-xs opacity-80">ID: {editingMessageId}</span>
            </div>
            <button onClick={onCancelEdit} className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline">
                Cancel Edit
            </button>
        </motion.div>
      )}

      {/* Webhook Settings */}
      <div className="space-y-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
          <LinkIcon className="w-5 h-5" /> Webhook Configuration
        </h2>
        
        <div className="space-y-2">
          <label className="block font-medium text-zinc-700 dark:text-zinc-300">Webhook URL</label>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              onKeyDown={handleWebhookInputKeyDown}
              placeholder="https://discord.com/api/webhooks/..."
              className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white transition-all"
            />
            <button
              type="button"
              onClick={handleLoad}
              disabled={loading}
              className="relative flex items-center justify-center px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md font-medium transition-colors min-w-[48px]"
            >
              {loading ? (
                <span className="flex gap-1">
                  <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </span>
              ) : (
                'Load'
              )}
            </button>
          </div>
        </div>

        {/* Ping Everyone Checkbox */}
        <div className="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            id="ping-everyone"
            checked={pingEveryone}
            onChange={e => setPingEveryone(e.target.checked)}
            className="accent-cyan-600 w-4 h-4"
          />
          <label htmlFor="ping-everyone" className="text-zinc-700 dark:text-zinc-300 text-sm select-none">Ping Everyone to announce</label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block font-medium text-zinc-700 dark:text-zinc-300">Username Override</label>
            <input
              type="text"
              value={message.username || ''}
              onChange={(e) => updateMessage({ username: e.target.value })}
              placeholder={webhookData?.name || "Spidey Bot"}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white"
            />
            {webhookData?.name && !message.username && (
                <p className="text-[10px] text-zinc-500">Default: {webhookData.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="block font-medium text-zinc-700 dark:text-zinc-300">Avatar URL Override</label>
            <input
              type="text"
              value={message.avatar_url || ''}
              onChange={(e) => updateMessage({ avatar_url: e.target.value })}
              placeholder={webhookData?.avatar || "https://..."}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white"
            />
             {webhookData?.avatar && !message.avatar_url && (
                <div className="flex items-center gap-2 mt-1">
                    <img src={webhookData.avatar} className="w-4 h-4 rounded-full" />
                    <p className="text-[10px] text-zinc-500">Default Avatar</p>
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Message Content */}
      <div className="space-y-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
          <Type className="w-5 h-5" /> Message Content
        </h2>
        <textarea
          value={message.content || ''}
          onChange={(e) => updateMessage({ content: e.target.value })}
          placeholder="Type your message here..."
          rows={4}
          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white resize-y min-h-[100px]"
          spellCheck={autoCorrectEnabled}
          autoCorrect={autoCorrectEnabled ? "on" : "off"}
        />
      </div>

      {/* Files */}
      <div className="space-y-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
          <Paperclip className="w-5 h-5" /> Files
        </h2>
        <div className="space-y-2">
            {message.files?.map((file, index) => (
                <div key={file.id} className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-950 p-2 rounded border border-zinc-200 dark:border-zinc-800">
                    <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                    <button onClick={() => removeFile(index)} className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 p-1 rounded">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ))}
            <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl cursor-pointer hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/10 transition-colors">
                <div className="flex flex-col items-center gap-2 text-zinc-500">
                    <Paperclip className="w-6 h-6" />
                    <span className="text-xs font-bold uppercase">Click to Upload Files</span>
                </div>
                <input type="file" multiple className="hidden" onChange={handleFileUpload} />
            </label>
        </div>
      </div>

      {/* Embeds */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5" /> Embeds
          </h2>
          <button
            onClick={addEmbed}
            className="flex items-center gap-2 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Embed
          </button>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {message.embeds?.map((embed, index) => (
              <EmbedEditorItem
                key={index}
                index={index}
                embed={embed}
                onChange={(updates) => updateEmbed(index, updates)}
                onRemove={() => removeEmbed(index)}
                autoCorrectEnabled={autoCorrectEnabled}
              />
            ))}
          </AnimatePresence>
          {(!message.embeds || message.embeds.length === 0) && (
            <div className="text-center py-8 text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900/50 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700">
              No embeds yet. Click "Add Embed" to create one.
            </div>
          )}
        </div>
      </div>

      {/* Components (Buttons) */}
      <div className="space-y-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
            <MousePointerClick className="w-5 h-5" /> Components (Buttons)
            </h2>
            <button
                onClick={addComponent}
                className="flex items-center gap-2 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md text-sm font-medium transition-colors"
            >
                <Plus className="w-4 h-4" /> Add Row
            </button>
        </div>
        <p className="text-xs text-zinc-500 mb-4">
            Note: Standard webhooks may not support components unless created by a bot application.
        </p>
        
        <div className="space-y-4">
            {message.components?.map((row, rowIndex) => (
                <div key={rowIndex} className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold uppercase text-zinc-500">Action Row {rowIndex + 1}</span>
                        <div className="flex gap-2">
                             <button onClick={() => addButtonToRow(rowIndex)} className="text-cyan-500 hover:text-cyan-600 text-xs font-bold" disabled={row.components.length >= 5}>+ Add Button</button>
                             <button onClick={() => removeComponentRow(rowIndex)} className="text-red-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                        {row.components.map((btn, btnIndex) => (
                            <div key={btnIndex} className="flex gap-2 items-center bg-white dark:bg-zinc-900 p-2 rounded border border-zinc-300 dark:border-zinc-700">
                                <input 
                                    value={btn.label} 
                                    onChange={(e) => updateComponent(rowIndex, btnIndex, { label: e.target.value })}
                                    className="flex-1 bg-transparent text-sm border-b border-zinc-200 dark:border-zinc-700 focus:border-cyan-500 outline-none"
                                    placeholder="Label"
                                />
                                <input 
                                    value={btn.url || ''} 
                                    onChange={(e) => updateComponent(rowIndex, btnIndex, { url: e.target.value, style: 5 })}
                                    className="flex-1 bg-transparent text-sm border-b border-zinc-200 dark:border-zinc-700 focus:border-cyan-500 outline-none p-1"
                                    placeholder="URL (Required for Link style)"
                                />
                                <div className="w-32">
                                    <CustomSelect
                                        value={btn.style}
                                        onChange={(val) => updateComponent(rowIndex, btnIndex, { style: val as 1 | 2 | 3 | 4 | 5 })}
                                        options={[
                                            { value: 1, label: 'Primary', icon: <div className="w-3 h-3 rounded-full bg-[#5865F2]" /> },
                                            { value: 2, label: 'Secondary', icon: <div className="w-3 h-3 rounded-full bg-[#4F545C]" /> },
                                            { value: 3, label: 'Success', icon: <div className="w-3 h-3 rounded-full bg-[#2D7D46]" /> },
                                            { value: 4, label: 'Danger', icon: <div className="w-3 h-3 rounded-full bg-[#ED4245]" /> },
                                            { value: 5, label: 'Link', icon: <div className="w-3 h-3 rounded-full bg-[#4F545C]" /> },
                                        ]}
                                    />
                                </div>
                                <button onClick={() => removeButton(rowIndex, btnIndex)} className="text-zinc-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Auto Reactions */}
      <div className="space-y-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
          <Smile className="w-5 h-5" /> Auto Reactions
        </h2>
        
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-200">
            <strong>Note:</strong> Webhooks cannot add reactions themselves. You must provide a <strong>Bot Token</strong> to automatically react to the message after it's sent.
        </div>

        <div className="space-y-2">
             <label className="block text-xs font-medium text-zinc-500 uppercase">Bot Token (Optional)</label>
             <div className="flex gap-2">
                <div className="relative flex-1">
                    <Bot className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input 
                        type="password"
                        value={message.bot_token || ''}
                        onChange={(e) => updateMessage({ bot_token: e.target.value })}
                        placeholder="MTA..."
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md pl-9 pr-3 py-2 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                </div>
             </div>
        </div>

        <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-500 uppercase">Reactions to Add</label>
            <div className="flex gap-2">
                <input 
                    placeholder="Emoji (e.g. 👍, 🚀)" 
                    className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            const val = e.currentTarget.value;
                            if (val) {
                                updateMessage({ auto_reactions: [...(message.auto_reactions || []), val] });
                                e.currentTarget.value = '';
                            }
                        }
                    }}
                />
                <button className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-md text-sm font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">Add</button>
            </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
            {message.auto_reactions?.map((emoji, idx) => (
                <div key={idx} className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full flex items-center gap-2 text-sm border border-zinc-200 dark:border-zinc-700">
                    <span>{emoji}</span>
                    <button onClick={() => {
                        const newReactions = [...(message.auto_reactions || [])];
                        newReactions.splice(idx, 1);
                        updateMessage({ auto_reactions: newReactions });
                    }} className="text-zinc-400 hover:text-red-500 transition-colors">×</button>
                </div>
            ))}
            {(!message.auto_reactions || message.auto_reactions.length === 0) && (
                <span className="text-xs text-zinc-400 italic">No reactions added yet.</span>
            )}
        </div>
      </div>

      {/* Actions */}
      <div className="sticky bottom-4 z-10 flex gap-2">
        {editingMessageId && (
            <button
                onClick={onCancelEdit}
                className="px-4 py-3 rounded-xl font-bold text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all"
            >
                Cancel
            </button>
        )}
        <button
          onClick={onSend}
          disabled={isSending || !webhookUrl}
          className={cn(
            "flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-[0.99]",
            !webhookUrl ? "bg-zinc-400 cursor-not-allowed" : 
            isSending ? "bg-cyan-400 cursor-wait" : 
            editingMessageId ? "bg-amber-600 hover:bg-amber-500 hover:shadow-amber-500/25" :
            "bg-cyan-600 hover:bg-cyan-500 hover:shadow-cyan-500/25"
          )}
        >
          {isSending ? (editingMessageId ? "Updating..." : "Sending...") : (editingMessageId ? "Update Message" : "Send Message")}
        </button>
      </div>
    </div>
  );
};

const EmbedEditorItem: React.FC<{
  index: number;
  embed: DiscordEmbed;
  onChange: (updates: Partial<DiscordEmbed>) => void;
  onRemove: () => void;
  autoCorrectEnabled?: boolean;
}> = ({ index, embed, onChange, onRemove, autoCorrectEnabled }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
      className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden"
    >
      <div 
        className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: intToHex(embed.color) }} />
          <span className="font-medium text-zinc-900 dark:text-white">Embed #{index + 1}</span>
          <span className="text-xs text-zinc-500 truncate max-w-[200px]">{embed.title || '(No title)'}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Main Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-500 uppercase">Author Name</label>
              <input
                type="text"
                value={embed.author?.name || ''}
                onChange={(e) => onChange({ author: { ...embed.author, name: e.target.value } })}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-500 uppercase">Author URL</label>
              <input
                type="text"
                value={embed.author?.url || ''}
                onChange={(e) => onChange({ author: { ...embed.author, url: e.target.value, name: embed.author?.name || '' } })}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm dark:text-white"
              />
            </div>
             <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-500 uppercase">Author Icon URL</label>
              <input
                type="text"
                value={embed.author?.icon_url || ''}
                onChange={(e) => onChange({ author: { ...embed.author, icon_url: e.target.value, name: embed.author?.name || '' } })}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm dark:text-white"
              />
            </div>
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-800 my-4" />

          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-500 uppercase">Title</label>
            <input
              type="text"
              value={embed.title || ''}
              onChange={(e) => onChange({ title: e.target.value })}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm dark:text-white font-medium"
              spellCheck={autoCorrectEnabled}
              autoCorrect={autoCorrectEnabled ? "on" : "off"}
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-500 uppercase">Description</label>
            <textarea
              value={embed.description || ''}
              onChange={(e) => onChange({ description: e.target.value })}
              rows={3}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm dark:text-white resize-y"
              spellCheck={autoCorrectEnabled}
              autoCorrect={autoCorrectEnabled ? "on" : "off"}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-500 uppercase">Title URL</label>
            <input
              type="text"
              value={embed.url || ''}
              onChange={(e) => onChange({ url: e.target.value })}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-500 uppercase">Color (Hex)</label>
              <CustomColorPicker
                color={intToHex(embed.color)}
                onChange={(color) => onChange({ color: hexToInt(color) })}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-500 uppercase">Timestamp</label>
               <input
                  type="datetime-local"
                  // Simple handling for now, could be better
                  onChange={(e) => onChange({ timestamp: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm dark:text-white"
                />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-500 uppercase">Image URL</label>
              <input
                type="text"
                value={embed.image?.url || ''}
                onChange={(e) => onChange({ image: { url: e.target.value } })}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-500 uppercase">Thumbnail URL</label>
              <input
                type="text"
                value={embed.thumbnail?.url || ''}
                onChange={(e) => onChange({ thumbnail: { url: e.target.value } })}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm dark:text-white"
              />
            </div>
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-800 my-4" />

          {/* Footer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-500 uppercase">Footer Text</label>
              <input
                type="text"
                value={embed.footer?.text || ''}
                onChange={(e) => onChange({ footer: { ...embed.footer, text: e.target.value } })}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm dark:text-white"
              />
            </div>
             <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-500 uppercase">Footer Icon URL</label>
              <input
                type="text"
                value={embed.footer?.icon_url || ''}
                onChange={(e) => onChange({ footer: { ...embed.footer, icon_url: e.target.value, text: embed.footer?.text || '' } })}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm dark:text-white"
              />
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between">
               <label className="block text-xs font-medium text-zinc-500 uppercase">Fields</label>
               <button
                onClick={() => onChange({ fields: [...(embed.fields || []), { name: 'New Field', value: 'Value', inline: true }] })}
                className="text-xs text-cyan-500 hover:text-cyan-400 font-medium"
               >
                 + Add Field
               </button>
            </div>
            <div className="space-y-2">
              {embed.fields?.map((field, fIndex) => (
                <div key={fIndex} className="flex gap-2 items-start bg-zinc-50 dark:bg-zinc-950 p-2 rounded-md border border-zinc-200 dark:border-zinc-800">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 flex-1">
                    <input
                      type="text"
                      value={field.name}
                      onChange={(e) => {
                        const newFields = [...(embed.fields || [])];
                        newFields[fIndex] = { ...field, name: e.target.value };
                        onChange({ fields: newFields });
                      }}
                      placeholder="Name"
                      className="sm:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-xs dark:text-white"
                    />
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => {
                        const newFields = [...(embed.fields || [])];
                        newFields[fIndex] = { ...field, value: e.target.value };
                        onChange({ fields: newFields });
                      }}
                      placeholder="Value"
                      className="sm:col-span-6 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-xs dark:text-white"
                    />
                    <div className="sm:col-span-2 flex items-center gap-2">
                      <label className="flex items-center gap-1 text-[10px] text-zinc-500 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={field.inline}
                          onChange={(e) => {
                            const newFields = [...(embed.fields || [])];
                            newFields[fIndex] = { ...field, inline: e.target.checked };
                            onChange({ fields: newFields });
                          }}
                          className="rounded border-zinc-300"
                        />
                        Inline
                      </label>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                        const newFields = [...(embed.fields || [])];
                        newFields.splice(fIndex, 1);
                        onChange({ fields: newFields });
                    }}
                    className="p-1 text-zinc-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </motion.div>
  );
};
