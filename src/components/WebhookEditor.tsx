import React, { useState } from 'react';
import { DiscordWebhookMessage, DiscordEmbed, DiscordFile, DiscordComponent, DiscordButton } from '@/types';
import { intToHex, hexToInt, cn } from '@/utils';
import { Plus, Trash2, ChevronDown, ChevronUp, Image as ImageIcon, Link as LinkIcon, Type, Paperclip, MousePointerClick, Smile, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { v4 as uuidv4 } from 'uuid';
import { playButtonSound, playDeleteSound, playSendSound } from '@/utils/sounds';
import { CustomSelect, CustomColorPicker, CustomDatePicker } from './ui/CustomInputs';

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
  spellCheckEnabled?: boolean;
}

export const WebhookEditor: React.FC<EditorProps> = ({ message, onChange, webhookUrl, setWebhookUrl, onSend, isSending, addLog, webhookData, editingMessageId, onCancelEdit, autoCorrectEnabled, spellCheckEnabled }) => {
  const [isLoadingWebhook, setIsLoadingWebhook] = useState(false);
  const [pingEveryone, setPingEveryone] = useState(false);
  const [pingType, setPingType] = useState<'@everyone' | '@here'>('@everyone');
  const [showInvalidUrlModal, setShowInvalidUrlModal] = useState(false);

  const handleLoadWebhook = async () => {
    if (!webhookUrl) return;
    
    // Basic validation for Discord webhook URL
    const isValidDiscordWebhook = /^https:\/\/(discord|discordapp)\.com\/api\/webhooks\/[^/]+\/[^/]+/.test(webhookUrl);
    
    if (!isValidDiscordWebhook) {
      setShowInvalidUrlModal(true);
      return;
    }

    await executeLoadWebhook();
  };

  const executeLoadWebhook = async () => {
    setIsLoadingWebhook(true);
    await new Promise(r => setTimeout(r, 800));
    setIsLoadingWebhook(false);
    setShowInvalidUrlModal(false);
  };

  const handleCancelLoad = () => {
    setWebhookUrl('');
    setShowInvalidUrlModal(false);
  };

  const handlePingEveryoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setPingEveryone(checked);
    if (checked) {
      if (!message.content?.includes(pingType)) {
        updateMessage({ content: `${pingType}\n${message.content || ''}` });
      }
    } else {
      let newContent = message.content || '';
      newContent = newContent.replace(`@everyone\n`, '').replace(`@everyone`, '');
      newContent = newContent.replace(`@here\n`, '').replace(`@here`, '');
      updateMessage({ content: newContent });
    }
  };

  const handlePingTypeChange = (newType: '@everyone' | '@here') => {
    setPingType(newType);
    if (pingEveryone) {
      let newContent = message.content || '';
      newContent = newContent.replace(`@everyone`, newType);
      newContent = newContent.replace(`@here`, newType);
      updateMessage({ content: newContent });
    }
  };

  const updateMessage = (updates: Partial<DiscordWebhookMessage>) => {
    onChange({ ...message, ...updates });
  };

  const addEmbed = () => {
    playButtonSound();
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
    playButtonSound();
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
    playButtonSound();
    const newFiles = [...(message.files || [])];
    const removed = newFiles.splice(index, 1);
    updateMessage({ files: newFiles });
    addLog(`Removed file: ${removed[0].name}`, 'warn');
  };

  const addComponent = () => {
    playButtonSound();
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
    playButtonSound();
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
    playButtonSound();
    const newComponents = [...(message.components || [])];
    newComponents.splice(index, 1);
    updateMessage({ components: newComponents });
  };

  const removeButton = (rowIndex: number, btnIndex: number) => {
    playButtonSound();
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
            className="bg-amber-900/20 border border-amber-800 rounded-xl p-4 flex items-center justify-between shadow-sm"
        >
            <div className="flex items-center gap-2 text-amber-200">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="font-bold">Editing Message Mode</span>
                <span className="hidden sm:inline text-zinc-400 mx-2">|</span>
                <span className="hidden sm:inline font-mono text-xs opacity-80">ID: {editingMessageId}</span>
            </div>
            <button onClick={onCancelEdit} className="text-xs font-bold text-amber-400 hover:underline">
                Cancel Edit
            </button>
        </motion.div>
      )}

      {/* Webhook Settings */}
      <div className="space-y-4 bg-[#121212] p-4 rounded-xl border border-[#222] shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
          <LinkIcon className="w-5 h-5" /> Webhook Configuration
        </h2>
        
        <div className="space-y-2">
          <label className="block font-medium text-zinc-300">Webhook URL</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleLoadWebhook();
                }
              }}
              placeholder="https://discord.com/api/webhooks/..."
              className="flex-1 bg-[#0a0a0a] border border-[#333] rounded-md px-3 py-2 focus:outline-none focus:border-cyan-500 text-white transition-all"
            />
            <button
              onClick={handleLoadWebhook}
              disabled={isLoadingWebhook || !webhookUrl}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-md font-bold transition-colors flex items-center justify-center min-w-[80px] shadow-[0_0_10px_rgba(6,182,212,0.2)]"
            >
              {isLoadingWebhook ? (
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              ) : (
                "Load"
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block font-medium text-zinc-300">Username Override</label>
            <input
              type="text"
              value={message.username || ''}
              onChange={(e) => updateMessage({ username: e.target.value })}
              placeholder={webhookData?.name || "Spidey Bot"}
              className="w-full bg-[#0a0a0a] border border-[#333] rounded-md px-3 py-2 focus:outline-none focus:border-cyan-500 text-white transition-all"
            />
            {webhookData?.name && !message.username && (
                <p className="text-[10px] text-zinc-500">Default: {webhookData.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="block font-medium text-zinc-300">Avatar URL Override</label>
            <input
              type="text"
              value={message.avatar_url || ''}
              onChange={(e) => updateMessage({ avatar_url: e.target.value })}
              placeholder={webhookData?.avatar || "https://..."}
              className="w-full bg-[#0a0a0a] border border-[#333] rounded-md px-3 py-2 focus:outline-none focus:border-cyan-500 text-white transition-all"
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
      <div className="space-y-4 bg-[#121212] p-4 rounded-xl border border-[#222] shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <Type className="w-5 h-5" /> Message Content
          </h2>
          <div className="flex items-center gap-3 text-sm font-medium text-zinc-400 group">
            <label className="relative cursor-pointer">
              <input 
                type="checkbox" 
                checked={pingEveryone}
                onChange={handlePingEveryoneChange}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-[#333] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
            <span className="flex items-center gap-1.5 group-hover:text-white transition-colors">
              Ping 
              <CustomSelect 
                value={pingType}
                onChange={(val) => handlePingTypeChange(val as '@everyone' | '@here')}
                options={[
                  { value: '@everyone', label: '@everyone' },
                  { value: '@here', label: '@here' }
                ]}
                className="w-32"
              />
              to announce
            </span>
          </div>
        </div>
        <textarea
          value={message.content || ''}
          onChange={(e) => updateMessage({ content: e.target.value })}
          placeholder="Type your message here..."
          rows={4}
          className="w-full bg-[#0a0a0a] border border-[#333] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white resize-y min-h-[100px]"
          spellCheck={spellCheckEnabled}
          autoCorrect={autoCorrectEnabled ? "on" : "off"}
        />
      </div>

      {/* Files */}
      <div className="space-y-4 bg-[#121212] p-4 rounded-xl border border-[#222] shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
          <Paperclip className="w-5 h-5" /> Files
        </h2>
        <div className="space-y-2">
            {message.files?.map((file, index) => (
                <div key={file.id} className="flex items-center justify-between bg-[#0a0a0a] p-2 rounded border border-[#333]">
                    <span className="text-sm truncate max-w-[200px] text-zinc-300">{file.name}</span>
                    <button onClick={() => { playDeleteSound(); removeFile(index); }} className="text-red-400 hover:bg-red-400/10 p-1 rounded transition-colors">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ))}
            <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-[#333] rounded-xl cursor-pointer hover:border-cyan-500 hover:bg-cyan-500/5 transition-colors">
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
          <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <ImageIcon className="w-5 h-5" /> Embeds
          </h2>
          <button
            onClick={addEmbed}
            className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black rounded-md text-sm font-bold transition-colors shadow-[0_0_10px_rgba(6,182,212,0.2)]"
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
                spellCheckEnabled={spellCheckEnabled}
              />
            ))}
          </AnimatePresence>
          {(!message.embeds || message.embeds.length === 0) && (
            <div className="text-center py-8 text-zinc-500 bg-[#121212] rounded-xl border border-dashed border-[#333]">
              No embeds yet. Click "Add Embed" to create one.
            </div>
          )}
        </div>
      </div>

      {/* Components (Buttons) */}
      <div className="space-y-4 bg-[#121212] p-4 rounded-xl border border-[#222] shadow-sm">
        <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <MousePointerClick className="w-5 h-5" /> Components (Buttons)
            </h2>
            <button
                onClick={addComponent}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#222] hover:bg-[#333] text-zinc-300 border border-[#333] rounded-md text-sm font-medium transition-colors"
            >
                <Plus className="w-4 h-4" /> Add Row
            </button>
        </div>
        <p className="text-xs text-zinc-500 mb-4">
            Note: Standard webhooks may not support components unless created by a bot application.
        </p>
        
        <div className="space-y-4">
            {message.components?.map((row, rowIndex) => (
                <div key={rowIndex} className="bg-[#0a0a0a] p-3 rounded-lg border border-[#333]">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold uppercase text-zinc-500">Action Row {rowIndex + 1}</span>
                        <div className="flex gap-2">
                             <button onClick={() => addButtonToRow(rowIndex)} className="text-cyan-400 hover:text-cyan-300 text-xs font-bold transition-colors" disabled={row.components.length >= 5}>+ Add Button</button>
                             <button onClick={() => { playDeleteSound(); removeComponentRow(rowIndex); }} className="text-red-400 hover:text-red-300 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                        {row.components.map((btn, btnIndex) => (
                            <div key={btnIndex} className="flex gap-2 items-center bg-[#121212] p-2 rounded border border-[#222]">
                                <input 
                                    value={btn.label} 
                                    onChange={(e) => updateComponent(rowIndex, btnIndex, { label: e.target.value })}
                                    className="flex-1 bg-transparent text-sm border-b border-[#333] focus:border-cyan-500 outline-none text-white transition-colors"
                                    placeholder="Label"
                                />
                                <input 
                                    value={btn.url || ''} 
                                    onChange={(e) => updateComponent(rowIndex, btnIndex, { url: e.target.value, style: 5 })}
                                    className="flex-1 bg-transparent text-sm border-b border-[#333] focus:border-cyan-500 outline-none p-1 text-white transition-colors"
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
                                <button onClick={() => { playDeleteSound(); removeButton(rowIndex, btnIndex); }} className="text-zinc-500 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Auto Reactions */}
      <div className="space-y-4 bg-[#121212] p-4 rounded-xl border border-[#222] shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
          <Smile className="w-5 h-5" /> Auto Reactions
        </h2>
        
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-200">
            <strong>Note:</strong> Webhooks cannot add reactions themselves. You must provide a <strong>Bot Token</strong> to automatically react to the message after it's sent.
        </div>

        <div className="space-y-2">
             <label className="block text-xs font-medium text-zinc-400 uppercase">Bot Token (Optional)</label>
             <div className="flex gap-2">
                <div className="relative flex-1">
                    <Bot className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input 
                        type="password"
                        value={message.bot_token || ''}
                        onChange={(e) => updateMessage({ bot_token: e.target.value })}
                        placeholder="MTA..."
                        className="w-full bg-[#0a0a0a] border border-[#333] rounded-md pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                </div>
             </div>
        </div>

        <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-400 uppercase">Reactions to Add</label>
            <div className="flex gap-2">
                <input 
                    placeholder="Emoji (e.g. 👍, 🚀)" 
                    className="flex-1 bg-[#0a0a0a] border border-[#333] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
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
                <button className="px-4 py-2 bg-[#222] border border-[#333] rounded-md text-sm font-bold hover:bg-[#333] text-zinc-300 transition-colors">Add</button>
            </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
            {message.auto_reactions?.map((emoji, idx) => (
                <div key={idx} className="bg-[#222] px-3 py-1.5 rounded-full flex items-center gap-2 text-sm border border-[#333] text-zinc-300">
                    <span>{emoji}</span>
                    <button onClick={() => {
                        const newReactions = [...(message.auto_reactions || [])];
                        newReactions.splice(idx, 1);
                        updateMessage({ auto_reactions: newReactions });
                    }} className="text-zinc-500 hover:text-red-400 transition-colors">×</button>
                </div>
            ))}
            {(!message.auto_reactions || message.auto_reactions.length === 0) && (
                <span className="text-xs text-zinc-500 italic">No reactions added yet.</span>
            )}
        </div>
      </div>

      {/* Actions */}
      <div className="sticky bottom-4 z-10 flex gap-2">
        {editingMessageId && (
            <button
                onClick={onCancelEdit}
                className="px-4 py-3 rounded-xl font-bold text-zinc-300 bg-[#222] border border-[#333] shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:bg-[#333] transition-all"
            >
                Cancel
            </button>
        )}
        <button
          onClick={() => { playSendSound(); onSend(); }}
          disabled={isSending || !webhookUrl}
          className={cn(
            "flex-1 py-3 rounded-xl font-bold text-black shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all",
            !webhookUrl ? "bg-zinc-600 cursor-not-allowed shadow-none" : 
            isSending ? "bg-cyan-400 cursor-wait" : 
            editingMessageId ? "bg-amber-500 hover:bg-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-[0.99]" :
            "bg-cyan-500 hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-[0.99]"
          )}
        >
          {isSending ? (editingMessageId ? "Updating..." : "Sending...") : (editingMessageId ? "Update Message" : "Send Message")}
        </button>
      </div>
      {/* Invalid Webhook URL Modal */}
      <AnimatePresence>
        {showInvalidUrlModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#121212] rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-[#333]"
            >
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">
                  Unrecognized URL
                </h3>
                <p className="text-zinc-400 mb-6">
                  Your given Webhook URL is can not found in the DWM Tools Database , Webhook URL Struckture, So please cheak The url again.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleCancelLoad}
                    className="px-4 py-2 text-zinc-400 hover:bg-[#222] hover:text-white rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeLoadWebhook}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg transition-colors font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                  >
                    Load It Anyway
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const EmbedEditorItem: React.FC<{
  index: number;
  embed: DiscordEmbed;
  onChange: (updates: Partial<DiscordEmbed>) => void;
  onRemove: () => void;
  autoCorrectEnabled?: boolean;
  spellCheckEnabled?: boolean;
}> = ({ index, embed, onChange, onRemove, autoCorrectEnabled, spellCheckEnabled }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
      className="bg-[#121212] rounded-xl border border-[#333] shadow-sm overflow-hidden"
    >
      <div 
        className="flex items-center justify-between p-3 bg-[#0a0a0a] border-b border-[#333] cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: intToHex(embed.color) }} />
          <span className="font-medium text-white">Embed #{index + 1}</span>
          <span className="text-xs text-zinc-500 truncate max-w-[200px]">{embed.title || '(No title)'}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); playDeleteSound(); onRemove(); }}
            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Main Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-400 uppercase">Author Name</label>
              <input
                type="text"
                value={embed.author?.name || ''}
                onChange={(e) => onChange({ author: { ...embed.author, name: e.target.value } })}
                className="w-full bg-[#0a0a0a] border border-[#333] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-400 uppercase">Author URL</label>
              <input
                type="text"
                value={embed.author?.url || ''}
                onChange={(e) => onChange({ author: { ...embed.author, url: e.target.value, name: embed.author?.name || '' } })}
                className="w-full bg-[#0a0a0a] border border-[#333] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
             <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-400 uppercase">Author Icon URL</label>
              <input
                type="text"
                value={embed.author?.icon_url || ''}
                onChange={(e) => onChange({ author: { ...embed.author, icon_url: e.target.value, name: embed.author?.name || '' } })}
                className="w-full bg-[#0a0a0a] border border-[#333] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <div className="border-t border-[#333] my-4" />

          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-400 uppercase">Title</label>
            <input
              type="text"
              value={embed.title || ''}
              onChange={(e) => onChange({ title: e.target.value })}
              className="w-full bg-[#0a0a0a] border border-[#333] rounded-md px-3 py-2 text-sm text-white font-medium focus:outline-none focus:border-cyan-500 transition-colors"
              spellCheck={spellCheckEnabled}
              autoCorrect={autoCorrectEnabled ? "on" : "off"}
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-400 uppercase">Description</label>
            <textarea
              value={embed.description || ''}
              onChange={(e) => onChange({ description: e.target.value })}
              rows={3}
              className="w-full bg-[#0a0a0a] border border-[#333] rounded-md px-3 py-2 text-sm text-white resize-y focus:outline-none focus:border-cyan-500 transition-colors"
              spellCheck={spellCheckEnabled}
              autoCorrect={autoCorrectEnabled ? "on" : "off"}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-400 uppercase">Title URL</label>
            <input
              type="text"
              value={embed.url || ''}
              onChange={(e) => onChange({ url: e.target.value })}
              className="w-full bg-[#0a0a0a] border border-[#333] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-400 uppercase">Color (Hex)</label>
              <CustomColorPicker
                color={intToHex(embed.color)}
                onChange={(color) => onChange({ color: hexToInt(color) })}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-400 uppercase">Timestamp</label>
               <CustomDatePicker
                  value={embed.timestamp || ''}
                  onChange={(val) => onChange({ timestamp: val || undefined })}
                />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-400 uppercase">Image URL</label>
              <input
                type="text"
                value={embed.image?.url || ''}
                onChange={(e) => onChange({ image: { url: e.target.value } })}
                className="w-full bg-[#0a0a0a] border border-[#333] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-400 uppercase">Thumbnail URL</label>
              <input
                type="text"
                value={embed.thumbnail?.url || ''}
                onChange={(e) => onChange({ thumbnail: { url: e.target.value } })}
                className="w-full bg-[#0a0a0a] border border-[#333] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <div className="border-t border-[#333] my-4" />

          {/* Footer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-400 uppercase">Footer Text</label>
              <input
                type="text"
                value={embed.footer?.text || ''}
                onChange={(e) => onChange({ footer: { ...embed.footer, text: e.target.value } })}
                className="w-full bg-[#0a0a0a] border border-[#333] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
             <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-400 uppercase">Footer Icon URL</label>
              <input
                type="text"
                value={embed.footer?.icon_url || ''}
                onChange={(e) => onChange({ footer: { ...embed.footer, icon_url: e.target.value, text: embed.footer?.text || '' } })}
                className="w-full bg-[#0a0a0a] border border-[#333] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between">
               <label className="block text-xs font-medium text-zinc-400 uppercase">Fields</label>
               <button
                onClick={() => onChange({ fields: [...(embed.fields || []), { name: 'New Field', value: 'Value', inline: true }] })}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-bold transition-colors"
               >
                 + Add Field
               </button>
            </div>
            <div className="space-y-2">
              {embed.fields?.map((field, fIndex) => (
                <div key={fIndex} className="flex gap-2 items-start bg-[#121212] p-2 rounded-md border border-[#222]">
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
                      className="sm:col-span-4 bg-[#0a0a0a] border border-[#333] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      spellCheck={spellCheckEnabled}
                      autoCorrect={autoCorrectEnabled ? "on" : "off"}
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
                      className="sm:col-span-6 bg-[#0a0a0a] border border-[#333] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      spellCheck={spellCheckEnabled}
                      autoCorrect={autoCorrectEnabled ? "on" : "off"}
                    />
                    <div className="sm:col-span-2 flex items-center gap-2">
                      <label className="flex items-center gap-1 text-[10px] text-zinc-400 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={field.inline}
                          onChange={(e) => {
                            const newFields = [...(embed.fields || [])];
                            newFields[fIndex] = { ...field, inline: e.target.checked };
                            onChange({ fields: newFields });
                          }}
                          className="rounded border-[#333] bg-[#0a0a0a] text-cyan-500 focus:ring-cyan-500 focus:ring-offset-[#121212]"
                        />
                        Inline
                      </label>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                        playDeleteSound();
                        const newFields = [...(embed.fields || [])];
                        newFields.splice(fIndex, 1);
                        onChange({ fields: newFields });
                    }}
                    className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
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
