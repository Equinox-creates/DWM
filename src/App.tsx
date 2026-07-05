import React, { useState, useEffect, useMemo } from 'react';
import { DiscordMobileChat } from './components/DiscordMobileChat';
import { CinematicIntro } from './components/CinematicIntro';
import { WebhookEditor } from './components/WebhookEditor';
import { MessagePreview } from './components/MessagePreview';
import { CodeEditor } from './components/CodeEditor';
import { NodeEditor } from './components/NodeEditor';
import { BlockEditor } from './components/BlockEditor';
import { LogPanel, LogEntry } from './components/LogPanel';
import { TemplatesPanel } from './components/TemplatesPanel';
import { AccountPanel } from './components/AccountPanel';
import { CompanionBotPanel } from './components/CompanionBotPanel';
import { MessageStackManager } from './components/MessageStackManager';
import { TemplateCreator } from './components/TemplateCreator';
import { DiscordWebhookMessage, DEFAULT_MESSAGE } from './types';
import { Moon, Sun, Trash2, FileJson, Copy, Check, Layout, Code, Box, GitGraph, Plus, Settings, Terminal, FileText, User, Eye, EyeOff, X, Type, Webhook, Volume2, VolumeX, Menu, Layers, Send, ChevronDown, Maximize2, Minimize2, Save, MessageSquare, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, safeUUID } from '@/utils';
import { Toaster } from 'sonner';
import { toast } from '@/utils/toast';
import { getMuted, setMuted, playButtonSound, playSendSound, playDeleteSound } from '@/utils/sounds';
import { v4 as uuidv4 } from 'uuid';

import { NotificationCenter } from './components/NotificationCenter';
import { CustomDropdown } from './components/ui/CustomDropdown';
import { useNotifications } from './context/NotificationContext';

import { MobileExperience } from './components/MobileExperience';
import { VirtualKeyboardProvider, useVirtualKeyboard } from './contexts/VirtualKeyboardContext';
import { VirtualKeyboard } from './components/VirtualKeyboard';

function App() {
  return (
    <VirtualKeyboardProvider>
      <AppContent />
    </VirtualKeyboardProvider>
  );
}

function AppContent() {
  const { isOpen: isVirtualKeyboardOpen } = useVirtualKeyboard();
  const [messages, setMessages] = useState<DiscordWebhookMessage[]>([DEFAULT_MESSAGE]);
  const [activeMessageIndex, setActiveMessageIndex] = useState(0);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [showJson, setShowJson] = useState(false);
  const [showWebhookManager, setShowWebhookManager] = useState(false);
  const [showMessageManager, setShowMessageManager] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : false);
  const [fullScreenPreview, setFullScreenPreview] = useState(false);
  const [previewType, setPreviewType] = useState<'default' | 'chat'>('default');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeleteWebhookConfirm, setShowDeleteWebhookConfirm] = useState(false);
  const [showDeleteMessageConfirm, setShowDeleteMessageConfirm] = useState(false);
  const [clearRemoveWebhook, setClearRemoveWebhook] = useState(false);
  const [clearHardReset, setClearHardReset] = useState(false);
  const [showMobileWarning, setShowMobileWarning] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showLimitDetails, setShowLimitDetails] = useState(false);
  const [ignoreLimits, setIgnoreLimits] = useState(false);
  const [lastValidMessage, setLastValidMessage] = useState<DiscordWebhookMessage>(DEFAULT_MESSAGE);
  const [limitReasons, setLimitReasons] = useState<string[]>([]);
  const [showTextOptionsModal, setShowTextOptionsModal] = useState(false);
  const [stackSelectMode, setStackSelectMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<number[]>([]);
  const [spellCheckEnabled, setSpellCheckEnabled] = useState(false);
  const [translateTo, setTranslateTo] = useState('en');
  const [isMutedState, setIsMutedState] = useState(getMuted());
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'code' | 'block' | 'node' | 'logs' | 'templates' | 'account' | 'bot'>('editor');
  const { unreadCount: notificationsUnreadCount } = useNotifications();
  const [showGlobalNotifications, setShowGlobalNotifications] = useState(false);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [showTemplateCreator, setShowTemplateCreator] = useState(false);
  const [savedWebhooks, setSavedWebhooks] = useState<{ name: string, url: string }[]>(() => {
    try {
      const stored = localStorage.getItem('discord_webhooks');
      if (stored) return JSON.parse(stored).map((w: { name: string, url: string }) => ({ name: w.name, url: w.url }));
    } catch {
      // Ignored
    }
    return [];
  });

  // Warn before reloading
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ''; // Standard way to trigger the confirmation dialog
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Sync savedWebhooks with localStorage when it changes
  useEffect(() => {
    try {
      const stored = localStorage.getItem('discord_webhooks');
      let webhooks = stored ? JSON.parse(stored) : [];
      
      // Update or add webhooks
      savedWebhooks.forEach(sw => {
        if (!webhooks.some((w: { url: string }) => w.url === sw.url)) {
          webhooks.push({ id: uuidv4(), name: sw.name || 'Unnamed', url: sw.url, channel_id: 'unknown', guild_id: 'unknown', guild_name: 'Custom Server' });
        }
      });
      // Remove webhooks that are no longer in savedWebhooks
      webhooks = webhooks.filter((w: { url: string }) => savedWebhooks.some(sw => sw.url === w.url));
      
      localStorage.setItem('discord_webhooks', JSON.stringify(webhooks));
    } catch {
      // Ignored
    }
  }, [savedWebhooks]);

  // Sync savedWebhooks state in real-time when custom events are triggered from AccountPanel
  useEffect(() => {
    const handleWebhooksUpdated = () => {
      try {
        const stored = localStorage.getItem('discord_webhooks');
        if (stored) {
          const parsed = JSON.parse(stored).map((w: { name: string, url: string }) => ({ name: w.name, url: w.url }));
          setSavedWebhooks(parsed);
        } else {
          setSavedWebhooks([]);
        }
      } catch {
        // Ignored
      }
    };

    window.addEventListener('discord_webhooks_updated', handleWebhooksUpdated);
    window.addEventListener('webhook_count_updated', handleWebhooksUpdated);
    return () => {
      window.removeEventListener('discord_webhooks_updated', handleWebhooksUpdated);
      window.removeEventListener('webhook_count_updated', handleWebhooksUpdated);
    };
  }, []);

   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   const [botStatus, setBotStatus] = useState<{
    status: 'offline' | 'connecting' | 'online';
    username: string | null;
    id: string | null;
    avatar: string | null;
    guildsCount: number;
    error: string | null;
  } | null>(null);

  // Onboarding editing coordination state
  const [isOnboardingEdit, setIsOnboardingEdit] = useState(false);
  const [isTriggerEdit, setIsTriggerEdit] = useState(false);
  const [onboardingBackupMessages, setOnboardingBackupMessages] = useState<DiscordWebhookMessage[] | null>(null);
  const [onboardingBackupIndex, setOnboardingBackupIndex] = useState<number | null>(null);
  const [onboardingConfirmCallback, setOnboardingConfirmCallback] = useState<((msg: DiscordWebhookMessage) => void) | null>(null);

  useEffect(() => {
    const fetchBotStatusGlobal = async () => {
      try {
        const res = await fetch('/api/bot/status');
        if (res.ok) {
          const data = await res.json();
          setBotStatus(data);
        }
      } catch {
        // Silent catch for background polling during server restarts or transient disconnects
      }
    };
    fetchBotStatusGlobal();
    const interval = setInterval(fetchBotStatusGlobal, 10000);
    return () => clearInterval(interval);
  }, []);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [autoCorrectEnabled, setAutoCorrectEnabled] = useState(false);
  const [channelName, setChannelName] = useState("general");
  const [showIntro, setShowIntro] = useState(true);

  // Undo/Redo History
  const [history, setHistory] = useState<DiscordWebhookMessage[]>([DEFAULT_MESSAGE]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Logging helper
  const addLog = (message: string, level: 'info' | 'warn' | 'error' | 'success' = 'info') => {
    setLogs(prev => [...prev, {
      id: uuidv4(),
      timestamp: new Date(),
      level,
      message
    }]);
  };

  const [webhookData, setWebhookData] = useState<{ name?: string, avatar?: string } | null>(null);

  useEffect(() => {
    // Disable the blocking caution dialog on load to provide immediate layout access on mobile
    setShowMobileWarning(false);

    // Viewport Height Fix for Mobile
    const setHeight = () => {
      if (window.visualViewport) {
        const vh = window.visualViewport.height * 0.01;
        // Only update VH if not a keyboard event
        const isKeyboard = window.visualViewport.height < window.innerHeight * 0.85;
        if (!isKeyboard) {
          document.documentElement.style.setProperty('--vh', `${vh}px`);
        }
        setIsKeyboardOpen(isKeyboard);
      } else {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      }
    };

    setHeight();
    window.addEventListener('resize', setHeight);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', setHeight);
      window.visualViewport.addEventListener('scroll', setHeight);
    }

    // Keyboard Detection Fallback
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLInputElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        // Don't trigger for checkboxes or radios
        if (target.type === 'checkbox' || target.type === 'radio') return;
        setIsKeyboardOpen(true);
      }
    };

    const handleBlur = () => {
      // Allow visualViewport resize to take precedence
      setTimeout(() => {
        if (window.visualViewport) {
          const isKeyboard = window.visualViewport.height < window.innerHeight * 0.85;
          setIsKeyboardOpen(isKeyboard);
        } else {
          setIsKeyboardOpen(false);
        }
      }, 300); // Increased delay
    };

    window.addEventListener('focusin', handleFocus as unknown as EventListener);
    window.addEventListener('focusout', handleBlur);

    return () => {
      window.removeEventListener('resize', setHeight);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', setHeight);
        window.visualViewport.removeEventListener('scroll', setHeight);
      }
      window.removeEventListener('focusin', handleFocus as unknown as EventListener);
      window.removeEventListener('focusout', handleBlur);
    };
  }, []);

  // Fetch webhook details when URL changes
  useEffect(() => {
    const fetchWebhookDetails = async () => {
      if (!webhookUrl || !webhookUrl.startsWith('http')) {
        setWebhookData(null);
        return;
      }

      try {
        const response = await fetch(webhookUrl);
        if (response.ok) {
          const data = await response.json();
          setWebhookData({
            name: data.name,
            avatar: data.avatar 
              ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png` 
              : undefined
          });
          
          // Set channel name to webhook name as a fallback since we can't get actual channel name
          if (data.name) {
            setChannelName(data.name.toLowerCase().replace(/\s+/g, '-'));
          }
          
          // Clear overrides when a new valid webhook is loaded
          setMessage({ ...message, username: '', avatar_url: '' });
          
          addLog(`Fetched webhook details: ${data.name}`, 'success');
        }
      } catch {
        // Silently ignore fetch errors to prevent console spam and unhandled promise rejections
        // console.error("Failed to fetch webhook details", error);
      }
    };

    const timeoutId = setTimeout(fetchWebhookDetails, 1000);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webhookUrl]);

  // Listen for custom event to open account settings
  useEffect(() => {
    const handleOpenAccount = () => setActiveTab('account');
    document.addEventListener('OPEN_ACCOUNT_SETTINGS', handleOpenAccount);
    return () => document.removeEventListener('OPEN_ACCOUNT_SETTINGS', handleOpenAccount);
  }, []);

  useEffect(() => {
    const handleOpenCreator = () => setShowTemplateCreator(true);
    window.addEventListener('OPEN_TEMPLATE_CREATOR', handleOpenCreator);
    return () => window.removeEventListener('OPEN_TEMPLATE_CREATOR', handleOpenCreator);
  }, []);

  useEffect(() => {
    const handleSwitchTab = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail as 'editor' | 'code' | 'block' | 'node' | 'logs' | 'templates' | 'account' | 'bot');
      }
    };
    window.addEventListener('SWITCH_APP_TAB', handleSwitchTab as EventListener);
    return () => window.removeEventListener('SWITCH_APP_TAB', handleSwitchTab as EventListener);
  }, []);

  // Current message helper

  // Current message helper
  const checkLimits = (msg: DiscordWebhookMessage) => {
    let totalChars = 0;
    let exceeds = false;
    const reasons: string[] = [];

    if (msg.content) totalChars += msg.content.length;

    if (msg.embeds && msg.embeds.length > 10) {
      exceeds = true;
      reasons.push("Max Embeds: 10 per message");
    }

    msg.embeds?.forEach(embed => {
      if (embed.title) {
        totalChars += embed.title.length;
        if (embed.title.length > 256) {
          exceeds = true;
          reasons.push("Title Length: 256 characters (per individual embed)");
        }
      }
      if (embed.description) {
        totalChars += embed.description.length;
        if (embed.description.length > 4096) {
          exceeds = true;
          reasons.push("Description Length: 4096 characters (per individual embed)");
        }
      }
      if (embed.author?.name) totalChars += embed.author.name.length;
      if (embed.footer?.text) totalChars += embed.footer.text.length;
      
      if (embed.fields) {
        if (embed.fields.length > 25) {
          exceeds = true;
          reasons.push("Fields per Embed: 25 fields");
        }
        embed.fields.forEach(field => {
          if (field.name) totalChars += field.name.length;
          if (field.value) totalChars += field.value.length;
        });
      }
    });

    if (totalChars > 6000) {
      exceeds = true;
      reasons.push("Total Characters: 6,000 (combined across all 10 embeds)");
    }

    return { exceeds, reasons };
  };

  const message = messages[activeMessageIndex];
  
  const setMessage = (newMessage: DiscordWebhookMessage) => {
    if (!ignoreLimits) {
      const { exceeds, reasons } = checkLimits(newMessage);
      if (exceeds) {
        setLimitReasons(reasons);
        setShowLimitModal(true);
      } else {
        setLastValidMessage(newMessage);
      }
    }

    const newMessages = [...messages];
    newMessages[activeMessageIndex] = newMessage;
    setMessages(newMessages);

    // Add to history if different
    const currentHistory = history.slice(0, historyIndex + 1);
    const lastState = currentHistory[currentHistory.length - 1];
    
    // Simple JSON comparison to avoid duplicates
    if (JSON.stringify(lastState) !== JSON.stringify(newMessage)) {
        const newHistory = [...currentHistory, newMessage];
        // Limit history size to 50
        if (newHistory.length > 50) newHistory.shift();
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        const prevMsg = history[newIndex];
        setHistoryIndex(newIndex);
        
        const newMessages = [...messages];
        newMessages[activeMessageIndex] = prevMsg;
        setMessages(newMessages);
        toast.success("Undone");
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        const nextMsg = history[newIndex];
        setHistoryIndex(newIndex);
        
        const newMessages = [...messages];
        newMessages[activeMessageIndex] = nextMsg;
        setMessages(newMessages);
        toast.success("Redone");
    }
  };

  const handleClear = () => {
    playButtonSound();
    setShowClearConfirm(true);
  };

  const confirmClear = () => {
    playDeleteSound();
    const emptyMessage = { content: '', embeds: [] };
    
    if (clearHardReset) {
      setMessages([emptyMessage]);
      setActiveMessageIndex(0);
      setHistory([emptyMessage]);
      setHistoryIndex(0);
    } else {
      const newMessages = [...messages];
      newMessages[activeMessageIndex] = { ...newMessages[activeMessageIndex], content: '', embeds: [], files: [] };
      setMessages(newMessages);
    }
    
    if (clearRemoveWebhook) {
      setWebhookUrl('');
    }
    
    setShowClearConfirm(false);
    toast.success("Cleared successfully.");
    addLog("Cleared messages", 'warn');
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(message, null, 2));
    setCopied(true);
    toast.success("JSON copied to clipboard");
    addLog("Copied JSON to clipboard", 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const addNewMessage = () => {
    setMessages([...messages, { ...DEFAULT_MESSAGE, id: uuidv4(), content: "New Message" }]);
    setActiveMessageIndex(messages.length);
    toast.success("New message added to stack");
    addLog("Added new message to stack", 'info');
  };

  const removeMessage = (index: number) => {
    if (messages.length <= 1) return;
    const newMessages = messages.filter((_, i) => i !== index);
    setMessages(newMessages);
    if (activeMessageIndex >= index && activeMessageIndex > 0) {
      setActiveMessageIndex(activeMessageIndex - 1);
    }
    addLog(`Removed message #${index + 1}`, 'warn');
  };

  const editorModes = useMemo(() => [
    { id: 'editor', label: 'Editor', icon: Layout },
    { id: 'code', label: 'Code', icon: Code },
    { id: 'block', label: 'Block', icon: Box },
    { id: 'node', label: 'Node', icon: GitGraph },
  ] as const, []);

  const isProfessionalDevice = () => {
    if (typeof window === 'undefined') return true;
    const width = window.innerWidth;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isPhone = /iPhone|Android|Mobile/i.test(navigator.userAgent) && width < 640;
    const isTablet = (/iPad|Tablet/i.test(navigator.userAgent) || isTouch) && width < 1024;
    
    return !(isPhone || isTablet);
  };

  const filteredEditorModes = useMemo(() => {
    // Only 'editor' mode for non-professional devices (phones/tablets)
    if (!isProfessionalDevice()) {
      return editorModes.filter(mode => mode.id === 'editor');
    }
    return editorModes;
  }, [editorModes]);

  useEffect(() => {
    // If current tab is one that was filtered out, switch to editor
    if (!isProfessionalDevice() && (activeTab === 'code' || activeTab === 'block' || activeTab === 'node')) {
      setActiveTab('editor');
    }
  }, [activeTab]);

  const tabs = [
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'logs', label: 'Logs', icon: Terminal },
    { id: 'account', label: 'Account', icon: User },
    { id: 'bot', label: 'DWM Companion', icon: Webhook },
  ] as const;

  const [editMessageUrl, setEditMessageUrl] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  const handleDeleteMessage = async () => {
    if (!webhookUrl) {
        toast.error("Please ensure a Webhook URL is set first.");
        return;
    }

    const match = editMessageUrl.match(/channels\/\d+\/\d+\/(\d+)/);
    if (!match) {
        toast.error("Invalid Discord Message URL format.");
        return;
    }
    const messageId = match[1];

    setShowDeleteMessageConfirm(false);
    const toastId = toast.loading("Deleting message...");
    setIsSending(true);

    try {
        const fetchUrl = `${webhookUrl}/messages/${messageId}`;
        const response = await fetch(fetchUrl, {
            method: 'DELETE'
        });

        if (response.ok || response.status === 204) {
            toast.success("Message deleted!", { id: toastId });
            addLog(`Deleted message ${messageId}`, 'success');
            setEditMessageUrl('');
            if (editingMessageId === messageId) {
                setEditingMessageId(null);
                setMessage(DEFAULT_MESSAGE);
            }
        } else {
            const text = await response.text();
            toast.error(`Failed to delete: ${response.status}`, { description: text, id: toastId });
            addLog(`Failed to delete message: ${text}`, 'error');
        }
    } catch (error) {
        toast.error(`Error deleting message: ${error}`, { id: toastId });
        addLog(`Error deleting message: ${error}`, 'error');
    } finally {
        setIsSending(false);
    }
  };

  const handleDeleteWebhook = async () => {
    if (!webhookUrl) {
        toast.error("Please ensure a Webhook URL is set first.");
        return;
    }

    setShowDeleteWebhookConfirm(false);
    const toastId = toast.loading("Deleting webhook...");
    setIsSending(true);

    try {
        const response = await fetch(webhookUrl, {
            method: 'DELETE'
        });

        if (response.ok || response.status === 204) {
            toast.success("Webhook deleted successfully!", { id: toastId });
            addLog(`Deleted webhook from Discord`, 'success');
            setWebhookUrl('');
            setWebhookData(null);
            setShowWebhookManager(false);
        } else {
            const text = await response.text();
            toast.error(`Failed to delete webhook: ${response.status}`, { description: text, id: toastId });
            addLog(`Failed to delete webhook: ${text}`, 'error');
        }
    } catch (error) {
        toast.error(`Error deleting webhook: ${error}`, { id: toastId });
        addLog(`Error deleting webhook: ${error}`, 'error');
    } finally {
        setIsSending(false);
    }
  };

  const handleLoadMessage = async () => {
    if (!webhookUrl) {
        toast.error("Please ensure a Webhook URL is set first.");
        return;
    }

    // Extract Message ID from URL
    const match = editMessageUrl.match(/channels\/\d+\/\d+\/(\d+)/);
    if (!match) {
        toast.error("Invalid Discord Message URL format.");
        return;
    }
    const messageId = match[1];

    const toastId = toast.loading("Fetching message...");

    try {
        const fetchUrl = `${webhookUrl}/messages/${messageId}`;
        const response = await fetch(fetchUrl);

        if (response.ok) {
            const data = await response.json();
            
            // Transform Discord Message Object to our DiscordWebhookMessage format
            const loadedMessage: DiscordWebhookMessage = {
                content: data.content,
                username: data.author?.username,
                avatar_url: data.author?.avatar ? `https://cdn.discordapp.com/avatars/${data.author.id}/${data.author.avatar}.png` : undefined,
                embeds: data.embeds,
                components: data.components,
                // Attachments are not easily editable via webhook without re-uploading, ignoring for now or could handle as links
            };

            setMessage(loadedMessage);
            setEditingMessageId(messageId);
            setEditMessageUrl('');
            toast.success("Message loaded for editing!", { id: toastId });
            addLog(`Loaded message ${messageId} for editing`, 'success');
        } else {
            const text = await response.text();
            toast.error(`Failed to fetch: ${response.status}`, { description: text, id: toastId });
            addLog(`Failed to fetch message: ${text}`, 'error');
        }
    } catch (error) {
        toast.error(`Error fetching message: ${error}`, { id: toastId });
        addLog(`Error fetching message: ${error}`, 'error');
    }
  };

  const handleSend = async (msgToSend?: DiscordWebhookMessage) => {
    const targetMessage = msgToSend || message;
    if (!webhookUrl) {
      toast.error("Please enter a Webhook URL first.");
      addLog("Attempted to send without Webhook URL", 'error');
      return;
    }

    // Validation: Must have content, embeds, or files
    if (!targetMessage.content && (!targetMessage.embeds || targetMessage.embeds.length === 0) && (!targetMessage.files || targetMessage.files.length === 0)) {
      toast.error("Message cannot be empty. Add content, an embed, or a file.");
      addLog("Attempted to send empty message", 'warn');
      return;
    }

    setIsSending(true);
    playSendSound();
    const action = editingMessageId ? "Updating" : "Sending";
    addLog(`${action} message...`, 'info');
    
    const toastId = toast.loading(`${action} message...`);

    // Sanitize message payload
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload = { ...targetMessage } as any;
    if (!payload.username) delete payload.username;
    if (!payload.avatar_url) delete payload.avatar_url;
    if (!payload.thread_name || editingMessageId) delete payload.thread_name;
    
    // Forum mode logic
    if (payload.forum_mode) {
        if (!payload.thread_name && !editingMessageId) {
            toast.error("Thread/Post name is required for Forum mode.");
            return;
        }
        // If thread_name or applied_tags are present, but it's not a forum, 
        // Discord might still accept it as a thread or error out.
        // We ensure applied_tags is only sent if forum_mode is true
        if (!payload.applied_tags || payload.applied_tags.length === 0) {
            delete payload.applied_tags;
        }
    } else {
        delete payload.applied_tags;
    }
    delete payload.forum_mode;
    
    // Remove internal fields
    delete payload.id;
    const autoReactions = payload.auto_reactions;
    delete payload.bot_token;
    delete payload.auto_reactions;
    delete payload.use_bot_token;

    // Sanitize components for Webhooks (cannot have custom_id on style 5, and webhooks only support style 5)
    if (payload.components) {
      payload.components = payload.components.map(row => {
        return {
          ...row,
          components: row.components.map(btn => {
            const sanitizedBtn = { ...btn };
            sanitizedBtn.style = 5; // Force Link style for webhooks
            if (!sanitizedBtn.url) {
                sanitizedBtn.url = "https://discord.com"; // Prevent 400 error if URL is missing
            }
            delete sanitizedBtn.custom_id; // Link buttons cannot have a custom_id
            return sanitizedBtn;
          })
        };
      });
    }

    try {
      let body: string | FormData;
      const headers: Record<string, string> = {};

      if (payload.files && payload.files.length > 0) {
        const formData = new FormData();
        formData.append('payload_json', JSON.stringify(payload));
        payload.files.forEach((f, i) => {
           if (f.file) {
             formData.append(`files[${i}]`, f.file);
           }
        });
        body = formData;
      } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(payload);
      }

      let sendUrl = webhookUrl;
      let method = 'POST';

      if (editingMessageId) {
          sendUrl = `${webhookUrl}/messages/${editingMessageId}`;
          if (targetMessage.thread_id) {
              sendUrl += `?thread_id=${targetMessage.thread_id}`;
          }
          method = 'PATCH';
      } else {
          // Always append wait=true so we can capture the message ID
          sendUrl = `${webhookUrl}?wait=true`;
          if (targetMessage.thread_id) {
              sendUrl += `&thread_id=${targetMessage.thread_id}`;
          }
      }

      const isForumAttempt = targetMessage.forum_mode;
      let finalResponse = await fetch(sendUrl, {
        method,
        headers,
        body,
      });

      // Handle Forum Fallback as requested
      if (!finalResponse.ok && isForumAttempt && !editingMessageId) {
        const errorData = await finalResponse.json().catch(() => ({}));
        if (errorData.message?.toLowerCase().includes('forum') || finalResponse.status === 400) {
            toast.error("Not a Forum Channel! Sending as a normal thread instead.", { id: toastId });
            addLog(`Forum Post Warning: Webhook is not in a forum channel. Falling back to normal thread.`, 'error');

            const fallbackPayload = { ...payload };
            delete fallbackPayload.applied_tags;
            
            let fallbackBody: string | FormData;
            if (payload.files && payload.files.length > 0) {
                const formData = new FormData();
                formData.append('payload_json', JSON.stringify(fallbackPayload));
                payload.files.forEach((f, i) => { if (f.file) formData.append(`files[${i}]`, f.file); });
                fallbackBody = formData;
            } else {
                fallbackBody = JSON.stringify(fallbackPayload);
            }

            finalResponse = await fetch(sendUrl, {
                method,
                headers,
                body: fallbackBody,
            });
        }
      }

      if (finalResponse.ok) {
        toast.success(`Message ${editingMessageId ? "updated" : "sent"} successfully!`, { id: toastId });
        addLog(`Message ${editingMessageId ? "updated" : "sent"} successfully`, 'success');
        
        let sentMessageId = editingMessageId;
        let sentChannelId = null;

        try {
          const responseData = await finalResponse.json();
          sentMessageId = responseData.id || sentMessageId;
          sentChannelId = responseData.channel_id;
        } catch {
          // Response wasn't JSON
        }

        // Enter or stay in edit mode
        if (sentMessageId) {
            setEditingMessageId(sentMessageId);
        }
        
        if (!editingMessageId) {
          try {
            const countsStr = localStorage.getItem('webhook_message_counts');
            const counts = countsStr ? JSON.parse(countsStr) : {};
            counts[webhookUrl] = (counts[webhookUrl] || 0) + 1;
            localStorage.setItem('webhook_message_counts', JSON.stringify(counts));
            
            // Save to history
            const historyStr = localStorage.getItem('webhook_history');
            const history = historyStr ? JSON.parse(historyStr) : [];
            const webhooksStr = localStorage.getItem('discord_webhooks');
            const webhooks = webhooksStr ? JSON.parse(webhooksStr) : [];
            const webhookName = webhooks.find((w: { url: string; name: string }) => w.url === webhookUrl)?.name || 'Unknown Webhook';
            history.unshift({
              id: safeUUID(),
              name: webhookName,
              time: new Date().toISOString(),
              status: 'success'
            });
            // Keep only last 50
            if (history.length > 50) history.pop();
            localStorage.setItem('webhook_history', JSON.stringify(history));
            
            window.dispatchEvent(new Event('webhook_count_updated'));
          } catch {
            console.error('Failed to update webhook count/history');
          }
        }

        // Handle Auto Reactions via backend companion bot
        if (!editingMessageId && autoReactions && autoReactions.length > 0 && sentMessageId && sentChannelId) {
            try {
                addLog(`Adding ${autoReactions.length} reactions via DWM Companion...`, 'info');
                const reactResponse = await fetch('/api/bot/react', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        channelId: sentChannelId,
                        messageId: sentMessageId,
                        reactions: autoReactions
                    })
                });
                
                if (reactResponse.ok) {
                    addLog("Reactions added successfully via DWM Companion!", 'success');
                    toast.success("Auto reactions added!");
                } else {
                    const errData = await reactResponse.json().catch(() => ({}));
                    throw new Error(errData.error || 'Failed to add reactions');
                }
            } catch (reactionError: unknown) {
                const errMsg = reactionError instanceof Error ? reactionError.message : 'Companion offline';
                console.error("Failed to add reactions", reactionError);
                addLog(`Failed to add reactions: ${errMsg}`, 'error');
                toast.error("Auto reaction failed. Make sure DWM Companion is active & in server.");
            }
        }

      } else {
        const text = await finalResponse.text();
        let errorMsg = text;
        try {
            const jsonError = JSON.parse(text);
            if (jsonError.message) errorMsg = jsonError.message;
        } catch {
            // Ignore JSON parse error
        }
        
        // Save to history
        try {
          const historyStr = localStorage.getItem('webhook_history');
          const history = historyStr ? JSON.parse(historyStr) : [];
          const webhooksStr = localStorage.getItem('discord_webhooks');
          const webhooks = webhooksStr ? JSON.parse(webhooksStr) : [];
          const webhookName = webhooks.find((w: { url: string; name: string }) => w.url === webhookUrl)?.name || 'Unknown Webhook';
          history.unshift({
            id: safeUUID(),
            name: webhookName,
            time: new Date().toISOString(),
            status: 'error'
          });
          if (history.length > 50) history.pop();
          localStorage.setItem('webhook_history', JSON.stringify(history));
          window.dispatchEvent(new Event('webhook_count_updated'));
        } catch (e) {
          console.error('Failed to update webhook history', e);
        }

        toast.error(`Failed to ${editingMessageId ? "update" : "send"}: ${finalResponse.status}`, { description: errorMsg, id: toastId });
        addLog(`Failed to ${editingMessageId ? "update" : "send"}: ${finalResponse.status} - ${errorMsg}`, 'error');
      }
    } catch (error) {
      toast.error(`Error: ${error}`, { id: toastId });
      addLog(`Network error: ${error}`, 'error');
      
      // Save to history
      try {
        const historyStr = localStorage.getItem('webhook_history');
        const history = historyStr ? JSON.parse(historyStr) : [];
        const webhooksStr = localStorage.getItem('discord_webhooks');
        const webhooks = webhooksStr ? JSON.parse(webhooksStr) : [];
        const webhookName = webhooks.find((w: { url: string; name: string }) => w.url === webhookUrl)?.name || 'Unknown Webhook';
        history.unshift({
          id: safeUUID(),
          name: webhookName,
          time: new Date().toISOString(),
          status: 'error'
        });
        if (history.length > 50) history.pop();
        localStorage.setItem('webhook_history', JSON.stringify(history));
        window.dispatchEvent(new Event('webhook_count_updated'));
      } catch (e) {
        console.error('Failed to update webhook history', e);
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div 
      className="w-full overflow-hidden bg-[#0a0a0a] text-zinc-100 flex flex-col font-sans selection:bg-white/30 selection:text-white"
      style={{ height: 'calc(var(--vh, 1vh) * 100)' }}
    >
      <Toaster 
        position="top-center" 
        theme="dark" 
        className="!z-[9999]"
        toastOptions={{
          className: "backdrop-blur-[40px] bg-black/40 border border-white/10 text-white rounded-2xl shadow-2xl",
          style: {
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
          }
        }}
      />
      
      <header className={cn(
        "fixed top-0 left-0 right-0 z-[130] bg-[#121212]/70 backdrop-blur-xl border-b border-white/5 transition-transform duration-300",
        isVirtualKeyboardOpen ? "-translate-y-full" : "translate-y-0"
      )}>
        <div className="w-full px-4 h-14 lg:h-12 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-2">
            <div className="w-8 h-8 lg:w-6 lg:h-6 bg-cyan-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Webhook className="w-5 h-5 lg:w-3 lg:h-3 text-black" />
            </div>
            <div className="flex flex-col">
              <h1 className="font-black text-[13px] lg:text-[11px] tracking-tighter uppercase text-zinc-200">
                <span className="lg:hidden">DWM</span>
                <span className="hidden lg:inline">Discord Webhook Manager</span>
                <span className="text-zinc-500 font-normal ml-1">[EQN]</span>
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <div className="hidden sm:flex bg-[#0a0a0a] border border-[#222] rounded-md p-0.5 mr-2">
              {filteredEditorModes.map(mode => (
                <button
                  key={mode.id}
                  onClick={() => { playButtonSound(); setActiveTab(mode.id); }}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded transition-all flex items-center gap-2",
                    activeTab === mode.id 
                      ? "bg-[#222] text-white shadow-sm" 
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-[#1a1a1a]"
                  )}
                >
                  <mode.icon className="w-3.5 h-3.5" />
                  {mode.label}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => {
                const newMuted = !isMutedState;
                setIsMutedState(newMuted);
                setMuted(newMuted);
                if (!newMuted) playButtonSound();
              }}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#222] rounded transition-colors"
              title={isMutedState ? "Unmute Sounds" : "Mute Sounds"}
            >
              {isMutedState ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <div className="w-px h-4 bg-[#333] mx-1" />
            <button
              onClick={() => { playButtonSound(); setShowMobilePreview(!showMobilePreview); }}
              className="p-1.5 text-cyan-400 hover:text-white hover:bg-cyan-500/10 rounded transition-all flex items-center gap-1.5 px-3 py-1 bg-cyan-950/20 border border-cyan-500/30 font-semibold md:px-3 md:py-1.5"
              title={showMobilePreview ? "Hide Preview" : "See Live Preview"}
            >
              {showMobilePreview ? <EyeOff className="w-4 h-4 text-cyan-400" /> : <Eye className="w-4 h-4 text-cyan-400" />}
              <span className="text-xs font-bold sm:hidden md:inline-block lg:inline-block xl:inline-block">{showMobilePreview ? "Hide Preview" : "See Preview"}</span>
            </button>
            <div className="w-px h-4 bg-[#333] mx-1" />
            
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                onClick={() => { playButtonSound(); setShowWebhookManager(true); }}
                className="px-3 py-1.5 text-xs font-medium bg-[#222] hover:bg-[#333] text-zinc-300 rounded transition-colors flex items-center gap-2 border border-[#333]"
              >
                <Settings className="w-3.5 h-3.5" /> <span>Settings</span>
              </button>

              <div className="w-px h-4 bg-[#333] mx-1" />
              <NotificationCenter />
              <div className="w-px h-4 bg-[#333] mx-1" />
              <button
                onClick={() => { playButtonSound(); setShowTextOptionsModal(true); }}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  autoCorrectEnabled || spellCheckEnabled ? "text-cyan-400 bg-cyan-400/10" : "text-zinc-400 hover:text-white hover:bg-[#222]"
                )}
                title="Text Options"
              >
                <Type className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-[#333] mx-1" />
              <button
                onClick={() => { playButtonSound(); setShowJson(!showJson); }}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#222] rounded transition-colors"
                title="JSON Editor"
              >
                <FileJson className="w-4 h-4" />
              </button>
              <button
                onClick={handleClear}
                className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                title="Clear All"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="w-px h-4 bg-[#333] mx-1" />
              
              <button
                onClick={() => { playSendSound(); handleSend(); }}
                disabled={isSending || !webhookUrl}
                className={cn(
                  "px-6 py-2 text-xs font-black tracking-[0.1em] rounded-full transition-all flex items-center gap-2 ml-1",
                  !webhookUrl 
                    ? "bg-[#222] text-zinc-600 cursor-not-allowed border border-[#333]" 
                    : isSending 
                      ? "bg-cyan-500 text-white animate-pulse" 
                      : "bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] active:scale-95"
                )}
              >
                {isSending ? (
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  editingMessageId ? <Save className="w-4 h-4" /> : <Send className="w-4 h-4" />
                )}
                <span>{editingMessageId ? 'UPDATE MESSAGE' : 'SEND WEBHOOK'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex pb-14 sm:pb-0 pt-14 lg:pt-12 relative">
        
        {/* Left Sidebar Menu (Desktop) */}
        <div className="hidden sm:flex w-16 bg-[#121212] border-r border-[#222] flex-col items-center py-4 gap-2 z-40 overflow-y-auto overflow-x-hidden custom-scrollbar shrink-0">
           <div className="w-full flex flex-col items-center gap-2 mb-4 pb-4 border-b border-[#222]">
             {filteredEditorModes.map(mode => (
               <button
                 key={mode.id}
                 onClick={() => setActiveTab(mode.id)}
                 className={cn(
                   "w-10 h-10 transition-all duration-200 flex items-center justify-center group relative rounded-lg",
                   activeTab === mode.id 
                     ? "text-cyan-400 bg-cyan-400/10" 
                     : "text-zinc-500 hover:text-zinc-300 hover:bg-[#222]"
                 )}
                 title={mode.label}
               >
                 {activeTab === mode.id && (
                   <motion.div 
                     layoutId="activeTabIndicator"
                     className="absolute left-0 w-1 h-6 bg-cyan-400 rounded-r-full shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                     initial={false}
                     transition={{ type: "spring", stiffness: 300, damping: 30 }}
                   />
                 )}
                 <mode.icon className="w-5 h-5 relative z-10" />
                 <span className="text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity absolute left-12 bg-[#222] text-white px-2 py-1 rounded shadow-lg whitespace-nowrap z-50 pointer-events-none border border-[#333]">
                   {mode.label}
                 </span>
               </button>
             ))}
           </div>
           
           {tabs.map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={cn(
                 "w-10 h-10 transition-all duration-200 flex items-center justify-center group relative rounded-lg",
                 activeTab === tab.id 
                   ? "text-cyan-400 bg-cyan-400/10" 
                   : "text-zinc-500 hover:text-zinc-300 hover:bg-[#222]"
               )}
               title={tab.label}
             >
               {activeTab === tab.id && (
                 <motion.div 
                   layoutId="activeTabIndicator"
                   className="absolute left-0 w-1 h-6 bg-cyan-400 rounded-r-full shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                   initial={false}
                   transition={{ type: "spring", stiffness: 300, damping: 30 }}
                 />
               )}
               <tab.icon className="w-5 h-5 relative z-10" />
               <span className="text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity absolute left-12 bg-[#222] text-white px-2 py-1 rounded shadow-lg whitespace-nowrap z-50 pointer-events-none border border-[#333]">
                 {tab.label}
               </span>
             </button>
           ))}
           
           {/* Message Stack Manager Button */}
           <div className="flex flex-col gap-2 w-full px-2 items-center mt-auto mb-4">
             <div className="w-full h-px bg-[#333] my-1" />
             <button
               onClick={() => { playButtonSound(); setShowMessageManager(true); }}
               className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
               title="Message Manager"
             >
               <Layers className="w-5 h-5" />
             </button>
           </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Editor Area */}
          <div className="flex-1 h-full overflow-hidden relative bg-[#0a0a0a]">
            <div className={cn(
              "absolute inset-0 overflow-y-auto custom-scrollbar",
              ['editor', 'code', 'block', 'node'].includes(activeTab) ? "p-4 pb-0 lg:p-6 lg:pb-0" : "p-0"
            )}>
              {activeTab === 'editor' && (
                <WebhookEditor
                  message={message}
                  onChange={setMessage}
                  webhookUrl={webhookUrl}
                  setWebhookUrl={setWebhookUrl}
                  onSend={handleSend}
                  isSending={isSending}
                  addLog={addLog}
                  webhookData={webhookData}
                  editingMessageId={editingMessageId}
                  onCancelEdit={() => setEditingMessageId(null)}
                  autoCorrectEnabled={autoCorrectEnabled}
                  spellCheckEnabled={spellCheckEnabled}
                  isCreatingTemplate={isCreatingTemplate}
                  onTemplateDone={() => {
                    setIsCreatingTemplate(false);
                    localStorage.setItem('pending_template_save_trigger', 'true');
                    setActiveTab('account');
                    document.dispatchEvent(new CustomEvent('SAVE_TEMPLATE_FROM_EDITOR'));
                  }}
                  onTemplateCancel={() => {
                    setIsCreatingTemplate(false);
                    setActiveTab('account');
                  }}
                  onClear={() => {
                    if (confirm('Are you sure you want to clear the entire message?')) {
                      setMessage(DEFAULT_MESSAGE);
                    }
                  }}
                  onSaveTemplate={() => setIsCreatingTemplate(true)}
                  isOnboardingEdit={isOnboardingEdit}
                  isTriggerEdit={isTriggerEdit}
                  onConfirmOnboarding={() => {
                    if (onboardingConfirmCallback) {
                       onboardingConfirmCallback(message);
                    }
                    if (onboardingBackupMessages && onboardingBackupIndex !== null) {
                      setMessages(onboardingBackupMessages);
                      setActiveMessageIndex(onboardingBackupIndex);
                    }
                    setIsOnboardingEdit(false);
                    setIsTriggerEdit(false);
                    setOnboardingBackupMessages(null);
                    setOnboardingBackupIndex(null);
                    setOnboardingConfirmCallback(null);
                    setActiveTab('bot');
                  }}
                  onCancelOnboarding={() => {
                    if (onboardingBackupMessages && onboardingBackupIndex !== null) {
                      setMessages(onboardingBackupMessages);
                      setActiveMessageIndex(onboardingBackupIndex);
                    }
                    setIsOnboardingEdit(false);
                    setIsTriggerEdit(false);
                    setOnboardingBackupMessages(null);
                    setOnboardingBackupIndex(null);
                    setOnboardingConfirmCallback(null);
                    setActiveTab('bot');
                  }}
                />
              )}
              {activeTab === 'code' && (
                <CodeEditor 
                    message={message} 
                    onChange={setMessage} 
                    onUndo={undo} 
                    onRedo={redo}
                    canUndo={historyIndex > 0}
                    canRedo={historyIndex < history.length - 1}
                />
              )}
              {activeTab === 'block' && (
                <BlockEditor 
                    message={message} 
                    onChange={setMessage}
                    onUndo={undo} 
                    onRedo={redo}
                    canUndo={historyIndex > 0}
                    canRedo={historyIndex < history.length - 1}
                />
              )}
              {activeTab === 'node' && (
                <NodeEditor message={message} onChange={setMessage} />
              )}
              {activeTab === 'logs' && (
                <LogPanel logs={logs} onClear={() => setLogs([])} />
              )}
              {activeTab === 'templates' && (
                <TemplatesPanel 
                  onApply={(msg) => {
                    setMessage(msg);
                    addLog("Applied template", 'info');
                  }} 
                />
              )}
              {activeTab === 'account' && (
                <AccountPanel 
                  message={message} 
                  onChange={setMessage} 
                  onSelectWebhook={(url, name) => {
                    setWebhookUrl(url);
                    setChannelName(name);
                    toast.success(`Selected webhook: #${name}`);
                    setActiveTab('editor');
                  }}
                />
              )}
              {activeTab === 'bot' && (
                <CompanionBotPanel 
                  onEditOnboardingMessage={(currentOnboardingMsg, onSaveCallback) => {
                    setOnboardingBackupMessages(messages);
                    setOnboardingBackupIndex(activeMessageIndex);
                    setMessages([currentOnboardingMsg]);
                    setActiveMessageIndex(0);
                    setIsOnboardingEdit(true);
                    setOnboardingConfirmCallback(() => onSaveCallback);
                    setActiveTab('editor');
                  }}
                  onEditTriggerMessage={(currentMsg, onSaveCallback) => {
                    setOnboardingBackupMessages(messages);
                    setOnboardingBackupIndex(activeMessageIndex);
                    setMessages([currentMsg]);
                    setActiveMessageIndex(0);
                    setIsOnboardingEdit(true);
                    setIsTriggerEdit(true);
                    setOnboardingConfirmCallback(() => onSaveCallback);
                    setActiveTab('editor');
                  }}
                  onAddWebhook={(url, name) => {
                    setWebhookUrl(url);
                    setChannelName(name);
                    toast.success(`Active webhook updated to #${name}`);
                    setActiveTab('editor');
                  }}
                />
              )}
            </div>
          </div>

          {/* Preview Column (Responsive) */}
          <AnimatePresence>
            {(fullScreenPreview && window.innerWidth < 1024) ? (
              <DiscordMobileChat 
                message={message} 
                webhookData={webhookData} 
                channelName={channelName}
                onExit={() => { setFullScreenPreview(false); setShowMobilePreview(false); }} 
              />
            ) : (
              <div className={cn(
                "bg-[#121212] border-l border-[#222] transition-all duration-300 ease-in-out overflow-x-hidden overflow-y-auto z-[110]",
                "fixed inset-y-0 right-0 shadow-[-10px_0_30px_rgba(0,0,0,0.55)] w-full sm:w-[460px] md:w-[480px]",
                "lg:static lg:transform-none lg:flex-shrink-0 lg:w-[420px] xl:w-[480px] lg:shadow-none",
                !showMobilePreview && "translate-x-full lg:hidden",
                showMobilePreview && "translate-x-0",
                fullScreenPreview && "!fixed !inset-0 !w-full !h-full !max-w-none !transform-none !z-[120]"
              )}>
                 <div className="h-full p-4 flex flex-col bg-[#121212]">
                    <div className="flex items-center justify-between mb-4 xl:mb-4">
                        <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Live Preview</h3>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => { playButtonSound(); setPreviewType(previewType === 'default' ? 'chat' : 'default'); }}
                                className={cn(
                                    "p-1.5 transition-all rounded-md flex items-center gap-2",
                                    previewType === 'chat' 
                                    ? "text-white bg-[#5865F2] shadow-[0_0_10px_rgba(88,101,242,0.3)]" 
                                    : "text-zinc-600 bg-white/5 hover:text-white"
                                )}
                                title={previewType === 'chat' ? "Layout: Message" : "Layout: Channel"}
                            >
                                {previewType === 'chat' ? (
                                    <MessageSquare className="w-4 h-4 fill-current" />
                                ) : (
                                    <MessageSquare className="w-4 h-4" />
                                )}
                            </button>
                            <div className="hidden lg:block">
                                <button
                                    onClick={() => { playButtonSound(); setFullScreenPreview(!fullScreenPreview); }}
                                    className="p-1.5 text-zinc-600 bg-white/5 hover:text-white rounded-md transition-all active:scale-95"
                                    title={fullScreenPreview ? "Exit Full Screen" : "Full Screen"}
                                >
                                    {fullScreenPreview ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                </button>
                            </div>
                            <button
                              onClick={() => { playButtonSound(); setDarkMode(!darkMode); }}
                              className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#222] rounded transition-colors"
                            >
                              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            </button>
                            <button 
                                onClick={() => { 
                                  playButtonSound(); 
                                  setShowMobilePreview(false); 
                                  setFullScreenPreview(false);
                                }} 
                                className="p-1.5 hover:bg-[#222] rounded text-zinc-400 hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <div className={cn(
                      "rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.3)] overflow-hidden flex-1 border transition-colors",
                      darkMode ? 'bg-[#313338] border-[#1e1f22]' : 'bg-[#ffffff] border-[#e3e5e8]'
                    )}>
                      <div className={cn(
                        "h-10 flex items-center px-4 gap-2 border-b",
                        darkMode ? 'bg-[#1e1f22] border-[#111214]' : 'bg-[#f2f3f5] border-[#e3e5e8]'
                      )}>
                        <div className={cn(
                          "font-bold text-sm",
                          darkMode ? 'text-[#949BA4]' : 'text-[#5c5e66]'
                        )}># {channelName}</div>
                      </div>
                      <div className="p-0 h-[calc(100%-2.5rem)] overflow-y-auto overflow-x-hidden custom-scrollbar">
                        <MessagePreview message={message} webhookData={webhookData} darkMode={darkMode} previewType={previewType} />
                      </div>
                    </div>
                 </div>
              </div>
            )}
          </AnimatePresence>

        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className={cn(
        "sm:hidden fixed bottom-0 left-0 right-0 bg-[#121212] border-t border-[#222] flex justify-around items-center h-14 z-[90] transition-all duration-300",
        (isKeyboardOpen || isVirtualKeyboardOpen) ? "translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
      )}>
        <button
          onClick={() => setActiveTab('editor')}
          className={cn("flex flex-col items-center justify-center w-full h-full transition-colors", activeTab === 'editor' ? "text-cyan-400" : "text-zinc-500 hover:text-zinc-300")}
        >
          <Layout className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Editor</span>
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={cn("flex flex-col items-center justify-center w-full h-full transition-colors", activeTab === 'logs' ? "text-cyan-400" : "text-zinc-500 hover:text-zinc-300")}
        >
          <Terminal className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Logs</span>
        </button>
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className={cn("flex flex-col items-center justify-center w-full h-full transition-colors", showMobileMenu ? "text-cyan-400" : "text-zinc-500 hover:text-zinc-300")}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Menu</span>
        </button>
      </div>

      <AnimatePresence>
        {showMobileMenu && (
          <div className="sm:hidden fixed inset-0 z-[999]">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#000000] opacity-90" 
              onClick={() => setShowMobileMenu(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.2 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100) {
                  setShowMobileMenu(false);
                }
              }}
              className="absolute bottom-0 left-0 right-0 bg-[#0c0c0c] rounded-t-[2.5rem] p-6 pt-4 shadow-[0_-20px_50px_rgba(0,0,0,1)] border-t border-white/10 max-h-[90vh] overflow-hidden flex flex-col z-[1000]"
              style={{ 
                transform: 'translateZ(0)',
                WebkitTransform: 'translateZ(0)',
                willChange: 'transform'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-10 cursor-grab active:cursor-grabbing shrink-0" />
              
              <div className="flex-1 overflow-y-auto no-scrollbar pb-12 px-2">
                {/* Section: Editors */}
                <div className="mb-10">
                  <div className="flex flex-col mb-5 px-1">
                    <h4 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.25em]">Studio Editors</h4>
                    <p className="text-[10px] text-zinc-600 mt-1.5 leading-none">Best experienced on desktop devices</p>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    {filteredEditorModes.map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => { setActiveTab(mode.id); setShowMobileMenu(false); }}
                        className={cn(
                          "relative flex flex-col items-center justify-center aspect-square rounded-[1.5rem] transition-all active:scale-95 overflow-hidden",
                          activeTab === mode.id 
                            ? "bg-cyan-500 text-black shadow-[0_8px_24px_rgba(6,182,212,0.4)]" 
                            : "bg-[#1a1a1a] text-zinc-400"
                        )}
                      >
                        <mode.icon className={cn("w-6 h-6 mb-2", activeTab === mode.id ? "text-black" : "text-zinc-500")} />
                        <span className="text-[9px] font-black uppercase tracking-tight">{mode.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section: Main Tabs */}
                <div className="mb-10">
                  <div className="flex flex-col mb-5 px-1">
                    <h4 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.25em]">Navigation</h4>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    {tabs.filter(t => t.id !== 'logs').map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setShowMobileMenu(false); }}
                        className={cn(
                          "relative flex flex-col items-center justify-center aspect-square rounded-[1.5rem] transition-all active:scale-95 overflow-hidden",
                          activeTab === tab.id 
                            ? "bg-cyan-500 text-black shadow-[0_8px_24px_rgba(6,182,212,0.4)]" 
                            : "bg-[#1a1a1a] text-zinc-400"
                        )}
                      >
                        <tab.icon className={cn("w-6 h-6 mb-2", activeTab === tab.id ? "text-black" : "text-zinc-500")} />
                        <span className="text-[9px] font-black uppercase tracking-tight">{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section: System Tools */}
                <div className="mb-10">
                  <div className="flex flex-col mb-5 px-1">
                    <h4 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.25em]">System Tools</h4>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <button
                      onClick={() => { playButtonSound(); setShowGlobalNotifications(true); setShowMobileMenu(false); }}
                      className="flex flex-col items-center justify-center aspect-square rounded-[1.5rem] bg-[#1a1a1a] text-zinc-400 active:scale-95 transition-all"
                    >
                      <Bell className="w-6 h-6 mb-2 text-zinc-500" />
                      <span className="text-[9px] font-black uppercase tracking-tight">Alerts</span>
                      {notificationsUnreadCount > 0 && (
                        <div className="absolute top-4 right-4 w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]">
                          <div className="absolute inset-0 bg-amber-500 rounded-full animate-ping opacity-50" />
                        </div>
                      )}
                    </button>
                    <button
                      onClick={() => { playButtonSound(); setShowMessageManager(true); setShowMobileMenu(false); }}
                      className="flex flex-col items-center justify-center aspect-square rounded-[1.5rem] bg-[#1a1a1a] text-zinc-400 active:scale-95 transition-all"
                    >
                      <Layers className="w-6 h-6 mb-2 text-zinc-500" />
                      <span className="text-[9px] font-black uppercase tracking-tight">Stack</span>
                    </button>
                    <button
                      onClick={() => { playButtonSound(); setShowWebhookManager(true); setShowMobileMenu(false); }}
                      className="flex flex-col items-center justify-center aspect-square rounded-[1.5rem] bg-[#1a1a1a] text-zinc-400 active:scale-95 transition-all"
                    >
                      <Settings className="w-6 h-6 mb-2 text-zinc-500" />
                      <span className="text-[9px] font-black uppercase tracking-tight">Hooks</span>
                    </button>
                    <button
                      onClick={() => { playButtonSound(); setShowJson(true); setShowMobileMenu(false); }}
                      className="flex flex-col items-center justify-center aspect-square rounded-[1.5rem] bg-[#1a1a1a] text-zinc-400 active:scale-95 transition-all"
                    >
                      <FileJson className="w-6 h-6 mb-2 text-zinc-500" />
                      <span className="text-[9px] font-black uppercase tracking-tight">JSON</span>
                    </button>
                    <button
                      onClick={() => { playButtonSound(); handleClear(); setShowMobileMenu(false); }}
                      className="flex flex-col items-center justify-center aspect-square rounded-[1.5rem] bg-red-500/10 text-red-500 active:scale-95 transition-all"
                    >
                      <Trash2 className="w-6 h-6 mb-2" />
                      <span className="text-[9px] font-black uppercase tracking-tight">Reset</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Notifications Sheet */}
      <AnimatePresence>
        {showGlobalNotifications && (
          <NotificationCenter 
            variant="default"
            forceOpen={true}
            onOpenStateChange={(isOpen) => {
                if (!isOpen) setShowGlobalNotifications(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Message Manager UI */}
      <AnimatePresence>
        {showMessageManager && (
          <MessageStackManager
            messages={messages}
            activeMessageIndex={activeMessageIndex}
            setActiveMessageIndex={setActiveMessageIndex}
            addNewMessage={addNewMessage}
            removeMessage={removeMessage}
            handleSend={handleSend}
            isSending={isSending}
            editMessageUrl={editMessageUrl}
            setEditMessageUrl={setEditMessageUrl}
            handleLoadMessage={handleLoadMessage}
            setShowDeleteMessageConfirm={setShowDeleteMessageConfirm}
            setShowMessageManager={setShowMessageManager}
            stackSelectMode={stackSelectMode}
            setStackSelectMode={setStackSelectMode}
            selectedMessages={selectedMessages}
            setSelectedMessages={setSelectedMessages}
            setMessages={setMessages}
          />
        )}
      </AnimatePresence>

      {/* Text Options Modal */}
      {showTextOptionsModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 sm:p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.1}
            onDragEnd={(_, info) => {
                if (info.offset.y > 100) {
                    setShowTextOptionsModal(false);
                }
            }}
            className="bg-[#121212] sm:rounded-xl shadow-2xl w-full h-full sm:h-auto sm:max-w-md flex flex-col border-white/5 sm:border-[#333]"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/5 sm:border-[#333]">
              <div className="flex flex-col">
                <h3 className="font-bold text-lg flex items-center gap-2 text-white"><Type className="w-5 h-5" /> Text Options</h3>
                <p className="text-[10px] text-zinc-500 sm:hidden">Drag down to close</p>
              </div>
              <button onClick={() => { playButtonSound(); setShowTextOptionsModal(false); }} className="p-1.5 hover:bg-[#222] text-zinc-400 hover:text-white rounded-md transition-colors">
                <span className="sr-only">Close</span>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-6">
              {/* Spell Check */}
              <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-medium text-white">Spell Check</h4>
                    <p className="text-xs text-zinc-400">Highlight spelling errors in the editor.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={spellCheckEnabled} onChange={() => { playButtonSound(); setSpellCheckEnabled(!spellCheckEnabled); }} />
                  <div className="w-11 h-6 bg-[#333] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>

              {/* Translate To */}
              <div className="space-y-2">
                <div>
                    <h4 className="font-medium text-white">Translate To</h4>
                    <p className="text-xs text-zinc-400">Select a language to translate your message to.</p>
                </div>
                <CustomDropdown
                    value={translateTo}
                    onChange={(val) => setTranslateTo(val)}
                    options={[
                        { value: "en", label: "English" },
                        { value: "es", label: "Spanish" },
                        { value: "fr", label: "French" },
                        { value: "de", label: "German" },
                        { value: "it", label: "Italian" },
                        { value: "pt", label: "Portuguese" },
                        { value: "ru", label: "Russian" },
                        { value: "ja", label: "Japanese" },
                        { value: "ko", label: "Korean" },
                        { value: "zh", label: "Chinese (Simplified)" },
                        { value: "hi", label: "Hindi" },
                        { value: "ar", label: "Arabic" }
                    ]}
                />
              </div>

              {/* Auto Correct */}
              <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-medium text-white">Auto Correct</h4>
                    <p className="text-xs text-zinc-400">Automatically correct grammar and spelling.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={autoCorrectEnabled} onChange={() => { playButtonSound(); setAutoCorrectEnabled(!autoCorrectEnabled); }} />
                  <div className="w-11 h-6 bg-[#333] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>
            </div>
            <div className="p-4 border-t border-[#333] flex justify-end gap-2 bg-[#0a0a0a] rounded-b-xl">
               <button 
                onClick={() => { playButtonSound(); setShowTextOptionsModal(false); }}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-[#222] hover:text-white rounded-lg transition-colors"
               >
                 Close
               </button>
               <button 
                onClick={() => { playButtonSound(); toast.success("Text options applied!"); setShowTextOptionsModal(false); }}
                className="px-4 py-2 text-sm font-bold text-white bg-cyan-500 hover:bg-cyan-400 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all"
               >
                 Apply & Save
               </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* JSON Modal */}
      {showJson && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 sm:p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.1}
            onDragEnd={(_, info) => {
                if (info.offset.y > 100) {
                    setShowJson(false);
                }
            }}
            className="bg-[#121212] sm:rounded-xl shadow-2xl w-full h-full sm:h-[80vh] sm:max-w-4xl flex flex-col border-white/5 sm:border-[#333]"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/5 sm:border-[#333]">
              <div className="flex flex-col">
                <h3 className="font-bold text-lg text-white">JSON Editor</h3>
                <p className="text-[10px] text-zinc-500 sm:hidden">Drag down to close</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyJson}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#222] hover:bg-[#333] text-zinc-300 rounded-md text-sm font-medium transition-colors border border-[#333]"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button onClick={() => setShowJson(false)} className="p-1.5 hover:bg-[#222] text-zinc-400 hover:text-white rounded-md transition-colors">
                  <span className="sr-only">Close</span>
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden p-0 relative">
              <textarea
                className="w-full h-full p-4 bg-[#0a0a0a] font-mono text-xs sm:text-sm text-zinc-300 resize-none focus:outline-none custom-scrollbar"
                defaultValue={JSON.stringify(message, null, 2)}
                spellCheck={false}
                id="json-editor-textarea"
              />
            </div>
            <div className="p-4 border-t border-[#333] flex justify-end gap-2 bg-[#121212] rounded-b-xl">
               <button 
                onClick={() => setShowJson(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-[#222] hover:text-white rounded-lg transition-colors"
               >
                 Cancel
               </button>
               <button 
                onClick={() => {
                  const textarea = document.getElementById('json-editor-textarea') as HTMLTextAreaElement;
                  try {
                    const parsed = JSON.parse(textarea.value);
                    setMessage(parsed);
                    setShowJson(false);
                    toast.success("JSON applied successfully");
                    addLog("Applied JSON from editor", 'info');
                  } catch (err) {
                    toast.error("Invalid JSON: " + err);
                    addLog(`JSON Parse Error: ${err}`, 'error');
                  }
                }}
                className="px-4 py-2 text-sm font-bold text-white bg-cyan-500 hover:bg-cyan-400 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all"
               >
                 Apply Changes
               </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Webhook Settings Modal */}
      {showWebhookManager && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 sm:p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.1}
            onDragEnd={(_, info) => {
                if (info.offset.y > 100) {
                    setShowWebhookManager(false);
                }
            }}
            className="bg-[#121212] sm:rounded-xl shadow-2xl w-full h-full sm:h-auto sm:max-w-lg flex flex-col border-white/5 sm:border-[#333]"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/5 sm:border-[#333]">
              <div className="flex flex-col">
                <h3 className="font-bold text-lg text-white">Webhook Settings</h3>
                <p className="text-[10px] text-zinc-500 sm:hidden">Drag down to close</p>
              </div>
              <button onClick={() => setShowWebhookManager(false)} className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#222] rounded-md transition-colors">
                <span className="sr-only">Close</span>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-zinc-400">
                Configure your Discord Webhook URL. You can save multiple webhooks as "Server Channels" to easily switch between them.
              </p>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-zinc-500">Select A Targeted Channel:</label>
                  <CustomDropdown
                    value={savedWebhooks.some(wh => wh.url === webhookUrl) ? webhookUrl : ""}
                    onChange={(val) => {
                      if (val) {
                        const selected = savedWebhooks.find(wh => wh.url === val);
                        if (selected) {
                          setWebhookUrl(selected.url);
                          setChannelName(selected.name);
                          toast.success(`Channel changed to #${selected.name}`);
                          addLog(`Switched to channel: #${selected.name}`, 'info');
                        }
                      } else {
                        setWebhookUrl('');
                      }
                    }}
                    options={[
                      { value: "", label: "-- Custom / New Webhook --" },
                      ...savedWebhooks.map(wh => ({ value: wh.url, label: `#${wh.name}` }))
                    ]}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-zinc-500">Targeted Webhook URL:</label>
                  <input 
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#333] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    placeholder="https://discord.com/api/webhooks/..."
                  />
                </div>

                <div className="pt-2">
                  <button 
                    onClick={() => {
                      if (webhookUrl) {
                        if (savedWebhooks.some(wh => wh.url === webhookUrl)) {
                          toast.error("This webhook URL is already saved.");
                          return;
                        }
                        const name = prompt("Enter a channel name (e.g. general):") || "general";
                        setSavedWebhooks([...savedWebhooks, { name, url: webhookUrl }]);
                        setChannelName(name);
                        toast.success(`Webhook saved as #${name}!`);
                        addLog(`Saved new channel: #${name}`, 'success');
                      } else {
                        toast.error("Ensure Target Webhook URL is set.");
                      }
                    }}
                    className="w-full py-2 bg-[#222] hover:bg-[#333] text-white text-sm font-bold rounded-md transition-colors flex items-center justify-center gap-2 border border-white/5"
                  >
                    <Plus className="w-4 h-4" /> Save Current Webhook
                  </button>
                </div>
                
                {savedWebhooks.length > 0 && (
                  <div className="pt-4 border-t border-[#333]">
                    <h4 className="text-xs font-bold uppercase text-zinc-500 mb-2">Saved Webhooks</h4>
                    <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar">
                      {savedWebhooks.map((wh, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-[#0a0a0a] p-2 rounded-md border border-[#333] group">
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-white truncate">#{wh.name}</span>
                            <span className="text-[10px] text-zinc-500 truncate">{wh.url}</span>
                          </div>
                          <button
                            onClick={() => {
                              setSavedWebhooks(savedWebhooks.filter((_, i) => i !== idx));
                              if (webhookUrl === wh.url) {
                                setWebhookUrl('');
                              }
                              toast.success(`Removed #${wh.name}`);
                            }}
                            className="p-1.5 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded-md hover:bg-white/5 shrink-0 ml-2"
                            title="Remove Channel"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t border-[#333]">
                  <button
                    onClick={() => { playButtonSound(); setShowDeleteWebhookConfirm(true); }}
                    disabled={!webhookUrl}
                    className="w-full py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Webhook from Discord
                  </button>
                </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Clear Confirm Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#121212] w-full max-w-md rounded-2xl shadow-2xl border border-[#333] overflow-hidden"
          >
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-2">Clear Message?</h2>
              <p className="text-sm text-zinc-400 mb-6">
                Are you sure you want to clear the current message? This will delete text fields and embeds.
              </p>

              <div className="space-y-3 mb-6">
                <label className="flex items-center justify-between p-3 rounded-lg border border-[#333] bg-[#0a0a0a] cursor-pointer">
                  <span className="text-sm font-medium text-zinc-300">Remove the WebHook URL</span>
                  <div className={cn("w-10 h-5 rounded-full transition-colors relative", clearRemoveWebhook ? "bg-cyan-500" : "bg-[#222]")}>
                    <div className={cn("absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform", clearRemoveWebhook ? "translate-x-5" : "")} />
                  </div>
                  <input type="checkbox" className="hidden" checked={clearRemoveWebhook} onChange={() => { playButtonSound(); setClearRemoveWebhook(!clearRemoveWebhook); }} />
                </label>
                
                <label className="flex items-center justify-between p-3 rounded-lg border border-[#333] bg-[#0a0a0a] cursor-pointer">
                  <span className="text-sm font-medium text-zinc-300">Hard reset (Delete all message stacks)</span>
                  <div className={cn("w-10 h-5 rounded-full transition-colors relative", clearHardReset ? "bg-red-500" : "bg-[#222]")}>
                    <div className={cn("absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform", clearHardReset ? "translate-x-5" : "")} />
                  </div>
                  <input type="checkbox" className="hidden" checked={clearHardReset} onChange={() => { playButtonSound(); setClearHardReset(!clearHardReset); }} />
                </label>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => { playButtonSound(); setShowClearConfirm(false); }}
                  className="px-4 py-2 rounded-lg font-medium text-zinc-400 hover:bg-[#222] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmClear}
                  className="px-4 py-2 rounded-lg font-bold text-white bg-red-500 hover:bg-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all"
                >
                  Clear
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Webhook Confirm Modal */}
      {showDeleteWebhookConfirm && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#121212] w-full max-w-md rounded-2xl shadow-2xl border border-[#333] overflow-hidden"
          >
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-2">Delete Webhook?</h2>
              <p className="text-sm text-zinc-400 mb-6">
                Are you sure you want to delete this webhook from Discord? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { playButtonSound(); setShowDeleteWebhookConfirm(false); }}
                  className="flex-1 py-2.5 bg-[#222] hover:bg-[#333] text-white font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { playDeleteSound(); handleDeleteWebhook(); }}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-400 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all"
                >
                  Delete Webhook
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Message Confirm Modal */}
      {showDeleteMessageConfirm && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#121212] w-full max-w-md rounded-2xl shadow-2xl border border-[#333] overflow-hidden"
          >
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-2">Delete Message?</h2>
              <p className="text-sm text-zinc-400 mb-6">
                Are you sure you want to delete this message from Discord? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { playButtonSound(); setShowDeleteMessageConfirm(false); }}
                  className="flex-1 py-2.5 bg-[#222] hover:bg-[#333] text-white font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { playDeleteSound(); handleDeleteMessage(); }}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-400 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all"
                >
                  Delete Message
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Mobile Experience Screen */}
      <AnimatePresence>
        {showMobileWarning && (
          <MobileExperience 
            onAccept={() => { playButtonSound(); setShowMobileWarning(false); }}
            onForcedDesktop={() => { 
                playButtonSound(); 
                const viewport = document.querySelector("meta[name=viewport]");
                if (viewport) {
                  viewport.setAttribute("content", "width=1024");
                }
                setShowMobileWarning(false);
                toast.info("Attempted to force desktop mode. You may need to use your browser's 'Request Desktop Site' feature.");
            }}
          />
        )}
      </AnimatePresence>

      {/* Limit Exceeded Modal */}
      <AnimatePresence>
        {showLimitModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#121212] rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden border border-[#333]"
            >
              <div className="p-6 space-y-4">
                <h1 className="font-bold text-2xl text-red-500">You have reached the limitation</h1>
                <p className="text-sm text-zinc-300">
                  Sorry, we can not do anything about that, but discord webhooks have limitations, discord will not support to send this message, the limitations are given below -
                </p>
                
                <div className="border border-[#333] rounded-xl overflow-hidden">
                  <button 
                    onClick={() => setShowLimitDetails(!showLimitDetails)}
                    className="w-full flex items-center justify-between p-3 bg-[#1a1a1a] hover:bg-[#222] transition-colors"
                  >
                    <span className="font-medium text-sm text-zinc-200">View Limitations</span>
                    <motion.div animate={{ rotate: showLimitDetails ? 180 : 0 }}>
                      <ChevronDown className="w-4 h-4 text-zinc-400" />
                    </motion.div>
                  </button>
                  
                  <AnimatePresence>
                    {showLimitDetails && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-[#0a0a0a] border-t border-[#333] overflow-hidden"
                      >
                        <div className="p-4">
                          <table className="w-full text-sm text-left">
                            <thead className="text-xs text-zinc-500 uppercase border-b border-[#333]">
                              <tr>
                                <th className="pb-2 font-medium">Feature</th>
                                <th className="pb-2 font-medium">Limit</th>
                              </tr>
                            </thead>
                            <tbody className="text-zinc-300">
                              <tr className="border-b border-[#222]">
                                <td className="py-2">Max Embeds</td>
                                <td className="py-2">10 per message</td>
                              </tr>
                              <tr className="border-b border-[#222]">
                                <td className="py-2">Total Characters</td>
                                <td className="py-2">6,000 (combined across all 10 embeds)</td>
                              </tr>
                              <tr className="border-b border-[#222]">
                                <td className="py-2">Fields per Embed</td>
                                <td className="py-2">25 fields</td>
                              </tr>
                              <tr className="border-b border-[#222]">
                                <td className="py-2">Description Length</td>
                                <td className="py-2">4,096 characters (per individual embed)</td>
                              </tr>
                              <tr>
                                <td className="py-2">Title Length</td>
                                <td className="py-2">256 characters</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {limitReasons.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-xs font-bold text-red-400 mb-1">Current Exceeded Limits:</p>
                    <ul className="list-disc list-inside text-xs text-red-300 space-y-1">
                      {limitReasons.map((reason, idx) => (
                        <li key={idx}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-[#0a0a0a] border-t border-[#333] flex flex-col sm:flex-row gap-2">
                <button 
                  onClick={() => { 
                    playButtonSound(); 
                    setIgnoreLimits(true);
                    setShowLimitModal(false); 
                  }}
                  className="flex-1 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 rounded-xl font-bold transition-colors text-sm"
                >
                  Continue anyway
                </button>
                <button 
                  onClick={() => { 
                    playButtonSound(); 
                    
                    // Revert to last valid message
                    const newMessages = [...messages];
                    newMessages[activeMessageIndex] = lastValidMessage;
                    setMessages(newMessages);
                    
                    setShowLimitModal(false); 
                  }}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-400 text-white rounded-xl font-bold transition-colors shadow-[0_0_15px_rgba(239,68,68,0.3)] text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => { 
                    playButtonSound(); 
                    setShowLimitModal(false); 
                  }}
                  className="flex-1 py-2.5 bg-[#222] hover:bg-[#333] text-zinc-300 hover:text-white border border-[#333] rounded-xl font-bold transition-colors text-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showIntro && (
          <CinematicIntro onComplete={() => setShowIntro(false)} />
        )}
      </AnimatePresence>

      <VirtualKeyboard />

      <TemplateCreator
        isOpen={showTemplateCreator}
        onClose={() => setShowTemplateCreator(false)}
        currentEditorMessage={message}
        onUpdateEditorMessage={setMessage}
        onSwitchTab={setActiveTab}
      />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #2b2d31; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1a1b1e; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #111214; 
        }
      `}</style>
    </div>
  );
}

export default App;
