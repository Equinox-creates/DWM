import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DiscordWebhookMessage, DiscordEmbed, DiscordFile, DiscordComponent, DiscordButton } from '@/types';
import { intToHex, hexToInt, cn } from '@/utils';
import { Plus, Trash2, ChevronDown, ChevronUp, Image as ImageIcon, Link as LinkIcon, Type, Paperclip, MousePointerClick, Smile, Webhook, Folder, File as FileIcon, X, Eye, Download, Search, Book, Info, Send, GripVertical, Settings, Layers, Check, Eraser, Sparkles } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { v4 as uuidv4 } from 'uuid';
import { playButtonSound, playDeleteSound, playSendSound } from '@/utils/sounds';
import { CustomSelect, CustomColorPicker, CustomDatePicker, CustomCheckbox } from './ui/CustomInputs';
import { RichText3DotMenu } from './RichText3DotMenu';


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
  isCreatingTemplate?: boolean;
  onTemplateDone?: () => void;
  onTemplateCancel?: () => void;
  onClear?: () => void;
  onSaveTemplate?: () => void;
  isOnboardingEdit?: boolean;
  onConfirmOnboarding?: () => void;
  onCancelOnboarding?: () => void;
  isTriggerEdit?: boolean;
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const STANDARD_EMOJI_CATEGORIES = [
  {
    name: "Smileys & Faces",
    emojis: ["😀", "😂", "🤣", "😊", "😍", "😘", "🥰", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😢", "😭", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥"]
  },
  {
    name: "Gestures & Symbols",
    emojis: ["👍", "👎", "👊", "✊", "🤞", "✌️", "👌", "🖖", "👋", "👏", "🙌", "🙏", "💪", "🧠", "👀", "🔥", "✨", "🎉", "💯", "❤️", "💖", "⭐", "🌟", "🚀", "👑", "🎯", "🎮", "🔔", "💡", "📢"]
  },
  {
    name: "Transport & Nature",
    emojis: ["🍀", "🌸", "⭐", "🌈", "⚡", "☀️", "❄️", "💤", "🐶", "🐱", "🦁", "🐰", "🦊", "🐼", "🍕", "🍔", "🍟", "🧁", "🍩", "☕", "🍺", "🍻", "🥂", "🎈", "🎁", "💥", "🛑", "⚔️", "🛡️", "🔮"]
  }
];

import { useVirtualKeyboard } from '@/contexts/VirtualKeyboardContext';

export const WebhookEditor: React.FC<EditorProps> = ({ message, onChange, webhookUrl, setWebhookUrl, onSend, isSending, addLog, webhookData, editingMessageId, onCancelEdit, autoCorrectEnabled, spellCheckEnabled, isCreatingTemplate, onTemplateDone, onTemplateCancel, isOnboardingEdit, onConfirmOnboarding, onCancelOnboarding, isTriggerEdit }) => {
  const { isOpen: isVirtualKeyboardOpen } = useVirtualKeyboard();
  const forumDisabledByUrl = webhookUrl.toLowerCase().includes('text-channel');
  const [webhookConfigOpen, setWebhookConfigOpen] = useState(true);
  const [isLoadingWebhook, setIsLoadingWebhook] = useState(false);

  const [showInvalidUrlModal, setShowInvalidUrlModal] = useState(false);
  const [showFileExplorer, setShowFileExplorer] = useState(false);
  const [previewFile, setPreviewFile] = useState<DiscordFile | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, fileId: string } | null>(null);
  const [fileSearchQuery, setFileSearchQuery] = useState('');
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [showFileControlsInfo, setShowFileControlsInfo] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ x1: number, y1: number, x2: number, y2: number } | null>(null);
  const explorerRef = useRef<HTMLDivElement>(null);
  const lastSelectedIndex = useRef<number | null>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [showEmbedReorder, setShowEmbedReorder] = useState(false);
  
  // Selection States
  const [embedSelectMode, setEmbedSelectMode] = useState(false);
  const [selectedEmbedIds, setSelectedEmbedIds] = useState<string[]>([]);
  const [showEmbedMenu, setShowEmbedMenu] = useState<number | null>(null);
  const [showTextMenu, setShowTextMenu] = useState(false);
  const [showDeleteAllEmbedsConfirm, setShowDeleteAllEmbedsConfirm] = useState(false);

  const [fieldSelectMode, setFieldSelectMode] = useState<{ [embedId: string]: boolean }>({});
  const [selectedFieldIds, setSelectedFieldIds] = useState<{ [embedId: string]: string[] }>({});
  const [showDeleteAllFieldsConfirm, setShowDeleteAllFieldsConfirm] = useState<string | null>(null);

  // Emoji Picker States
  const [botEmojis, setBotEmojis] = useState<{ id: string, name: string, animated: boolean, url: string, string: string }[]>([]);
  const [loadingEmojis, setLoadingEmojis] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [emojiSearchQuery, setEmojiSearchQuery] = useState('');
  const [activeEmojiTab, setActiveEmojiTab] = useState<'standard' | 'server'>('standard');

  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setEmojiPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchBotEmojis = async (retries = 3, delay = 2000) => {
      if (!isMounted) return;
      setLoadingEmojis(true);
      try {
        const res = await fetch('/api/bot/emojis');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data && data.emojis) {
            setBotEmojis(data.emojis);
          }
          if (isMounted) setLoadingEmojis(false);
        } else if (retries > 0) {
          if (isMounted) {
            setTimeout(() => fetchBotEmojis(retries - 1, delay * 1.5), delay);
          }
        } else {
          if (isMounted) setLoadingEmojis(false);
        }
      } catch (err) {
        if (retries > 0) {
          if (isMounted) {
            setTimeout(() => fetchBotEmojis(retries - 1, delay * 1.5), delay);
          }
        } else {
          console.warn('Unable to sync custom Discord emojis at this moment:', err);
          if (isMounted) setLoadingEmojis(false);
        }
      }
    };
    fetchBotEmojis();
    return () => {
      isMounted = false;
    };
  }, []);

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

  const updateMessage = React.useCallback((updates: Partial<DiscordWebhookMessage>) => {
    onChange({ ...message, ...updates });
  }, [message, onChange]);

  const addEmbed = () => {
    playButtonSound();
    const newEmbed: DiscordEmbed = {
      id: uuidv4(),
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
    const removedId = newEmbeds[index].id;
    newEmbeds.splice(index, 1);
    updateMessage({ embeds: newEmbeds });
    addLog(`Removed embed #${index + 1}`, 'warn');
    if (removedId) {
      setSelectedEmbedIds(prev => prev.filter(id => id !== removedId));
    }
  };

  const removeSelectedEmbeds = () => {
    if (selectedEmbedIds.length === 0) return;
    playDeleteSound();
    const newEmbeds = message.embeds?.filter(e => !e.id || !selectedEmbedIds.includes(e.id)) || [];
    updateMessage({ embeds: newEmbeds });
    addLog(`Removed ${selectedEmbedIds.length} embed(s)`, 'warn');
    setSelectedEmbedIds([]);
    setEmbedSelectMode(false);
  };

  const removeAllEmbeds = () => {
    playDeleteSound();
    updateMessage({ embeds: [] });
    addLog("Removed all embeds", 'error');
    setSelectedEmbedIds([]);
    setEmbedSelectMode(false);
    setShowDeleteAllEmbedsConfirm(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: DiscordFile[] = Array.from(e.target.files).map(file => ({
        id: uuidv4(),
        name: file.name,
        file: file,
        dataUrl: URL.createObjectURL(file),
        size: file.size,
        type: file.type,
        timestamp: new Date().toISOString()
      }));
      updateMessage({ files: [...(message.files || []), ...newFiles] });
      addLog(`Uploaded ${newFiles.length} file(s)`, 'success');
    }
  };

  const removeFile = (id: string) => {
    playButtonSound();
    const newFiles = message.files?.filter(f => f.id !== id) || [];
    const removed = message.files?.find(f => f.id === id);
    updateMessage({ files: newFiles });
    if (removed) {
        addLog(`Removed file: ${removed.name}`, 'warn');
        if (previewFile?.id === id) setPreviewFile(null);
        setSelectedFileIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  const removeSelectedFiles = React.useCallback(() => {
    if (selectedFileIds.length === 0) return;
    playDeleteSound();
    const newFiles = message.files?.filter(f => !selectedFileIds.includes(f.id)) || [];
    updateMessage({ files: newFiles });
    addLog(`Removed ${selectedFileIds.length} file(s)`, 'warn');
    setSelectedFileIds([]);
    setPreviewFile(null);
  }, [selectedFileIds, message.files, updateMessage, addLog]);

  const filteredFiles = useMemo(() => {
    if (!message.files) return [];
    if (!fileSearchQuery.trim()) return message.files;
    const query = fileSearchQuery.toLowerCase();
    return message.files.filter(f => f.name.toLowerCase().includes(query));
  }, [message.files, fileSearchQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showFileExplorer) return;
      
      // Ctrl + A
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        if (message.files) {
          setSelectedFileIds(message.files.map(f => f.id));
        }
      }
      
      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const target = e.target as HTMLElement;
        if (selectedFileIds.length > 0 && target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          removeSelectedFiles();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFileExplorer, selectedFileIds, message.files, removeSelectedFiles]);

  const [selectionMode, setSelectionMode] = useState(false);

  const handleFileClick = (e: React.MouseEvent | React.TouchEvent, file: DiscordFile, index: number) => {
    e.stopPropagation();
    
    const isMobile = window.innerWidth < 640;
    
    if (isMobile && !selectionMode) {
      // On mobile without selection mode, single tap just previews
      setPreviewFile(file);
      playButtonSound();
      return;
    }

    playButtonSound();
    
    if (e.nativeEvent instanceof MouseEvent && e.nativeEvent.shiftKey && lastSelectedIndex.current !== null) {
      // Range selection
      const start = Math.min(index, lastSelectedIndex.current);
      const end = Math.max(index, lastSelectedIndex.current);
      const rangeIds = filteredFiles.slice(start, end + 1).map(f => f.id);
      setSelectedFileIds(prev => Array.from(new Set([...prev, ...rangeIds])));
    } else if ((e.nativeEvent instanceof MouseEvent && (e.nativeEvent.ctrlKey || e.nativeEvent.metaKey)) || (isMobile && selectionMode)) {
      // Toggle single selection
      setSelectedFileIds(prev => 
        prev.includes(file.id) ? prev.filter(id => id !== file.id) : [...prev, file.id]
      );
    } else {
      // Single selection and preview
      if (selectedFileIds.includes(file.id) && selectedFileIds.length === 1) {
        setPreviewFile(file);
      } else {
        setSelectedFileIds([file.id]);
        setPreviewFile(file);
      }
    }
    lastSelectedIndex.current = index;
  };

  const handleFileLongPress = (id: string) => {
    if (window.innerWidth < 640) {
      setSelectionMode(true);
      setSelectedFileIds(prev => [...new Set([...prev, id])]);
      playButtonSound();
    }
  };

  const handleExplorerMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    if ((e.target as HTMLElement).closest('.file-item')) return;
    
    setSelectedFileIds([]);
    const rect = explorerRef.current?.getBoundingClientRect();
    if (rect) {
      setSelectionBox({
        x1: e.clientX - rect.left,
        y1: e.clientY - rect.top,
        x2: e.clientX - rect.left,
        y2: e.clientY - rect.top,
      });
    }
  };

  const handleExplorerMouseMove = (e: React.MouseEvent) => {
    if (selectionBox) {
      const rect = explorerRef.current?.getBoundingClientRect();
      if (rect) {
        const x2 = e.clientX - rect.left;
        const y2 = e.clientY - rect.top;
        setSelectionBox(prev => prev ? { ...prev, x2, y2 } : null);
        
        // Update selection based on box overlap
        const boxLeft = Math.min(selectionBox.x1, x2);
        const boxTop = Math.min(selectionBox.y1, y2);
        const boxRight = Math.max(selectionBox.x1, x2);
        const boxBottom = Math.max(selectionBox.y1, y2);
        
        const overlappingIds: string[] = [];
        const fileElements = explorerRef.current?.querySelectorAll('.file-item');
        fileElements?.forEach((el) => {
          const fileRect = el.getBoundingClientRect();
          const explorerRect = explorerRef.current?.getBoundingClientRect();
          if (explorerRect) {
            const elTop = fileRect.top - explorerRect.top;
            const elLeft = fileRect.left - explorerRect.left;
            const elBottom = elTop + fileRect.height;
            const elRight = elLeft + fileRect.width;
            
            if (!(elLeft > boxRight || elRight < boxLeft || elTop > boxBottom || elBottom < boxTop)) {
              const id = el.getAttribute('data-id');
              if (id) overlappingIds.push(id);
            }
          }
        });
        setSelectedFileIds(overlappingIds);
      }
    }
  };

  const handleExplorerMouseUp = () => {
    setSelectionBox(null);
  };

  const handleFileContextMenu = (e: React.MouseEvent, fileId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, fileId });
  };

  const closeContextMenu = () => setContextMenu(null);

  useEffect(() => {
    const handleGlobalClick = () => closeContextMenu();
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

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
    <div className="flex flex-col min-h-full space-y-6 text-sm pb-0">
      
      {/* Editing Banner */}
      {editingMessageId && (
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-900/20 border border-amber-800 rounded-2xl p-4 flex items-center justify-between shadow-sm"
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
      <div className="space-y-4 bg-[#121212] p-4 rounded-2xl border border-[#222] shadow-sm ring-1 ring-white/10 ring-inset">
        <div 
          className="flex items-center justify-between cursor-pointer group px-2"
          onClick={() => setWebhookConfigOpen(!webhookConfigOpen)}
        >
          <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <LinkIcon className="w-5 h-5" /> Webhook Configuration
          </h2>
          <div className="p-1 rounded-lg hover:bg-white/5 transition-colors">
            {webhookConfigOpen ? <ChevronUp className="w-5 h-5 text-zinc-500 group-hover:text-white" /> : <ChevronDown className="w-5 h-5 text-zinc-500 group-hover:text-white" />}
          </div>
        </div>
        
        {webhookConfigOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="space-y-4 overflow-hidden pt-2"
          >
            <div className="space-y-4 animate-in fade-in duration-200">
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
                      className={cn(
                        "transition-all duration-200 flex items-center justify-center",
                        "md:px-4 md:py-2 md:bg-cyan-500 md:hover:bg-cyan-400 md:text-black md:rounded-md md:font-bold md:min-w-[80px] md:shadow-[0_0_10px_rgba(6,182,212,0.2)]",
                        "bg-transparent md:bg-cyan-500",
                        (isLoadingWebhook || !webhookUrl) ? "opacity-50 cursor-not-allowed" : "hover:scale-105 active:scale-95"
                      )}
                    >
                      {isLoadingWebhook ? (
                        <div className="flex items-center justify-center w-6 h-6">
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                className="relative w-full h-full"
                            >
                                {[0, 1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className="absolute w-1.5 h-1.5 bg-current rounded-full"
                                        style={{
                                            top: '50%',
                                            left: '50%',
                                            transform: `rotate(${i * 90}deg) translate(7px) translate(-50%, -50%)`,
                                        }}
                                    />
                                ))}
                            </motion.div>
                        </div>
                      ) : (
                        <>
                          <span className="hidden md:inline">Load</span>
                          <div className="md:hidden flex items-center justify-center p-1">
                            <Send 
                              className={cn(
                                "w-6 h-6 transition-all",
                                !webhookUrl ? "text-zinc-600" : "text-white fill-white"
                              )} 
                            />
                          </div>
                        </>
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

                <div className="border-t border-white/5 pt-3 mt-3">
                  <div className="space-y-2">
                    <label className="block font-medium text-zinc-300">Thread ID Override</label>
                    <input
                      type="text"
                      value={message.thread_id || ''}
                      onChange={(e) => updateMessage({ thread_id: e.target.value.replace(/\D/g, '') })}
                      placeholder="e.g. 109827364510293847"
                      className="w-full bg-[#0a0a0a] border border-[#333] rounded-md px-3 py-2 focus:outline-none focus:border-cyan-500 text-white font-mono transition-all text-xs"
                    />
                    <p className="text-[10px] text-zinc-500">Routes the notification cleanly into an existing thread ID or forum post.</p>
                  </div>
                </div>
              </div>

            <div className="space-y-4 border-t border-[#222] pt-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <label className="block font-medium text-zinc-300">Forum / Post Settings</label>
                    {message.thread_name ? (
                        <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Forum Post Mode Active</span>
                    ) : (
                        <p className="text-[10px] text-zinc-500">
                          {forumDisabledByUrl ? "Disabled for Text Channels" : "Provide a title to enable forum mode"}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all",
                        message.thread_name ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400" : "bg-zinc-800/30 border-zinc-700/50 text-zinc-600"
                    )}>
                        {message.thread_name ? 'Post' : 'Message'}
                    </div>
                </div>
              </div>

              <div className="space-y-3 pl-2 border-l-2 border-[#222]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase text-zinc-500 tracking-wider">
                          Forum Post Title
                      </label>
                      <input
                          type="text"
                          disabled={!!editingMessageId || forumDisabledByUrl}
                          value={message.thread_name || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateMessage({ thread_name: val, forum_mode: !!val });
                          }}
                          placeholder="A descriptive title for your post..."
                          className="w-full bg-[#0a0a0a] border border-[#333] rounded-md px-3 py-2 focus:outline-none focus:border-cyan-500 text-white text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                  </div>
                  <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase text-zinc-500 tracking-wider">
                          Thread ID (Optional)
                      </label>
                      <input
                          type="text"
                          disabled={!!editingMessageId}
                          value={message.thread_id || ''}
                          onChange={(e) => updateMessage({ thread_id: e.target.value })}
                          placeholder="1234567890..."
                          className="w-full bg-[#0a0a0a] border border-[#333] rounded-md px-3 py-2 focus:outline-none focus:border-cyan-500 text-white text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                  </div>
                </div>

                {message.thread_name && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-3"
                    >
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase text-zinc-500 tracking-wider">Applied Tags (Comma Separated IDs)</label>
                            <input
                                type="text"
                                disabled={!!editingMessageId}
                                value={message.applied_tags?.join(', ') || ''}
                                onChange={(e) => {
                                    const tags = e.target.value.split(',').map(s => s.trim()).filter(s => s !== '');
                                    updateMessage({ applied_tags: tags });
                                }}
                                placeholder="123456789, 987654321"
                                className="w-full bg-[#0a0a0a] border border-[#333] rounded-md px-3 py-2 focus:outline-none focus:border-cyan-500 text-white text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                        <p className="text-[9px] text-zinc-600 font-medium">Providing a title converts the webhook payload to a forum post.</p>
                    </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Message Content */}
      <div className="space-y-4 bg-[#121212] p-4 rounded-2xl border border-[#222] shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <Type className="w-5 h-5" /> Message Content
          </h2>
          <div className="relative sm:hidden">
            <button 
              onClick={() => { setShowTextMenu(!showTextMenu); playButtonSound(); }}
              className={cn(
                "p-2 rounded-lg transition-all",
                showTextMenu ? "bg-cyan-500/10 text-cyan-400" : "text-zinc-500 hover:text-white hover:bg-white/5"
              )}
            >
              <Settings className="w-5 h-5" />
            </button>
            <AnimatePresence>
              {showTextMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a1a] border border-[#333] rounded-xl shadow-2xl py-1.5 z-[70] overflow-hidden"
                >
                  <button 
                    onClick={() => { updateMessage({ content: '' }); setShowTextMenu(false); playDeleteSound(); }}
                    className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500 hover:text-white flex items-center gap-3 transition-colors"
                  >
                    <Eraser className="w-4 h-4" /> Clear Content
                  </button>
                  <button 
                    onClick={() => { setShowTextMenu(false); playButtonSound(); }}
                    className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-cyan-500 hover:text-black flex items-center gap-3 transition-colors"
                  >
                    <Sparkles className="w-4 h-4" /> AI Enhance
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="relative group/editor">
          <textarea
            ref={contentRef}
            value={message.content || ''}
            onChange={(e) => updateMessage({ content: e.target.value })}
            placeholder="Type your message here..."
            rows={4}
            className="w-full bg-[#0a0a0a] border border-[#333] group-hover/editor:border-[#444] rounded-2xl px-4 py-4 pb-14 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 text-white resize-y min-h-[120px] transition-all shadow-inner"
            spellCheck={spellCheckEnabled}
            autoCorrect={autoCorrectEnabled ? "on" : "off"}
          />
          <div className="absolute bottom-3 right-3 flex items-center justify-end z-20 pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-2">
              <RichText3DotMenu 
                value={message.content || ''}
                onChange={(val) => updateMessage({ content: val })}
                textareaRef={contentRef}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Files */}
      <div className="space-y-4 bg-[#121212] p-4 rounded-2xl border border-[#222] shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
          <Paperclip className="w-5 h-5" /> Files
        </h2>
        <div className="space-y-4">
            <div className="flex flex-col gap-3">
                <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-[#333] rounded-2xl cursor-pointer hover:border-cyan-500 hover:bg-cyan-500/5 transition-colors">
                    <div className="flex flex-col items-center gap-2 text-zinc-500">
                        <Paperclip className="w-6 h-6" />
                        <span className="text-xs font-bold uppercase">Click to Upload Files</span>
                    </div>
                    <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                </label>

                <button 
                    onClick={() => { playButtonSound(); setShowFileExplorer(true); }}
                    className="flex items-center justify-center gap-2 p-3 bg-[#1e1e1e] border border-[#333] rounded-2xl hover:bg-[#252525] hover:border-cyan-500/50 transition-all text-zinc-400 hover:text-cyan-400 group"
                >
                    <Folder className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold uppercase">Open File Explorer</span>
                </button>
            </div>
        </div>
      </div>

      {/* Embeds */}
      <div className="space-y-4 bg-[#121212] p-4 rounded-2xl border border-[#222] shadow-sm ring-1 ring-white/10 ring-inset">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <ImageIcon className="w-5 h-5" /> Embeds
          </h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => { playButtonSound(); setShowEmbedMenu(showEmbedMenu === -1 ? null : -1); }}
                className={cn(
                  "w-10 h-10 flex items-center justify-center rounded-2xl transition-all active:scale-95",
                  (showEmbedMenu === -1 || embedSelectMode) ? "bg-cyan-500/20 text-cyan-400" : "bg-[#1e1e1e] text-zinc-500 hover:text-zinc-300"
                )}
                title="Embed Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              
              <AnimatePresence>
                {showEmbedMenu === -1 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a1a] border border-[#333] rounded-xl shadow-2xl py-1.5 z-50 overflow-hidden"
                  >
                    <button 
                      onClick={() => { 
                        setEmbedSelectMode(!embedSelectMode); 
                        setSelectedEmbedIds([]); 
                        setShowEmbedMenu(null); 
                        playButtonSound();
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-cyan-500 hover:text-black flex items-center gap-3 transition-colors"
                    >
                      <Layers className="w-4 h-4" /> {embedSelectMode ? 'Cancel Selection' : 'Select Multiple'}
                    </button>
                    
                    <button 
                      onClick={() => { 
                        setShowEmbedReorder(!showEmbedReorder); 
                        setShowEmbedMenu(null); 
                        playButtonSound();
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-cyan-500 hover:text-black flex items-center gap-3 transition-colors"
                    >
                      <GripVertical className="w-4 h-4" /> Reorder
                    </button>

                    {embedSelectMode && selectedEmbedIds.length > 0 && (
                      <button 
                        onClick={() => { removeSelectedEmbeds(); setShowEmbedMenu(null); }}
                        className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500 hover:text-white flex items-center gap-3 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" /> Delete Selected ({selectedEmbedIds.length})
                      </button>
                    )}
                    <button 
                      onClick={() => { setShowDeleteAllEmbedsConfirm(true); setShowEmbedMenu(null); playButtonSound(); }}
                      disabled={!message.embeds || message.embeds.length === 0}
                      className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-600 hover:text-white flex items-center gap-3 transition-colors disabled:opacity-30"
                    >
                      <Trash2 className="w-4 h-4" /> Delete All
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={addEmbed}
              className="flex items-center justify-center gap-2 md:px-4 md:py-2 w-10 h-10 md:w-auto bg-cyan-500 hover:bg-cyan-400 text-black rounded-full md:rounded-md text-sm font-bold transition-all shadow-[0_0_10px_rgba(6,182,212,0.2)] active:scale-95"
              title="Add Embed"
            >
              <Plus className="w-5 h-5 md:w-4 md:h-4 stroke-[3px]" /> 
              <span className="hidden md:inline">Add Embed</span>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showDeleteAllEmbedsConfirm && (
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
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">Delete All Embeds?</h3>
                        <p className="text-sm text-zinc-400">
                            This action cannot be undone. All {message.embeds?.length} embeds in this message will be permanently removed.
                        </p>
                        <div className="grid grid-cols-2 gap-3 pt-4">
                            <button 
                                onClick={() => setShowDeleteAllEmbedsConfirm(false)}
                                className="py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-2xl font-bold transition-all active:scale-95"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={removeAllEmbeds}
                                className="py-3 bg-red-500 hover:bg-red-400 text-white rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-red-500/20"
                            >
                                Delete All
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          <Reorder.Group 
            axis="y" 
            values={message.embeds || []} 
            onReorder={(newEmbeds) => updateMessage({ embeds: newEmbeds })}
            className="space-y-4"
          >
            {message.embeds?.map((embed, index) => (
              <Reorder.Item 
                key={embed.id || index}
                value={embed}
                drag={showEmbedReorder ? "y" : false}
                whileDrag={{ 
                    scale: 1.02, 
                    boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                    border: "2px solid rgba(6,182,212,0.5)",
                    zIndex: 50
                }}
                className={cn(
                    "relative transition-all duration-200",
                    showEmbedReorder && "hover:ring-1 hover:ring-cyan-500/30 rounded-2xl"
                )}
              >
                <EmbedEditorItem
                  index={index}
                  embed={embed}
                  onChange={(updates) => updateEmbed(index, updates)}
                  onRemove={() => removeEmbed(index)}
                  autoCorrectEnabled={autoCorrectEnabled}
                  spellCheckEnabled={spellCheckEnabled}
                  showReorder={showEmbedReorder}
                  selectMode={embedSelectMode}
                  isSelected={embed.id ? selectedEmbedIds.includes(embed.id) : false}
                  onToggleSelect={() => {
                    if (!embed.id) return;
                    setSelectedEmbedIds(prev => 
                      prev.includes(embed.id!) ? prev.filter(id => id !== embed.id) : [...prev, embed.id!]
                    );
                  }}
                  fieldSelectMode={fieldSelectMode[embed.id || ''] || false}
                  setFieldSelectMode={(mode) => setFieldSelectMode(prev => ({ ...prev, [embed.id || '']: mode }))}
                  selectedFieldIds={selectedFieldIds[embed.id || ''] || []}
                  setSelectedFieldIds={(ids) => setSelectedFieldIds(prev => ({ ...prev, [embed.id || '']: ids }))}
                  showDeleteAllFieldsConfirm={showDeleteAllFieldsConfirm === embed.id}
                  setShowDeleteAllFieldsConfirm={(show) => setShowDeleteAllFieldsConfirm(show ? embed.id || null : null)}
                />
              </Reorder.Item>
            ))}
          </Reorder.Group>
          {(!message.embeds || message.embeds.length === 0) && (
            <div className="text-center py-8 text-zinc-500 bg-[#121212] rounded-2xl border border-dashed border-[#333]">
              No embeds yet. Click "Add Embed" to create one.
            </div>
          )}
        </div>
      </div>

      {/* Components (Buttons) */}
      <div className="space-y-4 bg-[#121212] p-4 rounded-2xl border border-[#222] shadow-sm ring-1 ring-white/10 ring-inset">
        <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <MousePointerClick className="w-5 h-5" /> Components (Buttons)
            </h2>
            <button
                onClick={addComponent}
                className={cn(
                  "flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-cyan-500/10",
                  "bg-cyan-500 hover:bg-cyan-400 text-black border border-cyan-400/20",
                  "rounded-full p-3 sm:rounded-2xl sm:px-4 sm:py-2"
                )}
                title="Add New Row"
            >
                <Plus className="w-5 h-5 sm:w-4 sm:h-4 stroke-[3px]" /> 
                <span className="hidden sm:inline text-xs font-black uppercase tracking-widest">Add Row</span>
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
                 <button 
                    onClick={() => addButtonToRow(rowIndex)} 
                    className={cn(
                      "flex items-center justify-center gap-1.5 transition-all disabled:opacity-50",
                      "text-cyan-400 hover:text-white bg-cyan-400/5 hover:bg-cyan-500 p-2 sm:px-3 sm:py-1 rounded-lg border border-cyan-500/10"
                    )}
                    disabled={row.components.length >= 5}
                 >
                    <Plus className="w-4 h-4 sm:w-3 sm:h-3 stroke-[3px]" />
                    <span className="hidden sm:inline text-[10px] font-black uppercase tracking-wider">Button</span>
                 </button>
                 <button onClick={() => { playDeleteSound(); removeComponentRow(rowIndex); }} className="p-2 text-zinc-500 hover:text-red-400 transition-colors bg-white/5 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                        {row.components.map((btn, btnIndex) => (
                            <div key={btnIndex} className="flex flex-col lg:flex-row gap-2 lg:items-center bg-[#121212] p-3 rounded-lg border border-[#222] shadow-sm">
                                <div className="flex-1 flex gap-2 items-center">
                                    <div className="flex-1 space-y-1">
                                        <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider ml-1">Button Text</label>
                                        <input 
                                            value={btn.label} 
                                            onChange={(e) => updateComponent(rowIndex, btnIndex, { label: e.target.value })}
                                            className="w-full bg-transparent text-sm border-b border-[#333] focus:border-cyan-500 outline-none text-white transition-colors"
                                            placeholder="Label"
                                        />
                                    </div>
                                    <div className="w-32 shrink-0 space-y-1">
                                        <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider ml-1">Style</label>
                                        <CustomSelect
                                            value={btn.style}
                                            onChange={(val) => updateComponent(rowIndex, btnIndex, { style: val as 1 | 2 | 3 | 4 | 5 })}
                                            options={[
                                                { value: 1, label: 'Blurple', icon: <div className="w-3 h-3 rounded-full bg-[#5865F2]" /> },
                                                { value: 2, label: 'Grey', icon: <div className="w-3 h-3 rounded-full bg-[#4F545C]" /> },
                                                { value: 3, label: 'Green', icon: <div className="w-3 h-3 rounded-full bg-[#2D7D46]" /> },
                                                { value: 4, label: 'Red', icon: <div className="w-3 h-3 rounded-full bg-[#ED4245]" /> },
                                                { value: 5, label: 'Link', icon: <div className="w-3 h-3 rounded-full bg-[#4F545C]" /> },
                                            ]}
                                        />
                                    </div>
                                    <button onClick={() => { playDeleteSound(); removeButton(rowIndex, btnIndex); }} className="text-zinc-500 hover:text-red-400 transition-colors lg:hidden pt-4"><Trash2 className="w-4 h-4" /></button>
                                </div>
                                <div className="flex-1 flex gap-2 items-center">
                                    <div className="flex-1 space-y-1">
                                        <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider ml-1">URL (Redirect)</label>
                                        <input 
                                            value={btn.url || ''} 
                                            onChange={(e) => updateComponent(rowIndex, btnIndex, { url: e.target.value, style: 5 })}
                                            className="w-full bg-transparent text-sm border-b border-[#333] focus:border-cyan-500 outline-none p-1 text-white transition-colors"
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <button onClick={() => { playDeleteSound(); removeButton(rowIndex, btnIndex); }} className="text-zinc-500 hover:text-red-400 transition-colors hidden lg:block pt-4"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Auto Reactions */}
      <div className="space-y-4 bg-[#121212] p-4 rounded-2xl border border-[#222] shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
          <Smile className="w-5 h-5 text-cyan-400" /> Auto Reactions
        </h2>
        
        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 text-xs text-cyan-200 leading-relaxed shadow-[inset_0_1px_3px_rgba(0,255,255,0.05)]">
            <strong>Note:</strong> You must Invite The DWM companion in to your server (You invite it to your Discord From the Manue &gt; DWM Compnion Page) For Using This Feature.
        </div>

        <div className="space-y-2 relative" ref={emojiPickerRef}>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">Reactions to Add</label>
            <input 
                id="reaction-input-field"
                placeholder="Type emoji (e.g. 👍, 🚀) or use Picker" 
                className="w-full bg-[#0a0a0a] border border-[#333] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        const val = e.currentTarget.value.trim();
                        if (val) {
                            updateMessage({ auto_reactions: [...(message.auto_reactions || []), val] });
                            e.currentTarget.value = '';
                            playButtonSound();
                        }
                    }
                }}
            />
            
            <div className="flex gap-2 justify-end relative">
                {/* Emoji Picker toggle button with dynamic SVG */}
                <button 
                    type="button"
                    onClick={() => { playButtonSound(); setEmojiPickerOpen(!emojiPickerOpen); }}
                    className={cn(
                        "px-3.5 py-1.5 bg-[#1a1a1a] border rounded-md hover:bg-neutral-800 transition-all text-zinc-300 flex items-center justify-center gap-1.5 text-xs font-semibold",
                        emojiPickerOpen ? "border-cyan-500 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.15)]" : "border-[#333] hover:border-zinc-700"
                    )}
                    title="Open Emoji Picker"
                >
                    <Smile className="w-4 h-4 text-cyan-400" />
                    <span>Picker</span>
                </button>

                <button 
                  type="button"
                  onClick={() => {
                     const inputEl = document.getElementById('reaction-input-field') as HTMLInputElement;
                     if (inputEl && inputEl.value.trim()) {
                         updateMessage({ auto_reactions: [...(message.auto_reactions || []), inputEl.value.trim()] });
                         inputEl.value = '';
                         playButtonSound();
                     }
                  }} 
                  className="px-4 py-1.5 bg-cyan-600 border border-cyan-500 rounded-md text-sm font-bold hover:bg-cyan-500 text-white transition-colors"
                >
                  Add
                </button>

                {/* Dynamic Emoji Picker Dropdown */}
                <AnimatePresence>
                  {emojiPickerOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-[310px] bg-[#121212] border border-[#222] rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] z-50 flex flex-col h-[340px] overflow-hidden"
                    >
                      {/* Tabs */}
                      <div className="flex bg-[#161616] border-b border-[#222] shrink-0 text-xs text-white">
                        <button
                          type="button"
                          onClick={() => { playButtonSound(); setActiveEmojiTab('standard'); }}
                          className={cn(
                            "flex-1 py-2.5 font-bold uppercase tracking-wider border-b-2 text-[10px] transition-colors",
                            activeEmojiTab === 'standard' ? "border-cyan-500 text-cyan-400 bg-cyan-500/5" : "border-transparent text-zinc-500 hover:text-zinc-300"
                          )}
                        >
                          Popular Emojis
                        </button>
                        <button
                          type="button"
                          onClick={() => { playButtonSound(); setActiveEmojiTab('server'); }}
                          className={cn(
                            "flex-1 py-2.5 font-bold uppercase tracking-wider border-b-2 text-[10px] transition-colors",
                            activeEmojiTab === 'server' ? "border-cyan-500 text-cyan-400 bg-cyan-500/5" : "border-transparent text-zinc-500 hover:text-zinc-300"
                          )}
                        >
                          Server Emojis ({botEmojis.length})
                        </button>
                      </div>

                      {/* Search Bar */}
                      <div className="p-2 border-b border-[#222] shrink-0">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                          <input
                            type="text"
                            placeholder="Search emojis..."
                            value={emojiSearchQuery}
                            onChange={(e) => setEmojiSearchQuery(e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-[#222] text-xs rounded-lg pl-8 pr-2 py-1.5 text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                        {activeEmojiTab === 'standard' ? (
                          <div className="space-y-3 pb-2">
                            {STANDARD_EMOJI_CATEGORIES.map((cat, ci) => {
                              const filtered = cat.emojis.filter(e => 
                                !emojiSearchQuery || e.includes(emojiSearchQuery)
                              );
                              if (filtered.length === 0) return null;
                              return (
                                <div key={ci} className="space-y-1">
                                  <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">{cat.name}</div>
                                  <div className="grid grid-cols-8 gap-1.5">
                                    {filtered.map((emo, ei) => (
                                      <button
                                        key={ei}
                                        type="button"
                                        onClick={() => {
                                          updateMessage({ auto_reactions: [...(message.auto_reactions || []), emo] });
                                          playButtonSound();
                                        }}
                                        className="h-8 w-8 hover:bg-white/5 active:bg-cyan-500/20 rounded flex items-center justify-center text-lg transition-colors"
                                      >
                                        {emo}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="pb-2">
                            {loadingEmojis ? (
                              <div className="flex flex-col items-center justify-center py-12 text-zinc-500 text-xs">
                                <span className="animate-spin rounded-full h-5 w-5 border-2 border-t-cyan-500 border-zinc-700 mb-2"></span>
                                Loading server custom emojis...
                              </div>
                            ) : (
                              (() => {
                                const filtered = botEmojis.filter(e => 
                                  !emojiSearchQuery || e.name.toLowerCase().includes(emojiSearchQuery.toLowerCase())
                                );

                                if (filtered.length === 0) {
                                  return (
                                    <div className="text-center py-10 text-zinc-500 text-xs px-4 leading-relaxed mt-2 bg-[#09090b] border border-[#222] rounded-xl">
                                      <Webhook className="w-5 h-5 mx-auto text-zinc-600 mb-2 mt-1" />
                                      <p className="font-bold text-zinc-400 mb-1">No Server Emojis Found</p>
                                      <p className="text-[10px] text-zinc-500 leading-normal">
                                        Make sure the DWM Companion bot is fully connected and invited to your Discord servers to sync custom emojis here!
                                      </p>
                                    </div>
                                  );
                                }

                                return (
                                  <div className="space-y-1 text-left">
                                    <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1">DWM Guild Custom Emojis</div>
                                    <div className="grid grid-cols-6 gap-2">
                                      {filtered.map((e, idx) => (
                                        <button
                                          key={idx}
                                          type="button"
                                          onClick={() => {
                                            updateMessage({ auto_reactions: [...(message.auto_reactions || []), e.string] });
                                            playButtonSound();
                                          }}
                                          className="h-10 w-10 border border-[#222] hover:border-cyan-500 hover:bg-cyan-500/5 active:bg-cyan-500/20 rounded-lg flex items-center justify-center transition-all group"
                                          title={`:${e.name}:`}
                                        >
                                          {e.url ? (
                                            <img
                                              src={e.url}
                                              alt={e.name}
                                              className="h-6 w-6 object-contain"
                                              referrerPolicy="no-referrer"
                                            />
                                          ) : (
                                            <span className="text-xs text-zinc-400 font-mono truncate max-w-full">
                                              {e.name.substring(0, 3)}
                                            </span>
                                          )}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
            </div>
        </div>

        {/* Reactions List */}
        <div className="flex flex-wrap gap-2 pt-2 min-h-[60px]">
            {message.auto_reactions?.map((emoji, idx) => {
                const isCustom = emoji.startsWith('<') && emoji.endsWith('>');
                let emojiName = emoji;
                let emojiUrl = '';
                
                if (isCustom) {
                  const match = emoji.match(/:([a-zA-Z0-9_]+):([0-9]+)/);
                  if (match) {
                    emojiName = `:${match[1]}:`;
                    const id = match[2];
                    const isAnimated = emoji.startsWith('<a');
                    emojiUrl = `https://cdn.discordapp.com/emojis/${id}.${isAnimated ? 'gif' : 'png'}`;
                  }
                }

                return (
                    <motion.div 
                        key={idx} 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="bg-[#222] px-3 py-1.5 rounded-2xl flex items-center gap-2 text-sm border border-white/5 text-zinc-300 hover:border-cyan-500/50 transition-all font-mono shadow-sm"
                    >
                        {emojiUrl ? (
                          <img
                            src={emojiUrl}
                            alt={emojiName}
                            className="w-4 h-4 object-contain inline-block"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="text-base leading-none">{emoji}</span>
                        )}
                        <span className="text-[10px] text-zinc-400 max-w-[80px] truncate font-sans">{isCustom ? emojiName : ''}</span>
                        <button 
                            type="button"
                            onClick={() => {
                                playDeleteSound();
                                const newReactions = [...(message.auto_reactions || [])];
                                newReactions.splice(idx, 1);
                                updateMessage({ auto_reactions: newReactions });
                            }} 
                            className="text-zinc-600 hover:text-red-400 transition-colors bg-white/5 rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                        >
                            ×
                        </button>
                    </motion.div>
                );
            })}
            {(!message.auto_reactions || message.auto_reactions.length === 0) && (
                <div className="w-full flex flex-col items-center justify-center py-5 border border-dashed border-[#222] rounded-2xl text-zinc-600 gap-1.5 bg-[#0a0a0a]/50">
                    <Smile className="w-5 h-5 opacity-50 text-cyan-500/50" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Reactions Empty</span>
                </div>
            )}
        </div>
      </div>

      {/* Cleaned layout */}

      <motion.div 
        animate={{ 
          opacity: (isVirtualKeyboardOpen || showInvalidUrlModal || (showTextMenu && window.innerWidth < 640) || emojiPickerOpen) ? 0 : 1,
          y: (isVirtualKeyboardOpen || showInvalidUrlModal || (showTextMenu && window.innerWidth < 640) || emojiPickerOpen) ? 80 : 0,
          pointerEvents: (isVirtualKeyboardOpen || showInvalidUrlModal || (showTextMenu && window.innerWidth < 640) || emojiPickerOpen) ? 'none' : 'auto'
        }}
        transition={{ duration: 0.2 }}
        className={cn(
            "z-[60] mt-auto sticky", 
            "bottom-0", 
            "px-4 lg:px-6 pb-4 lg:pb-6 pt-6 w-[calc(100%+2rem)] lg:w-[calc(100%+3rem)] -mx-4 lg:-mx-6 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent shadow-[0_-20px_40px_-10px_rgba(0,0,0,0.5)]"
        )}
      >
        <div className="flex gap-3 max-w-2xl mx-auto w-full pointer-events-auto md:max-w-none">
          {isOnboardingEdit ? (
            <div className="flex gap-4 w-full">
              {isTriggerEdit ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      playButtonSound();
                      onCancelOnboarding?.();
                    }}
                    className="hidden sm:flex flex-1 py-4 rounded-2xl font-black text-[#ff4a4a] bg-[#222] border border-[#ff4a4a]/20 hover:border-[#ff4a4a]/40 hover:bg-[#282828] transition-all active:scale-95 cursor-pointer items-center justify-center gap-2 uppercase tracking-widest text-xs min-h-[60px]"
                  >
                    <X className="w-5 h-5 text-rose-500" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playButtonSound();
                      onCancelOnboarding?.();
                    }}
                    className="flex sm:hidden w-15 py-4 rounded-2xl font-black text-[#ff4a4a] bg-[#222] border border-[#ff4a4a]/20 hover:border-[#ff4a4a]/40 hover:bg-[#282828] transition-all active:scale-95 cursor-pointer items-center justify-center min-h-[60px]"
                    aria-label="Cancel"
                  >
                    <X className="w-6 h-6 text-rose-500" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    playButtonSound();
                    onCancelOnboarding?.();
                  }}
                  className="flex-1 py-4 rounded-2xl font-black text-[#ff4a4a] bg-[#222] border border-[#ff4a4a]/20 hover:border-[#ff4a4a]/40 hover:bg-[#282828] transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 uppercase tracking-widest text-xs min-h-[60px]"
                >
                  <X className="w-5 h-5 text-rose-500" />
                  Cancel Setup
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  playSendSound();
                  onConfirmOnboarding?.();
                }}
                className={cn(
                  "flex-1 py-4 rounded-2xl font-black text-white transition-all shadow-lg active:scale-95 cursor-pointer flex items-center justify-center gap-2 uppercase tracking-widest text-xs min-h-[60px]",
                  isTriggerEdit ? "bg-cyan-600 hover:bg-cyan-500 shadow-cyan-950/20" : "bg-[#5865F2] hover:bg-indigo-500 shadow-indigo-950/20"
                )}
              >
                {isTriggerEdit ? (
                  <>
                    <Check className="w-5 h-5 text-white" />
                    Confirm Message
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 text-emerald-400" />
                    Confirm Layout
                  </>
                )}
              </button>
            </div>
          ) : isCreatingTemplate ? (
            <div className="flex gap-3 w-full">
              <button
                onClick={onTemplateCancel}
                className="flex-shrink-0 px-6 py-4 rounded-2xl font-bold text-zinc-300 bg-[#222] border border-white/5 hover:bg-[#282828] transition-all shadow-xl active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={onTemplateDone}
                className="flex-1 py-4 rounded-2xl font-black text-white bg-purple-600 hover:bg-purple-500 transition-all shadow-lg active:scale-95 uppercase tracking-widest text-xs"
              >
                Create Template
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
               <div className="flex gap-3 w-full">
                  {editingMessageId && (
                      <button
                          onClick={() => {
                              playButtonSound();
                              onCancelEdit?.();
                          }}
                          className="flex-shrink-0 px-6 py-4 rounded-2xl font-bold text-zinc-300 bg-[#222] border border-white/5 hover:bg-[#282828] transition-all shadow-xl active:scale-95"
                      >
                          <X className="w-5 h-5" />
                      </button>
                  )}
                  {!emojiPickerOpen && (
                    <button
                      onClick={() => { 
                        playSendSound(); 
                        onSend();
                      }}
                      disabled={isSending || !webhookUrl}
                      className={cn(
                        "flex-1 py-4 rounded-2xl min-h-[64px]",
                        "font-black text-sm uppercase tracking-[0.25em] transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-4 group overflow-hidden relative",
                        !webhookUrl 
                          ? "bg-white/5 backdrop-blur-2xl border border-white/5 text-white/20 cursor-not-allowed" 
                          : isSending 
                          ? "bg-cyan-500 cursor-wait animate-pulse text-white shadow-[0_0_50px_rgba(6,182,212,0.8)]" 
                          : editingMessageId 
                          ? "bg-amber-400 hover:bg-amber-300 text-black shadow-[0_0_25px_rgba(251,191,36,0.3)]" 
                          : "bg-gradient-to-r from-cyan-600 via-cyan-500 to-cyan-400 hover:scale-[1.02] shadow-[0_20px_50px_-12px_rgba(6,182,212,0.5)] border border-cyan-400/50"
                      )}
                    >
                      {/* Glossy overlay */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      {isSending ? (
                        <>
                          <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <Send className={cn(
                            "w-6 h-6 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1", 
                            !webhookUrl ? "text-white/20" : "fill-current text-white"
                          )} />
                          <span className={cn(
                            !webhookUrl ? "text-white/20" : "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
                          )}>
                            {editingMessageId ? "Update Message" : "Send Webhook"}
                          </span>
                        </>
                      )}
                    </button>
                  )}
               </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Invalid Webhook URL Modal */}
      {/* Invalid Webhook URL Modal */}
      <AnimatePresence>
        {showInvalidUrlModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="bg-[#121212] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-[#333]"
            >
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">
                  Unrecognized URL
                </h3>
                <p className="text-zinc-400 mb-6">
                  Your given Webhook URL was not found in our database or has an invalid structure. Please check the URL and try again.
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
      
      {/* File Explorer Modal */}
      <AnimatePresence>
        {showFileExplorer && (
          <div className="fixed inset-0 z-[150] flex flex-col bg-[#050505]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col h-full overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-[#222] bg-[#0a0a0a] z-20">
                <div className="flex items-center justify-between mb-4 md:mb-0">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-cyan-500/10 rounded-lg">
                                <Folder className="w-5 h-5 text-cyan-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white leading-none">File Explorer</h3>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1 font-bold">Manage uploads ({message.files?.length || 0})</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Controls Helper Icon */}
                                <button 
                                onClick={() => setShowFileControlsInfo(true)}
                                className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors relative group"
                                title="Shortcuts & Controls"
                                >
                                <Book className="w-5 h-5" />
                                <div className="absolute -top-1 -right-1 bg-cyan-500 rounded-full w-3.5 h-3.5 border-2 border-[#0a0a0a] flex items-center justify-center">
                                    <span className="text-[8px] font-black text-black leading-none">?</span>
                                </div>
                                </button>
                            </div>
                        </div>

                        <button 
                        onClick={() => { 
                          setShowFileExplorer(false); 
                          setSelectedFileIds([]); 
                          setPreviewFile(null);
                          setSelectionMode(false);
                        }}
                        className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors"
                        >
                        <X className="w-7 h-7" />
                        </button>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input 
                                type="text"
                                placeholder="Search files..."
                                value={fileSearchQuery}
                                onChange={(e) => setFileSearchQuery(e.target.value)}
                                className="w-full bg-[#121212] border border-[#222] rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                        </div>
                        {selectionMode && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onClick={() => { setSelectionMode(false); setSelectedFileIds([]); }}
                                className="flex items-center gap-2 px-3 py-2 bg-zinc-500/10 hover:bg-zinc-500/20 text-zinc-400 border border-zinc-500/30 rounded-lg text-xs font-bold transition-all whitespace-nowrap"
                            >
                                Cancel Selection
                            </motion.button>
                        )}
                        {selectedFileIds.length > 0 && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onClick={removeSelectedFiles}
                                className="flex items-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-lg text-xs font-bold transition-all whitespace-nowrap"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Remove Selected ({selectedFileIds.length})
                            </motion.button>
                        )}
                    </div>
              </div>

              {/* Explorer Content */}
              <div 
                ref={explorerRef}
                onMouseDown={handleExplorerMouseDown}
                onMouseMove={handleExplorerMouseMove}
                onMouseUp={handleExplorerMouseUp}
                onMouseLeave={handleExplorerMouseUp}
                className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-cyan-500/5 via-transparent to-transparent relative"
              >
                {/* Selection Box */}
                {selectionBox && !isVirtualKeyboardOpen && (
                    <div 
                        className="absolute bg-cyan-500/10 border border-cyan-500/30 pointer-events-none z-50"
                        style={{
                            left: Math.min(selectionBox.x1, selectionBox.x2),
                            top: Math.min(selectionBox.y1, selectionBox.y2),
                            width: Math.abs(selectionBox.x2 - selectionBox.x1),
                            height: Math.abs(selectionBox.y2 - selectionBox.y1),
                        }}
                    />
                )}

                {(!message.files || message.files.length === 0) ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-4">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                            <FileIcon className="w-10 h-10 opacity-20" />
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-bold text-zinc-400">No files found</p>
                            <p className="text-sm">Upload some files to see them here.</p>
                        </div>
                    </div>
                ) : filteredFiles.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                        <p className="text-lg font-bold text-zinc-400">No matches found</p>
                        <p className="text-sm">Try searching for something else.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 md:gap-6 select-none">
                        {filteredFiles.map((file, idx) => (
                           <motion.div
                             key={file.id}
                             data-id={file.id}
                             onClick={(e) => handleFileClick(e, file, idx)}
                             onTouchStart={() => {
                               const timer = setTimeout(() => handleFileLongPress(file.id), 500);
                               const clearTimer = () => clearTimeout(timer);
                               window.addEventListener('touchend', clearTimer, { once: true });
                               window.addEventListener('touchmove', clearTimer, { once: true });
                             }}
                             onContextMenu={(e) => handleFileContextMenu(e, file.id)}
                             className={cn(
                                "file-item group relative bg-[#121212] border rounded-xl overflow-hidden cursor-pointer transition-all duration-200",
                                selectedFileIds.includes(file.id) 
                                    ? "border-cyan-500 bg-cyan-500/5 shadow-[0_0_20px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/50" 
                                    : "border-[#222] hover:border-zinc-700 hover:bg-[#181818]"
                             )}
                           >
                              {/* Selection Indicator */}
                              <div className={cn(
                                "absolute top-2 left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all z-10",
                                selectedFileIds.includes(file.id) 
                                    ? "bg-cyan-500 border-cyan-500" 
                                    : "bg-black/50 border-white/20 opacity-0 group-hover:opacity-100"
                              )}>
                                {selectedFileIds.includes(file.id) && <div className="w-2 h-2 bg-black rounded-full" />}
                              </div>

                              {/* Preview Area */}
                              <div className="aspect-square bg-black flex items-center justify-center relative overflow-hidden">
                                {file.type?.startsWith('image/') ? (
                                    <img src={file.dataUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" draggable={false} />
                                ) : file.type?.startsWith('video/') ? (
                                    <div className="relative w-full h-full">
                                        <video src={file.dataUrl} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                            <Eye className="w-6 h-6 text-white/50" />
                                        </div>
                                    </div>
                                ) : (
                                    <FileIcon className="w-10 h-10 text-zinc-700" />
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity" />
                              </div>
                              
                              {/* Details */}
                              <div className="p-3">
                                <p className="text-xs font-bold text-white truncate mb-1">{file.name}</p>
                                <div className="flex items-center justify-between text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">
                                    <span>{formatBytes(file.size || 0)}</span>
                                    <span>{file.timestamp ? new Date(file.timestamp).toLocaleDateString() : ''}</span>
                                </div>
                              </div>
                           </motion.div>
                        ))}
                    </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Controls Help Popup */}
      <AnimatePresence>
        {showFileControlsInfo && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-[#121212] border border-[#333] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
                >
                    <div className="p-4 bg-[#181818] border-b border-[#333] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Info className="w-4 h-4 text-cyan-400" />
                            <h4 className="font-bold text-white">Explorer Controls</h4>
                        </div>
                        <button onClick={() => setShowFileControlsInfo(false)} className="text-zinc-500 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="bg-[#222] px-2 py-1 rounded text-[10px] font-mono text-zinc-300">Shift + Click</div>
                            <p className="text-xs text-zinc-400 leading-tight">Select range of files</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="bg-[#222] px-2 py-1 rounded text-[10px] font-mono text-zinc-300">Ctrl + A</div>
                            <p className="text-xs text-zinc-400 leading-tight">Select all files in explorer</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="bg-[#222] px-2 py-1 rounded text-[10px] font-mono text-zinc-300">Drag Box</div>
                            <p className="text-xs text-zinc-400 leading-tight">Click and drag in empty space to select multiple</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="bg-[#222] px-2 py-1 rounded text-[10px] font-mono text-zinc-300">Delete / BKSP</div>
                            <p className="text-xs text-zinc-400 leading-tight">Remove all currently selected files</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="bg-[#222] px-2 py-1 rounded text-[10px] font-mono text-zinc-300">Right Click</div>
                            <p className="text-xs text-zinc-400 leading-tight">Open context menu for options</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="bg-[#222] px-2 py-1 rounded text-[10px] font-mono text-zinc-300">Long Press</div>
                            <p className="text-xs text-zinc-400 leading-tight">Select file on touch devices</p>
                        </div>
                    </div>
                    <div className="p-4 bg-[#181818] flex justify-center">
                        <button 
                            onClick={() => setShowFileControlsInfo(false)}
                            className="text-xs font-bold uppercase text-zinc-500 hover:text-cyan-400 transition-colors"
                        >
                            Got it
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* File Preview Overlay */}
      <AnimatePresence>
        {previewFile && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/95">
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setPreviewFile(null)}
                    className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-[130]"
                >
                    <X className="w-8 h-8" />
                </motion.button>

                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="max-w-4xl max-h-[90vh] flex flex-col items-center gap-6"
                >
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                        {previewFile.type?.startsWith('image/') ? (
                            <img src={previewFile.dataUrl} className="max-w-full max-h-[70vh] object-contain" />
                        ) : previewFile.type?.startsWith('video/') ? (
                            <video src={previewFile.dataUrl} controls autoPlay className="max-w-full max-h-[70vh]" />
                        ) : previewFile.type?.startsWith('audio/') ? (
                            <div className="bg-[#181818] p-12 flex flex-col items-center gap-6 rounded-2xl border border-zinc-800 min-w-[300px]">
                                <Webhook className="w-16 h-16 text-cyan-500 animate-pulse" />
                                <audio src={previewFile.dataUrl} controls autoPlay className="w-full" />
                            </div>
                        ) : (
                            <div className="bg-[#181818] p-20 flex flex-col items-center gap-6 rounded-2xl border border-zinc-800">
                                <FileIcon className="w-24 h-24 text-zinc-600" />
                                <div className="text-center">
                                    <p className="text-xl font-bold text-white">{previewFile.name}</p>
                                    <p className="text-sm text-zinc-500 mt-2 uppercase tracking-widest">{previewFile.type}</p>
                                </div>
                                <a 
                                    href={previewFile.dataUrl} 
                                    download={previewFile.name}
                                    className="flex items-center gap-2 px-6 py-3 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 transition-colors"
                                >
                                    <Download className="w-5 h-5" /> Download File
                                </a>
                            </div>
                        )}
                    </div>

                    <div className="text-center space-y-1">
                        <h4 className="text-2xl font-bold text-white">{previewFile.name}</h4>
                        <div className="flex items-center justify-center gap-4 text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
                            <span>{formatBytes(previewFile.size || 0)}</span>
                            <span>•</span>
                            <span>{previewFile.type}</span>
                            <span>•</span>
                            <span>{previewFile.timestamp ? new Date(previewFile.timestamp).toLocaleString() : ''}</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{ top: contextMenu.y, left: contextMenu.x }}
                className="fixed z-[200] bg-[#1a1a1a] border border-[#333] rounded-xl shadow-2xl py-1.5 min-w-[160px] overflow-hidden"
            >
                <button 
                  onClick={() => {
                    const file = message.files?.find(f => f.id === contextMenu.fileId);
                    if (file) setPreviewFile(file);
                    closeContextMenu();
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-cyan-500 hover:text-black flex items-center gap-3 transition-colors"
                >
                    <Eye className="w-4 h-4" /> Open
                </button>
                <div className="h-px bg-[#333] my-1" />
                <button 
                  onClick={() => {
                    if (selectedFileIds.includes(contextMenu.fileId)) {
                        removeSelectedFiles();
                    } else {
                        removeFile(contextMenu.fileId);
                    }
                    closeContextMenu();
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500 hover:text-white flex items-center gap-3 transition-colors"
                >
                    <Trash2 className="w-4 h-4" /> {selectedFileIds.length > 1 && selectedFileIds.includes(contextMenu.fileId) ? `Remove All (${selectedFileIds.length})` : 'Remove'}
                </button>
            </motion.div>
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
  showReorder?: boolean;
  selectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  fieldSelectMode: boolean;
  setFieldSelectMode: (mode: boolean) => void;
  selectedFieldIds: string[];
  setSelectedFieldIds: (ids: string[]) => void;
  showDeleteAllFieldsConfirm: boolean;
  setShowDeleteAllFieldsConfirm: (show: boolean) => void;
}> = ({ 
  index, 
  embed, 
  onChange, 
  onRemove, 
  autoCorrectEnabled, 
  spellCheckEnabled, 
  showReorder, 
  selectMode, 
  isSelected, 
  onToggleSelect,
  fieldSelectMode,
  setFieldSelectMode,
  selectedFieldIds,
  setSelectedFieldIds,
  showDeleteAllFieldsConfirm,
  setShowDeleteAllFieldsConfirm
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [collapsedFieldIds, setCollapsedFieldIds] = useState<number[]>([]);
  const [showFieldReorder, setShowFieldReorder] = useState(false);
  const [showFieldMenuDropdown, setShowFieldMenuDropdown] = useState(false);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);

  const toggleField = (fIdx: number) => {
    setCollapsedFieldIds(prev => 
      prev.includes(fIdx) ? prev.filter(id => id !== fIdx) : [...prev, fIdx]
    );
  };

  const addField = () => {
    const newFieldIdx = (embed.fields?.length || 0);
    const newField = { id: uuidv4(), name: 'New Field', value: 'Value', inline: true };
    onChange({ fields: [...(embed.fields || []), newField] });
    // Default new fields to closed
    setCollapsedFieldIds(prev => [...prev, newFieldIdx]);
  };

  const removeSelectedFields = () => {
    if (selectedFieldIds.length === 0) return;
    playDeleteSound();
    const newFields = embed.fields?.filter(f => !f.id || !selectedFieldIds.includes(f.id)) || [];
    onChange({ fields: newFields });
    setSelectedFieldIds([]);
    setFieldSelectMode(false);
  };

  const removeAllFields = () => {
    playDeleteSound();
    onChange({ fields: [] });
    setSelectedFieldIds([]);
    setFieldSelectMode(false);
    setShowDeleteAllFieldsConfirm(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
      onClick={() => {
        if (selectMode && onToggleSelect) {
          onToggleSelect();
        }
      }}
      className={cn(
        "bg-[#121212] rounded-2xl border shadow-sm ring-1 ring-white/5 ring-inset transition-all",
        isExpanded ? "overflow-visible" : "overflow-hidden",
        isSelected ? "border-cyan-500 ring-cyan-500/20 bg-cyan-500/5" : "border-[#333]"
      )}
    >
      <div 
        className={cn(
            "flex items-center justify-between p-3 border-b select-none group",
            isSelected ? "bg-cyan-500/10 border-cyan-500/30" : "bg-[#0a0a0a] border-[#333]",
            !selectMode && "cursor-pointer"
        )}
        onClick={() => {
            if (selectMode) return;
            setIsExpanded(!isExpanded);
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {selectMode ? (
            <div className={cn(
                "w-5 h-5 rounded-lg border flex items-center justify-center transition-all",
                isSelected ? "bg-cyan-500 border-cyan-500 text-black" : "border-white/10 bg-black/40"
            )}>
                {isSelected && <Check className="w-3.5 h-3.5 stroke-[4px]" />}
            </div>
          ) : showReorder && (
            <div className="cursor-grab active:cursor-grabbing p-1 text-zinc-600 hover:text-zinc-400 group-hover:bg-white/5 rounded transition-all">
              <GripVertical className="w-4 h-4" />
            </div>
          )}
          <div className="w-4 h-4 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: intToHex(embed.color) }} />
          <span className="font-medium text-white shrink-0">Embed #{index + 1}</span>
          <span className="text-xs text-zinc-500 truncate block md:max-w-[200px]">
            {embed.title ? (
              <span className="md:hidden">
                {embed.title.split(' ').length > 8 ? embed.title.split(' ').slice(0, 8).join(' ') + '...' : embed.title}
              </span>
            ) : null}
            {embed.title ? (
              <span className="hidden md:inline">
                {embed.title}
              </span>
            ) : <span className="text-zinc-600">(No title)</span>}
          </span>
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
            <div className="relative group/editor">
              <textarea
                ref={descriptionRef}
                value={embed.description || ''}
                onChange={(e) => onChange({ description: e.target.value })}
                rows={3}
                className="w-full bg-[#0a0a0a] border border-[#333] rounded-md px-3 py-2 pb-10 text-sm text-white resize-y focus:outline-none focus:border-cyan-500 transition-colors"
                spellCheck={spellCheckEnabled}
                autoCorrect={autoCorrectEnabled ? "on" : "off"}
              />
              <div className="absolute bottom-2 right-2 flex items-center justify-end z-20 pointer-events-none">
                <div className="pointer-events-auto">
                  <RichText3DotMenu 
                    value={embed.description || ''}
                    onChange={(val) => onChange({ description: val })}
                    textareaRef={descriptionRef}
                  />
                </div>
              </div>
            </div>
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

          <div className="space-y-4 mt-6">
            <div className="flex items-center justify-between px-1">
               <div className="flex items-center gap-2">
                  <div 
                    className="w-1.5 h-1.5 rounded-full" 
                    style={{ 
                      backgroundColor: intToHex(embed.color || 0),
                      boxShadow: `0 0 8px ${intToHex(embed.color || 0)}`
                    }}
                  />
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Embed Fields</label>
               </div>
             <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    onClick={() => { playButtonSound(); setShowFieldMenuDropdown(!showFieldMenuDropdown); }}
                    className={cn(
                      "flex items-center justify-center w-10 h-10 md:w-10 md:h-10 rounded-full transition-all active:scale-95",
                      (showFieldMenuDropdown || fieldSelectMode) ? "bg-cyan-500/20 text-cyan-400" : "bg-[#1e1e1e] text-zinc-500 hover:text-zinc-300"
                    )}
                    title="Field Settings"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>

                  <AnimatePresence>
                    {showFieldMenuDropdown && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a1a] border border-[#333] rounded-xl shadow-2xl py-1.5 z-50 overflow-hidden"
                      >
                        <button 
                          onClick={() => { 
                            setFieldSelectMode(!fieldSelectMode); 
                            setSelectedFieldIds([]); 
                            setShowFieldMenuDropdown(false); 
                            playButtonSound();
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-cyan-500 hover:text-black flex items-center gap-3 transition-colors"
                        >
                          <Layers className="w-4 h-4" /> {fieldSelectMode ? 'Cancel Selection' : 'Select Multiple'}
                        </button>
                        
                        <button 
                          onClick={() => { 
                            setShowFieldReorder(!showFieldReorder); 
                            setShowFieldMenuDropdown(false); 
                            playButtonSound();
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-cyan-500 hover:text-black flex items-center gap-3 transition-colors"
                        >
                          <GripVertical className="w-4 h-4" /> Reorder
                        </button>

                        {fieldSelectMode && selectedFieldIds.length > 0 && (
                          <button 
                            onClick={() => { removeSelectedFields(); setShowFieldMenuDropdown(false); }}
                            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500 hover:text-white flex items-center gap-3 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" /> Delete Selected ({selectedFieldIds.length})
                          </button>
                        )}
                        <button 
                          onClick={() => { setShowDeleteAllFieldsConfirm(true); setShowFieldMenuDropdown(false); playButtonSound(); }}
                          disabled={!embed.fields || embed.fields.length === 0}
                          className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-600 hover:text-white flex items-center gap-3 transition-colors disabled:opacity-30"
                        >
                          <Trash2 className="w-4 h-4" /> Delete All
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <AnimatePresence>
                  {showDeleteAllFieldsConfirm && (
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
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Delete All Fields?</h3>
                                <p className="text-sm text-zinc-400">
                                    This action cannot be undone. All {embed.fields?.length} fields in this embed will be permanently removed.
                                </p>
                                <div className="grid grid-cols-2 gap-3 pt-4">
                                    <button 
                                        onClick={() => setShowDeleteAllFieldsConfirm(false)}
                                        className="py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-2xl font-bold transition-all active:scale-95"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={removeAllFields}
                                        className="py-3 bg-red-500 hover:bg-red-400 text-white rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-red-500/20"
                                    >
                                        Delete All
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                <button
                  onClick={addField}
                  className="flex items-center justify-center gap-2 text-[10px] text-black bg-cyan-400 hover:bg-white font-black uppercase tracking-widest transition-all w-10 h-10 md:w-auto md:px-4 md:py-2 rounded-full shadow-lg shadow-cyan-500/10 active:scale-95"
                  title="Create Field"
                >
                  <Plus className="w-5 h-5 md:w-3.5 md:h-3.5 stroke-[3px]" />
                  <span className="hidden md:inline">Create Field</span>
                </button>
             </div>
            </div>
            <div className="space-y-4">
              <Reorder.Group 
                axis="y" 
                values={embed.fields || []} 
                onReorder={(newFields) => onChange({ fields: newFields })}
                className="space-y-3"
              >
                {embed.fields?.map((field, fIndex) => (
                    <Reorder.Item 
                        key={field.id || fIndex} 
                        value={field}
                        drag={showFieldReorder ? "y" : false}
                        whileDrag={{ 
                            scale: 1.02, 
                            boxShadow: "0 15px 30px rgba(0,0,0,0.4)",
                            border: "1px solid rgba(6,182,212,0.5)",
                            zIndex: 50
                        }}
                        className={cn(
                            "relative transition-all duration-200",
                            showFieldReorder && "hover:ring-1 hover:ring-cyan-500/30 rounded-2xl"
                        )}
                    >
                        <FieldItemEditor 
                            fIndex={fIndex}
                            field={field}
                            embed={embed}
                            onChange={onChange}
                            toggleField={toggleField}
                            isFieldCollapsed={collapsedFieldIds.includes(fIndex)}
                            spellCheckEnabled={spellCheckEnabled}
                            autoCorrectEnabled={autoCorrectEnabled}
                            showReorder={showFieldReorder}
                            selectMode={fieldSelectMode}
                            isSelected={field.id ? selectedFieldIds.includes(field.id) : false}
                            onToggleSelect={() => {
                                if (!field.id) return;
                                setSelectedFieldIds(
                                    selectedFieldIds.includes(field.id)
                                        ? selectedFieldIds.filter(id => id !== field.id)
                                        : [...selectedFieldIds, field.id]
                                );
                            }}
                        />
                    </Reorder.Item>
                ))}
              </Reorder.Group>
            </div>
          </div>

        </div>
      )}
    </motion.div>
  );
};

const FieldItemEditor: React.FC<{
    fIndex: number;
    field: { name: string; value: string; inline?: boolean };
    embed: DiscordEmbed;
    onChange: (updates: Partial<DiscordEmbed>) => void;
    toggleField: (idx: number) => void;
    isFieldCollapsed: boolean;
    spellCheckEnabled?: boolean;
    autoCorrectEnabled?: boolean;
    showReorder?: boolean;
    selectMode?: boolean;
    isSelected?: boolean;
    onToggleSelect?: () => void;
}> = ({ fIndex, field, embed, onChange, toggleField, isFieldCollapsed, spellCheckEnabled, autoCorrectEnabled, showReorder, selectMode, isSelected, onToggleSelect }) => {
    const valueRef = useRef<HTMLTextAreaElement | null>(null);
    return (
        <div 
            onClick={() => {
                if (selectMode && onToggleSelect) {
                    onToggleSelect();
                }
            }}
            className={cn(
                "rounded-2xl border shadow-sm transition-all",
                isFieldCollapsed ? "overflow-hidden" : "overflow-visible",
                isSelected ? "border-cyan-500 bg-cyan-500/10" : "bg-[#0a0a0a] border-[#222]"
            )}
        >
            {/* Field Header */}
            <div 
                className={cn(
                    "flex items-center justify-between p-2 select-none group",
                    isSelected ? "bg-cyan-500/10" : "bg-[#121212]/50",
                    !selectMode && "cursor-pointer"
                )}
                onClick={() => {
                    if (selectMode) return;
                    toggleField(fIndex);
                }}
            >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {selectMode ? (
                        <div className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center transition-all",
                            isSelected ? "bg-cyan-500 border-cyan-500 text-black" : "border-white/10 bg-black/40"
                        )}>
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[4px]" />}
                        </div>
                    ) : showReorder && (
                        <div className="cursor-grab active:cursor-grabbing p-1 text-zinc-600 hover:text-zinc-400 group-hover:bg-white/5 rounded transition-all">
                            <GripVertical className="w-4 h-4" />
                        </div>
                    )}
                    {!selectMode && (
                        <div className="p-1 bg-[#222] rounded text-zinc-500 group-hover:text-cyan-400 transition-colors">
                            {isFieldCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                        </div>
                    )}
                    <span className="text-[10px] font-black uppercase text-zinc-500 truncate tracking-wider">
                        {field.name || `Field #${fIndex + 1}`}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            playDeleteSound();
                            const newFields = [...(embed.fields || [])];
                            newFields.splice(fIndex, 1);
                            onChange({ fields: newFields });
                        }}
                        className="p-1 text-zinc-600 hover:text-red-400 transition-colors"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Field Content */}
            {!isFieldCollapsed && (
                <div className="p-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 gap-3">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-zinc-600 tracking-widest ml-1">Field Name</label>
                            <input
                                type="text"
                                value={field.name}
                                onChange={(e) => {
                                    const newFields = [...(embed.fields || [])];
                                    newFields[fIndex] = { ...field, name: e.target.value };
                                    onChange({ fields: newFields });
                                }}
                                placeholder="Name"
                                className="w-full bg-[#050505] border border-[#333] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                                spellCheck={spellCheckEnabled}
                                autoCorrect={autoCorrectEnabled ? "on" : "off"}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-zinc-600 tracking-widest ml-1">Field Value</label>
                            <div className="relative group/editor">
                                <textarea
                                    ref={valueRef}
                                    value={field.value}
                                    rows={1}
                                    onChange={(e) => {
                                        const newFields = [...(embed.fields || [])];
                                        newFields[fIndex] = { ...field, value: e.target.value };
                                        onChange({ fields: newFields });
                                        // Auto-expand
                                        e.target.style.height = 'auto';
                                        e.target.style.height = `${e.target.scrollHeight}px`;
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.height = 'auto';
                                        e.target.style.height = `${e.target.scrollHeight}px`;
                                    }}
                                    placeholder="Value"
                                    className="w-full bg-[#050505] border border-[#333] rounded-lg px-3 py-2 pb-10 text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-colors resize-none overflow-hidden min-h-[40px]"
                                    spellCheck={spellCheckEnabled}
                                    autoCorrect={autoCorrectEnabled ? "on" : "off"}
                                />
                                <div className="absolute bottom-2 right-2 flex items-center justify-end z-20 pointer-events-none">
                                    <div className="pointer-events-auto">
                                        <RichText3DotMenu 
                                            value={field.value}
                                            onChange={(val) => {
                                                const newFields = [...(embed.fields || [])];
                                                newFields[fIndex] = { ...field, value: val };
                                                onChange({ fields: newFields });
                                            }}
                                            textareaRef={valueRef}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between bg-[#121212] p-2 rounded-lg border border-white/5">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-zinc-400">Inline Field</span>
                                <span className="text-[8px] text-zinc-600 uppercase">Place fields side-by-side</span>
                            </div>
                            <CustomCheckbox
                                checked={field.inline || false}
                                onChange={(checked) => {
                                    const newFields = [...(embed.fields || [])];
                                    newFields[fIndex] = { ...field, inline: checked };
                                    onChange({ fields: newFields });
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
