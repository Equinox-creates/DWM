import React, { useState, useEffect } from 'react';
import { LogOut, Shield, Loader2, Trash2, Copy, Plus, Hash, Settings, X, Save, Image as ImageIcon, ChevronRight, Server, Globe, Link as LinkIcon } from 'lucide-react';
import { toast } from '../utils/toast';
import { playButtonSound, playDeleteSound } from '../utils/sounds';
import { motion, AnimatePresence } from 'motion/react';

import { DiscordWebhookMessage } from '../types';

interface DiscordWebhook {
  id: string;
  name: string;
  channel_id: string;
  guild_id: string;
  url: string;
  avatar?: string;
  guild_name?: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  message: DiscordWebhookMessage;
}

interface AccountPanelProps {
  message: DiscordWebhookMessage;
  onChange: (message: DiscordWebhookMessage) => void;
}

export const AccountPanel: React.FC<AccountPanelProps> = ({ message, onChange }) => {
  const [username, setUsername] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [userId, setUserId] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [webhooks, setWebhooks] = useState<DiscordWebhook[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [messageCounts, setMessageCounts] = useState<Record<string, number>>({});

  const [activeView, setActiveView] = useState<'dashboard' | 'manage_webhooks' | 'create_webhook' | 'templates'>('dashboard');
  const [templateTab, setTemplateTab] = useState<'list' | 'create'>('list');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [serverFilter, setServerFilter] = useState<string>('all');

  const [editingWebhook, setEditingWebhook] = useState<DiscordWebhook | null>(null);
  const [editName, setEditName] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editChannelId, setEditChannelId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Create Webhook State
  const [newWebhookName, setNewWebhookName] = useState('');
  const [newWebhookAvatar, setNewWebhookAvatar] = useState('');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookGuild, setNewWebhookGuild] = useState('');
  const [isFetchingWebhook, setIsFetchingWebhook] = useState(false);

  // Auto-fetch webhook details when URL is pasted
  useEffect(() => {
    const fetchWebhookDetails = async () => {
      const match = newWebhookUrl.match(/discord\.com\/api\/webhooks\/([^/]+)\/([^/]+)/);
      if (match && !isFetchingWebhook) {
        setIsFetchingWebhook(true);
        try {
          const response = await fetch(newWebhookUrl);
          if (response.ok) {
            const data = await response.json();
            setNewWebhookName(prev => prev || data.name || '');
            setNewWebhookAvatar(prev => prev || (data.avatar ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png` : ''));
            setNewWebhookGuild(prev => {
              if (prev) return prev;
              const knownGuild = webhooks.find(w => w.guild_id === data.guild_id)?.guild_name;
              return knownGuild || (data.guild_id ? `Server ${data.guild_id}` : '');
            });
            toast.success("Webhook details fetched automatically!");
          }
        } catch (error) {
          console.error("Failed to fetch webhook details:", error);
        }
      }
    };

    const timeoutId = setTimeout(fetchWebhookDetails, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [newWebhookUrl, isFetchingWebhook, webhooks]); // Only run when URL changes

  useEffect(() => {
    const storedUser = localStorage.getItem('username');
    const storedAvatar = localStorage.getItem('user_avatar');
    const storedId = localStorage.getItem('user_id');
    if (storedUser) {
      setUsername(storedUser);
      if (storedAvatar) setUserAvatar(storedAvatar);
      if (storedId) setUserId(storedId);
      setIsLoggedIn(true);
      loadWebhooks();
      loadMessageCounts();
    }
    loadTemplates();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const { user, token, webhook } = event.data.data;
        localStorage.setItem('username', user.username);
        localStorage.setItem('discord_token', token);
        if (user.avatar) localStorage.setItem('user_avatar', user.avatar);
        if (user.id) localStorage.setItem('user_id', user.id);
        
        setUsername(user.username);
        setUserAvatar(user.avatar || '');
        setUserId(user.id || '');
        setIsLoggedIn(true);
        
        if (webhook) {
            addWebhook({
              ...webhook,
              guild_name: webhook.guild?.name || 'Unknown Server'
            });
            toast.success(`Webhook created successfully!`);
        } else {
            toast.success(`Welcome, ${user.username}!`);
        }
      }
    };

    const handleCountUpdate = () => {
      loadMessageCounts();
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('webhook_count_updated', handleCountUpdate);
    
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('webhook_count_updated', handleCountUpdate);
    };
  }, []);

  const loadTemplates = () => {
    try {
      const stored = localStorage.getItem('discord_templates');
      if (stored) {
        setTemplates(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load templates', e);
    }
  };

  const loadWebhooks = () => {
    try {
      const stored = localStorage.getItem('discord_webhooks');
      if (stored) {
        setWebhooks(JSON.parse(stored));
      } else {
        const oldWebhook = localStorage.getItem('discord_webhook');
        if (oldWebhook) {
          const parsed = JSON.parse(oldWebhook);
          setWebhooks([parsed]);
          localStorage.setItem('discord_webhooks', JSON.stringify([parsed]));
        }
      }
    } catch (e) {
      console.error('Failed to load webhooks', e);
    }
  };

  const loadMessageCounts = () => {
    try {
      const stored = localStorage.getItem('webhook_message_counts');
      if (stored) {
        setMessageCounts(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load message counts', e);
    }
  };

  const addWebhook = (newWebhook: DiscordWebhook) => {
    setWebhooks(prev => {
      if (prev.some(w => w.id === newWebhook.id)) return prev;
      const updated = [...prev, newWebhook];
      localStorage.setItem('discord_webhooks', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteWebhook = (id: string) => {
    playDeleteSound();
    setWebhooks(prev => {
      const updated = prev.filter(w => w.id !== id);
      localStorage.setItem('discord_webhooks', JSON.stringify(updated));
      return updated;
    });
    toast.success("Webhook removed from dashboard.");
  };

  const handleCopyUrl = (url: string) => {
    playButtonSound();
    navigator.clipboard.writeText(url);
    toast.success("Webhook URL copied to clipboard!");
  };

  const openSettings = (webhook: DiscordWebhook) => {
    playButtonSound();
    setEditingWebhook(webhook);
    setEditName(webhook.name || '');
    setEditAvatarUrl('');
    setEditChannelId(webhook.channel_id || '');
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await convertImageToBase64(file);
        setter(base64);
      } catch {
        toast.error("Failed to process image");
      }
    }
  };

  const saveWebhookSettings = async () => {
    if (!editingWebhook) return;
    playButtonSound();
    setIsSaving(true);
    
    try {
      const payload: Record<string, string> = { name: editName };
      if (editAvatarUrl) {
        payload.avatar = editAvatarUrl;
      }
      if (editChannelId && editChannelId !== editingWebhook.channel_id) {
        payload.channel_id = editChannelId;
      }

      const response = await fetch(editingWebhook.url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to update webhook');
      }

      const updatedData = await response.json();
      
      setWebhooks(prev => {
        const updated = prev.map(w => w.id === editingWebhook.id ? { 
          ...w, 
          name: updatedData.name || editName, 
          avatar: updatedData.avatar || editAvatarUrl,
          channel_id: updatedData.channel_id || editChannelId
        } : w);
        localStorage.setItem('discord_webhooks', JSON.stringify(updated));
        return updated;
      });
      
      toast.success("Webhook updated successfully!");
      setEditingWebhook(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update webhook. Make sure the URL is valid and you have permissions.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscordLogin = async () => {
    playButtonSound();
    
    // Open window immediately to bypass popup blockers
    const width = 500;
    const height = 750;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    const authWindow = window.open(
      '',
      'discord_oauth',
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
    );
    
    if (!authWindow) {
      toast.error('Please allow popups to sign in with Discord');
      return;
    }

    // Show loading state in the popup
    authWindow.document.write(`
      <html>
        <body style="background-color: #36393f; color: white; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="text-align: center;">
            <h2 style="margin-bottom: 10px;">Connecting to Discord...</h2>
            <p style="color: #b9bbbe;">Please wait while we redirect you.</p>
          </div>
        </body>
      </html>
    `);

    setIsLoading(true);
    try {
      const response = await fetch(`/api/auth/discord/url`);
      if (!response.ok) throw new Error('Failed to get auth URL');
      const { url } = await response.json();
      
      // Redirect the popup to the actual Discord OAuth URL
      authWindow.location.href = url;
    } catch (error) {
      console.error('Discord login error:', error);
      toast.error('Failed to initiate Discord login');
      authWindow.close();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    playButtonSound();
    setIsLoggedIn(false);
    setUsername('');
    setUserAvatar('');
    setUserId('');
    setWebhooks([]);
    setActiveView('dashboard');
    localStorage.removeItem('username');
    localStorage.removeItem('user_avatar');
    localStorage.removeItem('user_id');
    localStorage.removeItem('discord_token');
    localStorage.removeItem('discord_webhook');
    localStorage.removeItem('discord_webhooks');
    toast.success("Logged out successfully.");
  };

  const handleManualWebhookCreate = () => {
    playButtonSound();
    if (!newWebhookUrl || !newWebhookName) {
      toast.error("Please provide a name and URL");
      return;
    }
    
    // Extract ID from URL
    const match = newWebhookUrl.match(/api\/webhooks\/([^/]+)\//);
    const id = match ? match[1] : Date.now().toString();
    
    const newWebhook: DiscordWebhook = {
      id,
      name: newWebhookName,
      url: newWebhookUrl,
      channel_id: 'Unknown',
      guild_id: 'Unknown',
      guild_name: newWebhookGuild || 'Manual Entry',
      avatar: newWebhookAvatar
    };
    
    addWebhook(newWebhook);
    toast.success("Webhook added successfully!");
    setActiveView('manage_webhooks');
    setNewWebhookName('');
    setNewWebhookUrl('');
    setNewWebhookAvatar('');
    setNewWebhookGuild('');
  };

  const handleSaveTemplate = () => {
    if (!newTemplateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }
    const newTemplate: MessageTemplate = {
      id: crypto.randomUUID(),
      name: newTemplateName,
      message: JSON.parse(JSON.stringify(message)) // deep copy
    };
    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);
    localStorage.setItem('discord_templates', JSON.stringify(updatedTemplates));
    setNewTemplateName('');
    setTemplateTab('list');
    toast.success('Template saved successfully!');
    playButtonSound();
  };

  const handleLoadTemplate = (template: MessageTemplate) => {
    onChange(JSON.parse(JSON.stringify(template.message)));
    toast.success('Template loaded!');
    playButtonSound();
  };

  const handleDeleteTemplate = (id: string) => {
    const updatedTemplates = templates.filter(t => t.id !== id);
    setTemplates(updatedTemplates);
    localStorage.setItem('discord_templates', JSON.stringify(updatedTemplates));
    toast.success('Template deleted');
    playDeleteSound();
  };

  // 3D Animated Background Component
  const AnimatedBackground = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[80px] animate-blob" />
      <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/20 rounded-full blur-[100px] animate-blob animation-delay-2000" />
      <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] bg-purple-500/20 rounded-full blur-[120px] animate-blob animation-delay-4000" />
      
      {/* Floating 3D-like shapes */}
      <motion.div 
        animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }} 
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[15%] left-[10%] w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.5)] opacity-40 backdrop-blur-xl border border-white/10"
        style={{ transformStyle: 'preserve-3d', transform: 'perspective(500px) rotateX(20deg) rotateY(-20deg)' }}
      />
      <motion.div 
        animate={{ y: [0, 30, 0], rotate: [0, -15, 0] }} 
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[20%] right-[15%] w-24 h-24 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-full shadow-[0_0_40px_rgba(6,182,212,0.4)] opacity-30 backdrop-blur-xl border border-white/10"
      />
      <motion.div 
        animate={{ y: [0, -15, 0], x: [0, 15, 0], rotate: [0, 45, 0] }} 
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-[40%] right-[25%] w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg shadow-[0_0_20px_rgba(236,72,153,0.4)] opacity-40 backdrop-blur-xl border border-white/10"
        style={{ transformStyle: 'preserve-3d', transform: 'perspective(500px) rotateX(40deg) rotateY(20deg)' }}
      />
    </div>
  );

  if (!isLoggedIn) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-[#0a0a0a] rounded-xl border border-zinc-800 text-center overflow-hidden relative">
        <AnimatedBackground />
        
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-sm bg-[#121212]/80 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl border border-white/10 relative z-10"
        >
            <div className="flex justify-center mb-8 relative">
                <div className="absolute inset-0 bg-[#5865F2] blur-2xl opacity-40 rounded-full animate-pulse" />
                <div className="w-16 h-16 bg-gradient-to-br from-[#5865F2] to-[#4752C4] rounded-2xl flex items-center justify-center shadow-xl relative z-10 border border-white/20 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                    <Shield className="w-8 h-8 text-white" />
                </div>
            </div>
            
            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
                Welcome to DWM
            </h2>
            <p className="text-sm text-zinc-400 mb-8 font-medium">
                Professional tools to manage your Discord Webhooks
            </p>
            
            <button 
                onClick={handleDiscordLogin}
                disabled={isLoading}
                className="w-full py-4 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(88,101,242,0.4)] border border-white/10"
            >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <svg className="w-6 h-6" viewBox="0 0 127.14 96.36" fill="currentColor">
                      <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.33,46,96.22,53,91.08,65.69,84.69,65.69Z"/>
                    </svg>
                    Login with Discord
                  </>
                )}
            </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] rounded-xl overflow-hidden border border-zinc-800 relative">
      <AnimatedBackground />
      
      {/* Header */}
      <div className="p-6 border-b border-zinc-800 bg-[#121212]/80 backdrop-blur-xl flex flex-col items-center relative overflow-hidden shrink-0 z-10">
        <div className="relative mb-3">
          <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center shadow-2xl border-4 border-zinc-700 relative z-10 overflow-hidden">
            {userAvatar && userId ? (
              <img src={`https://cdn.discordapp.com/avatars/${userId}/${userAvatar}.png`} alt={username} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-cyan-400">{username.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-zinc-800 z-20 shadow-[0_0_10px_rgba(34,197,94,0.5)]" title="Online" />
        </div>
        <h2 className="text-xl font-black text-white relative z-10 tracking-tight">{username}</h2>
      </div>

      <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar relative z-10">
        <AnimatePresence mode="wait">
          {activeView === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Dashboard</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Manage Webhooks Card */}
                <button 
                  onClick={() => { playButtonSound(); setActiveView('manage_webhooks'); }}
                  className="flex flex-col items-start p-5 bg-[#121212]/80 backdrop-blur-md rounded-2xl border border-white/5 hover:border-cyan-500/50 transition-all group hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] hover:-translate-y-1"
                >
                  <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition-colors">
                    <Hash className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-1">Manage Webhooks</h4>
                  <p className="text-sm text-zinc-400 text-left mb-4">View, edit, and manage all your connected Discord webhooks.</p>
                  <div className="mt-auto flex items-center text-cyan-400 text-sm font-bold group-hover:translate-x-1 transition-transform">
                    View Webhooks <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </button>

                {/* Create Webhook Card */}
                <button 
                  onClick={() => { playButtonSound(); setActiveView('create_webhook'); }}
                  className="flex flex-col items-start p-5 bg-[#121212]/80 backdrop-blur-md rounded-2xl border border-white/5 hover:border-[#5865F2]/50 transition-all group hover:shadow-[0_0_30px_rgba(88,101,242,0.15)] hover:-translate-y-1"
                >
                  <div className="w-12 h-12 bg-[#5865F2]/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#5865F2]/20 transition-colors">
                    <Plus className="w-6 h-6 text-[#5865F2]" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-1">Create Webhook</h4>
                  <p className="text-sm text-zinc-400 text-left mb-4">Add a new webhook manually or connect via Discord OAuth.</p>
                  <div className="mt-auto flex items-center text-[#5865F2] text-sm font-bold group-hover:translate-x-1 transition-transform">
                    Add New <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </button>

                {/* Create Template Card */}
                <button 
                  onClick={() => { playButtonSound(); setActiveView('templates'); }}
                  className="flex flex-col items-start p-5 bg-[#121212]/80 backdrop-blur-md rounded-2xl border border-white/5 hover:border-purple-500/50 transition-all group hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:-translate-y-1"
                >
                  <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
                    <Copy className="w-6 h-6 text-purple-400" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-1">Templates</h4>
                  <p className="text-sm text-zinc-400 text-left mb-4">Save and load your message designs as reusable templates.</p>
                  <div className="mt-auto flex items-center text-purple-400 text-sm font-bold group-hover:translate-x-1 transition-transform">
                    Manage Templates <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </button>
              </div>

              {/* Stats Card */}
              <div className="p-5 bg-[#121212]/80 backdrop-blur-md rounded-2xl border border-white/5 mt-4">
                <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Overview</h4>
                <div className="flex items-center justify-around">
                  <div className="text-center">
                    <div className="text-3xl font-black text-white mb-1">{webhooks.length}</div>
                    <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Total Webhooks</div>
                  </div>
                  <div className="w-px h-12 bg-zinc-800" />
                  <div className="text-center">
                    <div className="text-3xl font-black text-cyan-400 mb-1">
                      {Object.values(messageCounts).reduce((a, b) => a + b, 0)}
                    </div>
                    <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Messages Sent</div>
                  </div>
                  <div className="w-px h-12 bg-zinc-800" />
                  <div className="text-center">
                    <div className="text-3xl font-black text-purple-400 mb-1">{templates.length}</div>
                    <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Templates</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeView === 'manage_webhooks' && (
            <motion.div 
              key="manage_webhooks"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-6">
                <button 
                  onClick={() => { playButtonSound(); setActiveView('dashboard'); }}
                  className="flex items-center text-sm font-bold text-zinc-400 hover:text-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4 mr-1 rotate-180" /> Back
                </button>
                <div className="flex items-center gap-3">
                  <select 
                    value={serverFilter}
                    onChange={(e) => setServerFilter(e.target.value)}
                    className="bg-[#1a1a1a] border border-zinc-800 text-white text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="all">All Servers</option>
                    {Array.from(new Set(webhooks.map(w => w.guild_name).filter(Boolean))).map(guild => (
                      <option key={guild} value={guild}>{guild}</option>
                    ))}
                  </select>
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Your Webhooks</h3>
                </div>
              </div>

              <div className="space-y-3">
                {webhooks.filter(w => serverFilter === 'all' || w.guild_name === serverFilter).map(webhook => (
                  <div key={webhook.id} className="flex flex-col p-4 bg-[#121212]/80 backdrop-blur-md rounded-xl border border-white/5 hover:border-cyan-500/30 transition-colors group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {webhook.avatar ? (
                          <img src={webhook.avatar.startsWith('http') ? webhook.avatar : `https://cdn.discordapp.com/avatars/${webhook.id}/${webhook.avatar}.png`} alt={webhook.name} className="w-12 h-12 rounded-full border border-zinc-700" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                            <Hash className="w-6 h-6 text-zinc-500" />
                          </div>
                        )}
                        <div>
                          <div className="text-base font-bold text-white mb-0.5">{webhook.name || 'Unnamed Webhook'}</div>
                          <div className="flex flex-col gap-1">
                            <div className="text-xs text-zinc-400 flex items-center gap-1.5 bg-zinc-800/50 w-fit px-2 py-0.5 rounded">
                              <Server className="w-3 h-3 text-indigo-400" /> {webhook.guild_name || 'Unknown Server'}
                            </div>
                            <div className="text-[10px] text-zinc-500 flex items-center gap-1 font-mono">
                              <Hash className="w-3 h-3" /> {webhook.channel_id}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openSettings(webhook)} 
                          className="p-2 text-zinc-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-colors" 
                          title="Edit Webhook"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleCopyUrl(webhook.url)} 
                          className="p-2 text-zinc-400 hover:text-green-400 hover:bg-green-400/10 rounded-lg transition-colors" 
                          title="Copy Webhook URL"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteWebhook(webhook.id)} 
                          className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" 
                          title="Delete Webhook"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {webhooks.length === 0 && (
                  <div className="text-center py-12 px-4 bg-[#121212]/50 rounded-xl border border-dashed border-zinc-700">
                    <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Hash className="w-8 h-8 text-zinc-500" />
                    </div>
                    <h4 className="text-base font-bold text-white mb-2">No Webhooks Found</h4>
                    <p className="text-sm text-zinc-400 mb-6">You haven't added any webhooks yet.</p>
                    <button 
                      onClick={() => { playButtonSound(); setActiveView('create_webhook'); }}
                      className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg text-sm font-bold transition-colors inline-flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                    >
                      <Plus className="w-4 h-4" /> Create Webhook
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeView === 'create_webhook' && (
            <motion.div 
              key="create_webhook"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-2">
                <button 
                  onClick={() => { playButtonSound(); setActiveView('dashboard'); }}
                  className="flex items-center text-sm font-bold text-zinc-400 hover:text-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4 mr-1 rotate-180" /> Back
                </button>
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Add Webhook</h3>
              </div>

              {/* Option 1: OAuth */}
              <div className="p-6 bg-[#121212]/80 backdrop-blur-md rounded-2xl border border-[#5865F2]/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#5865F2]/10 rounded-full blur-3xl" />
                <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-[#5865F2]" /> Auto Connect (Recommended)
                </h4>
                <p className="text-sm text-zinc-400 mb-6">Select a server and channel using Discord's official integration. This is the easiest and most secure method.</p>
                <button 
                  onClick={handleDiscordLogin}
                  disabled={isLoading}
                  className="w-full py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(88,101,242,0.3)]"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  Connect via Discord
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="h-px bg-zinc-800 flex-1" />
                <span className="text-xs font-bold text-zinc-500 uppercase">OR MANUAL ENTRY</span>
                <div className="h-px bg-zinc-800 flex-1" />
              </div>

              {/* Option 2: Manual */}
              <div className="p-6 bg-[#121212]/80 backdrop-blur-md rounded-2xl border border-white/5 space-y-4">
                <h4 className="text-lg font-bold text-white mb-4">Manual Setup</h4>
                
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Webhook URL *</label>
                  <input 
                    type="text" 
                    value={newWebhookUrl}
                    onChange={(e) => setNewWebhookUrl(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    placeholder="https://discord.com/api/webhooks/..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Name *</label>
                    <input 
                      type="text" 
                      value={newWebhookName}
                      onChange={(e) => setNewWebhookName(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="My Webhook"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Server Name</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={newWebhookGuild}
                        onChange={(e) => setNewWebhookGuild(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                        placeholder="Type or select below"
                        list="known-servers"
                      />
                      <datalist id="known-servers">
                        {Array.from(new Set(webhooks.map(w => w.guild_name).filter(Boolean))).map(guild => (
                          <option key={guild} value={guild} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Avatar URL</label>
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0a0a0a] border border-zinc-800 flex items-center justify-center shrink-0 overflow-hidden">
                      {newWebhookAvatar ? <img src={newWebhookAvatar} alt="preview" className="w-full h-full object-cover" /> : <ImageIcon className="w-4 h-4 text-zinc-600" />}
                    </div>
                    <input 
                      type="text" 
                      value={newWebhookAvatar}
                      onChange={(e) => setNewWebhookAvatar(e.target.value)}
                      className="flex-1 bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <button 
                  onClick={handleManualWebhookCreate}
                  className="w-full py-3 mt-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save Webhook
                </button>
              </div>
            </motion.div>
          )}
          {activeView === 'templates' && (
            <motion.div 
              key="templates"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-6">
                <button 
                  onClick={() => { playButtonSound(); setActiveView('dashboard'); }}
                  className="flex items-center text-zinc-400 hover:text-white transition-colors text-sm font-bold"
                >
                  <ChevronRight className="w-4 h-4 mr-1 rotate-180" /> Back to Dashboard
                </button>
                <h3 className="text-sm font-bold text-purple-400 uppercase tracking-widest">Templates</h3>
              </div>

              <div className="flex bg-[#121212]/80 backdrop-blur-md p-1 rounded-xl border border-white/5 mb-6">
                <button
                  onClick={() => { playButtonSound(); setTemplateTab('list'); }}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${templateTab === 'list' ? 'bg-purple-500 text-white shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                >
                  Your Templates
                </button>
                <button
                  onClick={() => { playButtonSound(); setTemplateTab('create'); }}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${templateTab === 'create' ? 'bg-purple-500 text-white shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                >
                  Create Template
                </button>
              </div>

              {templateTab === 'list' && (
                <div className="space-y-4">
                  {templates.length === 0 ? (
                    <div className="text-center py-12 bg-[#121212]/50 rounded-2xl border border-white/5 border-dashed">
                      <Copy className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-white mb-2">No Templates Yet</h3>
                      <p className="text-sm text-zinc-400 mb-6 max-w-xs mx-auto">Create a template to save your message designs for quick reuse.</p>
                      <button 
                        onClick={() => { playButtonSound(); setTemplateTab('create'); }}
                        className="px-6 py-2.5 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]"
                      >
                        Create Your First Template
                      </button>
                    </div>
                  ) : (
                    templates.map((template) => (
                      <div key={template.id} className="p-4 bg-[#121212]/80 backdrop-blur-md rounded-2xl border border-white/5 flex items-center justify-between group hover:border-purple-500/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                            <Copy className="w-5 h-5 text-purple-400" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white">{template.name}</h4>
                            <p className="text-xs text-zinc-400">{template.message.embeds?.length || 0} Embeds • {template.message.content ? 'Has Content' : 'No Content'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleLoadTemplate(template)}
                            className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-white text-sm font-bold rounded-lg transition-all"
                          >
                            Load
                          </button>
                          <button 
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete Template"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {templateTab === 'create' && (
                <div className="p-6 bg-[#121212]/80 backdrop-blur-md rounded-2xl border border-white/5 space-y-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                      <Save className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Save Current Message</h3>
                      <p className="text-sm text-zinc-400">Save the message currently in the editor as a template.</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                      Template Name
                    </label>
                    <input 
                      type="text" 
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder="e.g., Welcome Message, Announcement"
                    />
                  </div>

                  <button 
                    onClick={handleSaveTemplate}
                    disabled={!newTemplateName.trim()}
                    className="w-full py-3 bg-purple-500 hover:bg-purple-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] disabled:shadow-none flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" /> Save Template
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-4 border-t border-zinc-800 bg-[#121212]/90 backdrop-blur-xl relative z-10">
        <button 
          onClick={() => { playButtonSound(); setShowSignOutConfirm(true); }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors text-sm font-bold border border-transparent hover:border-red-500/30"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {editingWebhook && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#121212] rounded-2xl shadow-2xl w-full max-w-md border border-zinc-800 overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-[#1a1a1a]">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-cyan-400" />
                  Webhook Settings
                </h3>
                <button 
                  onClick={() => setEditingWebhook(null)}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-5">
                {/* Copy URL Tool */}
                <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center">
                      <LinkIcon className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Webhook URL</div>
                      <div className="text-xs text-zinc-400">Copy the URL to use elsewhere</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleCopyUrl(editingWebhook.url)}
                    className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold rounded-lg transition-colors"
                  >
                    Copy
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Webhook Name
                  </label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    placeholder="Enter webhook name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Target Channel ID
                  </label>
                  <input 
                    type="text" 
                    value={editChannelId}
                    onChange={(e) => setEditChannelId(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                    placeholder="Channel ID"
                    list="known-channels"
                  />
                  <datalist id="known-channels">
                    {Array.from(new Set(webhooks.map(w => w.channel_id).filter(Boolean))).map(channel => (
                      <option key={channel} value={channel} />
                    ))}
                  </datalist>
                  <p className="text-[10px] text-zinc-500 mt-1">Note: The webhook must have permissions in the new channel.</p>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Webhook Avatar
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-[#0a0a0a] border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                      {editAvatarUrl ? (
                        <img src={editAvatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                      ) : editingWebhook.avatar ? (
                        <img src={editingWebhook.avatar.startsWith('http') ? editingWebhook.avatar : `https://cdn.discordapp.com/avatars/${editingWebhook.id}/${editingWebhook.avatar}.png`} alt="Current" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-zinc-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input 
                        type="file" 
                        accept="image/png, image/jpeg, image/gif"
                        onChange={(e) => handleAvatarUpload(e, setEditAvatarUrl)}
                        className="hidden"
                        id="avatar-upload"
                      />
                      <label 
                        htmlFor="avatar-upload"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium cursor-pointer transition-colors"
                      >
                        <ImageIcon className="w-4 h-4" />
                        Upload Image
                      </label>
                      <p className="text-xs text-zinc-500 mt-2">
                        Recommended size: 128x128px. Max 1MB.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-5 border-t border-zinc-800 bg-[#1a1a1a] flex justify-end gap-3">
                <button 
                  onClick={() => setEditingWebhook(null)}
                  className="px-4 py-2 text-sm font-bold text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveWebhookSettings}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg text-sm font-bold transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sign Out Confirmation Modal */}
      <AnimatePresence>
        {showSignOutConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#121212] rounded-2xl shadow-2xl w-full max-w-sm border border-zinc-800 overflow-hidden text-center p-6"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Sign Out</h3>
              <p className="text-sm text-zinc-400 mb-8">Are you sure you want to sign out? You will need to reconnect your Discord account to manage webhooks.</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowSignOutConfirm(false)}
                  className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setShowSignOutConfirm(false);
                    handleLogout();
                  }}
                  className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                >
                  Yes, Sign Out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
