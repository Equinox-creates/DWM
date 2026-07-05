import React, { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { X, Trash2, Plus, Check, ChevronDown, ChevronUp, Layers, Send, Link as LinkIcon, MessageSquare, GripVertical, Settings } from 'lucide-react';
import { cn } from '@/utils';
import { DiscordWebhookMessage } from '@/types';
import { playButtonSound, playDeleteSound, playSendSound } from '@/utils/sounds';

interface MessageStackManagerProps {
  messages: DiscordWebhookMessage[];
  activeMessageIndex: number;
  setActiveMessageIndex: (idx: number) => void;
  addNewMessage: () => void;
  removeMessage: (idx: number) => void;
  handleSend: (msg: DiscordWebhookMessage) => Promise<void>;
  isSending: boolean;
  editMessageUrl: string;
  setEditMessageUrl: (url: string) => void;
  handleLoadMessage: () => void;
  setShowDeleteMessageConfirm: (show: boolean) => void;
  setShowMessageManager: (show: boolean) => void;
  stackSelectMode: boolean;
  setStackSelectMode: (mode: boolean) => void;
  selectedMessages: number[];
  setSelectedMessages: (indices: number[]) => void;
  setMessages: (messages: DiscordWebhookMessage[]) => void;
}

export const MessageStackManager: React.FC<MessageStackManagerProps> = ({
  messages,
  activeMessageIndex,
  setActiveMessageIndex,
  addNewMessage,
  removeMessage,
  handleSend,
  isSending,
  editMessageUrl,
  setEditMessageUrl,
  handleLoadMessage,
  setShowDeleteMessageConfirm,
  setShowMessageManager,
  stackSelectMode,
  setStackSelectMode,
  selectedMessages,
  setSelectedMessages,
  setMessages
}) => {
  const [activeCategory, setActiveCategory] = useState<'stack' | 'edit' | null>('stack');
  const [showReorder, setShowReorder] = useState(false);
  const [showStackSettings, setShowStackSettings] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  const toggleCategory = (cat: 'stack' | 'edit') => {
    playButtonSound();
    setActiveCategory(activeCategory === cat ? null : cat);
  };

  const handleSendStack = async () => {
    playSendSound();
    const msgsToSend = stackSelectMode && selectedMessages.length > 0 
        ? selectedMessages.map(i => messages[i]) 
        : messages;
    
    setShowMessageManager(false);
    
    for (let i = 0; i < msgsToSend.length; i++) {
        const actualIndex = messages.indexOf(msgsToSend[i]);
        setActiveMessageIndex(actualIndex);
        await new Promise(r => setTimeout(r, 100));
        await handleSend(msgsToSend[i]);
        await new Promise(r => setTimeout(r, 1000));
    }
  };

  const removeSelectedStack = () => {
    if (selectedMessages.length === 0) return;
    playDeleteSound();
    const newMessages = messages.filter((_, i) => !selectedMessages.includes(i));
    setMessages(newMessages);
    setSelectedMessages([]);
    setStackSelectMode(false);
    setActiveMessageIndex(0);
  };

  const removeAllStack = () => {
    playDeleteSound();
    setMessages([messages[0]]); // Keep at least one or a default
    // Or if we can have zero: setMessages([]);
    // But App.tsx seems to expect at least one DEFAULT_MESSAGE usually
    setSelectedMessages([]);
    setStackSelectMode(false);
    setActiveMessageIndex(0);
    setShowDeleteAllConfirm(false);
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 sm:p-4 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-[#0c0c0c] sm:rounded-3xl shadow-2xl w-full h-full sm:h-auto sm:max-w-xl flex flex-col border border-white/5 relative overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/20">
              <Layers className="w-5 h-5 text-cyan-500" />
            </div>
            <div className="flex flex-col">
              <h3 className="font-black text-lg text-white uppercase tracking-tighter">Stack Manager</h3>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest leading-none mt-1">Manage multiple messages</p>
            </div>
          </div>
          <button 
            onClick={() => { playButtonSound(); setShowMessageManager(false); }} 
            className="w-10 h-10 flex items-center justify-center hover:bg-white/5 text-zinc-400 hover:text-white rounded-xl transition-all active:scale-90"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Section - Accordion-style for mobile, but same structure for all for consistency as requested */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          
          {/* Category: Message Stack */}
          <div className="border border-white/5 rounded-[2rem] overflow-hidden bg-[#121212]/50 shadow-inner">
            <div className="flex items-center justify-between hover:bg-white/5 transition-colors group">
              <button 
                onClick={() => toggleCategory('stack')}
                className="flex-1 flex items-center gap-4 p-5"
              >
                <MessageSquare className={cn("w-6 h-6 transition-colors", activeCategory === 'stack' ? "text-cyan-500" : "text-zinc-500 group-hover:text-zinc-300")} />
                <span className={cn("font-bold text-base uppercase tracking-wider transition-colors", activeCategory === 'stack' ? "text-white" : "text-zinc-400 group-hover:text-zinc-200")}>
                  Message Stack
                </span>
                <span className="px-3 py-1 bg-zinc-800 rounded-full text-[11px] font-black text-zinc-400">
                  {messages.length}
                </span>
              </button>
              <div className="flex items-center gap-2 pr-5">
                <div className="relative">
                  <button 
                    onClick={() => { playButtonSound(); setShowStackSettings(!showStackSettings); }}
                    className={cn(
                      "p-2 rounded-lg transition-all active:scale-90",
                      (showStackSettings || stackSelectMode) ? "bg-cyan-500/20 text-cyan-400" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    <Settings className="w-5 h-5" />
                  </button>

                  <AnimatePresence>
                    {showStackSettings && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl py-1.5 z-50 overflow-hidden"
                      >
                        <button 
                          onClick={() => { 
                            setStackSelectMode(!stackSelectMode); 
                            setSelectedMessages([]); 
                            setShowStackSettings(false); 
                            playButtonSound();
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-cyan-500 hover:text-black flex items-center gap-3 transition-colors"
                        >
                          <Layers className="w-4 h-4" /> {stackSelectMode ? 'Cancel Selection' : 'Select Multiple'}
                        </button>
                        
                        <button 
                          onClick={() => { 
                            setShowReorder(!showReorder); 
                            setShowStackSettings(false); 
                            playButtonSound();
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-cyan-500 hover:text-black flex items-center gap-3 transition-colors"
                        >
                          <GripVertical className="w-4 h-4" /> Reorder
                        </button>

                        {stackSelectMode && selectedMessages.length > 0 && (
                          <button 
                            onClick={() => { removeSelectedStack(); setShowStackSettings(false); }}
                            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500 hover:text-white flex items-center gap-3 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" /> Delete Selected ({selectedMessages.length})
                          </button>
                        )}
                        
                        <button 
                          onClick={() => { setShowDeleteAllConfirm(true); setShowStackSettings(false); playButtonSound(); }}
                          disabled={messages.length <= 1}
                          className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-600 hover:text-white flex items-center gap-3 transition-colors disabled:opacity-30"
                        >
                          <Trash2 className="w-4 h-4" /> Delete All
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {activeCategory === 'stack' ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
              </div>
            </div>
            
            <AnimatePresence>
              {showDeleteAllConfirm && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-[#121212] border border-red-500/20 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
                    >
                        <div className="p-8 text-center space-y-4">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Trash2 className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Clear Stack?</h3>
                            <p className="text-sm text-zinc-400">
                                This will remove all messages from your current stack except for the first one. This action is permanent.
                            </p>
                            <div className="grid grid-cols-2 gap-3 pt-4">
                                <button 
                                    onClick={() => setShowDeleteAllConfirm(false)}
                                    className="py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-2xl font-bold transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={removeAllStack}
                                    className="py-3 bg-red-500 hover:bg-red-400 text-white rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-red-500/20"
                                >
                                    Clear All
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {activeCategory === 'stack' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="p-6 pt-6 space-y-6">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-black opacity-50">
                            Stored Messages
                        </p>
                        <button
                            onClick={() => {
                                playButtonSound();
                                setStackSelectMode(!stackSelectMode);
                                setSelectedMessages([]);
                            }}
                            className={cn(
                                "text-[10px] uppercase tracking-widest font-black px-4 py-1.5 rounded-full transition-all active:scale-95",
                                stackSelectMode ? "bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]" : "bg-[#222] text-zinc-400 hover:text-white"
                            )}
                        >
                            {stackSelectMode ? "Cancel Select" : "Multi Select"}
                        </button>
                    </div>

                    <div className="space-y-3 max-h-[45vh] sm:max-h-[350px] overflow-y-auto custom-scrollbar pr-2 pb-2 -mr-2">
                        <Reorder.Group 
                            axis="y" 
                            values={messages} 
                            onReorder={setMessages}
                            className="space-y-3"
                        >
                            {messages.map((msg, idx) => (
                                <Reorder.Item 
                                    key={msg.id || idx} 
                                    value={msg}
                                    drag={showReorder ? "y" : false}
                                    whileDrag={{ 
                                        scale: 1.05, 
                                        boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                                        zIndex: 100,
                                        border: "2px solid rgba(6,182,212,0.5)"
                                    }}
                                    className={cn(
                                        "relative transition-all",
                                        showReorder && "hover:ring-1 hover:ring-cyan-500/30 rounded-2xl"
                                    )}
                                >
                                    <div 
                                        onClick={() => {
                                            playButtonSound();
                                            if (stackSelectMode) {
                                                if (selectedMessages.includes(idx)) {
                                                    setSelectedMessages(selectedMessages.filter(i => i !== idx));
                                                } else {
                                                    setSelectedMessages([...selectedMessages, idx]);
                                                }
                                            } else {
                                                setActiveMessageIndex(idx);
                                                setShowMessageManager(false);
                                            }
                                        }}
                                        className={cn(
                                            "flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all active:scale-[0.98] group/item",
                                            (stackSelectMode && selectedMessages.includes(idx)) || (activeMessageIndex === idx && !stackSelectMode)
                                                ? "bg-cyan-500/10 border-cyan-500/30"
                                                : "bg-black/40 border-white/5 hover:border-white/10"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            {showReorder && !stackSelectMode && (
                                                <div className="cursor-grab active:cursor-grabbing p-1 text-zinc-600 hover:text-zinc-400">
                                                    <GripVertical className="w-4 h-4" />
                                                </div>
                                            )}
                                            {stackSelectMode ? (
                                                <div className={cn(
                                                    "w-6 h-6 rounded-lg border flex items-center justify-center transition-all",
                                                    selectedMessages.includes(idx) ? "bg-cyan-500 border-cyan-500 text-black" : "border-white/10 bg-black/40"
                                                )}>
                                                    {selectedMessages.includes(idx) && <Check className="w-4 h-4 stroke-[3px]" />}
                                                </div>
                                            ) : (
                                                <div className={cn(
                                                    "w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black transition-all",
                                                    activeMessageIndex === idx ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]" : "bg-white/5 text-zinc-500"
                                                )}>
                                                    {idx + 1}
                                                </div>
                                            )}
                                            <div className="flex flex-col overflow-hidden">
                                                <span className={cn("text-xs font-black truncate max-w-[200px] transition-colors", (stackSelectMode && selectedMessages.includes(idx)) || (activeMessageIndex === idx && !stackSelectMode) ? "text-cyan-400" : "text-zinc-200")}>
                                                    {(() => {
                                                        const rawTitle = msg.content || (msg.embeds?.[0]?.title) || "Untitled Message";
                                                        const words = rawTitle.split(/\s+/);
                                                        if (words.length <= 8) return rawTitle;
                                                        return words.slice(0, 8).join(' ') + '...';
                                                    })()}
                                                </span>
                                                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-0.5">
                                                    {msg.embeds?.length || 0} embeds • {msg.files?.length || 0} files
                                                </span>
                                            </div>
                                        </div>
                                        {messages.length > 1 && !stackSelectMode && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); playDeleteSound(); removeMessage(idx); }}
                                                className="w-10 h-10 flex items-center justify-center text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all active:scale-90"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </Reorder.Item>
                            ))}
                        </Reorder.Group>
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                        {!stackSelectMode && (
                            <button
                                onClick={() => { playButtonSound(); addNewMessage(); }}
                                className="w-full py-4 border-2 border-dashed border-white/5 rounded-2xl text-zinc-500 hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-[0.2em]"
                            >
                                <Plus className="w-4 h-4" /> New Message
                            </button>
                        )}
                        
                        <button 
                            onClick={handleSendStack}
                            disabled={isSending}
                            className="w-full py-5 bg-cyan-500 hover:bg-cyan-400 text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-[0_10px_40px_rgba(6,182,212,0.3)] transition-all active:scale-95 disabled:opacity-50 mt-2"
                        >
                            {isSending ? "Sending..." : (stackSelectMode && selectedMessages.length > 0 ? `Send Selected (${selectedMessages.length})` : "Send All Stack")}
                        </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Category: Edit Sent Message */}
          <div className="border border-white/5 rounded-[2rem] overflow-hidden bg-[#121212]/50 shadow-inner">
            <button 
              onClick={() => toggleCategory('edit')}
              className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <Send className={cn("w-6 h-6 transition-colors", activeCategory === 'edit' ? "text-cyan-500" : "text-zinc-500 group-hover:text-zinc-300")} />
                <span className={cn("font-bold text-base uppercase tracking-wider transition-colors", activeCategory === 'edit' ? "text-white" : "text-zinc-400 group-hover:text-zinc-200")}>
                  Edit Remote Message
                </span>
              </div>
              {activeCategory === 'edit' ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
            </button>
            <AnimatePresence>
              {activeCategory === 'edit' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="p-6 pt-6 space-y-6">
                    <div className="flex gap-3 p-4 bg-white/5 rounded-[1.5rem] border border-white/5">
                        <LinkIcon className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
                        <div className="flex flex-col gap-1.5">
                            <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                                Paste the message URL to load it for editing.
                            </p>
                            <p className="text-[10px] text-amber-500/70 font-black uppercase tracking-widest">
                                Webhook identity must match the author.
                            </p>
                        </div>
                    </div>
                    
                    <div className="relative">
                        <input 
                            value={editMessageUrl}
                            onChange={(e) => setEditMessageUrl(e.target.value)}
                            placeholder="https://discord.com/channels/..."
                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-all font-mono"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={handleLoadMessage}
                            disabled={isSending || !editMessageUrl}
                            className="flex items-center justify-center gap-3 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                        >
                            {isSending ? 'Loading...' : <>Load Message</>}
                        </button>
                        <button 
                            onClick={() => { playButtonSound(); setShowDeleteMessageConfirm(true); }}
                            disabled={isSending || !editMessageUrl}
                            className="flex items-center justify-center gap-3 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-red-500 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                        >
                            <Trash2 className="w-4 h-4" /> Delete
                        </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/5 bg-black/40">
            <button 
                onClick={() => { playButtonSound(); setShowMessageManager(false); }}
                className="w-full py-4 bg-[#1a1a1a] hover:bg-[#222] text-zinc-400 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl"
            >
                Return to Editor
            </button>
        </div>
      </motion.div>
    </div>
  );
};

