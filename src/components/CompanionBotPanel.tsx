/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Webhook, Plus, ArrowRight, ArrowLeft, Shield, Trash2, Key, Save, MessageSquare, 
  Bell, UserPlus, RefreshCw, Check, Zap, BookOpen, 
  Palette, Sliders, Eye, CheckSquare, Sparkles,
  ChevronDown, Pencil, Bot, Hash, Copy, AlertTriangle,
  Search, X, ChevronUp, Link, Globe
} from 'lucide-react';
import { toast } from '../utils/toast';
import { cn } from '../utils';
import { DiscordWebhookMessage } from '../types';
import { playButtonSound, playDeleteSound } from '../utils/sounds';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { CommandCheatSheetModal } from './CommandCheatSheetModal';
import { CommandManualInline } from './CommandManualInline';

// High-fidelity accents and style mappings for dynamic per-server themes
const themeStyles: Record<string, {
  accent: string;
  textAccent: string;
  bgAccent: string;
  borderAccent: string;
  accentHover: string;
  gradient: string;
  bgGlow: string;
  name: string;
}> = {
  discord: {
    accent: '#5865F2',
    textAccent: 'text-[#5865F2]',
    bgAccent: 'bg-[#5865F2]',
    borderAccent: 'border-[#5865F2]/40 focus:border-[#5865F2]',
    accentHover: 'hover:bg-[#4752C4]',
    gradient: 'from-[#5865F2] to-[#404eed]',
    bgGlow: 'shadow-[0_0_20px_rgba(88,101,242,0.15)]',
    name: 'Discord Classic'
  },
  twilight: {
    accent: '#F59E0B',
    textAccent: 'text-[#F59E0B]',
    bgAccent: 'bg-[#F59E0B]',
    borderAccent: 'border-[#F59E0B]/40 focus:border-[#F59E0B]',
    accentHover: 'hover:bg-[#D97706]',
    gradient: 'from-[#F59E0B] to-[#D97706]',
    bgGlow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]',
    name: 'Twilight Gold'
  },
  cyberpunk: {
    accent: '#06B6D4',
    textAccent: 'text-[#06B6D4]',
    bgAccent: 'bg-[#06B6D4]',
    borderAccent: 'border-[#06B6D4]/40 focus:border-[#06B6D4]',
    accentHover: 'hover:bg-[#0891B2]',
    gradient: 'from-[#06B6D4] to-[#EC4899]',
    bgGlow: 'shadow-[0_0_20px_rgba(6,182,212,0.2)]',
    name: 'Neon Cyberpunk'
  },
  retro: {
    accent: '#8B5CF6',
    textAccent: 'text-[#8B5CF6]',
    bgAccent: 'bg-[#8B5CF6]',
    borderAccent: 'border-[#8B5CF6]/40 focus:border-[#8B5CF6]',
    accentHover: 'hover:bg-[#7C3AED]',
    gradient: 'from-[#8B5CF6] to-[#EC4899]',
    bgGlow: 'shadow-[0_0_20px_rgba(139,92,246,0.15)]',
    name: 'Retro Violet'
  },
  cosmic: {
    accent: '#14B8A6',
    textAccent: 'text-[#14B8A6]',
    bgAccent: 'bg-[#14B8A6]',
    borderAccent: 'border-[#14B8A6]/40 focus:border-[#14B8A6]',
    accentHover: 'hover:bg-[#0D9488]',
    gradient: 'from-[#14B8A6] to-[#0284C7]',
    bgGlow: 'shadow-[0_0_20px_rgba(20,184,166,0.15)]',
    name: 'Cosmic Teal'
  },
  emerald: {
    accent: '#10B981',
    textAccent: 'text-[#10B981]',
    bgAccent: 'bg-[#10B981]',
    borderAccent: 'border-[#10B981]/40 focus:border-[#10B981]',
    accentHover: 'hover:bg-[#059669]',
    gradient: 'from-[#10B981] to-[#059669]',
    bgGlow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
    name: 'Mint Emerald'
  }
};

const CustomWebhookDropdown: React.FC<{
  selectedUrl: string;
  onSelect: (url: string) => void;
  webhooks: any[];
  channels: any[];
}> = ({ selectedUrl, onSelect, webhooks, channels }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedWh = webhooks.find(wh => wh.url === selectedUrl);

  return (
    <div ref={dropdownRef} className="relative w-full">
      <div
        onClick={() => {
          playButtonSound();
          setIsOpen(!isOpen);
        }}
        className="w-full bg-[#0a0a0c] border border-zinc-800/80 hover:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all flex items-center justify-between cursor-pointer"
      >
        {selectedWh ? (
          <div className="flex items-center gap-2.5 overflow-hidden">
            {selectedWh.avatar ? (
              <img
                src={`https://cdn.discordapp.com/avatars/${selectedWh.id}/${selectedWh.avatar}.png?size=32`}
                alt=""
                className="w-5 h-5 rounded-full bg-zinc-800"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://cdn.discordapp.com/embed/avatars/0.png";
                }}
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center">
                <Globe className="w-3 h-3 text-zinc-500" />
              </div>
            )}
            <div className="overflow-hidden">
              <p className="font-bold truncate text-[11.5px] text-white">{selectedWh.name}</p>
              <p className="text-[9.5px] text-zinc-500">
                Channel: #{channels.find((c: any) => c.id === selectedWh.channel_id)?.name || 'unknown'}
              </p>
            </div>
          </div>
        ) : (
          <span className="text-zinc-500 flex items-center gap-2">
            <Globe className="w-4 h-4 text-zinc-600" />
            Please select a Discord Webhook...
          </span>
        )}
        <ChevronDown className="w-4 h-4 text-zinc-500 transition-transform" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }} />
      </div>

      {isOpen && (
        <div className="absolute z-10 left-0 right-0 mt-1.5 max-h-60 overflow-y-auto bg-[#0a0a0c] border border-zinc-800 rounded-xl shadow-2xl p-1.5 custom-scrollbar animate-in fade-in duration-100">
          {webhooks.length === 0 ? (
            <p className="p-3 text-[11px] text-zinc-500 text-center italic">
              No webhooks available in this guild. Create one first!
            </p>
          ) : (
            webhooks.map((wh) => {
              const isSelected = wh.url === selectedUrl;
              const chName = channels.find((c: any) => c.id === wh.channel_id)?.name || 'unknown';
              return (
                <div
                  key={wh.id}
                  onClick={() => {
                    playButtonSound();
                    onSelect(wh.url);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "p-2.5 rounded-lg flex items-center gap-2.5 cursor-pointer hover:bg-zinc-900 transition-colors",
                    isSelected ? "bg-cyan-950/20 text-cyan-400 border border-cyan-500/20" : "text-zinc-300"
                  )}
                >
                  {wh.avatar ? (
                    <img
                      src={`https://cdn.discordapp.com/avatars/${wh.id}/${wh.avatar}.png?size=32`}
                      alt=""
                      className="w-5 h-5 rounded-full bg-zinc-800"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://cdn.discordapp.com/embed/avatars/0.png";
                      }}
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center">
                      <Globe className="w-3 h-3 text-zinc-500" />
                    </div>
                  )}
                  <div className="overflow-hidden flex-1">
                    <p className="font-bold truncate text-[11.5px]">{wh.name}</p>
                    <p className="text-[9.5px] text-zinc-500">
                      Channel: #{chName}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

interface CompanionBotPanelProps {
  onAddWebhook?: (url: string, name: string) => void;
  onEditOnboardingMessage?: (
    currentMsg: DiscordWebhookMessage,
    onSave: (savedMsg: DiscordWebhookMessage) => void
  ) => void;
  onEditTriggerMessage?: (
    currentMsg: DiscordWebhookMessage,
    onSave: (savedMsg: DiscordWebhookMessage) => void
  ) => void;
}

export const CompanionBotPanel: React.FC<CompanionBotPanelProps> = ({ onAddWebhook, onEditOnboardingMessage, onEditTriggerMessage }) => {
  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [userId, setUserId] = useState('');

  // Bot configuration states
  const [botStatus, setBotStatus] = useState<{
    status: 'offline' | 'connecting' | 'online';
    username: string | null;
    id: string | null;
    avatar: string | null;
    guildsCount: number;
    error: string | null;
  } | null>(null);

  // Guilds and Channels fetched via Bot
  const [botGuilds, setBotGuilds] = useState<any[]>([]);
  const [selectedGuildId, setSelectedGuildId] = useState<string>('');
  const [isLoadingGuilds, setIsLoadingGuilds] = useState(false);

  // Dashboard active sub-tab
  const [activeDashboardTab, setActiveDashboardTab] = useState<'triggers' | 'welcomer' | 'reaction_roles' | 'profile' | 'modules' | 'create_webhook' | 'uptime'>('triggers');
  const [isModuleScreenActive, setIsModuleScreenActive] = useState(false);

  const getActiveModuleName = () => {
    switch (activeDashboardTab) {
      case 'triggers': return 'Triggers Responder';
      case 'welcomer': return 'Onboarding Welcomer';
      case 'reaction_roles': return 'Reaction Roles';
      case 'profile': return 'Branding Profile';
      case 'modules': return 'Modules & Styles';
      case 'create_webhook': return 'Inject Webhook';
      case 'uptime': return '24/7 Gateway Guard';
      default: return 'Module Configuration';
    }
  };

  // Command Cheat Sheet toggle state
  const [showCheatSheet, setShowCheatSheet] = useState(false);

  // Dropdown states
  const [isInviteDropdownOpen, setIsInviteDropdownOpen] = useState(false);
  const [isManualDropdownOpen, setIsManualDropdownOpen] = useState(false);
  const [isConfigurationDropdownOpen, setIsConfigurationDropdownOpen] = useState(false);
  const [isServerPreviewDropdownOpen, setIsServerPreviewDropdownOpen] = useState(false);
  const [isSidebarSelectionOpen, setIsSidebarSelectionOpen] = useState(false);

  // Custom Bot connection form states
  const [inputToken, setInputToken] = useState('');
  const [isConnectingBot, setIsConnectingBot] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [customClientIdForInvite, setCustomClientIdForInvite] = useState('');

  // TRIGGER FORM & LIST STATES
  const [triggersList, setTriggersList] = useState<Array<any>>([]);
  const [triggerSearchQuery, setTriggerSearchQuery] = useState('');
  const [expandedTriggers, setExpandedTriggers] = useState<Record<string, boolean>>({});
  const [showDeletionConfirmId, setShowDeletionConfirmId] = useState<string | null>(null);

  // WELCOMER STATES
  const [welcomerEnabled, setWelcomerEnabled] = useState(false);
  const [welcomerChannelId, setWelcomerChannelId] = useState('');
  const [isSavingWelcomer, setIsSavingWelcomer] = useState(false);
  const [welcomerMessagePayload, setWelcomerMessagePayload] = useState<DiscordWebhookMessage | null>(null);

  // EXTENDED WELCOMER SYSTEM FOR WEBHOOKS AND RICH EMBEDS
  const [welcomerUseWebhook, setWelcomerUseWebhook] = useState(false);
  const [welcomerWebhookUrl, setWelcomerWebhookUrl] = useState('');

  const [guildWebhooks, setGuildWebhooks] = useState<any[]>([]);
  const [isLoadingWebhooks, setIsLoadingWebhooks] = useState(false);

  // REACTION ROLES STATES
  const [reactionRolesList, setReactionRolesList] = useState<Array<{ id: string, messageId: string, emoji: string, roleId: string }>>([]);
  const [newRrMessageId, setNewRrMessageId] = useState('');
  const [newRrEmoji, setNewRrEmoji] = useState('');
  const [newRrRoleId, setNewRrRoleId] = useState('');
  const [isSavingRr, setIsSavingRr] = useState(false);

  // PROFILE OVERRIDES STATES
  const [profileUsername, setProfileUsername] = useState('');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // NEW BRANDING, MODULES & LIVE STYLE CUSTOMIZATIONS
  const [profileBannerUrl, setProfileBannerUrl] = useState('');
  const [themePreset, setThemePreset] = useState<'discord' | 'twilight' | 'cyberpunk' | 'retro' | 'cosmic' | 'emerald'>('discord');
  const [themeEnabled, setThemeEnabled] = useState(true);
  const [isSavingModules, setIsSavingModules] = useState(false);
  const [enabledModules, setEnabledModules] = useState<Record<string, boolean>>({
    triggers: true,
    welcomer: true,
    reaction_roles: true,
    injector: true,
    commands: true
  });
  const [defaultEmbedColor, setDefaultEmbedColor] = useState('#5865F2');
  const [defaultMessageText, setDefaultMessageText] = useState('');
  const [customFooter, setCustomFooter] = useState('');

  // INSTANT WEBHOOK INJECTOR STATES
  const [injectorChannelId, setInjectorChannelId] = useState('');
  const [injectorWebhookName, setInjectorWebhookName] = useState('DWM Interactive Injector');
  const [isInjectingWebhook, setIsInjectingWebhook] = useState(false);

  // Dynamically compute the active theme suite based on server overrides
  const activeSuite = useMemo(() => {
    if (!themeEnabled || !themePreset) {
      return themeStyles.discord;
    }
    return themeStyles[themePreset] || themeStyles.discord;
  }, [themeEnabled, themePreset]);

  // Load User Authentication Status from LocalStorage on mount
  useEffect(() => {
    const handleAuthCheck = () => {
      const token = localStorage.getItem('discord_token');
      const storedName = localStorage.getItem('username');
      const storedAvatar = localStorage.getItem('user_avatar');
      const storedId = localStorage.getItem('user_id');

      if (token && storedName) {
        setIsLoggedIn(true);
        setUsername(storedName);
        setUserAvatar(storedAvatar || '');
        setUserId(storedId || '');
      } else {
        setIsLoggedIn(false);
        setUsername('');
        setUserAvatar('');
        setUserId('');
      }
    };

    handleAuthCheck();
    window.addEventListener('storage', handleAuthCheck);
    
    // Custom trigger event to detect OAuth completion
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        handleAuthCheck();
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('storage', handleAuthCheck);
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Sync / Polling Discord Bot status
  useEffect(() => {
    const fetchBotStatus = async () => {
      try {
        const res = await fetch('/api/bot/status');
        if (res.ok) {
          const data = await res.json();
          setBotStatus(data);
        }
      } catch (err) {
        console.warn('Could not retrieve Discord bot status (backend offline or connecting):', err);
      }
    };

    fetchBotStatus();
    const interval = setInterval(fetchBotStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch bot guilds when logged in and bot is online
  useEffect(() => {
    const fetchGuilds = async () => {
      if (!isLoggedIn || !botStatus || botStatus.status !== 'online') {
        setBotGuilds([]);
        return;
      }

      setIsLoadingGuilds(true);
      try {
        const res = await fetch('/api/bot/guilds');
        if (res.ok) {
          const data = await res.json();
          setBotGuilds(data);
          if (data.length > 0) {
            setSelectedGuildId((prev) => {
              if (prev && data.some((g: any) => g.id === prev)) {
                return prev;
              }
              return data[0].id;
            });
          }
        }
      } catch (err) {
        console.warn('Could not load bot guild listing (offline/reconnecting):', err);
      } finally {
        setIsLoadingGuilds(false);
      }
    };

    fetchGuilds();
  }, [isLoggedIn, botStatus]);

  // Load selected guild configs from Firestore in real-time
  useEffect(() => {
    if (!selectedGuildId || !db) return;

    const loadGuildConfigs = async () => {
      try {
        // 1. Load triggers configuration
        const triggersDoc = await getDoc(doc(db, 'config', `triggers_${selectedGuildId}`));
        const rawTriggersData = triggersDoc.exists() ? (triggersDoc.data().list || []) : [];
        const normalizedTriggers = rawTriggersData.map((t: any, idx: number) => ({
          id: t.id || `trg_legacy_${idx}_${Date.now()}`,
          name: t.name || `Trigger Responder #${idx + 1}`,
          trigger: t.trigger || '',
          webhookUrl: t.webhookUrl || '',
          webhookName: t.webhookName || '',
          webhookAvatar: t.webhookAvatar || '',
          messageType: t.messageType || 'custom',
          messageLink: t.messageLink || '',
          messagePayload: t.messagePayload || (t.response ? { content: t.response } : { content: '' }),
          createdAt: t.createdAt || new Date().toISOString()
        }));
        setTriggersList(normalizedTriggers);
        localStorage.setItem(`decor_triggers_${selectedGuildId}`, JSON.stringify(normalizedTriggers));

        // 2. Load welcomer configuration
        const welcomeDoc = await getDoc(doc(db, 'config', `welcome_${selectedGuildId}`));
        const welcomeData = welcomeDoc.exists() ? welcomeDoc.data() : { enabled: false, channelId: '', message: '' };
        setWelcomerEnabled(welcomeData.enabled || false);
        setWelcomerChannelId(welcomeData.channelId || '');
        setWelcomerUseWebhook(welcomeData.useWebhook || false);
        setWelcomerWebhookUrl(welcomeData.webhookUrl || '');
        
        const initialPayload: DiscordWebhookMessage = welcomeData.messagePayload || {
          content: welcomeData.message || '',
          username: welcomeData.username || '',
          avatar_url: welcomeData.avatarUrl || '',
          embeds: welcomeData.messageType !== 'plain' ? [
            {
              title: welcomeData.embedTitle !== undefined ? welcomeData.embedTitle : '👋 Welcome!',
              description: welcomeData.embedDescription !== undefined ? welcomeData.embedDescription : '',
              color: welcomeData.embedColor ? parseInt(welcomeData.embedColor.replace('#', ''), 16) : 9125366,
              thumbnail: welcomeData.embedThumbnail && welcomeData.embedThumbnail !== 'none' ? { url: welcomeData.embedThumbnail } : undefined,
              image: welcomeData.embedImageUrl ? { url: welcomeData.embedImageUrl } : undefined,
              footer: welcomeData.embedFooter ? { text: welcomeData.embedFooter } : undefined
            }
          ] : []
        };
        setWelcomerMessagePayload(initialPayload);
        localStorage.setItem(`decor_welcome_${selectedGuildId}`, JSON.stringify(welcomeData));

        // 3. Load profile override configuration
        const profileDoc = await getDoc(doc(db, 'config', `profile_${selectedGuildId}`));
        const profileData = profileDoc.exists() ? profileDoc.data() : {};
        
        const profileUsernameVal = profileData.username || '';
        const profileAvatarUrlVal = profileData.avatarUrl || '';
        const profileBannerUrlVal = profileData.bannerUrl || '';
        const themePresetVal = profileData.themePreset || 'discord';
        const themeEnabledVal = profileData.themeEnabled !== false;
        const enabledModulesVal = profileData.enabledModules || {
          triggers: true,
          welcomer: true,
          reaction_roles: true,
          injector: true,
          commands: true
        };
        const defaultEmbedColorVal = profileData.defaultEmbedColor || '#5865F2';
        const defaultMessageTextVal = profileData.defaultMessageText || '';
        const customFooterVal = profileData.customFooter || '';

        setProfileUsername(profileUsernameVal);
        setProfileAvatarUrl(profileAvatarUrlVal);
        setProfileBannerUrl(profileBannerUrlVal);
        setThemePreset(themePresetVal);
        setThemeEnabled(themeEnabledVal);
        setEnabledModules(enabledModulesVal);
        setDefaultEmbedColor(defaultEmbedColorVal);
        setDefaultMessageText(defaultMessageTextVal);
        setCustomFooter(customFooterVal);

        localStorage.setItem(`decor_profile_${selectedGuildId}`, JSON.stringify({
          username: profileUsernameVal,
          avatarUrl: profileAvatarUrlVal,
          bannerUrl: profileBannerUrlVal,
          themePreset: themePresetVal,
          themeEnabled: themeEnabledVal,
          enabledModules: enabledModulesVal,
          defaultEmbedColor: defaultEmbedColorVal,
          defaultMessageText: defaultMessageTextVal,
          customFooter: customFooterVal
        }));

        // 4. Load all reaction role rules for this guild
        const rrQuery = await getDocs(collection(db, 'reaction_roles'));
        const rrs: any[] = [];
        rrQuery.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.guildId === selectedGuildId && data.messageId && data.emoji) {
            rrs.push({
              id: docSnap.id,
              messageId: data.messageId,
              emoji: data.emoji,
              roleId: data.roleId
            });
          }
        });
        setReactionRolesList(rrs);
        localStorage.setItem(`decor_reaction_roles_${selectedGuildId}`, JSON.stringify(rrs));

      } catch (err) {
        console.warn('Failed to load guild configurations from database (falling back to cache/offline mode):', err);
        
        // Fallback to cache if available
        try {
          const cachedTriggers = localStorage.getItem(`decor_triggers_${selectedGuildId}`);
          if (cachedTriggers) {
            const parsed = JSON.parse(cachedTriggers) || [];
            const normalized = parsed.map((t: any, idx: number) => ({
              id: t.id || `trg_legacy_${idx}_${Date.now()}`,
              name: t.name || `Trigger Responder #${idx + 1}`,
              trigger: t.trigger || '',
              webhookUrl: t.webhookUrl || '',
              webhookName: t.webhookName || '',
              webhookAvatar: t.webhookAvatar || '',
              messageType: t.messageType || 'custom',
              messageLink: t.messageLink || '',
              messagePayload: t.messagePayload || (t.response ? { content: t.response } : { content: '' }),
              createdAt: t.createdAt || new Date().toISOString()
            }));
            setTriggersList(normalized);
          } else {
            setTriggersList([]);
          }

          const cachedWelcome = localStorage.getItem(`decor_welcome_${selectedGuildId}`);
          if (cachedWelcome) {
            const welcomeData = JSON.parse(cachedWelcome);
            setWelcomerEnabled(welcomeData.enabled || false);
            setWelcomerChannelId(welcomeData.channelId || '');
            setWelcomerUseWebhook(welcomeData.useWebhook || false);
            setWelcomerWebhookUrl(welcomeData.webhookUrl || '');

            const initialPayload: DiscordWebhookMessage = welcomeData.messagePayload || {
              content: welcomeData.message || '',
              username: welcomeData.username || '',
              avatar_url: welcomeData.avatarUrl || '',
              embeds: welcomeData.messageType !== 'plain' ? [
                {
                  title: welcomeData.embedTitle !== undefined ? welcomeData.embedTitle : '👋 Welcome!',
                  description: welcomeData.embedDescription !== undefined ? welcomeData.embedDescription : '',
                  color: welcomeData.embedColor ? parseInt(welcomeData.embedColor.replace('#', ''), 16) : 9125366,
                  thumbnail: welcomeData.embedThumbnail && welcomeData.embedThumbnail !== 'none' ? { url: welcomeData.embedThumbnail } : undefined,
                  image: welcomeData.embedImageUrl ? { url: welcomeData.embedImageUrl } : undefined,
                  footer: welcomeData.embedFooter ? { text: welcomeData.embedFooter } : undefined
                }
              ] : []
            };
            setWelcomerMessagePayload(initialPayload);
          } else {
            setWelcomerEnabled(false);
            setWelcomerChannelId('');
            setWelcomerUseWebhook(false);
            setWelcomerWebhookUrl('');
            setWelcomerMessagePayload(null);
          }

          const cachedProfile = localStorage.getItem(`decor_profile_${selectedGuildId}`);
          if (cachedProfile) {
            const profileData = JSON.parse(cachedProfile);
            setProfileUsername(profileData.username || '');
            setProfileAvatarUrl(profileData.avatarUrl || '');
            setProfileBannerUrl(profileData.bannerUrl || '');
            setThemePreset(profileData.themePreset || 'discord');
            setThemeEnabled(profileData.themeEnabled !== false);
            setEnabledModules(profileData.enabledModules || {
              triggers: true,
              welcomer: true,
              reaction_roles: true,
              injector: true,
              commands: true
            });
            setDefaultEmbedColor(profileData.defaultEmbedColor || '#5865F2');
            setDefaultMessageText(profileData.defaultMessageText || '');
            setCustomFooter(profileData.customFooter || '');
          } else {
            setProfileUsername('');
            setProfileAvatarUrl('');
            setProfileBannerUrl('');
            setThemePreset('discord');
            setThemeEnabled(true);
            setEnabledModules({
              triggers: true,
              welcomer: true,
              reaction_roles: true,
              injector: true,
              commands: true
            });
            setDefaultEmbedColor('#5865F2');
            setDefaultMessageText('');
            setCustomFooter('');
          }

          const cachedRRs = localStorage.getItem(`decor_reaction_roles_${selectedGuildId}`);
          if (cachedRRs) {
            setReactionRolesList(JSON.parse(cachedRRs));
          } else {
            setReactionRolesList([]);
          }
        } catch (cacheErr) {
          console.warn('Failed to parse cached guild configurations:', cacheErr);
        }
      }
    };

    loadGuildConfigs();
  }, [selectedGuildId]);

  // Load Discord webhooks for the active guild
  useEffect(() => {
    if (!selectedGuildId) {
      setGuildWebhooks([]);
      return;
    }

    const loadWebhooks = async () => {
      setIsLoadingWebhooks(true);
      try {
        const tokenVal = localStorage.getItem('discord_token');
        const authHeader = tokenVal ? (tokenVal.startsWith('Bearer') ? tokenVal : `Bearer ${tokenVal}`) : '';
        const res = await fetch(`/api/discord/guilds/${selectedGuildId}/webhooks`, {
          headers: {
            Authorization: authHeader
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setGuildWebhooks(data);
          } else {
            console.warn('Webhooks response was not an array:', data);
            setGuildWebhooks([]);
          }
        } else {
          setGuildWebhooks([]);
        }
      } catch (err) {
        console.warn('Failed to load guild webhooks:', err);
        setGuildWebhooks([]);
      } finally {
        setIsLoadingWebhooks(false);
      }
    };

    loadWebhooks();
  }, [selectedGuildId]);

  const handleForceSync = async () => {
    playButtonSound();
    setIsLoadingGuilds(true);
    try {
      const res = await fetch('/api/bot/guilds');
      if (res.ok) {
        const data = await res.json();
        setBotGuilds(data);
        toast.success('Configuration and Server lists synced with cloud gateway!');
      } else {
        toast.error('Failed to sync server cache list.');
      }
    } catch {
      toast.error('Connection to backend failed. Retrying...');
    } finally {
      setIsLoadingGuilds(false);
    }
  };

  // Handle Discord OAuth Login flow
  const handleDiscordOauthLogin = async () => {
    playButtonSound();
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
      toast.error('Please allow popups to connect with your Discord account');
      return;
    }

    authWindow.document.write(`
      <html>
        <body style="background-color: #36393f; color: white; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="text-align: center;">
            <h2 style="margin-bottom: 10px;">Reaching Discord...</h2>
            <p style="color: #b9bbbe;">Please complete authentication routing.</p>
          </div>
        </body>
      </html>
    `);

    try {
      const response = await fetch(`/api/auth/discord/url`);
      if (!response.ok) throw new Error('Authorization routing failure');
      const { url } = await response.json();
      authWindow.location.href = url;
    } catch (error) {
      console.error('Oauth redirection trigger failure:', error);
      toast.error('Initiation failed');
      authWindow.close();
    }
  };

  const handleLogout = () => {
    playButtonSound();
    localStorage.removeItem('username');
    localStorage.removeItem('user_avatar');
    localStorage.removeItem('user_id');
    localStorage.removeItem('discord_token');
    localStorage.removeItem('user_guilds');
    setIsLoggedIn(false);
    setUsername('');
    setUserAvatar('');
    setUserId('');
    toast.success('Disconnected Discord account successfully.');
  };

  // 1. UPDATE AUTO-RESPONDER SYSTEM
  const saveTriggersToFirestore = async (updatedList: any[]) => {
    if (!selectedGuildId || !db) return;
    try {
      await setDoc(doc(db, 'config', `triggers_${selectedGuildId}`), { list: updatedList }, { merge: true });
      localStorage.setItem(`decor_triggers_${selectedGuildId}`, JSON.stringify(updatedList));
    } catch (err) {
      console.error('Error saving triggers:', err);
      toast.error('Failed to sync changes with Firebase database.');
    }
  };

  const handleAddEmptyTrigger = async () => {
    playButtonSound();
    if (!selectedGuildId) {
      toast.error('Please select a server/guild first.');
      return;
    }
    const newId = 'trg_' + Date.now();
    const newTrg = {
      id: newId,
      name: '',
      trigger: '',
      webhookUrl: '',
      webhookName: '',
      webhookAvatar: '',
      messageType: 'link', // 'link' or 'custom'
      messageLink: '',
      messagePayload: null,
      createdAt: new Date().toISOString()
    };

    const updated = [newTrg, ...triggersList];
    setTriggersList(updated);
    
    // Automatically set the new item as expanded
    setExpandedTriggers(prev => ({ ...prev, [newId]: true }));
    
    await saveTriggersToFirestore(updated);
    toast.success('Added new trigger. Complete the settings in the form below!');
  };

  const updateTriggerItem = async (itemId: string, field: string, value: any) => {
    const updated = triggersList.map(item => {
      if (item.id === itemId) {
        const isUpdated = { ...item, [field]: value };
        if (field === 'webhookUrl') {
          const matchingWh = guildWebhooks.find(wh => wh.url === value);
          if (matchingWh) {
            isUpdated.webhookName = matchingWh.name;
            isUpdated.webhookAvatar = matchingWh.avatar || '';
          }
        }
        return isUpdated;
      }
      return item;
    });
    setTriggersList(updated);
    await saveTriggersToFirestore(updated);
  };

  const handleDeleteTriggerById = async (idToDelete: string) => {
    playDeleteSound();
    if (!selectedGuildId || !db) return;
    try {
      const updatedList = triggersList.filter((t) => t.id !== idToDelete);
      await setDoc(doc(db, 'config', `triggers_${selectedGuildId}`), { list: updatedList }, { merge: true });
      setTriggersList(updatedList);
      localStorage.setItem(`decor_triggers_${selectedGuildId}`, JSON.stringify(updatedList));
      toast.success('Auto responder trigger deleted successfully!');
      setShowDeletionConfirmId(null);
    } catch {
      toast.error('Failed to delete trigger configuration.');
    }
  };

  const getMockPreviewText = (text: string) => {
    if (!text) return '';
    const activeGuild = botGuilds.find((g) => g.id === selectedGuildId);
    return text
      .replace(/{user}/g, '@NewMember')
      .replace(/{username}/g, 'NewMember123')
      .replace(/{server}/g, activeGuild?.name || 'DWM Discord Server')
      .replace(/{avatar}/g, 'https://cdn.discordapp.com/embed/avatars/0.png');
  };

  // 2. UPDATE ONBOARDING WELCOMER
  const handleSaveWelcomer = async (e: React.FormEvent) => {
    e.preventDefault();
    playButtonSound();
    if (!selectedGuildId) return toast.error('Select a target guild');
    
    if (welcomerUseWebhook) {
      if (!welcomerWebhookUrl) {
        return toast.error('Please select or configure a webhook URL for onboarding delivery.');
      }
    } else {
      if (!welcomerChannelId) return toast.error('Please select an Onboarding text channel.');
    }

    if (!welcomerMessagePayload || (!welcomerMessagePayload.content?.trim() && (!welcomerMessagePayload.embeds || welcomerMessagePayload.embeds.length === 0))) {
      return toast.error('Please click "Edit Welcome Message Layout" first to configure your message greeting content or embeds.');
    }

    setIsSavingWelcomer(true);
    try {
      if (db) {
        const payload = {
          channelId: welcomerChannelId,
          enabled: welcomerEnabled,
          useWebhook: welcomerUseWebhook,
          webhookUrl: welcomerWebhookUrl,
          messagePayload: welcomerMessagePayload,
          // Backward compatibility for standard layout scripts
          message: welcomerMessagePayload?.content || '',
          username: welcomerMessagePayload?.username || '',
          avatarUrl: welcomerMessagePayload?.avatar_url || '',
          messageType: welcomerMessagePayload?.embeds && welcomerMessagePayload.embeds.length > 0 
            ? (welcomerMessagePayload.content ? 'both' : 'embed') 
            : 'plain',
          embedTitle: welcomerMessagePayload?.embeds?.[0]?.title || '',
          embedDescription: welcomerMessagePayload?.embeds?.[0]?.description || '',
          embedColor: welcomerMessagePayload?.embeds?.[0]?.color 
            ? '#' + welcomerMessagePayload.embeds[0].color.toString(16).padStart(6, '0') 
            : '#8B5CF6',
          embedThumbnail: welcomerMessagePayload?.embeds?.[0]?.thumbnail?.url || 'none',
          embedImageUrl: welcomerMessagePayload?.embeds?.[0]?.image?.url || '',
          embedFooter: welcomerMessagePayload?.embeds?.[0]?.footer?.text || '',
          updatedAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'config', `welcome_${selectedGuildId}`), payload, { merge: true });
        localStorage.setItem(`decor_welcome_${selectedGuildId}`, JSON.stringify(payload));
        toast.success('Welcomer configuration deployed live!');
      } else {
        toast.error('Database connection unavailable.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to configure onboarding welcomer');
    } finally {
      setIsSavingWelcomer(false);
    }
  };

  // 3. REACTION ROLES FORM EXECUTOR
  const handleAddReactionRole = async (e: React.FormEvent) => {
    e.preventDefault();
    playButtonSound();
    if (!selectedGuildId) return toast.error('Select a target guild');
    if (!newRrMessageId.trim() || !newRrEmoji.trim() || !newRrRoleId.trim()) {
      return toast.error('Please fill in trigger message ID, target emoji and reward role ID.');
    }

    setIsSavingRr(true);
    try {
      const key = `${selectedGuildId}_${newRrMessageId}_${newRrEmoji}`;
      if (db) {
        await setDoc(doc(db, 'reaction_roles', key), {
          guildId: selectedGuildId,
          messageId: newRrMessageId,
          emoji: newRrEmoji,
          roleId: newRrRoleId
        }, { merge: true });

        setReactionRolesList((prev) => [
          ...prev.filter((item) => item.id !== key),
          { id: key, messageId: newRrMessageId, emoji: newRrEmoji, roleId: newRrRoleId }
        ]);

        setNewRrMessageId('');
        setNewRrEmoji('');
        setNewRrRoleId('');
        toast.success('Reaction Role reward established successfully!');
      } else {
        toast.error('Database connection unavailable.');
      }
    } catch {
      toast.error('Failed to create reaction role trigger');
    } finally {
      setIsSavingRr(false);
    }
  };

  const handleDeleteReactionRole = async (id: string) => {
    playDeleteSound();
    if (!db) return;

    try {
      await setDoc(doc(db, 'reaction_roles', id), {
        guildId: null,
        messageId: null,
        emoji: null,
        roleId: null
      }, { merge: true });

      setReactionRolesList((prev) => prev.filter((item) => item.id !== id));
      toast.success('Reaction role assignment disabled.');
    } catch {
      toast.error('Failed to delete rule config');
    }
  };

  // 4. SAVE PROFILE TARGET CUSTOM OVERRIDES (BOT BRANDING IDENTITY)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    playButtonSound();
    if (!selectedGuildId) return toast.error('Select a guild first');

    setIsSavingProfile(true);
    try {
      if (db) {
        await setDoc(doc(db, 'config', `profile_${selectedGuildId}`), {
          username: profileUsername || null,
          avatarUrl: profileAvatarUrl || null,
          bannerUrl: profileBannerUrl || null
        }, { merge: true });
      }

      const res = await fetch(`/api/bot/guilds/${selectedGuildId}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: profileUsername || null,
          avatarUrl: profileAvatarUrl || null
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (errData.error) {
          console.warn(`Could not set live guild nickname: ${errData.error}`);
        }
      }

      toast.success('Branding profiles and bot nickname updated/synced successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error('Settings updated locally (Direct Discord nickname limit reached)');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // 4B. SAVE THE INDIVIDUAL GUILD MODULES, STYLES, AND COLOR OVERRIDES
  const handleSaveModulesStyles = async (e: React.FormEvent) => {
    e.preventDefault();
    playButtonSound();
    if (!selectedGuildId) return toast.error('Select a guild first');

    setIsSavingModules(true);
    try {
      if (db) {
        await setDoc(doc(db, 'config', `profile_${selectedGuildId}`), {
          themePreset,
          themeEnabled,
          enabledModules,
          defaultEmbedColor,
          defaultMessageText,
          customFooter
        }, { merge: true });

        toast.success('Modules toggles, custom styling, and theme presets saved successfully!');
      } else {
        toast.error('Database connection unavailable.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to configure server customizer settings');
    } finally {
      setIsSavingModules(false);
    }
  };

  // 5. INSTANT WEBHOOK CREATION ENGINE (NEW INTERACTIVE WEBHOOK FEATURE)
  const handleInjectWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    playButtonSound();
    if (!selectedGuildId) return toast.error('Select a guild first');
    if (!injectorChannelId) return toast.error('Please select a target channel to deploy webhook.');
    if (!injectorWebhookName.trim()) return toast.error('Please designate a name for the new webhook.');

    setIsInjectingWebhook(true);
    try {
      const activeGuild = botGuilds.find((g) => g.id === selectedGuildId);
      const activeChannel = activeGuild?.channels?.find((ch: any) => ch.id === injectorChannelId);
      
      const res = await fetch(`/api/discord/guilds/${selectedGuildId}/webhooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: injectorChannelId,
          name: injectorWebhookName
        })
      });

      if (!res.ok) {
        const errPayload = await res.json();
        throw new Error(errPayload.error || 'Failed to inject webhook');
      }

      const freshWebhook = await res.json();
      
      // Save webhook to localStorage webhooks config
      const currentWebhooks = JSON.parse(localStorage.getItem('discord_webhooks') || '[]');
      const updated = [
        ...currentWebhooks,
        {
          id: freshWebhook.id,
          name: freshWebhook.name || injectorWebhookName,
          url: freshWebhook.url,
          channel_id: injectorChannelId,
          guild_id: selectedGuildId,
          guild_name: activeGuild?.name || 'My Discord Server',
          avatar: freshWebhook.avatar || ''
        }
      ];
      localStorage.setItem('discord_webhooks', JSON.stringify(updated));
      window.dispatchEvent(new Event('discord_webhooks_updated'));

      toast.success(`Webhook Generated & Saved inside #${activeChannel?.name || 'channel'}`);
      
      if (onAddWebhook) {
        onAddWebhook(freshWebhook.url, activeChannel?.name || injectorWebhookName);
      }

      setInjectorWebhookName('DWM Interactive Injector');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Check bot guild administrative permissions.');
    } finally {
      setIsInjectingWebhook(false);
    }
  };

  const handleConnectBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputToken.trim()) {
      toast.error('Bot token is required to initialize.');
      return;
    }
    
    setIsConnectingBot(true);
    playButtonSound();
    try {
      const res = await fetch('/api/bot/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: inputToken.trim() })
      });
      
      const data = await res.json();
      if (res.ok) {
        setBotStatus(data);
        toast.success(`DWM Companion activated: @${data.username}!`);
        setInputToken('');
      } else {
        toast.error(data.error || 'Authentication refused by Discord API.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to initialize connection to Discord Bot gateway.');
    } finally {
      setIsConnectingBot(false);
    }
  };

  const handleDisconnectBot = async () => {
    if (!window.confirm('Are you sure you want to disconnect, delete configs, and power down the companion bot?')) return;
    playButtonSound();
    try {
      const res = await fetch('/api/bot/disconnect', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setBotStatus(data);
        toast.success('DWM Companion Bot powered down successfully.');
      } else {
        toast.error(data.error || 'Failed to destroy bot connection.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error during shutdown session.');
    }
  };

  const inviteUrl = botStatus?.id 
    ? `https://discord.com/oauth2/authorize?client_id=${botStatus.id}&permissions=8&scope=bot%20applications.commands`
    : `https://discord.com/oauth2/authorize?client_id=12345&permissions=8&scope=bot%20applications.commands`;

  const selectedGuildChannels = botGuilds.find((g) => g.id === selectedGuildId)?.channels || [];

  return (
    <div className="w-full min-h-full p-4 sm:p-6 text-zinc-300 bg-[#0c0c0d]/95">
      {/* HEADER SECTION WITH BOT CARD */}
      <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-[#222]">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#5865F2] to-cyan-400 p-0.5 shadow-2xl flex items-center justify-center">
              <div className="w-full h-full bg-[#121214] rounded-2xl flex items-center justify-center">
                <Webhook className="w-8 h-8 text-white" />
              </div>
            </div>
            {botStatus?.status === 'online' && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-[#0c0c0d] rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
              DWM Companion
            </h1>
            <p className="text-sm text-zinc-500 font-medium">
              Maximize Discord experiences with active automation, event listeners, and interactive responders.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {botStatus?.status === 'online' && (
            <div className="hidden sm:flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 rounded-xl text-left">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
              <div className="text-left">
                <p className="text-[9px] font-black tracking-wider text-emerald-400 uppercase leading-none">Secretary Bot Active</p>
                <button onClick={handleDisconnectBot} className="text-[9px] text-zinc-400 hover:text-red-400 font-bold transition-colors cursor-pointer">
                  Disconnect Bot
                </button>
              </div>
            </div>
          )}
          {isLoggedIn ? (
            <div className="flex items-center gap-3 bg-[#18181b]/50 border border-[#222] px-4 py-2 rounded-xl">
              {userAvatar ? (
                <img src={`https://cdn.discordapp.com/avatars/${userId}/${userAvatar}.png`} alt={username} className="w-8 h-8 rounded-full ring-2 ring-[#5865F2]" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#5865F2]/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-[#5865F2]">{username.slice(0, 2).toUpperCase()}</span>
                </div>
              )}
              <div className="text-left">
                <p className="text-xs font-bold text-white leading-none">@{username}</p>
                <button onClick={handleLogout} className="text-[10px] text-red-400 font-bold hover:underline">
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={handleDiscordOauthLogin}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-200 shadow-[0_0_20px_rgba(88,101,242,0.4)] flex items-center gap-2"
            >
              <Key className="w-4 h-4" /> Link Discord Account
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* BOT COLLAPSIBLE SECTIONS PANEL */}
        {!isModuleScreenActive && (
          <div className="lg:col-span-4 flex flex-col gap-5 md:grid md:grid-cols-2 lg:flex lg:flex-col items-stretch">
          {/* Dropdown 1: Invite Bot collapsible, default closed */}
          <div className="rounded-2xl border border-[#2d2d30] bg-[#111114] overflow-hidden shadow-lg transition-all duration-300">
            <button
              onClick={() => {
                playButtonSound();
                setIsInviteDropdownOpen(!isInviteDropdownOpen);
              }}
              className="w-full text-left p-4 flex items-center justify-between gap-3 bg-[#161619] hover:bg-zinc-800/15 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black uppercase text-zinc-350 tracking-wider">
                  Invite Bot & Features
                </span>
                <span className={`w-1.5 h-1.5 rounded-full ${botStatus?.status === 'online' ? 'bg-emerald-500 font-bold' : 'bg-red-500'}`} />
              </div>
              <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${isInviteDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isInviteDropdownOpen && (
              <div className="p-5 border-t border-zinc-900 bg-gradient-to-b from-[#131316] to-[#0c0c0d] space-y-4 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] bg-[#5865F2]/20 border border-[#5865F2]/40 text-[#5865F2] font-black tracking-wider uppercase px-2 py-0.5 rounded-full">
                    DWM COMPANION
                  </span>
                  <span className="text-[10px] text-zinc-500 font-bold">
                    {botStatus?.status === 'online' ? 'active' : 'offline'}
                  </span>
                </div>

                <h3 className="text-sm font-black text-white leading-tight">
                  Invite bot & Unlock Interactive Features!
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Our DWM Companion allows you to implement interactive systems normally requiring complete custom application code, such as real-time triggers, onboard welcomer, reaction role rewards, and profile adjustments!
                </p>

                <a
                  href={inviteUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => playButtonSound()}
                  className="w-full py-2.5 bg-gradient-to-r from-[#5865F2] to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-black font-black text-xs rounded-xl transition-all duration-300 shadow-md flex items-center justify-center gap-2 hover:translate-y-[-2px] active:translate-y-0 text-center"
                >
                  <UserPlus className="w-3.5 h-3.5 text-black" />
                  <span>Invite to My Server</span>
                  <ArrowRight className="w-3.5 h-3.5 text-black" />
                </a>

                <div className="pt-4 border-t border-zinc-900 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-zinc-400 leading-normal">
                      <strong className="text-white font-semibold">Slash Commands Enabled:</strong> Configured natively inside Discord with 11 core commands!
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-zinc-400 leading-normal">
                      <strong className="text-white font-semibold">Cross-Server Config Sync:</strong> Changes configured on this dashboard instantly sync!
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-zinc-400 leading-normal">
                      <strong className="text-white font-semibold">Zero-Config Hosting:</strong> Hosted 24/7 with background gateways.
                    </p>
                  </div>
                </div>


              </div>
            )}
          </div>

          {/* Dropdown 2: Slash Command Manual, default closed */}
          <div className="rounded-2xl border border-[#2d2d30] bg-[#111114] overflow-hidden shadow-lg transition-all duration-300 id-manual-dropdown">
            <button
              onClick={() => {
                playButtonSound();
                setIsManualDropdownOpen(!isManualDropdownOpen);
              }}
              className="w-full text-left p-4 flex items-center justify-between gap-3 bg-[#161619] hover:bg-zinc-800/15 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-black uppercase text-zinc-350 tracking-wider">
                  Command Manual
                </span>
                <span className="text-[9px] bg-cyan-950/40 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.2 rounded font-black tracking-wide">
                  11 Active
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${isManualDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isManualDropdownOpen && (
              <div className="p-4 border-t border-zinc-900 bg-[#0c0c0e] animate-in fade-in slide-in-from-top-1 duration-150">
                <CommandManualInline />
              </div>
            )}
          </div>

          {/* Dropdown 3: Configuration, default closed */}
          <div className="rounded-2xl border border-[#2d2d30] bg-[#111114] overflow-hidden shadow-lg transition-all duration-300">
            <button
              onClick={() => {
                playButtonSound();
                setIsConfigurationDropdownOpen(!isConfigurationDropdownOpen);
              }}
              className="w-full text-left p-4 flex items-center justify-between gap-3 bg-[#161619] hover:bg-zinc-800/15 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-black uppercase text-zinc-350 tracking-wider">
                  Configuration
                </span>
                <span className="text-[9px] bg-indigo-950/40 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.2 rounded font-black tracking-wide">
                  Active
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${isConfigurationDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isConfigurationDropdownOpen && (
              <div className="p-4 border-t border-zinc-900 bg-[#0c0c0e] space-y-4 animate-in fade-in slide-in-from-top-1 duration-150 text-[11px]">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider block">
                    Guild Server Context:
                  </label>
                  {isLoadingGuilds ? (
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 py-1">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#5865F2]" />
                      <span>Syncing guilds...</span>
                    </div>
                  ) : !isLoggedIn ? (
                    <div className="text-zinc-600 italic py-1">
                      Please link your Discord account to select a server.
                    </div>
                  ) : (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          playButtonSound();
                          setIsSidebarSelectionOpen(!isSidebarSelectionOpen);
                        }}
                        className="w-full flex items-center justify-between gap-2.5 bg-[#070709] border border-zinc-850 hover:border-zinc-700/80 focus:border-[#5865F2] hover:bg-[#0c0c0e] text-white rounded-xl px-3 py-2.5 text-xs font-bold transition-all shadow-inner cursor-pointer"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          {(() => {
                            const activeG = botGuilds.find((g) => g.id === selectedGuildId);
                            const activeInitials = activeG?.name ? activeG.name.split(' ').map((w: string) => w[0]).slice(0, 3).join('').toUpperCase() : 'SRV';
                            return activeG ? (
                              <>
                                <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-zinc-800 bg-zinc-950">
                                  {activeG.icon ? (
                                    <img
                                      src={activeG.icon}
                                      alt={activeG.name}
                                      className="w-full h-full object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <span className="text-[9px] font-black text-zinc-400">
                                      {activeInitials}
                                    </span>
                                  )}
                                </div>
                                <span className="truncate text-left text-zinc-200">{activeG.name}</span>
                              </>
                            ) : (
                              <span className="text-zinc-500 text-[11px]">Select active bot server...</span>
                            );
                          })()}
                        </div>
                        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 shrink-0 ${isSidebarSelectionOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isSidebarSelectionOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setIsSidebarSelectionOpen(false)} 
                          />
                          <div className="absolute left-0 right-0 mt-1 bg-[#09090b] border border-zinc-850 rounded-xl shadow-2xl overflow-hidden z-50 py-1 max-h-48 overflow-y-auto divide-y divide-zinc-900/40">
                            {botGuilds.length === 0 ? (
                              <div className="px-3 py-2 text-[10px] text-zinc-500 text-center">
                                No Servers Found with DWM Companion
                              </div>
                            ) : (
                              botGuilds.map((g: any) => {
                                const isActive = g.id === selectedGuildId;
                                const serverInitials = g.name.split(' ').map((w: string) => w[0]).slice(0, 3).join('').toUpperCase();
                                return (
                                  <button
                                    key={g.id}
                                    type="button"
                                    onClick={() => {
                                      playButtonSound();
                                      setSelectedGuildId(g.id);
                                      setIsSidebarSelectionOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors text-[11px] font-bold ${
                                      isActive
                                        ? 'bg-[#5865F2]/10 text-[#5865F2]'
                                        : 'text-zinc-350 hover:text-white hover:bg-zinc-900/60'
                                    }`}
                                  >
                                    <div className={`w-5 h-5 rounded overflow-hidden flex items-center justify-center shrink-0 border ${
                                      isActive ? 'border-[#5865F2]' : 'border-zinc-800 bg-black text-zinc-400'
                                    }`}>
                                      {g.icon ? (
                                        <img
                                          src={g.icon}
                                          alt={g.name}
                                          className="w-full h-full object-cover"
                                          referrerPolicy="no-referrer"
                                        />
                                      ) : (
                                        <span className="text-[9px] font-black">
                                          {serverInitials}
                                        </span>
                                      )}
                                    </div>
                                    <span className="truncate flex-1">{g.name}</span>
                                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#5865F2]" />}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Other configuration things */}
                {isLoggedIn && selectedGuildId && (
                  <div className="space-y-3.5 pt-2 border-t border-zinc-900">
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider block">
                        Server Real-Time Metrics:
                      </span>
                      <div className="bg-black/40 rounded-xl p-3 border border-zinc-900 space-y-2 text-[10.5px]">
                        <div className="flex items-center justify-between text-zinc-450">
                          <span>Triggers Configured</span>
                          <span className="font-mono text-cyan-400 font-bold">{triggersList?.length || 0}</span>
                        </div>
                        <div className="flex items-center justify-between text-zinc-450">
                          <span>Reaction Role Rewards</span>
                          <span className="font-mono text-amber-400 font-bold">{reactionRolesList?.length || 0}</span>
                        </div>
                        <div className="flex items-center justify-between text-zinc-450">
                          <span>Welcomer Greeting Greet</span>
                          <span className={`font-bold ${welcomerEnabled ? 'text-emerald-400' : 'text-zinc-500'}`}>
                            {welcomerEnabled ? 'On' : 'Off'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-zinc-450">
                          <span>Theme Overrides</span>
                          <span className={`font-bold ${themeEnabled ? 'text-indigo-400' : 'text-zinc-500'}`}>
                            {themeEnabled ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider block">
                          Sync State:
                        </span>
                        <span className="text-[9px] px-1.5 font-bold tracking-wide rounded bg-emerald-950/40 text-emerald-400 border border-emerald-500/10">
                          ● ONLINE
                        </span>
                      </div>
                      <div className="bg-[#070709] rounded-lg p-2 px-2.5 border border-zinc-900 flex items-center justify-between gap-1.5 mt-1.5">
                        <span className="text-zinc-500 text-[9.5px]">Firestore Client API</span>
                        <span className="text-zinc-400 font-mono text-[9px]">v9.0.0</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleForceSync()}
                      disabled={isLoadingGuilds}
                      className="w-full py-2 bg-zinc-900 hover:bg-zinc-850 active:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-xl text-[10px] font-bold text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingGuilds ? 'animate-spin' : ''}`} />
                      <span>Sync Cloud Database</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dropdown 4: Server Preview, default closed */}
          <div className="rounded-2xl border border-[#2d2d30] bg-[#111114] overflow-hidden shadow-lg transition-all duration-300">
            <button
              onClick={() => {
                playButtonSound();
                setIsServerPreviewDropdownOpen(!isServerPreviewDropdownOpen);
              }}
              className="w-full text-left p-4 flex items-center justify-between gap-3 bg-[#161619] hover:bg-zinc-800/15 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Palette className="w-4 h-4 text-emerald-450" />
                <span className="text-xs font-black uppercase text-zinc-350 tracking-wider">
                  Server Previewer
                </span>
                {isLoggedIn && selectedGuildId && (
                  <span className="text-[9px] bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded font-black tracking-wide">
                    Loaded
                  </span>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${isServerPreviewDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isServerPreviewDropdownOpen && (
              <div className="p-4 border-t border-zinc-900 bg-[#0c0c0e] animate-in fade-in slide-in-from-top-1 duration-150">
                {!isLoggedIn ? (
                  <p className="text-zinc-500 text-xs italic text-center py-2">Please link Discord to view preview.</p>
                ) : !selectedGuildId ? (
                  <p className="text-zinc-500 text-xs italic text-center py-2">Please select a server in Configuration to preview.</p>
                ) : (
                  (() => {
                    const activeG = botGuilds.find((g) => g.id === selectedGuildId);
                    const activeInitials = activeG?.name ? activeG.name.split(' ').map((w: string) => w[0]).slice(0, 3).join('').toUpperCase() : 'SRV';
                    const modulesCount = Object.values(enabledModules).filter(Boolean).length;
                    
                    return (
                      <div className="rounded-xl border border-zinc-800 bg-[#121214] shadow-xs overflow-hidden relative text-[11px]">
                        {/* Banner section */}
                        <div className="h-16 w-full relative overflow-hidden bg-zinc-900/60">
                          {profileBannerUrl ? (
                            <img 
                              src={profileBannerUrl} 
                              alt="Server Custom Banner" 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                              onError={(e) => { (e.target as any).style.display = 'none'; }}
                            />
                          ) : (
                            <div className={`absolute inset-0 bg-gradient-to-r ${activeSuite.gradient} opacity-85`} />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#121214] to-transparent block" />
                        </div>

                        {/* Info section overlap style */}
                        <div className="px-3 pb-3 pt-0 relative flex flex-col items-center text-center -mt-6 z-10 space-y-2">
                          <div className="w-12 h-12 rounded-2xl bg-[#121214] p-1 border border-zinc-800 shadow-md overflow-hidden flex items-center justify-center">
                            {activeG?.icon ? (
                              <img 
                                src={activeG.icon} 
                                alt={activeG.name} 
                                className="w-full h-full object-cover rounded-xl" 
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className={`w-full h-full rounded-xl text-[10px] font-black flex items-center justify-center bg-gradient-to-br ${activeSuite.gradient} text-white`}>
                                {activeInitials}
                              </div>
                            )}
                          </div>

                          <div>
                            <h4 className="text-xs font-black text-white leading-tight">
                              {activeG?.name || 'Connected Server'}
                            </h4>
                            <p className="text-[10px] text-zinc-500 font-mono mt-0.5 select-all">
                              ID: {selectedGuildId}
                            </p>
                          </div>

                          <div className="w-full pt-2 border-t border-zinc-900 space-y-1.5 text-left text-zinc-400">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px]">Active Modules:</span>
                              <span className="text-[10px] text-zinc-200 font-bold">{modulesCount} / 5</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px]">Theme Mode:</span>
                              <span className="text-[10px] text-zinc-200 font-bold">{activeSuite.name}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px]">Registered Rooms:</span>
                              <span className="text-[10px] text-zinc-200 font-bold">{activeG?.channels?.length || 0} Rooms</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            )}
          </div>

          {/* HELP TIP */}
          <div className="p-5 rounded-2xl bg-[#141416] border border-[#222]">
            <div className="flex items-center gap-2 text-white mb-2 font-bold text-xs uppercase tracking-wider">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Quick Tips</span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Ensure you have the <strong className="text-zinc-400">Manage Server</strong> or <strong className="text-zinc-405">Administrator</strong> permission in the guild where you are adding the companion bot.
            </p>
          </div>
        </div>)}

        {/* COMPANION BOT INTERACTIVE SERVICES INTERFACE */}
        <div className={isModuleScreenActive ? "lg:col-span-12 space-y-6" : "lg:col-span-8 space-y-6"}>
          {!isLoggedIn ? (
            <div className="p-8 rounded-2xl bg-[#111] border border-[#2d2d30] text-center flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Login Required for Dashboard Controller</h3>
              <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed mb-6">
                Associate your Discord profile securely to load servers containing the active bot. Manage welcomers, auto-responders, reaction rewards and create webhooks in real-time.
              </p>
              <button
                onClick={handleDiscordOauthLogin}
                className="px-6 py-3 bg-[#5865F2] hover:bg-indigo-500 active:scale-95 text-white rounded-xl text-xs font-black tracking-wider uppercase transition-all shadow-[0_10px_20px_rgba(88,101,242,0.25)] flex items-center gap-2"
              >
                <Key className="w-4 h-4" /> Link Discord Account
              </button>
            </div>
          ) : botStatus?.status !== 'online' ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Bot Onboarding Card */}
              <div className="p-8 rounded-2xl bg-[#111113] border border-[#2d2d30] shadow-2xl relative overflow-hidden">
                {/* Visual blur background glow */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-[#5865F2]/5 blur-3xl pointer-events-none" />
                
                <div className="flex flex-col items-center text-center max-w-xl mx-auto">
                  <div className="w-16 h-16 rounded-2xl bg-[#5865F2]/10 border border-[#5865F2]/30 flex items-center justify-center mb-6">
                    <Bot className="w-8 h-8 text-[#5865F2]" />
                  </div>
                  <h3 className="text-xl font-black text-white tracking-tight mb-2">DWM Companion Secretary Bot Gateway</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-6 font-medium">
                    Connect your custom Discord Secretary bot to power the live dashboard parameters. Once active, the bot uses a <strong className="text-zinc-300">24/7 background worker</strong> so it stays online even if the panel is closed!
                  </p>

                  {/* Bot Connection Error Details & Sandbox Hint */}
                  {botStatus?.error && (
                    <div className="w-full text-left p-4 mb-6 rounded-xl bg-red-950/20 border border-red-500/20 text-red-400 space-y-1.5 animate-in fade-in duration-200">
                      <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wider text-red-400">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-500 animate-pulse" />
                        Companion Bot offline:
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-relaxed font-mono whitespace-pre-wrap break-all">
                        {botStatus.error}
                      </p>
                      <div className="pt-2 text-[10px] text-[#5865F2] font-semibold flex flex-col gap-1.5 border-t border-zinc-800/50 mt-2">
                        <div className="flex items-start gap-1">
                          <span className="text-zinc-500 shrink-0">💡</span>
                          <span>To test the full app features instantly in Simulated Offline Sandbox Mode, paste <code className="bg-[#5865F2]/20 text-indigo-300 border border-[#5865F2]/30 px-1 py-0.5 rounded text-[10px] font-mono select-all">mock</code> as the token below.</span>
                        </div>
                        <div className="flex items-start gap-1">
                          <span className="text-zinc-500 shrink-0">⚙️</span>
                          <span><strong>Are Intents toggled?</strong> On your <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-400">Discord Application Bot tab</a>, scroll down to <strong>Privileged Gateway Intents</strong> and ensure <strong>&quot;Message Content Intent&quot;</strong> and <strong>&quot;Server Members Intent&quot;</strong> are checked.</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Token Submission Form */}
                  <form onSubmit={handleConnectBot} className="w-full space-y-4 text-left">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black tracking-wider text-zinc-400 uppercase flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-[#5865F2]" /> Configure Secretary Token
                      </label>
                      <div className="relative">
                        <input
                          type={showToken ? "text" : "password"}
                          required
                          placeholder="Paste your Discord Bot Token here..."
                          value={inputToken}
                          onChange={(e) => setInputToken(e.target.value)}
                          className="w-full bg-[#070709] border border-[#2d2d30] focus:border-[#5865F2] rounded-xl pl-3 pr-10 py-3 text-xs text-white focus:outline-none transition-all placeholder-zinc-600 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => { playButtonSound(); setShowToken(!showToken); }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-normal">
                        Your bot token is securely stored and parsed inside your sandbox backend database context. Never share your token with anyone.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isConnectingBot}
                      className="w-full py-3 bg-[#5865F2] hover:bg-indigo-500 disabled:bg-zinc-850 disabled:text-zinc-500 text-white font-heavy text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 font-bold cursor-pointer hover:scale-[1.01] active:scale-[0.99] border border-transparent shadow-[0_4px_12px_rgba(88,101,242,0.2)]"
                    >
                      {isConnectingBot ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Establishing Connectivity...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 text-amber-300" />
                          <span>Connect & Activate Bot 24/7</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* Bot Creation Guide Accordion/Card */}
              <div className="p-6 rounded-2xl bg-[#111113] border border-[#222] space-y-6">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#5865F2] mb-1">🛠️ Discord Secretary Bot Creation Guide</h4>
                  <p className="text-xs text-zinc-500 leading-normal">Need help creating your Bot? Follow these simple setup steps:</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-zinc-400">
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <span className="w-6 h-6 rounded-lg bg-zinc-900 border border-zinc-805 flex items-center justify-center text-[10px] font-bold text-[#5865F2] shrink-0">1</span>
                      <div>
                        <strong className="text-zinc-300 block mb-0.5">Create Discord Application</strong>
                        <span>Open the <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer" className="text-[#5865F2] hover:underline inline-flex items-center gap-0.5 font-bold">Discord Developer Portal</a>, click <strong>New Application</strong>, and choose a name (e.g. "My DWM Companion").</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <span className="w-6 h-6 rounded-lg bg-zinc-900 border border-zinc-805 flex items-center justify-center text-[10px] font-bold text-[#5865F2] shrink-0">2</span>
                      <div>
                        <strong className="text-zinc-300 block mb-0.5">Generate Bot & Token</strong>
                        <span>Navigate to the <strong>Bot</strong> tab, click <strong>Add Bot</strong> (if shown), and click <strong>Reset Token</strong> under the username to copy your Bot Token.</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <span className="w-6 h-6 rounded-lg bg-[#18181b] border border-zinc-800 flex items-center justify-center text-[10px] font-bold text-[#5865F2] shrink-0">3</span>
                      <div>
                        <strong className="text-zinc-300 block mb-0.5">Enable Privileged Gateway Intents</strong>
                        <span>Scroll down on the <strong>Bot</strong> tab page, locate any <strong>Privileged Gateway Intents</strong>, and activate:
                          <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[11px] text-zinc-500">
                            <li>Server Members Intent</li>
                            <li>Presence Intent</li>
                            <li>Message Content Intent (Required!)</li>
                          </ul>
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <span className="w-6 h-6 rounded-lg bg-[#18181b] border border-zinc-800 flex items-center justify-center text-[10px] font-bold text-[#5865F2] shrink-0">4</span>
                      <div>
                        <strong className="text-zinc-300 block mb-0.5">Invite Bot to Server</strong>
                        <span>Use the invite constructor tool below to easily configure your bot permission invitation link and join your server.</span>
                      </div>
                    </div>


                  </div>
                </div>

                {/* Instant Invite Link Generator Tool */}
                <div className="pt-4 border-t border-[#1e1e20] space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#5865F2] block">🚀 Dynamic Bot Invitation Link Generator</span>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      placeholder="Enter your Bot Client ID / App ID..."
                      value={customClientIdForInvite}
                      onChange={(e) => setCustomClientIdForInvite(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-[#070709] border border-[#2d2d30] focus:border-[#5865F2] rounded-lg px-3 py-2 text-xs text-white focus:outline-none transition-all placeholder-zinc-600 font-mono"
                    />
                    <button
                      type="button"
                      disabled={!customClientIdForInvite}
                      onClick={() => {
                        playButtonSound();
                        const invite = `https://discord.com/oauth2/authorize?client_id=${customClientIdForInvite}&permissions=8&scope=bot%20applications.commands`;
                        window.open(invite, '_blank');
                        toast.success('Opened Bot Invitation session!');
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-zinc-900 hover:bg-zinc-850 disabled:bg-zinc-950 disabled:text-zinc-700 disabled:border-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg text-xs text-white font-heavy transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 uppercase select-none shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#5865F2]" />
                      <span>Invite Bot</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {!selectedGuildId ? (
                <div className="p-8 rounded-2xl bg-[#111] border border-[#2d2d30] text-center flex flex-col items-center justify-center py-16 animate-in fade-in duration-300">
                  <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-4">
                    <Sliders className="w-8 h-8 text-indigo-450" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">No Guild Server Context Selected</h3>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed mb-6">
                    Expand the <strong className="text-zinc-400">Configuration</strong> dropdown on the left side panel to select your Discord server and instantly start adjusting parameters.
                  </p>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {!isModuleScreenActive ? (
                    /* MODULE CARD OPTION GRID */
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black tracking-widest text-[#5865F2] uppercase flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-[#5865F2]" /> Server Control Modules
                        </label>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Launch any server suite module below instantly of DWM Companion, enabling interactive full-screen panel parameter optimization.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                          { 
                            id: 'triggers', 
                            label: 'Triggers Responder', 
                            icon: MessageSquare,
                            color: 'text-blue-400',
                            bgLight: 'bg-blue-500/5',
                            borderAccent: 'border-blue-500/10',
                            desc: 'Configure words scanned in live chat corridors to send automated responses instantly.'
                          },
                          { 
                            id: 'welcomer', 
                            label: 'Onboarding Welcomer', 
                            icon: Bell,
                            color: 'text-emerald-400',
                            bgLight: 'bg-emerald-500/5',
                            borderAccent: 'border-emerald-500/10',
                            desc: 'Design ambient styled greeting modules dispatched when members arrive on the server.'
                          },
                          { 
                            id: 'reaction_roles', 
                            label: 'Reaction Roles', 
                            icon: Shield,
                            color: 'text-amber-400',
                            bgLight: 'bg-amber-500/5',
                            borderAccent: 'border-[#fbbf24]/10',
                            desc: 'Create secure assign key mapping so users can claim their custom roles using emoji.'
                          },
                          { 
                            id: 'profile', 
                            label: 'Branding Profile', 
                            icon: Key,
                            color: 'text-pink-400',
                            bgLight: 'bg-pink-500/5',
                            borderAccent: 'border-pink-500/10',
                            desc: 'Override active username fields, configure banners, and customize theme options.'
                          },
                          { 
                            id: 'modules', 
                            label: 'Modules & Styles', 
                            icon: Sliders,
                            color: 'text-indigo-400',
                            bgLight: 'bg-indigo-500/5',
                            borderAccent: 'border-indigo-500/10',
                            desc: 'Toggle system active gateways and switch dynamic theme presets on demand.'
                          },
                          { 
                            id: 'create_webhook', 
                            label: 'Inject Webhook', 
                            icon: Plus,
                            color: 'text-teal-400',
                            bgLight: 'bg-teal-500/5',
                            borderAccent: 'border-teal-500/10',
                            desc: 'Deploy fast custom webhooks to push live visual embed messages to channels.'
                          },
                          { 
                            id: 'uptime', 
                            label: '24/7 Gateway Guard', 
                            icon: Zap,
                            color: 'text-amber-400',
                            bgLight: 'bg-amber-500/5',
                            borderAccent: 'border-amber-500/10',
                            desc: 'Deploy a free keep-alive gateway to Render.com so the bot stays online 24/7 even when closed!'
                          }
                        ].map((moduleCard) => {
                          return (
                            <div
                              key={moduleCard.id}
                              onClick={() => { 
                                playButtonSound(); 
                                setActiveDashboardTab(moduleCard.id as any); 
                                setIsModuleScreenActive(true);
                              }}
                              className="p-5 rounded-2xl border bg-[#101012] border-zinc-900 hover:border-zinc-700/70 hover:bg-[#121215] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex flex-col justify-between group overflow-hidden relative"
                            >
                              {/* Backdrop glow */}
                              <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full blur-2xl transition-opacity duration-300 opacity-0 group-hover:opacity-10 bg-[#5865F2]" />

                              <div className="space-y-3 relative z-10 flex-1 flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                  <div className={`p-2 rounded-xl border ${moduleCard.bgLight} ${moduleCard.borderAccent}`}>
                                    <moduleCard.icon className="w-4 h-4" />
                                  </div>
                                  <span className="text-[8.5px] font-black uppercase tracking-wider text-zinc-500 group-hover:text-[#5865F2] group-hover:border-[#5865F2]/20 transition-all bg-zinc-950 border border-zinc-900 px-2.2 py-0.8 rounded-lg">
                                    Configure
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  <h3 className="text-xs font-black text-white leading-snug group-hover:text-zinc-200 transition-colors">
                                    {moduleCard.label}
                                  </h3>
                                  <p className="text-[11px] text-zinc-500 leading-relaxed font-semibold">
                                    {moduleCard.desc}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* DEDICATED SCREEN VIEW WITH BACK BUTTON */
                    <div className="space-y-4 animate-in fade-in slide-in-from-left-1 duration-300">
                      <div className="relative flex items-center justify-between border-b border-zinc-900 pb-4 min-h-[48px]">
                        {/* BACK BUTTON (Left Aligned) */}
                        <div className="flex items-center z-10">
                          <button
                            onClick={() => {
                              playButtonSound();
                              setIsModuleScreenActive(false);
                            }}
                            className="p-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-[#5865F2]/30 text-zinc-400 hover:text-white rounded-xl transition-all active:scale-95 cursor-pointer shadow-indigo-950/20 shadow-sm flex items-center justify-center shrink-0"
                            aria-label="Back"
                          >
                            <ArrowLeft className="w-4 h-4 text-[#5865F2]" />
                          </button>
                        </div>

                        {/* CENTERED MODULE NAME */}
                        <div className="absolute inset-x-0 top-0 bottom-0 flex items-center justify-center pointer-events-none">
                          <h2 className="text-sm sm:text-base font-black text-white tracking-wider uppercase font-sans select-none pointer-events-auto">
                            {getActiveModuleName()}
                          </h2>
                        </div>

                        {/* Right balance placeholder */}
                        <div className="w-10 h-10 shrink-0 opacity-0 pointer-events-none" />
                      </div>

                      {/* SUB-PANEL CONTENT */}
                      <div className="p-6 rounded-3xl bg-gradient-to-b from-[#121214] to-[#0a0a0b] border border-zinc-800/80 min-h-[300px] shadow-sm">
                    
                    {/* 1. KEYWORD TRIGGER RESPONDERS */}
                    {activeDashboardTab === 'triggers' && (() => {
                      const filteredTriggers = triggersList.filter(item => {
                        const query = triggerSearchQuery.toLowerCase().trim();
                        if (!query) return true;
                        const nameMatch = (item.name || '').toLowerCase().includes(query);
                        const triggerMatch = (item.trigger || '').toLowerCase().includes(query);
                        const webhookMatch = (item.webhookName || '').toLowerCase().includes(query);
                        return nameMatch || triggerMatch || webhookMatch;
                      });

                      return (
                        <div className="space-y-6">
                          {/* Title outside the gray container */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-850">
                            <div>
                              <h3 className="font-extrabold text-base tracking-tight font-sans transition-all" style={{ color: activeSuite.accent }}>
                                Auto Responder keyword trigger
                              </h3>
                              <p className="text-xs text-zinc-500 mt-1">
                                Design customized webhooks triggered by specific keyword scans from active guild messages.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={handleAddEmptyTrigger}
                              className="p-2.5 active:scale-95 text-black hover:opacity-90 rounded-xl flex items-center justify-center shadow-lg transition-all border border-white/5 cursor-pointer shrink-0 self-start sm:self-center"
                              style={{ backgroundColor: activeSuite.accent }}
                              aria-label="Add"
                              title="Add auto responder trigger"
                            >
                              <Plus className="w-5 h-5 text-zinc-950 font-black" />
                            </button>
                          </div>

                          {/* Gray div container for search and collapsible list */}
                          <div className="bg-[#101012]/40 p-5 rounded-2xl border border-zinc-900 shadow-inner space-y-4">
                            {/* WORKING SEARCH BAR */}
                            <div className="relative">
                              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                              <input
                                type="text"
                                placeholder="Search triggers by name, keywords, or webhook..."
                                value={triggerSearchQuery}
                                onChange={(e) => setTriggerSearchQuery(e.target.value)}
                                className="w-full bg-[#070709] border border-zinc-850 hover:border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-700 focus:outline-none transition-all shadow-sm"
                                style={{'--tw-ring-color': activeSuite.accent} as any}
                              />
                              {triggerSearchQuery && (
                                <button
                                  onClick={() => setTriggerSearchQuery('')}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-850 text-zinc-500 hover:text-white rounded"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {/* TRIGGERS COLLAPSIBLE LIST */}
                            {filteredTriggers.length === 0 ? (
                              <div className="text-center py-12 bg-zinc-950/25 border border-dashed border-zinc-850/80 rounded-xl flex flex-col items-center justify-center gap-3">
                                <MessageSquare className="w-8 h-8 text-zinc-700" />
                                <div className="space-y-1">
                                  <p className="text-xs font-bold text-zinc-500">
                                    {triggerSearchQuery ? 'No search results found.' : 'No auto-responder triggers.'}
                                  </p>
                                  <p className="text-[10.5px] text-zinc-600 max-w-[280px] mx-auto">
                                    {triggerSearchQuery 
                                      ? 'Verify spelling or adjust keywords and try again.' 
                                      : 'Click the "+" button near the top name title to build a fresh automation template!'}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3.5 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                                {filteredTriggers.map((item, idx) => {
                                  const isExpanded = !!expandedTriggers[item.id];
                                  return (
                                    <div
                                      key={item.id}
                                      className="rounded-xl border border-zinc-850 bg-zinc-950/30 overflow-hidden flex flex-col transition-all hover:border-zinc-800"
                                      style={isExpanded ? { borderColor: `${activeSuite.accent}50` } : {}}
                                    >
                                      {/* COLLAPSIBLE HEADER (Always visible) */}
                                      <div
                                        onClick={() => {
                                          playButtonSound();
                                          setExpandedTriggers(prev => ({ ...prev, [item.id]: !isExpanded }));
                                        }}
                                        className="p-4 flex items-center justify-between gap-3 bg-zinc-950/60 cursor-pointer select-none border-b border-zinc-900/40"
                                      >
                                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                                          <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-850" style={{ color: activeSuite.accent }}>
                                            <Zap className="w-3.5 h-3.5" />
                                          </div>
                                          <div className="overflow-hidden flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                              <span className="text-xs font-medium text-white truncate max-w-[180px]">
                                                {item.name || <span className="text-zinc-600 italic font-normal">Unnamed Responder</span>}
                                              </span>
                                              {item.trigger ? (
                                                <span className="text-[9px] border bg-zinc-950/50 font-mono px-2 py-0.5 rounded font-medium" style={{ borderColor: `${activeSuite.accent}30`, color: activeSuite.accent }}>
                                                  {item.trigger}
                                                </span>
                                              ) : (
                                                <span className="text-[9px] bg-zinc-900 border border-zinc-800 text-zinc-500 font-mono px-1.5 py-0.5 rounded">
                                                  No filter key
                                                </span>
                                              )}
                                            </div>
                                            {item.webhookName && (
                                              <p className="text-[10px] text-zinc-500 mt-1 truncate font-medium">
                                                Webhook: #{item.webhookName} ({item.messageType === 'link' ? 'Message link' : 'Custom payload'})
                                              </p>
                                            )}
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                          {/* Delete toggle icon */}
                                          <button
                                            type="button"
                                            onClick={() => {
                                              playButtonSound();
                                              setShowDeletionConfirmId(item.id);
                                            }}
                                            className="p-1.5 hover:bg-rose-500/10 text-zinc-500 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                                            title="Delete trigger configuration"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>

                                          {/* Expand SVG toggle arrow */}
                                          <button
                                            type="button"
                                            onClick={() => {
                                              playButtonSound();
                                              setExpandedTriggers(prev => ({ ...prev, [item.id]: !isExpanded }));
                                            }}
                                            className="p-1.5 hover:bg-zinc-900 text-zinc-500 hover:text-white rounded-lg transition-colors cursor-pointer"
                                          >
                                            {isExpanded ? (
                                              <ChevronUp className="w-4 h-4" style={{ color: activeSuite.accent }} />
                                            ) : (
                                              <ChevronDown className="w-4 h-4" />
                                            )}
                                          </button>
                                        </div>
                                      </div>

                                      {/* Inline Delete Confirmation Overlay */}
                                      {showDeletionConfirmId === item.id && (
                                        <div className="p-4 bg-red-950/10 border-b border-red-950/20 animate-in slide-in-from-top-1 duration-200">
                                          <div className="flex flex-col gap-3">
                                            <div className="flex items-center gap-2 text-rose-400">
                                              <AlertTriangle className="w-4 h-4" />
                                              <span className="text-xs font-extrabold pb-0.5">Delete Responder?</span>
                                            </div>
                                            <p className="text-[11px] text-red-200/85 leading-relaxed">
                                              Are you sure you want to delete <span className="font-bold text-white">"{item.name || `Responder #${idx+1}`}"</span>? This will clear its trigger scans from the Discord bot.
                                            </p>
                                            <div className="flex gap-2 justify-end">
                                              <button
                                                type="button"
                                                onClick={() => setShowDeletionConfirmId(null)}
                                                className="px-3 py-1.5 bg-zinc-900 text-zinc-400 font-bold text-[9px] rounded-lg border border-zinc-800 hover:bg-zinc-800 cursor-pointer"
                                              >
                                                Cancel
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleDeleteTriggerById(item.id)}
                                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[9px] rounded-lg shadow-md cursor-pointer"
                                              >
                                                Delete Permanent
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* EXPANDED CONTENT SECTION */}
                                      {isExpanded && showDeletionConfirmId !== item.id && (
                                        <div className="p-5 border-t border-zinc-850 bg-[#0a0a0c]/85 space-y-6 animate-in fade-in duration-200">
                                          {/* Split layout: Section 1 (Scan Configuration) & Section 2 (Output Action) */}
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            
                                            {/* LEFT PORTION: GATEWORD SCAN CONDITIONS */}
                                            <div className="space-y-4 bg-zinc-950/40 p-4.5 rounded-2xl border border-zinc-900">
                                              <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
                                                <div className="w-1.5 h-3.5 rounded" style={{ backgroundColor: activeSuite.accent }} />
                                                <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-300">
                                                  1. SCAN CONDITION & METADATA
                                                </h4>
                                              </div>
                                              
                                              {/* Name input */}
                                              <div className="space-y-1.5">
                                                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">
                                                  Config Name <span className="text-rose-500">*</span>
                                                </label>
                                                <input
                                                  type="text"
                                                  required
                                                  placeholder="e.g. Help command responder"
                                                  value={item.name}
                                                  onChange={(e) => updateTriggerItem(item.id, 'name', e.target.value)}
                                                  className="w-full bg-[#050507] border border-zinc-850 hover:border-zinc-800 focus:border-zinc-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all"
                                                />
                                              </div>

                                              {/* Trigger Message Filter Text input */}
                                              <div className="space-y-1.5">
                                                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">
                                                  Trigger Keywords scan <span className="text-rose-500">*</span>
                                                </label>
                                                <input
                                                  type="text"
                                                  required
                                                  placeholder="Keywords or commands (e.g. !help, rules)"
                                                  value={item.trigger}
                                                  onChange={(e) => updateTriggerItem(item.id, 'trigger', e.target.value)}
                                                  className="w-full bg-[#050507] border border-zinc-850 hover:border-zinc-800 focus:border-zinc-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none font-mono transition-all"
                                                />
                                                <p className="text-[9.5px] text-zinc-500 leading-relaxed">
                                                  Bot will trigger response when user message contains or matches this exact text.
                                                </p>
                                              </div>
                                            </div>

                                            {/* RIGHT PORTION: TARGET WEBHOOK & ACTIONS */}
                                            <div className="space-y-4 bg-zinc-950/40 p-4.5 rounded-2xl border border-zinc-900">
                                              <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
                                                <div className="w-1.5 h-3.5 rounded" style={{ backgroundColor: activeSuite.accent }} />
                                                <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-300">
                                                  2. RESPONDER ACTION ENGINE
                                                </h4>
                                              </div>

                                              {/* Select Webhook */}
                                              <div className="space-y-1.5 border-b border-zinc-900/40 pb-3">
                                                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">
                                                  Select Outgoing Webhook
                                                </label>
                                                <CustomWebhookDropdown
                                                  selectedUrl={item.webhookUrl}
                                                  onSelect={(url) => updateTriggerItem(item.id, 'webhookUrl', url)}
                                                  webhooks={guildWebhooks}
                                                  channels={selectedGuildChannels}
                                                />
                                              </div>

                                              {/* Select Message Type */}
                                              <div className="space-y-2">
                                                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">
                                                  Message Action Payload
                                                </label>
                                                <div className="grid grid-cols-2 gap-2">
                                                  <button
                                                    type="button"
                                                    onClick={() => updateTriggerItem(item.id, 'messageType', 'link')}
                                                    className={cn(
                                                      "py-2.5 px-3 rounded-xl text-[10.5px] font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                                                      item.messageType === 'link' 
                                                        ? "bg-zinc-900 border-zinc-700 text-white shadow-inner" 
                                                        : "bg-[#050507] border-zinc-850 text-zinc-500 hover:text-white"
                                                    )}
                                                    style={item.messageType === 'link' ? { borderColor: activeSuite.accent, color: activeSuite.accent } : {}}
                                                  >
                                                    <Link className="w-3 h-3" />
                                                    Redirect Link
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => updateTriggerItem(item.id, 'messageType', 'custom')}
                                                    className={cn(
                                                      "py-2.5 px-3 rounded-xl text-[10.5px] font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                                                      item.messageType === 'custom' 
                                                        ? "bg-zinc-900 border-zinc-700 text-white shadow-inner" 
                                                        : "bg-[#050507] border-zinc-850 text-zinc-500 hover:text-white"
                                                    )}
                                                    style={item.messageType === 'custom' ? { borderColor: activeSuite.accent, color: activeSuite.accent } : {}}
                                                  >
                                                    <MessageSquare className="w-3 h-3" />
                                                    Embed Payload
                                                  </button>
                                                </div>
                                              </div>

                                              {/* Conditional Inputs */}
                                              {item.messageType === 'link' && (
                                                <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-150">
                                                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">
                                                    Source Message Link URL <span className="text-rose-500">*</span>
                                                  </label>
                                                  <input
                                                    type="url"
                                                    placeholder="Paste discord message channel URL"
                                                    value={item.messageLink || ''}
                                                    onChange={(e) => updateTriggerItem(item.id, 'messageLink', e.target.value)}
                                                    className="w-full bg-[#050507] border border-zinc-855 focus:border-zinc-650 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-700 focus:outline-none transition-all"
                                                  />
                                                </div>
                                              )}

                                              {item.messageType === 'custom' && (
                                                <div className="p-3 bg-[#050507] border border-zinc-850 rounded-xl flex items-center justify-between gap-3 animate-in slide-in-from-top-1 duration-150">
                                                  <div className="flex items-center gap-2 overflow-hidden">
                                                    <Sliders className="w-3.5 h-3.5 shrink-0" style={{ color: activeSuite.accent }} />
                                                    <span className="text-[10px] text-zinc-400 truncate">
                                                      {item.messagePayload 
                                                        ? 'Rich JSON Embed defined' 
                                                        : 'No parameters configured'}
                                                    </span>
                                                  </div>
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      playButtonSound();
                                                      onEditTriggerMessage?.(
                                                        item.messagePayload || { content: '' },
                                                        (savedPayload) => {
                                                          updateTriggerItem(item.id, 'messagePayload', savedPayload);
                                                        }
                                                      );
                                                    }}
                                                    className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg text-black transition-all flex items-center gap-1 shrink-0 cursor-pointer hover:opacity-90 active:scale-95"
                                                    style={{ backgroundColor: activeSuite.accent }}
                                                  >
                                                    {item.messagePayload ? (
                                                      <>
                                                        <Pencil className="w-2.5 h-2.5" />
                                                        Customize
                                                      </>
                                                    ) : (
                                                      <>
                                                        <Plus className="w-2.5 h-2.5" />
                                                        Configure
                                                      </>
                                                    )}
                                                  </button>
                                                </div>
                                              )}

                                            </div>
                                          </div>

                                          <div className="pt-2 flex justify-end gap-2 border-t border-zinc-900 pb-1">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                playButtonSound();
                                                setExpandedTriggers(prev => ({ ...prev, [item.id]: false }));
                                                toast.success('Trigger settings collapsed.');
                                              }}
                                              className="px-4 py-2 hover:bg-zinc-900 text-zinc-400 hover:text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all border border-zinc-850 cursor-pointer animate-in fade-in"
                                            >
                                              Collapse Configuration
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* 2. ONBOARD WELCOMER CONFIG */}
                    {activeDashboardTab === 'welcomer' && (
                      <form onSubmit={handleSaveWelcomer} className="space-y-6 animate-in fade-in duration-300">
                        {/* HEADER STATUS BAR */}
                        <div className="border-b border-zinc-900 pb-4.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div>
                            <h4 className="font-extrabold text-white text-sm flex items-center gap-2 uppercase tracking-wider">
                              <UserPlus className="w-4 h-4 text-[#5865F2]" /> Custom Onboarding Welcomer
                            </h4>
                            <p className="text-xs text-zinc-500 mt-1">
                              Deliver visual welcome greetings via standard bot or secure webhook immediately when new members arrive.
                            </p>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => { playButtonSound(); setWelcomerEnabled(!welcomerEnabled); }}
                            className="flex items-center self-start sm:self-center gap-1.5 bg-zinc-950 p-2 rounded-xl border border-zinc-900 transition-all hover:bg-zinc-900"
                          >
                            <span className="text-[10px] uppercase font-black text-zinc-500 tracking-wider px-1.5">Gateway Status</span>
                            {welcomerEnabled ? (
                              <span className="text-[10.5px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg font-black tracking-wider uppercase">
                                Active & Live
                              </span>
                            ) : (
                              <span className="text-[10.5px] bg-zinc-800 text-zinc-400 border border-zinc-700 px-2.5 py-1 rounded-lg font-black tracking-wider uppercase">
                                Dormant (Disabled)
                              </span>
                            )}
                          </button>
                        </div>

                        {/* DOUBLE PANEL GRID */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
                          
                          {/* PANEL 1: CONFIGURATION CONTROLS (7 columns) */}
                          <div className="lg:col-span-7 space-y-5">

                            {/* 1. TRANSMISSION ROUTING SETUP */}
                            <div className="p-4.5 rounded-2xl bg-[#09090b] border border-zinc-900 space-y-3.5">
                              <div>
                                <label className="text-[10px] font-black tracking-widest text-[#5865F2] uppercase flex items-center gap-1.5">
                                  <Shield className="w-3.5 h-3.5" /> Transmission Routing Method
                                </label>
                                <p className="text-[11px] text-zinc-500 mt-0.5">Select how you want to route the custom onboarding payload.</p>
                              </div>

                              {/* Toggle Method Selector */}
                              <div className="grid grid-cols-2 gap-2 bg-black/40 p-1 rounded-lg border border-zinc-900">
                                <button
                                  type="button"
                                  onClick={() => { playButtonSound(); setWelcomerUseWebhook(false); }}
                                  className={`py-2 text-[11px] font-bold rounded-md transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 ${
                                    !welcomerUseWebhook 
                                      ? 'bg-zinc-800 text-white shadow-sm'
                                      : 'text-zinc-500 hover:text-zinc-300'
                                  }`}
                                >
                                  <Bot className="w-3.5 h-3.5 text-[#5865F2]" /> Default Bot
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { playButtonSound(); setWelcomerUseWebhook(true); }}
                                  className={`py-2 text-[11px] font-bold rounded-md transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 ${
                                    welcomerUseWebhook 
                                      ? 'bg-zinc-800 text-white shadow-sm'
                                      : 'text-zinc-500 hover:text-zinc-300'
                                  }`}
                                >
                                  <Webhook className="w-3.5 h-3.5 text-[#5865F2]" /> Webhook Delivery
                                </button>
                              </div>

                              {/* Render Based on Selection */}
                              {!welcomerUseWebhook ? (
                                <div className="space-y-2 pt-1 animate-in fade-in duration-200">
                                  <label className="text-[9.5px] font-black text-zinc-400 uppercase tracking-wider block">
                                    Target Native Text Channel
                                  </label>
                                  <select
                                    required={!welcomerUseWebhook}
                                    value={welcomerChannelId}
                                    onChange={(e) => setWelcomerChannelId(e.target.value)}
                                    className="w-full bg-[#030303] border border-zinc-850 focus:border-[#5865F2] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
                                  >
                                    <option value="">Select Target Text Channel...</option>
                                    {selectedGuildChannels.map((ch: any) => (
                                      <option key={ch.id} value={ch.id}>
                                        # {ch.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ) : (
                                <div className="space-y-3 pt-1 animate-in fade-in duration-200">
                                  {/* Webhook Selector from Current Server */}
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[9.5px] font-black text-zinc-400 uppercase tracking-wider block">
                                        Select Server Webhook
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => { 
                                          playButtonSound(); 
                                          setActiveDashboardTab('create_webhook');
                                        }}
                                        className="text-[9.5px] font-bold text-[#5865F2] hover:underline"
                                      >
                                        + Inject New Webhook
                                      </button>
                                    </div>
                                    
                                    {isLoadingWebhooks ? (
                                      <div className="p-3 rounded-xl bg-black/30 border border-zinc-900 flex items-center justify-center gap-2 text-zinc-500 text-xs">
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#5865F2]" />
                                        <span>Loading server webhooks dynamically...</span>
                                      </div>
                                    ) : guildWebhooks.length > 0 ? (
                                      <select
                                        value={welcomerWebhookUrl}
                                        onChange={(e) => setWelcomerWebhookUrl(e.target.value)}
                                        className="w-full bg-[#030303] border border-zinc-850 focus:border-[#5865F2] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
                                      >
                                        <option value="">Select Webhook Link...</option>
                                        {guildWebhooks.map((wh: any) => (
                                          <option key={wh.id} value={wh.url}>
                                            {wh.name} (Channel: #{selectedGuildChannels.find((c: any) => c.id === wh.channel_id)?.name || 'unknown'})
                                          </option>
                                        ))}
                                      </select>
                                    ) : (
                                      <div className="p-3.5 rounded-xl bg-black/40 border border-dashed border-zinc-850 text-center">
                                        <p className="text-[10px] text-zinc-500">
                                          No webhooks found on this Discord server. You can specify a custom webhook URL below or use our dynamic generator block to inject one instantly!
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Custom Hook Paste Input */}
                                  <div className="space-y-1.5">
                                    <label className="text-[9.5px] font-black text-zinc-400 uppercase tracking-wider block">
                                      Or Paste Custom Webhook URL
                                    </label>
                                    <input
                                      type="url"
                                      placeholder="e.g. https://discord.com/api/webhooks/..."
                                      value={welcomerWebhookUrl}
                                      onChange={(e) => setWelcomerWebhookUrl(e.target.value)}
                                      className="w-full bg-[#030303] border border-zinc-850 focus:border-[#5865F2] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none placeholder-zinc-650"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* 2. DEDICATED GRADY GREETING CUSTOMIZER ACTION */}
                            <div className="p-4.5 rounded-2xl bg-[#09090b] border border-zinc-900 space-y-4">
                              <div>
                                <label className="text-[10px] font-black tracking-widest text-[#5865F2] uppercase flex items-center gap-1.5">
                                  <Sliders className="w-3.5 h-3.5 font-bold" /> Personalized Greeting Content
                                </label>
                                <p className="text-[11px] text-zinc-500 mt-0.5">
                                  Customize standard greetings, formatted embed parameters, profile picture overrides, image assets, and footers in our rich webhook designer.
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  playButtonSound();
                                  if (onEditOnboardingMessage) {
                                    onEditOnboardingMessage(welcomerMessagePayload || {}, (savedMsg) => {
                                      setWelcomerMessagePayload(savedMsg);
                                      toast.success('Your changes have been staged. Remember to click "Deploy Welcomer Configuration" to make them live.');
                                    });
                                  } else {
                                    toast.error('The Visual Message Editor is temporarily unavailable.');
                                  }
                                }}
                                className="w-full py-3 px-4 bg-zinc-900 hover:bg-zinc-850 text-white rounded-xl text-xs font-black tracking-wider uppercase transition-all flex items-center justify-center gap-2 border border-zinc-800 hover:border-zinc-700 active:scale-95 cursor-pointer shadow-[0_4px_10px_rgba(0,0,0,0.3)]"
                              >
                                <Pencil className="w-4 h-4 text-[#5865F2]" />
                                Edit Welcome Message Layout
                              </button>
                            </div>

                          </div>


                          {/* PANEL 2: REAL-TIME DISCORD SIMULATION WINDOW (5 columns) */}
                          <div className="lg:col-span-5 space-y-4">
                            <label className="text-[10px] font-black tracking-widest text-[#5865F2] uppercase flex items-center gap-1.5 font-bold">
                              <Eye className="w-3.5 h-3.5" /> Interactive Discord Mock Panel
                            </label>

                            {/* Outer Client frame */}
                            <div className="p-5 rounded-3xl bg-[#2f3136] border border-black/40 shadow-xl text-zinc-300 font-sans text-xs select-none relative overflow-hidden">
                              
                              {/* Small fake chat row title */}
                              <div className="border-b border-[#202225] pb-2.5 mb-4 flex items-center justify-between">
                                <span className="font-extrabold text-[10px] text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                                  {welcomerUseWebhook ? <Webhook className="w-3 h-3 text-zinc-400" /> : <Hash className="w-3 h-3 text-zinc-400" />}
                                  {welcomerUseWebhook ? 'WEBHOOK CHANNEL FEED' : 'TEXT CHANNEL FEED'}
                                </span>
                                <span className="text-[9px] text-[#4f545c] font-mono">Today</span>
                              </div>

                              {/* Message body */}
                              <div className="flex gap-3 items-start">
                                {/* Profile avatar */}
                                <div className="w-9 h-9 rounded-full bg-[#36393f] border border-[#202225] flex-shrink-0 overflow-hidden relative flex items-center justify-center text-white font-bold text-xs uppercase">
                                  {welcomerUseWebhook && welcomerMessagePayload?.avatar_url ? (
                                    <img src={welcomerMessagePayload.avatar_url} onError={(e) => { (e.target as any).src = 'https://cdn.discordapp.com/embed/avatars/0.png'; }} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  ) : (
                                    <div className="w-full h-full bg-[#5865F2] flex items-center justify-center text-white font-bold text-xs uppercase">
                                      {welcomerMessagePayload?.username ? welcomerMessagePayload.username.slice(0, 2) : 'WB'}
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-2 flex-1 min-w-0">
                                  {/* Author bar */}
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-extrabold text-white text-[12.5px] hover:underline cursor-pointer">
                                      {welcomerUseWebhook 
                                        ? (welcomerMessagePayload?.username || 'DWM Welcomer Webhook')
                                        : (botStatus?.username || 'DWM Companion')}
                                    </span>
                                    
                                    {/* BOT / webhook blue badge */}
                                    <span className="text-[9px] bg-[#5865F2] text-white px-1 py-0.2 rounded font-black tracking-wider uppercase">
                                      {welcomerUseWebhook ? 'Webhook' : 'Bot'}
                                    </span>

                                    <span className="text-[10px] text-[#72767d] ml-1">Today</span>
                                  </div>

                                  {/* Message text layout */}
                                  {welcomerMessagePayload?.content && (
                                    <p className="text-[#dcddde] text-xs leading-relaxed break-words whitespace-pre-wrap">
                                      {getMockPreviewText(welcomerMessagePayload.content)}
                                    </p>
                                  )}

                                  {/* Embed Block Layout */}
                                  {welcomerMessagePayload?.embeds?.map((emb, idx) => (
                                    <div 
                                      key={emb.id || idx}
                                      className="p-3.5 bg-[#202225] rounded-lg relative flex gap-4 border-l-[4px] max-w-md animate-in duration-300"
                                      style={{ borderLeftColor: emb.color ? '#' + emb.color.toString(16).padStart(6, '0') : '#8B5CF6' }}
                                    >
                                      <div className="flex-1 space-y-2">
                                        {emb.title && (
                                          <h5 className="font-bold text-white text-sm break-words leading-snug">
                                            {getMockPreviewText(emb.title)}
                                          </h5>
                                        )}
                                        
                                        {emb.description && (
                                          <p className="text-[#b9bbbe] text-[11px] leading-relaxed break-words whitespace-pre-wrap">
                                            {getMockPreviewText(emb.description)}
                                          </p>
                                        )}

                                        {emb.fields?.map((f: any, fidx: number) => (
                                          <div key={fidx} className="mt-1.2">
                                            <span className="font-bold text-[10.5px] text-zinc-200 block">{f.name}</span>
                                            <span className="text-[#b9bbbe] text-[10px] block font-medium mt-0.5">{f.value}</span>
                                          </div>
                                        ))}

                                        {/* Embed main image banner */}
                                        {emb.image?.url && (
                                          <div className="mt-1.5 rounded bg-black/20 border border-zinc-900/40 relative overflow-hidden h-28 w-full max-w-sm">
                                            <img src={emb.image.url} onError={(e) => { (e.target as any).style.display = 'none'; }} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                          </div>
                                        )}

                                        {/* Footer text */}
                                        {emb.footer?.text && (
                                          <p className="text-[#72767d] text-[9.5px] font-bold mt-1 tracking-wide">
                                            {getMockPreviewText(emb.footer.text)}
                                          </p>
                                        )}
                                      </div>

                                      {/* Embed Thumbnail if turned on */}
                                      {emb.thumbnail?.url && (
                                        <div className="w-12 h-12 rounded-lg bg-zinc-900/30 border border-zinc-800 flex-shrink-0 overflow-hidden relative">
                                          <img src={emb.thumbnail.url === 'user' ? 'https://cdn.discordapp.com/embed/avatars/0.png' : emb.thumbnail.url} onError={(e) => { (e.target as any).src = 'https://cdn.discordapp.com/embed/avatars/0.png'; }} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        </div>
                                      )}
                                    </div>
                                  ))}

                                </div>
                              </div>

                            </div>

                            {/* Informative tips */}
                            <div className="p-4 rounded-2xl bg-[#09090b] border border-zinc-900 space-y-1.5">
                              <h6 className="text-[10px] uppercase font-black text-white flex items-center gap-1.5 tracking-wider">
                                <Sparkles className="w-3.5 h-3.5 text-[#5865F2]" /> Format Tips for Discord
                              </h6>
                              <ul className="text-[10px] text-zinc-500 space-y-1 font-semibold">
                                <li>• Double asterisks like <code className="text-[#5865F2]">**bold**</code> produces bold writing.</li>
                                <li>• Use <code className="text-[#5865F2]">_italic_</code> to italicize words nicely.</li>
                                <li>• <code className="text-[#5865F2]">{'<#channel_id>'}</code> tags channel rooms inside layout sends!</li>
                              </ul>
                            </div>

                          </div>

                        </div>

                        {/* BOTTOM FORM ACTION SUBMIT BAR */}
                        <div className="border-t border-zinc-900 pt-4.5 flex justify-end gap-3.5">
                          <button
                            type="submit"
                            disabled={isSavingWelcomer}
                            className="px-6 py-2.5 bg-[#5865F2] hover:bg-indigo-500 text-white rounded-xl text-xs font-black tracking-wider uppercase transition-all flex items-center gap-2 active:scale-95 cursor-pointer shadow-indigo-950/20 shadow-md"
                          >
                            <Save className="w-4 h-4" />
                            {isSavingWelcomer ? 'Saving Config...' : 'Deploy Welcomer Configuration'}
                          </button>
                        </div>
                      </form>
                    )}

                    {/* 3. REACTION ROLES RULE CONFIG */}
                    {activeDashboardTab === 'reaction_roles' && (
                      <div className="space-y-6">
                        <div className="border-b border-[#222] pb-4">
                          <h4 className="font-extrabold text-white text-sm flex items-center gap-1.5 uppercase tracking-wider">
                            🎭 Automated Reaction Roles
                          </h4>
                          <p className="text-xs text-zinc-500 mt-1">
                            Assign unique roles instantly when members click a reaction emoji on target instruction message posts.
                          </p>
                        </div>

                        <form onSubmit={handleAddReactionRole} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-black/20 p-4 rounded-xl border border-[#222] items-end">
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase block">Target Post Message ID</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. 1102931481519456256"
                              value={newRrMessageId}
                              onChange={(e) => setNewRrMessageId(e.target.value)}
                              className="w-full bg-[#0a0a0c] border border-[#2d2d30] focus:border-[#5865F2] rounded-lg px-3 py-2 text-xs text-white focus:outline-none transition-all"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase block">Reaction Emoji</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. ⭐, 🚀, custom"
                              value={newRrEmoji}
                              onChange={(e) => setNewRrEmoji(e.target.value)}
                              className="w-full bg-[#0a0a0c] border border-[#2d2d30] focus:border-[#5865F2] rounded-lg px-3 py-2 text-xs text-white focus:outline-none text-center"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase block">Target Role ID</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                required
                                placeholder="e.g. 1102931..."
                                value={newRrRoleId}
                                onChange={(e) => setNewRrRoleId(e.target.value)}
                                className="flex-1 bg-[#0a0a0c] border border-[#2d2d30] focus:border-[#5865F2] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                              />
                              <button
                                type="submit"
                                disabled={isSavingRr}
                                className="px-4 py-2 bg-[#5865F2] hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all"
                              >
                                {isSavingRr ? 'Saving...' : 'Create'}
                              </button>
                            </div>
                          </div>
                        </form>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase block tracking-wider font-extrabold mb-1">
                            Active Reaction Rules ({reactionRolesList.length})
                          </label>
                          {reactionRolesList.length === 0 ? (
                            <div className="text-center py-8 text-xs text-zinc-500 bg-black/10 border border-dashed border-[#222] rounded-xl">
                              No reaction role maps set. Setup a trigger above!
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                              {reactionRolesList.map((item) => (
                                <div key={item.id} className="p-3 bg-[#0a0a0c]/85 border border-[#222] rounded-xl flex items-center justify-between gap-3 animate-in fade-in duration-300">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg">{item.emoji}</span>
                                      <p className="text-xs font-bold text-white">Award Role</p>
                                    </div>
                                    <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                                      Msg ID: {item.messageId.slice(0, 10)}... ➜ Role: {item.roleId.slice(0, 10)}...
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => handleDeleteReactionRole(item.id)}
                                    className="p-1.5 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 rounded-lg transition-colors"
                                    title="Disable trigger rewards"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 4. GUILD-WIDE WEBHOOK PROFILE OVERRIDES (BOT BRANDING IDENTITY) */}
                    {activeDashboardTab === 'profile' && (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-300">
                        {/* LEFT INPUT FORM */}
                        <div className="lg:col-span-7 space-y-6">
                          <div className="border-b border-zinc-800 pb-4">
                            <h4 className="font-extrabold text-white text-sm flex items-center gap-1.5 uppercase tracking-wider">
                              👤 Bot Identity Override Customizer
                            </h4>
                            <p className="text-xs text-zinc-500 mt-1">
                              Configure specific, server-level bot username nicknames, custom avatar pictures, and profile banners.
                            </p>
                          </div>

                          <form onSubmit={handleSaveProfile} className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black tracking-widest text-zinc-400 uppercase block font-extrabold">
                                Guild-Specific Nickname Override
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Announcement Bot"
                                value={profileUsername}
                                onChange={(e) => setProfileUsername(e.target.value)}
                                className="w-full bg-[#080809] border border-zinc-800 focus:border-[#5865F2] rounded-xl px-4 py-3 text-xs text-white focus:outline-none transition-colors"
                              />
                              <p className="text-[10px] text-zinc-500 leading-normal">
                                The bot nickname automatically overrides the global client name exclusively inside this Discord guild.
                              </p>
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] font-black tracking-widest text-zinc-400 uppercase block font-extrabold">
                                Custom Bot Avatar image URL
                              </label>
                              <input
                                type="url"
                                placeholder="e.g. https://i.imgur.com/my-avatar.png"
                                value={profileAvatarUrl}
                                onChange={(e) => setProfileAvatarUrl(e.target.value)}
                                className="w-full bg-[#080809] border border-zinc-800 focus:border-[#5865F2] rounded-xl px-4 py-3 text-xs text-white focus:outline-none transition-colors"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] font-black tracking-widest text-zinc-400 uppercase block font-extrabold">
                                Custom Profile Banner image URL
                              </label>
                              <input
                                type="url"
                                placeholder="e.g. https://i.imgur.com/my-banner.png"
                                value={profileBannerUrl}
                                onChange={(e) => setProfileBannerUrl(e.target.value)}
                                className="w-full bg-[#080809] border border-zinc-800 focus:border-[#5865F2] rounded-xl px-4 py-3 text-xs text-white focus:outline-none transition-colors"
                              />
                            </div>

                            <div className="border-t border-zinc-800/80 pt-4 flex justify-end">
                              <button
                                type="submit"
                                disabled={isSavingProfile}
                                className="px-6 py-2.5 text-black font-black tracking-wider uppercase rounded-xl text-xs transition-all flex items-center gap-2 active:scale-95 shadow-md"
                                style={{ backgroundColor: activeSuite.accent }}
                              >
                                <Save className="w-4 h-4 text-black" />
                                {isSavingProfile ? 'Syncing identity...' : 'Apply Identity Overrides'}
                              </button>
                            </div>
                          </form>
                        </div>

                        {/* RIGHT REALISTIC DISCORD USER POP-OUT MOCKUP */}
                        <div className="lg:col-span-5 flex flex-col items-center">
                          <div className="text-zinc-500 text-[10px] font-extrabold uppercase mb-3 flex items-center gap-1.5 self-start">
                            <Eye className="w-3.5 h-3.5" style={{ color: activeSuite.accent }} /> Real-time Profile Preview
                          </div>

                          <div className="w-full max-w-[320px] bg-[#111214] rounded-2xl overflow-hidden shadow-[0_15px_35px_rgba(0,0,0,0.6)] border border-[#232428] font-sans text-white text-left select-none relative">
                            {/* Banner strip in mockup */}
                            <div className="h-24 w-full relative bg-zinc-800">
                              {profileBannerUrl ? (
                                <img src={profileBannerUrl} alt="Banner mockup" className="w-full h-full object-cover" onError={(e) => { (e.target as any).style.display = 'none'; }} />
                              ) : (
                                <div className={`absolute inset-0 bg-gradient-to-r ${activeSuite.gradient}`} />
                              )}
                            </div>

                            {/* Overlapping Avatar circular popup */}
                            <div className="relative px-4">
                              <div className="absolute -top-9 left-4 w-[74px] h-[74px] rounded-full bg-[#111214] flex items-center justify-center p-[4px]">
                                <div className="w-full h-full rounded-full bg-zinc-800 overflow-hidden relative flex items-center justify-center">
                                  {profileAvatarUrl ? (
                                    <img src={profileAvatarUrl} alt="Avatar profile" className="w-full h-full object-cover" onError={(e) => { (e.target as any).style.display = 'none'; }} />
                                  ) : (
                                    <div className={`w-full h-full bg-gradient-to-tr ${activeSuite.gradient} flex items-center justify-center`}>
                                      <Webhook className="w-8 h-8 text-white" />
                                    </div>
                                  )}
                                  
                                  {/* Online status tag inside mockup (green Discord dot) */}
                                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-[#111214] rounded-full" />
                                </div>
                              </div>
                            </div>

                            {/* Profile content card text */}
                            <div className="px-4 pb-4 pt-11 space-y-3">
                              <div className="bg-[#18191c] p-3 rounded-xl border border-[#202225] space-y-2">
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <h5 className="text-sm font-bold text-white truncate max-w-[160px]">
                                      {profileUsername || 'DWM Companion'}
                                    </h5>
                                    <span className="text-[9px] bg-[#5865F2] text-xs px-1.5 py-0.5 rounded font-black uppercase tracking-wider text-white">BOT</span>
                                  </div>
                                  <p className="text-[10px] text-zinc-400 font-medium">@dwm_companion_sh</p>
                                </div>

                                <div className="border-t border-[#232428] pt-2 space-y-1">
                                  <h6 className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Custom Status</h6>
                                  <p className="text-[11px] text-zinc-300 font-medium flex items-center gap-1">
                                    🎮 Listening to <strong>{selectedGuildId ? botGuilds.find(g => g.id === selectedGuildId)?.name || 'server' : 'server'}</strong>
                                  </p>
                                </div>

                                <div className="border-t border-[#232428] pt-2 space-y-0.5">
                                  <h6 className="text-[9px] font-black uppercase tracking-wider text-zinc-400">About Me</h6>
                                  <p className="text-[10px] text-zinc-300 leading-normal font-sans">
                                    Active automation responder, onboarding welcomer, reaction role rewards manager, and direct administrative link utility.
                                  </p>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <button type="button" className="flex-1 py-1.5 bg-[#4f545c]/50 hover:bg-[#4f545c]/70 text-zinc-200 transition-colors text-[10px] font-bold rounded-lg text-center cursor-default">
                                  Profile Override
                                </button>
                                <button type="button" className="flex-1 py-1.5 transition-colors text-white text-[10px] font-bold rounded-lg text-center cursor-default" style={{ backgroundColor: activeSuite.accent }}>
                                  Active server
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 4B. ACTIVE MODULES & SPECIFIC GUILD CUSTOMIZER */}
                    {activeDashboardTab === 'modules' && (
                      <form onSubmit={handleSaveModulesStyles} className="space-y-6 animate-in fade-in duration-300">
                        <div className="border-b border-zinc-800 pb-4">
                          <h4 className="font-extrabold text-white text-sm flex items-center gap-1.5 uppercase tracking-wider">
                            ⚙️ Guild Modules & Style Customizer
                          </h4>
                          <p className="text-xs text-zinc-500 mt-1">
                            Customize bot responder sub-modules, enable individual style themes, and overwrite defaults exclusively for this server.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          {/* MODULE SWITCHBOARD PANEL */}
                          <div className="space-y-4">
                            <label className="text-[10px] font-black tracking-widest text-zinc-400 uppercase flex items-center gap-1.5 font-sans">
                              <CheckSquare className="w-4 h-4" style={{ color: activeSuite.accent }} /> Core Module Activation
                            </label>

                            <div className="space-y-3">
                              {[
                                { id: 'triggers', label: 'Auto-Responder Triggers', desc: 'Scan matching server words/phrases and auto-reply.' },
                                { id: 'welcomer', label: 'Onboarding Welcomer', desc: 'Auto-welcome new arrivals in specific rooms.' },
                                { id: 'reaction_roles', label: 'Automatic Reaction Roles', desc: 'Auto-assign user server roles on emoji reaction click.' },
                                { id: 'injector', label: 'Interactive Webhook Injector', desc: 'Generate and inject active webhook streams instantly.' },
                                { id: 'commands', label: 'Custom Slash Commands', desc: 'Slash-triggers reference indexes inside discord servers.' }
                              ].map((module) => {
                                const isEnabled = enabledModules[module.id] !== false;
                                return (
                                  <div 
                                    key={module.id} 
                                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                                      isEnabled 
                                        ? 'bg-[#121214] border-zinc-800' 
                                        : 'bg-zinc-950/40 border-zinc-900 opacity-60'
                                    }`}
                                  >
                                    <div>
                                      <h5 className="text-xs font-bold text-white">{module.label}</h5>
                                      <p className="text-[10px] text-zinc-500 mt-0.5">{module.desc}</p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        playButtonSound();
                                        setEnabledModules(prev => ({
                                          ...prev,
                                          [module.id]: !isEnabled
                                        }));
                                      }}
                                      className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ${
                                        isEnabled ? '' : 'bg-zinc-800'
                                      }`}
                                      style={isEnabled ? { backgroundColor: activeSuite.accent } : {}}
                                    >
                                      <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${
                                        isEnabled ? 'translate-x-5' : 'translate-x-0'
                                      }`} />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* STYLE THEME & OVERRIDES */}
                          <div className="space-y-6">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black tracking-widest text-zinc-400 uppercase flex items-center gap-1.5 font-sans">
                                  <Palette className="w-4 h-4" style={{ color: activeSuite.accent }} /> Aesthetic Style Theme
                                </label>
                                <button
                                  type="button"
                                  onClick={() => { playButtonSound(); setThemeEnabled(!themeEnabled); }}
                                  className="text-[10px] uppercase font-black tracking-wider flex items-center gap-1 transition-opacity hover:opacity-80"
                                  style={{ color: activeSuite.accent }}
                                >
                                  {themeEnabled ? '● Enabled' : '○ Disabled'}
                                </button>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {Object.entries(themeStyles).map(([key, value]) => {
                                  const isSelected = themePreset === key;
                                  return (
                                    <button
                                      key={key}
                                      type="button"
                                      onClick={() => { playButtonSound(); setThemePreset(key as any); }}
                                      className={`p-2.5 rounded-xl border text-xs font-black transition-all text-center flex flex-col items-center gap-1 w-full max-w-full font-sans ${
                                        isSelected 
                                          ? 'border-white bg-zinc-900 shadow-inner' 
                                          : 'border-zinc-800 bg-[#121214] shadow-sm hover:border-zinc-700'
                                      }`}
                                    >
                                      {/* Colored Indicator Dot */}
                                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: value.accent }} />
                                      <span className={isSelected ? 'text-white' : 'text-zinc-300'}>{value.name}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* DEFAULT COGNITO WEBHOOK OVERRIDES */}
                            <div className="space-y-4">
                              <label className="text-[10px] font-black tracking-widest text-zinc-400 uppercase flex items-center gap-1.5 font-sans">
                                <Sliders className="w-4 h-4" style={{ color: activeSuite.accent }} /> Default Embed Customizer
                              </label>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <label className="text-[9px] font-bold text-zinc-500 uppercase font-sans">Default Embed Color</label>
                                  <div className="flex gap-2">
                                    <input 
                                      type="color" 
                                      value={defaultEmbedColor} 
                                      onChange={(e) => setDefaultEmbedColor(e.target.value)} 
                                      className="w-10 h-10 bg-[#080809] border border-zinc-800 rounded-xl cursor-pointer p-0.5 overflow-hidden"
                                    />
                                    <input 
                                      type="text" 
                                      value={defaultEmbedColor} 
                                      onChange={(e) => setDefaultEmbedColor(e.target.value)} 
                                      placeholder="#5865F2"
                                      className="flex-1 bg-[#080809] border border-zinc-800 text-white font-mono text-xs px-3.5 py-1.5 rounded-xl focus:outline-none"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <label className="text-[9px] font-bold text-zinc-500 uppercase font-sans">Default Embed Footer Text</label>
                                  <input 
                                    type="text" 
                                    value={customFooter} 
                                    onChange={(e) => setCustomFooter(e.target.value)} 
                                    placeholder="e.g. Powered by DWM companion"
                                    className="w-full bg-[#080809] border border-zinc-805 text-white text-xs px-3.5 py-2.5 rounded-xl focus:outline-none"
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="text-[9px] font-bold text-zinc-500 uppercase font-sans">Custom Message text Template Override</label>
                                <textarea 
                                  value={defaultMessageText} 
                                  onChange={(e) => setDefaultMessageText(e.target.value)} 
                                  rows={2}
                                  placeholder="Type standard notification fallback override message structure..."
                                  className="w-full bg-[#080809] border border-zinc-805 text-white text-xs p-3.5 rounded-xl focus:outline-none resize-none leading-relaxed"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-zinc-800 pt-4 flex justify-end font-sans">
                          <button
                            type="submit"
                            disabled={isSavingModules}
                            className="px-6 py-2.5 text-black font-black tracking-wider uppercase rounded-xl text-xs transition-colors flex items-center gap-2 active:scale-95 shadow-md cursor-pointer"
                            style={{ backgroundColor: activeSuite.accent }}
                          >
                            <Save className="w-4 h-4 text-black" />
                            {isSavingModules ? 'Saving server specs...' : 'Save Configuration Parameters'}
                          </button>
                        </div>
                      </form>
                    )}

                    {/* 5. INSTANT WEBHOOK INJECTOR PAGE */}
                    {activeDashboardTab === 'create_webhook' && (
                      <form onSubmit={handleInjectWebhook} className="space-y-6">
                        <div className="border-b border-[#222] pb-4">
                          <h4 className="font-extrabold text-white text-sm flex items-center gap-1.5 uppercase tracking-wider">
                            ⚡ Instant Webhook Generation Engine
                          </h4>
                          <p className="text-xs text-zinc-500 mt-1">
                            Deploy high-frequency Discord Webhooks securely into any server text channel. Generates the active link instantly and logs configuration securely inside local workspace storage.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                              Target Server Room Channel
                            </label>
                            <select
                              required
                              value={injectorChannelId}
                              onChange={(e) => setInjectorChannelId(e.target.value)}
                              className="w-full bg-[#0a0a0c] border border-[#2d2d30] focus:border-[#5865F2] rounded-xl px-4 py-3 text-xs text-white focus:outline-none cursor-pointer"
                            >
                              <option value="">Select Target Room...</option>
                              {selectedGuildChannels.map((ch: any) => (
                                <option key={ch.id} value={ch.id}>
                                  #️⃣ {ch.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                              Designated Webhook Display Name
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Alerts Manager, Dev Notifications"
                              value={injectorWebhookName}
                              onChange={(e) => setInjectorWebhookName(e.target.value)}
                              className="w-full bg-[#0a0a0c] border border-[#2d2d30] focus:border-[#5865F2] rounded-xl px-4 py-3 text-xs text-white focus:outline-none transition-colors"
                            />
                          </div>
                        </div>

                        <div className="border-t border-[#222] pt-4 flex justify-end">
                          <button
                            type="submit"
                            disabled={isInjectingWebhook}
                            className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black tracking-wider uppercase rounded-xl text-xs transition-all flex items-center gap-2 active:scale-95 shadow-[0_4px_15px_rgba(16,185,129,0.2)]"
                          >
                            <Plus className="w-4 h-4 text-black" />
                            {isInjectingWebhook ? 'Injecting in Discord...' : 'Inject Webhook Link'}
                          </button>
                        </div>
                      </form>
                    )}

                    {/* 6. 24/7 GATEWAY GUARD CONFIG */}
                    {activeDashboardTab === 'uptime' && (
                      <div className="space-y-6 animate-in fade-in duration-300 text-left">
                        <div className="border-b border-[#222] pb-4">
                          <h4 className="font-extrabold text-white text-sm flex items-center gap-1.5 uppercase tracking-wider">
                            ⚡ 24/7 Gateway Guard & Keep-Awake Pinger
                          </h4>
                          <p className="text-xs text-zinc-500 mt-1">
                            Deploy this exact control panel and bot to Render.com's cloud for free, to keep your bot active 24 hours a day, 7 days a week, regardless of whether you have this browser tab open.
                          </p>
                        </div>

                        {/* STATUS SHIELD */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-4 rounded-2xl bg-[#09090b] border border-zinc-900 flex flex-col justify-between">
                            <span className="text-[9.5px] uppercase tracking-wider font-extrabold text-zinc-500">Daemon Pinger Status</span>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                              <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Active & Armed</span>
                            </div>
                          </div>

                          <div className="p-4 rounded-2xl bg-[#09090b] border border-zinc-900 flex flex-col justify-between">
                            <span className="text-[9.5px] uppercase tracking-wider font-extrabold text-zinc-500">Keep-Alive Frequency</span>
                            <span className="text-xs font-black text-white mt-2 font-semibold">Every 10 Minutes</span>
                          </div>

                          <div className="p-4 rounded-2xl bg-[#09090b] border border-zinc-900 flex flex-col justify-between">
                            <span className="text-[9.5px] uppercase tracking-wider font-extrabold text-zinc-500">Target URL Node</span>
                            <span className="text-xs font-black text-zinc-400 truncate mt-2">
                              {window.location.origin}
                            </span>
                          </div>
                        </div>

                        {/* EXPLANATORY BLUEPRINT SECTION */}
                        <div className="p-5 rounded-2xl bg-zinc-950/20 border border-zinc-800/40 space-y-4">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                              <Bot className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div>
                              <h5 className="text-xs font-black text-white">How the Keep-Awake Trick Works</h5>
                              <p className="text-[10px] text-zinc-500">A smart web technique keeping the free cloud server active indefinitely.</p>
                            </div>
                          </div>
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            Webhosting providers like <strong className="text-zinc-300">Render.com</strong> put free web containers to sleep after 15 minutes of inactivity. 
                            To combat this, we've integrated our <strong>Gateway Keep-Awake Daemon</strong> directly into the server backend. 
                            Every 10 minutes, the server securely self-pings its own health-check endpoints, telling the host provider that the application is busy. 
                            This keeps your container fully awake and keeps your Discord Slash Commands and Welcomers running 24/7 without any interruptions!
                          </p>
                        </div>

                        {/* BLUEPRINT STEPS & YAML COPY FIELD */}
                        <div className="space-y-4">
                          <h5 className="text-xs font-black text-white uppercase tracking-wider">
                            🚀 1-Click Render.com Deployment Guide
                          </h5>
                          
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                            <div className="md:col-span-5 space-y-4 text-xs text-zinc-400 leading-relaxed">
                              <div className="flex gap-2.5">
                                <span className="flex-none w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-[10px] text-zinc-300">1</span>
                                <p><strong>Export code</strong> using AI Studio's settings menu (Export to GitHub or ZIP) so you have the source setup ready.</p>
                              </div>
                              <div className="flex gap-2.5">
                                <span className="flex-none w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-[10px] text-zinc-300">2</span>
                                <p>Create a free account on <strong>https://render.com</strong> and click <strong>New +</strong> then select <strong>Blueprint</strong>.</p>
                              </div>
                              <div className="flex gap-2.5">
                                <span className="flex-none w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-[10px] text-zinc-300">3</span>
                                <p>Render auto-detects the pre-configured <strong>`render.yaml`</strong> file (which we have created in your workspace), then prompts for your Discord & Firebase environment settings.</p>
                              </div>
                              <div className="flex gap-2.5">
                                <span className="flex-none w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-[10px] text-zinc-300">4</span>
                                <p>Click <strong>Deploy</strong> and watch the server boot up. Once online, the self-ping daemon activates and will automatically block any sleep cycles!</p>
                              </div>
                            </div>

                            <div className="md:col-span-7 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black uppercase tracking-widest text-[#5865F2]">render.yaml config Blueprint</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    playButtonSound();
                                    const yamlText = `services:
  - type: web
    name: discord-dwm-companion-gateway
    runtime: node
    buildCommand: npm install && npm run build
    startCommand: npm run start
    plan: free # Deploys on the free tier
    envVars:
      - key: NODE_ENV
        value: production
      - key: DISCORD_BOT_TOKEN
        sync: false
      - key: APP_URL
        sync: false`;
                                    navigator.clipboard.writeText(yamlText);
                                    toast.success('System configuration blueprint copied to clipboard!');
                                  }}
                                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 rounded-lg text-[9.5px] text-zinc-350 flex items-center gap-1 active:scale-95 cursor-pointer font-bold select-none"
                                >
                                  <Copy className="w-3 h-3 text-[#5865F2]" />
                                  <span>Copy Blueprint</span>
                                </button>
                              </div>

                              <pre className="p-4 rounded-xl bg-[#070709] border border-zinc-900 text-[11px] font-mono text-zinc-400 overflow-x-auto text-left leading-relaxed">
{`services:
  - type: web
    name: discord-dwm-companion-gateway
    runtime: node
    buildCommand: npm install && npm run build
    startCommand: npm run start
    plan: free # Deploys on the free tier
    envVars:
      - key: NODE_ENV
        value: production
      - key: DISCORD_BOT_TOKEN
        sync: false
      - key: APP_URL
        sync: false`}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <CommandCheatSheetModal 
        isOpen={showCheatSheet} 
        onClose={() => setShowCheatSheet(false)} 
      />
    </div>
  );
};
