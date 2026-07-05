import React, { useState, useEffect, useCallback } from 'react';
import { LogOut, Shield, Loader2, Trash2, Copy, Plus, Hash, Settings, X, Save, Image as ImageIcon, ChevronRight, Server, Globe, Link as LinkIcon, Search, Send, MessageSquare, Edit2, ArrowLeft, Eye, ZoomIn, Upload } from 'lucide-react';
import { toast } from '../utils/toast';
import { playButtonSound, playDeleteSound } from '../utils/sounds';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, getDoc, doc, updateDoc } from 'firebase/firestore';
import { safeUUID } from '../utils';
import { Comment } from './TemplatesPanel';
import { MessagePreview } from './MessagePreview';

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

export interface BotChannel {
  id: string;
  name: string;
}

export interface BotGuild {
  id: string;
  name: string;
  icon: string | null;
  channels?: BotChannel[];
}

export interface MessageTemplate {
  id: string;
  name: string;
  message: DiscordWebhookMessage;
  audience?: 'public' | 'private';
  thumbnail?: string;
  description?: string;
  author?: string;
  authorId?: string;
  createdAt?: string;
  likes?: number;
  dislikes?: number;
  likedBy?: string[];
  dislikedBy?: string[];
}

const SafeTemplateImage: React.FC<{ src: string; alt: string; className: string; size?: 'small' | 'normal' }> = ({ src, alt, className, size = 'normal' }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    if (size === 'small') {
      return (
        <div className="flex items-center justify-center bg-zinc-900/60 text-zinc-400 h-full w-full border border-red-500/15" title="Failed to load Image">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="w-5 h-5 text-red-500/70"
          >
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
            <circle cx="10" cy="12" r="2" />
            <path d="m20 17-1.296-1.296a2.41 2.41 0 0 0-3.408 0L9 22" />
            <line x1="2" y1="2" x2="22" y2="22" />
          </svg>
        </div>
      );
    }

    return (
      <div className={`flex flex-col items-center justify-center bg-zinc-900/60 text-zinc-400 gap-2 p-4 h-full w-full border border-red-500/15 ${className}`}>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="w-8 h-8 text-red-500/70"
        >
          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
          <path d="M14 2v4a2 2 0 0 0 2 2h4" />
          <circle cx="10" cy="12" r="2" />
          <path d="m20 17-1.296-1.296a2.41 2.41 0 0 0-3.408 0L9 22" />
          <line x1="2" y1="2" x2="22" y2="22" />
        </svg>
        <span className="text-[10px] font-semibold text-zinc-400 text-center select-none">Failed to load Image</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
    />
  );
};

interface AccountPanelProps {
  message: DiscordWebhookMessage;
  onChange: (message: DiscordWebhookMessage) => void;
  onSelectWebhook?: (url: string, name: string) => void;
}

export const AccountPanel: React.FC<AccountPanelProps> = ({ message, onChange, onSelectWebhook }) => {
  const [username, setUsername] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [userId, setUserId] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [webhooks, setWebhooks] = useState<DiscordWebhook[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [messageCounts, setMessageCounts] = useState<Record<string, number>>({});

  const [activeView, setActiveView] = useState<'dashboard' | 'manage_webhooks' | 'create_webhook' | 'templates' | 'feedback'>('dashboard');
  const [templateTab, setTemplateTab] = useState<'list' | 'create' | 'community'>('list');

  // Automatically trigger premium template creator overlay when clicking create tab
  useEffect(() => {
    if (activeView === 'templates' && templateTab === 'create') {
      window.dispatchEvent(new Event('OPEN_TEMPLATE_CREATOR'));
    }
  }, [templateTab, activeView]);
  const [newTemplateName, setNewTemplateName] = useState(() => localStorage.getItem('pending_template_name') || '');
  const [newTemplateUrl, setNewTemplateUrl] = useState(() => localStorage.getItem('pending_template_url') || '');
  const [newTemplateAudience, setNewTemplateAudience] = useState<'public' | 'private'>(() => (localStorage.getItem('pending_template_audience') as 'public' | 'private') || 'private');
  const [newTemplateThumbnail, setNewTemplateThumbnail] = useState(() => localStorage.getItem('pending_template_thumbnail') || '');
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<MessageTemplate | null>(null);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [userGuilds, setUserGuilds] = useState<{ id: string; name: string; icon?: string }[]>(() => {
    try {
      const stored = localStorage.getItem('user_guilds');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [serverFilter, setServerFilter] = useState<string>('all');
  const [serverWebhooks, setServerWebhooks] = useState<DiscordWebhook[]>([]);
  const [isLoadingServerWebhooks, setIsLoadingServerWebhooks] = useState(false);
  const [serverWebhooksError, setServerWebhooksError] = useState('');
  const [webhookHistory, setWebhookHistory] = useState<{id: string, name: string, time: string, status: 'success' | 'error'}[]>([]);

  // User comments and replies activity states
  interface UserCommentOrReply {
    type: 'comment' | 'reply';
    id: string;
    commentId: string;
    text: string;
    createdAt: string;
    templateId: string;
    templateName: string;
    parentCommentText?: string;
  }

  interface FeedbackTemplatePreview {
    id: string;
    name: string;
    message: DiscordWebhookMessage;
    audience?: 'public' | 'private';
    thumbnail?: string;
    description?: string;
    author?: string;
    authorId?: string;
    createdAt?: string;
    likes?: number;
    dislikes?: number;
  }

  interface LocalTemplateFallback {
    id: string;
    name: string;
  }

  const [myFeedbackList, setMyFeedbackList] = useState<UserCommentOrReply[]>([]);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState<boolean>(false);
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null);
  const [editingFeedbackText, setEditingFeedbackText] = useState<string>('');
  const [selectedTemplateForView, setSelectedTemplateForView] = useState<FeedbackTemplatePreview | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const loadMyFeedback = useCallback(async () => {
    setIsLoadingFeedback(true);
    const feedbackList: UserCommentOrReply[] = [];
    try {
      // 1. Scan community templates from Firestore if DB is available
      if (db && userId) {
        const q = collection(db, 'templates');
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((docSnap) => {
          const tData = docSnap.data();
          const templateId = docSnap.id;
          const templateName = tData.name || "Unnamed Template";
          const commentsArr = (tData.comments || []) as Comment[];
          
          commentsArr.forEach((c) => {
            if (c.authorId === userId) {
              feedbackList.push({
                type: 'comment',
                id: c.id,
                commentId: c.id,
                text: c.text,
                createdAt: c.createdAt,
                templateId,
                templateName
              });
            }
            if (c.replies) {
              c.replies.forEach((r) => {
                if (r.authorId === userId) {
                  feedbackList.push({
                    type: 'reply',
                    id: r.id,
                    commentId: c.id,
                    text: r.text,
                    createdAt: r.createdAt,
                    templateId,
                    templateName,
                    parentCommentText: c.text
                  });
                }
              });
            }
          });
        });
      }

      // 2. Scan LocalStorage for any comments starting with 'comments_' suffix
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith('comments_')) {
          const templateId = key.substring(9);
          let templateName = "Local Template";
          try {
            const storedTemplates = localStorage.getItem('discord_templates');
            if (storedTemplates) {
              const parsedTs = JSON.parse(storedTemplates) as LocalTemplateFallback[];
              const foundT = parsedTs.find((t) => t.id === templateId);
              if (foundT) templateName = foundT.name;
            }
          } catch (e) {
            console.warn("Stored templates fallback read fail", e);
          }

          try {
            const localComments = JSON.parse(localStorage.getItem(key) || '[]') as Comment[];
            localComments.forEach((c) => {
              const hasComment = feedbackList.some(item => item.id === c.id);
              if (!hasComment && c.authorId === userId) {
                feedbackList.push({
                  type: 'comment',
                  id: c.id,
                  commentId: c.id,
                  text: c.text,
                  createdAt: c.createdAt,
                  templateId,
                  templateName
                });
              }

              if (c.replies) {
                c.replies.forEach((r) => {
                  const hasReply = feedbackList.some(item => item.id === r.id);
                  if (!hasReply && r.authorId === userId) {
                    feedbackList.push({
                      type: 'reply',
                      id: r.id,
                      commentId: c.id,
                      text: r.text,
                      createdAt: r.createdAt,
                      templateId,
                      templateName,
                      parentCommentText: c.text
                    });
                  }
                });
              }
            });
          } catch (e) {
            console.error("Error parsing local comment key:", key, e);
          }
        }
      }

      feedbackList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMyFeedbackList(feedbackList);
    } catch (error) {
      console.error("Error loading feedback list:", error);
    } finally {
      setIsLoadingFeedback(false);
    }
  }, [userId]);

  const handleEditFeedback = async (item: UserCommentOrReply, newText: string) => {
    const cleanText = newText.trim();
    if (!cleanText) {
      toast.error("Message text cannot be empty!");
      return;
    }

    try {
      const storageKey = `comments_${item.templateId}`;
      const localCommentsStr = localStorage.getItem(storageKey);
      let commentsList: Comment[] = [];
      if (localCommentsStr) {
        commentsList = JSON.parse(localCommentsStr);
      }

      const updatedCommentsList = commentsList.map((c) => {
        if (item.type === 'comment' && c.id === item.id) {
          return { ...c, text: cleanText };
        }
        if (item.type === 'reply' && c.id === item.commentId) {
          const updatedReplies = (c.replies || []).map((r) => {
            if (r.id === item.id) {
              return { ...r, text: cleanText };
            }
            return r;
          });
          return { ...c, replies: updatedReplies };
        }
        return c;
      });

      localStorage.setItem(storageKey, JSON.stringify(updatedCommentsList));

      if (db && !item.templateId.startsWith('local_')) {
        const tDocRef = doc(db, 'templates', item.templateId);
        const tSnap = await getDoc(tDocRef);
        if (tSnap.exists()) {
          const currentComments = (tSnap.data().comments || []) as Comment[];
          const refreshedComments = currentComments.map((c) => {
            if (item.type === 'comment' && c.id === item.id) {
              return { ...c, text: cleanText };
            }
            if (item.type === 'reply' && c.id === item.commentId) {
              const updatedReplies = (c.replies || []).map((r) => {
                if (r.id === item.id) {
                  return { ...r, text: cleanText };
                }
                return r;
              });
              return { ...c, replies: updatedReplies };
            }
            return c;
          });
          await updateDoc(tDocRef, { comments: refreshedComments });
        }
      }

      window.dispatchEvent(new CustomEvent('template_comments_updated', {
        detail: { templateId: item.templateId }
      }));

      setMyFeedbackList(prev => prev.map(f => f.id === item.id ? { ...f, text: cleanText } : f));
      toast.success("Feedback updated successfully!");
    } catch (err) {
      console.error("Error editing feedback:", err);
      toast.error("Failed to edit feedback.");
    }
  };

  const handleDeleteFeedback = async (item: UserCommentOrReply) => {
    playDeleteSound();

    try {
      const storageKey = `comments_${item.templateId}`;
      const localCommentsStr = localStorage.getItem(storageKey);
      let commentsList: Comment[] = [];
      if (localCommentsStr) {
        commentsList = JSON.parse(localCommentsStr);
      }

      let updatedCommentsList: Comment[] = [];
      if (item.type === 'comment') {
        updatedCommentsList = commentsList.filter(c => c.id !== item.id);
      } else {
        updatedCommentsList = commentsList.map((c) => {
          if (c.id === item.commentId) {
            const filteredReplies = (c.replies || []).filter(r => r.id !== item.id);
            return { ...c, replies: filteredReplies };
          }
          return c;
        });
      }

      localStorage.setItem(storageKey, JSON.stringify(updatedCommentsList));

      if (db && !item.templateId.startsWith('local_')) {
        const tDocRef = doc(db, 'templates', item.templateId);
        const tSnap = await getDoc(tDocRef);
        if (tSnap.exists()) {
          const currentComments = (tSnap.data().comments || []) as Comment[];
          let refreshedComments: Comment[] = [];
          if (item.type === 'comment') {
            refreshedComments = currentComments.filter(c => c.id !== item.id);
          } else {
            refreshedComments = currentComments.map((c) => {
              if (c.id === item.commentId) {
                const filteredReplies = (c.replies || []).filter(r => r.id !== item.id);
                return { ...c, replies: filteredReplies };
              }
              return c;
            });
          }
          await updateDoc(tDocRef, { comments: refreshedComments });
        }
      }

      window.dispatchEvent(new CustomEvent('template_comments_updated', {
        detail: { templateId: item.templateId }
      }));

      setMyFeedbackList(prev => prev.filter(f => f.id !== item.id));
      toast.success("Feedback deleted.");
    } catch (err) {
      console.error("Error deleting feedback:", err);
      toast.error("Failed to delete feedback.");
    }
  };

  const handleViewTemplateDetails = async (templateId: string) => {
    const found = templates.find(t => t.id === templateId) as FeedbackTemplatePreview | undefined;
    if (found) {
      setSelectedTemplateForView(found);
      return;
    }

    try {
      const stored = localStorage.getItem('discord_templates');
      if (stored) {
        const parsed = JSON.parse(stored) as FeedbackTemplatePreview[];
        const lFound = parsed.find((t) => t.id === templateId);
        if (lFound) {
          setSelectedTemplateForView(lFound);
          return;
        }
      }
    } catch (e) {
      console.warn("Storage fallback load template error", e);
    }

    if (db && !templateId.startsWith('local_')) {
      try {
        const docRef = doc(db, 'templates', templateId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const dat = docSnap.data();
          setSelectedTemplateForView({
            id: docSnap.id,
            name: dat.name || "Unnamed Layout",
            description: dat.description || "",
            author: dat.author || "Anonymous",
            message: (dat.message || { content: "" }) as DiscordWebhookMessage,
            createdAt: dat.createdAt || ""
          });
          return;
        }
      } catch (e) {
        console.error("Error fetching template context:", e);
      }
    }

    toast.error("Could not load original layout details. It might have been deleted.");
  };

  useEffect(() => {
    if (isLoggedIn && userId) {
      loadMyFeedback();
    }
  }, [isLoggedIn, userId, loadMyFeedback]);

  // Pull-to-refresh logic for Account system
  const [pullProgress, setPullProgress] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const startYRef = React.useRef(0);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const handleReloadAccountData = async () => {
    setIsRefreshing(true);
    setPullProgress(65);
    const startTime = Date.now();
    try {
      loadWebhooks();
      loadMessageCounts();
      await fetchAllCreatedWebhooks();
      loadTemplates();
      
      // Force minimum duration of 1400ms for active refreshing so the cool blue portal orbital animation can rotate gracefully and never get abruptly cut off.
      const elapsed = Date.now() - startTime;
      const minDuration = 1400;
      if (elapsed < minDuration) {
        await new Promise(resolve => setTimeout(resolve, minDuration - elapsed));
      }
      
      // Successfully reloaded! Show success star particles and checkmark animation
      setShowSuccess(true);
      setIsRefreshing(false);
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Account data reloaded!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to reload account data.');
    } finally {
      setIsRefreshing(false);
      setShowSuccess(false);
      setPullProgress(0);
    }
  };

  const handlePullStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const container = scrollContainerRef.current;
    if (!container || container.scrollTop > 0 || isRefreshing || showSuccess) return;
    
    setIsPulling(true);
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    startYRef.current = clientY;
  };

  const handlePullMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isPulling || isRefreshing || showSuccess) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = clientY - startYRef.current;
    
    if (deltaY > 0) {
      const maxPull = 120;
      const progress = Math.min(deltaY * 0.4, maxPull);
      setPullProgress(progress);
    } else {
      setPullProgress(0);
      setIsPulling(false);
    }
  };

  const handlePullEnd = () => {
    if (!isPulling || showSuccess) return;
    setIsPulling(false);
    
    if (pullProgress >= 65) {
      handleReloadAccountData();
    } else {
      setPullProgress(0);
    }
  };

  const [editingWebhook, setEditingWebhook] = useState<DiscordWebhook | null>(null);
  const [editName, setEditName] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editChannelId, setEditChannelId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Sync pending template creation data to survive tab switching unmounts
  useEffect(() => {
    localStorage.setItem('pending_template_name', newTemplateName);
  }, [newTemplateName]);
  useEffect(() => {
    localStorage.setItem('pending_template_url', newTemplateUrl);
  }, [newTemplateUrl]);
  useEffect(() => {
    localStorage.setItem('pending_template_audience', newTemplateAudience);
  }, [newTemplateAudience]);
  useEffect(() => {
    localStorage.setItem('pending_template_thumbnail', newTemplateThumbnail);
  }, [newTemplateThumbnail]);

  // Create Webhook State
  const [newWebhookName, setNewWebhookName] = useState('');
  const [newWebhookAvatar, setNewWebhookAvatar] = useState('');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookGuild, setNewWebhookGuild] = useState('');
  const [isFetchingWebhook, setIsFetchingWebhook] = useState(false);

  // Bot Custom Setup States
  const [isBotConnected, setIsBotConnected] = useState(false);
  const [botId, setBotId] = useState<string | null>(null);
  const [botGuilds, setBotGuilds] = useState<BotGuild[]>([]);
  const [selectedBotGuild, setSelectedBotGuild] = useState<BotGuild | null>(null);
  const [selectedBotChannel, setSelectedBotChannel] = useState<BotChannel | null>(null);
  const [isCreatingWebhookWithBot, setIsCreatingWebhookWithBot] = useState(false);
  const [showBotServerDropdown, setShowBotServerDropdown] = useState(false);
  const [showBotChannelDropdown, setShowBotChannelDropdown] = useState(false);

  // Crop / Zoom Avatar States
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [dragStartCrop, setDragStartCrop] = useState({ x: 0, y: 0 });
  const [imgRatio, setImgRatio] = useState(1);

  // Fetch Bot Status and Guilds
  useEffect(() => {
    let isMounted = true;
    const fetchBotStatusAndGuilds = async () => {
      try {
        const statusRes = await fetch('/api/bot/status');
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (isMounted) {
            const online = statusData.status === 'online';
            setIsBotConnected(online);
            if (statusData.id) {
              setBotId(statusData.id);
            }
            if (online) {
              const guildsRes = await fetch('/api/bot/guilds');
              if (guildsRes.ok) {
                const guildsData = await guildsRes.json();
                if (isMounted) {
                  setBotGuilds(guildsData);
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("Error fetching bot details for manual setup:", err);
      }
    };
    fetchBotStatusAndGuilds();
    return () => {
      isMounted = false;
    };
  }, [activeView]);

  // Set up crop image ratio when original image loads
  useEffect(() => {
    if (originalImageSrc) {
      const img = new Image();
      img.onload = () => {
        setImgRatio(img.width / img.height);
        setZoomScale(1);
        setPanX(0);
        setPanY(0);
      };
      img.src = originalImageSrc;
    }
  }, [originalImageSrc]);

  // Crop / Zoom Mouse & Touch Events
  const handleCropMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingCrop(true);
    setDragStartCrop({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleCropMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingCrop) return;
    setPanX(e.clientX - dragStartCrop.x);
    setPanY(e.clientY - dragStartCrop.y);
  };

  const handleCropMouseUp = () => {
    setIsDraggingCrop(false);
  };

  const handleCropTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDraggingCrop(true);
      setDragStartCrop({ 
        x: e.touches[0].clientX - panX, 
        y: e.touches[0].clientY - panY 
      });
    }
  };

  const handleCropTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingCrop || e.touches.length !== 1) return;
    setPanX(e.touches[0].clientX - dragStartCrop.x);
    setPanY(e.touches[0].clientY - dragStartCrop.y);
  };

  const handleCropTouchEnd = () => {
    setIsDraggingCrop(false);
  };

  const executeCropCrop = () => {
    if (!originalImageSrc) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const factor = 256 / 250; // Viewport is 250px inside canvas
        ctx.clearRect(0, 0, 256, 256);
        
        const renderWidth = imgRatio > 1 ? 250 * imgRatio : 250;
        const renderHeight = imgRatio > 1 ? 250 : 250 / imgRatio;

        ctx.save();
        ctx.translate(128, 128);
        ctx.scale(zoomScale, zoomScale);
        ctx.translate(panX * factor / zoomScale, panY * factor / zoomScale);
        ctx.drawImage(
          img,
          -renderWidth * factor / 2,
          -renderHeight * factor / 2,
          renderWidth * factor,
          renderHeight * factor
        );
        ctx.restore();

        const croppedBase64 = canvas.toDataURL('image/png');
        setNewWebhookAvatar(croppedBase64);
        setCropModalOpen(false);
        setOriginalImageSrc(null);
        toast.success("Avatar cropped and zoomed successfully!");
      }
    };
    img.src = originalImageSrc;
  };

  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setOriginalImageSrc(event.target.result as string);
          setCropModalOpen(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBotWebhookCreate = async () => {
    playButtonSound();
    if (!newWebhookName) {
      toast.error("Please add a webhook name");
      return;
    }
    if (!selectedBotGuild) {
      toast.error("Please select a server");
      return;
    }
    if (!selectedBotChannel) {
      toast.error("Please select a targeted channel");
      return;
    }

    setIsCreatingWebhookWithBot(true);
    const toastId = toast.loading("Creating webhook via DWM Tool bot...");

    try {
      const response = await fetch(`/api/discord/guilds/${selectedBotGuild.id}/webhooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: selectedBotChannel.id,
          name: newWebhookName,
          avatar: newWebhookAvatar || undefined
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to create webhook');
      }

      const resData = await response.json();

      // Formulate a proper DiscordWebhook item matching standard structure
      const newWebhook: DiscordWebhook = {
        id: resData.id,
        name: resData.name,
        channel_id: resData.channelId || selectedBotChannel.id,
        guild_id: selectedBotGuild.id,
        url: resData.url,
        guild_name: selectedBotGuild.name,
        avatar: newWebhookAvatar || undefined
      };

      addWebhook(newWebhook);
      toast.success("Webhook created and synced beautifully!", { id: toastId });
      
      // Reset form fields
      setNewWebhookName('');
      setNewWebhookAvatar('');
      setSelectedBotGuild(null);
      setSelectedBotChannel(null);
      setActiveView('manage_webhooks');
    } catch (err) {
      const error = err as Error;
      console.error(error);
      toast.error(`Error: ${error.message || 'Failed to generate webhook'}`, { id: toastId });
    } finally {
      setIsCreatingWebhookWithBot(false);
    }
  };

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

  const fetchAllCreatedWebhooks = async () => {
    const token = localStorage.getItem('discord_token');
    if (!token) return;

    interface DiscordGuildRaw {
      id: string;
      name: string;
      icon?: string;
      owner?: boolean;
      permissions?: string | number;
    }

    interface DiscordWebhookRaw {
      id: string;
      token: string;
      name: string;
      channel_id?: string;
      guild_id?: string;
      avatar?: string;
    }

    try {
      // 1. Fetch user guilds
      const guildsRes = await fetch('/api/discord/guilds', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!guildsRes.ok) return;
      const guilds = await guildsRes.json();
      if (!Array.isArray(guilds)) return;

      // Filter guilds where the user can access / manage webhooks (has ADMIN [0x8], MANAGE_GUILD [0x20], or MANAGE_WEBHOOKS [0x20000000])
      const accessibleGuilds = (guilds as DiscordGuildRaw[]).filter((guild) => {
        if (guild.owner === true) return true;
        if (!guild.permissions) return false;
        try {
          const perms = BigInt(guild.permissions);
          const ADMINISTRATOR = 8n;
          const MANAGE_GUILD = 32n;
          const MANAGE_WEBHOOKS = 536870912n; // 0x20000000
          
          return (perms & ADMINISTRATOR) === ADMINISTRATOR ||
                 (perms & MANAGE_GUILD) === MANAGE_GUILD ||
                 (perms & MANAGE_WEBHOOKS) === MANAGE_WEBHOOKS;
        } catch {
          const permsNum = Number(guild.permissions);
          return (permsNum & 8) === 8 || (permsNum & 32) === 32 || (permsNum & 536870912) === 536870912;
        }
      });

      // Extract and save guilds
      const mappedGuilds = accessibleGuilds.map((g) => ({
        id: g.id,
        name: g.name,
        icon: g.icon
      }));
      setUserGuilds(mappedGuilds);
      localStorage.setItem('user_guilds', JSON.stringify(mappedGuilds));

      // 2. For each guild, fetch webhooks
      const allFetchedWebhooks: DiscordWebhook[] = [];

      await Promise.all(accessibleGuilds.map(async (guild) => {
        try {
          const webhooksRes = await fetch(`/api/discord/guilds/${guild.id}/webhooks`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (webhooksRes.ok) {
            const data = await webhooksRes.json();
            if (Array.isArray(data)) {
              (data as DiscordWebhookRaw[]).forEach((w) => {
                if (w && w.id && w.token) {
                  allFetchedWebhooks.push({
                    id: w.id,
                    name: w.name,
                    url: `https://discord.com/api/webhooks/${w.id}/${w.token}`,
                    channel_id: w.channel_id || 'Unknown',
                    guild_id: w.guild_id || guild.id,
                    guild_name: guild.name,
                    avatar: w.avatar || ''
                  });
                }
              });
            }
          }
        } catch (e) {
          console.error(`Failed to fetch webhooks for guild ${guild.name}:`, e);
        }
      }));

      // 3. Update localStorage and state by merging them
      if (allFetchedWebhooks.length > 0) {
        setWebhooks(prev => {
          const existingUrls = new Set(prev.map(w => w.url));
          const newWebhooks = allFetchedWebhooks.filter(w => !existingUrls.has(w.url));
          if (newWebhooks.length === 0) return prev;
          const updated = [...prev, ...newWebhooks];
          localStorage.setItem('discord_webhooks', JSON.stringify(updated));
          window.dispatchEvent(new Event('discord_webhooks_updated'));
          return updated;
        });
      }
    } catch (e) {
      console.error('Failed to auto-fetch remote webhooks:', e);
    }
  };

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
      fetchAllCreatedWebhooks();
    }
    loadTemplates();

    // Check if we have a pending template that was just designed in the editor
    const triggerSave = localStorage.getItem('pending_template_save_trigger');
    if (triggerSave === 'true') {
      localStorage.removeItem('pending_template_save_trigger');
      setActiveView('templates');
      setTemplateTab('create');
    }

    // Check if we were directed from Templates panel to create a public template
    const shouldNavigatePublic = localStorage.getItem('navigate_to_create_template_public');
    if (shouldNavigatePublic === 'true') {
      localStorage.removeItem('navigate_to_create_template_public');
      setActiveView('templates');
      setTemplateTab('create');
      setNewTemplateAudience('public');
    }

    const handleTemplatesUpdated = () => {
      loadTemplates();
    };
    window.addEventListener('discord_templates_updated', handleTemplatesUpdated);

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
        loadWebhooks();
        fetchAllCreatedWebhooks();
        
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
      loadWebhookHistory();
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('webhook_count_updated', handleCountUpdate);
    
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('webhook_count_updated', handleCountUpdate);
      window.removeEventListener('discord_templates_updated', handleTemplatesUpdated);
    };
  }, []);

  const loadWebhookHistory = () => {
    try {
      const historyStr = localStorage.getItem('webhook_history');
      if (historyStr) {
        setWebhookHistory(JSON.parse(historyStr));
      }
    } catch (e) {
      console.error("Failed to load webhook history", e);
    }
  };

  useEffect(() => {
    loadWebhookHistory();
  }, []);

  useEffect(() => {
    if (serverFilter === 'all') {
      setServerWebhooks([]);
      setServerWebhooksError('');
      return;
    }
    
    // Find guild_id
    const guildId = webhooks.find(w => w.guild_name === serverFilter)?.guild_id || userGuilds.find(g => g.name === serverFilter)?.id;
    if (!guildId) return;

    const fetchServerWebhooks = async () => {
      setIsLoadingServerWebhooks(true);
      setServerWebhooksError('');
      try {
        const res = await fetch(`/api/discord/guilds/${guildId}/webhooks`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('discord_token')}` }
        });
        const data = await res.json();
        if (data.error) {
          setServerWebhooksError(data.error);
        } else if (Array.isArray(data)) {
          // data is an array of webhooks
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const fetchedWebhooks = data.map((w: any) => ({
            id: w.id,
            name: w.name,
            url: `https://discord.com/api/webhooks/${w.id}/${w.token}`,
            channel_id: w.channel_id,
            guild_id: w.guild_id,
            avatar: w.avatar,
            guild_name: serverFilter
          }));
          setServerWebhooks(fetchedWebhooks);

          // Auto-sync any discovered webhooks to the main state and localStorage
          setWebhooks(prev => {
            const existingUrls = new Set(prev.map(p => p.url));
            const newWebhooks = fetchedWebhooks.filter(fw => !existingUrls.has(fw.url));
            if (newWebhooks.length === 0) return prev;
            const updated = [...prev, ...newWebhooks];
            localStorage.setItem('discord_webhooks', JSON.stringify(updated));
            window.dispatchEvent(new Event('discord_webhooks_updated'));
            return updated;
          });
        }
      } catch {
        setServerWebhooksError('Failed to fetch remote webhooks.');
      } finally {
        setIsLoadingServerWebhooks(false);
      }
    };

    fetchServerWebhooks();
  }, [serverFilter, webhooks, userGuilds]);

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
      window.dispatchEvent(new Event('discord_webhooks_updated'));
      return updated;
    });
  };

  const handleDeleteWebhook = (id: string) => {
    playDeleteSound();
    setWebhooks(prev => {
      const updated = prev.filter(w => w.id !== id);
      localStorage.setItem('discord_webhooks', JSON.stringify(updated));
      window.dispatchEvent(new Event('discord_webhooks_updated'));
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
        window.dispatchEvent(new Event('discord_webhooks_updated'));
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
      const redirectUriParam = encodeURIComponent(`${window.location.origin}/auth/callback`);
      const response = await fetch(`/api/auth/discord/url?redirectUri=${redirectUriParam}`);
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
    setUserGuilds([]);
    setActiveView('dashboard');
    localStorage.removeItem('username');
    localStorage.removeItem('user_avatar');
    localStorage.removeItem('user_id');
    localStorage.removeItem('discord_token');
    localStorage.removeItem('discord_webhook');
    localStorage.removeItem('discord_webhooks');
    localStorage.removeItem('user_guilds');
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

  useEffect(() => {
    const handleSaveFromEditor = () => {
      if (activeView !== 'templates' || templateTab !== 'create') {
        setActiveView('templates');
        setTemplateTab('create');
      }
      
      // We need a small delay to ensure the view has switched before trying to save,
      // or we can just save it directly if we have a name.
      // If we don't have a name, we just switch to the tab so the user can enter one.
      if (newTemplateName.trim()) {
        handleSaveTemplate();
      } else {
        toast.info("Please enter a name for your template to save it.");
      }
    };

    const handleNavigatePublicCreate = () => {
      setActiveView('templates');
      setTemplateTab('create');
      setNewTemplateAudience('public');
    };

    document.addEventListener('SAVE_TEMPLATE_FROM_EDITOR', handleSaveFromEditor);
    document.addEventListener('NAVIGATE_TO_CREATE_TEMPLATE_PUBLIC', handleNavigatePublicCreate);
    return () => {
      document.removeEventListener('SAVE_TEMPLATE_FROM_EDITOR', handleSaveFromEditor);
      document.removeEventListener('NAVIGATE_TO_CREATE_TEMPLATE_PUBLIC', handleNavigatePublicCreate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newTemplateName, message, newTemplateAudience, templates, activeView, templateTab]);

  const handleSaveTemplate = async () => {
    const nameToSave = newTemplateName.trim() || localStorage.getItem('pending_template_name') || '';
    if (!nameToSave.trim()) {
      toast.error('Please enter a Template Name first!');
      document.getElementById('new-template-name-input')?.focus();
      return;
    }
    const audienceToSave = newTemplateAudience || localStorage.getItem('pending_template_audience') || 'private';
    const thumbnailToSave = newTemplateThumbnail || localStorage.getItem('pending_template_thumbnail') || '';

    let isSavedToCloud = false;

    if (audienceToSave === 'public') {
      if (db) {
        try {
          const newTemplateDoc = {
            name: nameToSave,
            description: 'Shared Template from Discord Webhook Designer',
            author: username || 'Anonymous User',
            authorId: userId || 'local-user',
            message: JSON.parse(JSON.stringify(message)), // deep copy
            isPublic: true,
            downloads: 0,
            createdAt: new Date().toISOString(),
            likes: 0,
            dislikes: 0,
            likedBy: [],
            dislikedBy: []
          };
          await addDoc(collection(db, 'templates'), newTemplateDoc);
          isSavedToCloud = true;
        } catch (err) {
          console.error("Error publishing template to cloud:", err);
          toast.error("Failed to share publicly on cloud. Saved locally.");
        }
      } else {
        toast.info("Database not connected. Saved template locally!");
      }
    }

    const newTemplate: MessageTemplate = {
      id: safeUUID(),
      name: nameToSave,
      message: JSON.parse(JSON.stringify(message)), // deep copy
      audience: audienceToSave as 'public' | 'private',
      thumbnail: thumbnailToSave || undefined,
      description: audienceToSave === 'public' ? 'Shared Template from Discord Webhook Designer' : 'My private template',
      author: username || 'Anonymous User',
      authorId: userId || 'local-user',
      createdAt: new Date().toISOString(),
      likes: 0,
      dislikes: 0,
      likedBy: [],
      dislikedBy: []
    };
    let latestTemplates: MessageTemplate[] = [];
    try {
      const stored = localStorage.getItem('discord_templates');
      if (stored) {
        latestTemplates = JSON.parse(stored);
        if (!Array.isArray(latestTemplates)) latestTemplates = [];
      }
    } catch (e) {
      console.error('Failed loading templates on save', e);
    }
    const updatedTemplates = [...latestTemplates.filter(t => t.id !== newTemplate.id), newTemplate];
    setTemplates(updatedTemplates);
    localStorage.setItem('discord_templates', JSON.stringify(updatedTemplates));
    window.dispatchEvent(new Event('discord_templates_updated'));
    
    if (isSavedToCloud) {
      toast.success(`Template "${nameToSave}" shared successfully to community!`);
    } else {
      toast.success(`Template "${nameToSave}" saved successfully!`);
    }
    window.dispatchEvent(new CustomEvent('ADD_APP_NOTIFICATION', { 
      detail: { 
        title: 'Template Created', 
        message: `Your template "${nameToSave}" was saved as a ${audienceToSave} template.`,
        type: 'success'
      } 
    }));
    
    setNewTemplateName('');
    setNewTemplateUrl('');
    setNewTemplateAudience('private');
    setNewTemplateThumbnail('');
    setTemplateTab('list');
    
    localStorage.removeItem('pending_template_name');
    localStorage.removeItem('pending_template_url');
    localStorage.removeItem('pending_template_audience');
    localStorage.removeItem('pending_template_thumbnail');
    localStorage.removeItem('pending_template_save_trigger');

    setTemplateTab('list');
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
    window.dispatchEvent(new Event('discord_templates_updated'));
    toast.success('Template deleted');
    playDeleteSound();
  };

  if (!isLoggedIn) {
    return (
      <>
        <div className="h-full flex flex-col items-center justify-center p-6 bg-transparent text-center overflow-hidden relative">
          
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-sm bg-white/5 backdrop-blur-xl p-10 rounded-3xl border border-white/5 relative z-10"
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
      </>
    );
  }

  return (
    <>
      <div className="h-full flex flex-col bg-transparent relative">
        {/* Global CSS Styles for Quantum Hologram Scanner and Shimmer animations */}
        <style>{`
          @keyframes hologramScan {
            0%, 100% { transform: translateY(-16px); opacity: 0.3; }
            50% { transform: translateY(16px); opacity: 0.95; filter: drop-shadow(0 0 4px rgba(6, 182, 212, 0.8)); }
          }
          @keyframes checkMarkDraw {
            0% { stroke-dashoffset: 24; transform: scale(0.6); opacity: 0; }
            100% { stroke-dashoffset: 0; transform: scale(1); opacity: 1; }
          }
        `}</style>
      
        {/* Header */}
      <div className="p-4 px-6 border-b border-white/5 bg-[#121212] flex flex-row items-center justify-between relative overflow-hidden shrink-0 z-10 sm:rounded-t-2xl">
        {/* Left Side: Avatar + Name */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center shadow-xl border-2 border-white/10 relative z-10 overflow-hidden">
              {userAvatar && userId ? (
                <img src={`https://cdn.discordapp.com/avatars/${userId}/${userAvatar}.png`} alt={username} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-cyan-400">{username.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-zinc-900 z-20 shadow-[0_0_8px_rgba(34,197,94,0.6)]" title="Online" />
          </div>
          <div className="flex flex-col items-start">
            <h2 className="text-lg font-bold text-white tracking-tight leading-none">{username}</h2>
            <span className="text-xs text-green-400 font-medium mt-1 flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
              Online
            </span>
          </div>
        </div>

        {/* Right Side: Sign Out Button */}
        <button 
          onClick={() => { playButtonSound(); handleLogout(); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-xl transition-all border border-red-500/20 hover:border-red-500/40 font-semibold text-sm shadow-[0_0_15px_rgba(239,68,68,0.1)]"
        >
          <LogOut className="w-4.5 h-4.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>

      <div 
        ref={scrollContainerRef}
        onMouseDown={handlePullStart}
        onMouseMove={handlePullMove}
        onMouseUp={handlePullEnd}
        onMouseLeave={handlePullEnd}
        onTouchStart={handlePullStart}
        onTouchMove={handlePullMove}
        onTouchEnd={handlePullEnd}
        className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar relative z-10"
      >
        {/* Pull-to-refresh visual indicator with charging progress ring morphing into glowing quantum portal */}
        {(isPulling || isRefreshing || showSuccess) && (
          <div 
            className="w-full flex items-center justify-center pointer-events-none transition-all duration-300 relative z-30 mb-2 overflow-visible"
            style={{ 
              height: showSuccess ? '55px' : `${pullProgress}px`, 
              marginTop: (isRefreshing || showSuccess) ? '0px' : '-8px', 
              opacity: showSuccess ? 1 : Math.min(pullProgress / 40, 1),
              transition: isPulling ? 'none' : 'all 300ms cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {showSuccess ? (
              <div className="flex items-center justify-center bg-[#18191c] border border-sky-500/40 w-12 h-12 rounded-full shadow-[0_0_20px_rgba(14,165,233,0.4)] text-sky-450">
                <svg 
                  viewBox="0 0 24 24" 
                  className="w-6 h-6 stroke-[3.5] fill-none stroke-linecap-round stroke-linejoin-round animate-in zoom-in duration-300 text-sky-400"
                >
                  <path d="M20 6L9 17l-5-5" style={{ strokeDasharray: 24, strokeDashoffset: 0 }} />
                </svg>
              </div>
            ) : isRefreshing ? (
              /* SPECTACULAR DOUBLE ORBITAL ROTATING GLOWING BLUE PORTAL/QUANTUM GATE ANIMATION */
              <div className="relative w-12 h-12 flex items-center justify-center scale-110 drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]">
                {/* Outer fast spinning ring (Cobalt Blue) */}
                <div className="absolute inset-0 rounded-full border-2 border-t-blue-500 border-r-sky-400 border-b-transparent border-l-transparent animate-spin duration-1000" />
                
                {/* Inner counter-rotating slower ring (Royal / Electric Blue) */}
                <div className="absolute inset-1.5 rounded-full border-2 border-t-transparent border-r-transparent border-b-blue-600 border-l-cyan-300 animate-spin duration-800 reversed-spin" style={{ animationDirection: 'reverse' }} />
                
                {/* Floating pulsate space */}
                <div className="absolute w-5 h-5 rounded-full bg-blue-500/20 animate-ping" />
                <div className="absolute w-7 h-7 rounded-full bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-400 opacity-40 animate-pulse blur-[3px]" />
                
                {/* Glowing neon blue nucleus core */}
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-sky-400 flex items-center justify-center shadow-[0_0_12px_#3b82f6] animate-pulse">
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                </div>

                {/* Sparkling cyan/azure portal dust floating */}
                <span className="absolute top-0.5 left-2 w-1 h-1 rounded-full bg-cyan-300 animate-ping delay-75" />
                <span className="absolute bottom-1 right-2 w-1 h-1 rounded-full bg-blue-300 animate-ping delay-200" />
              </div>
            ) : (
              /* PREMIUM NORMAL CIRCLE PROGRESS LOADING SPIN-RING (BLUE) during pulling action */
              <div className="relative w-11 h-11 flex items-center justify-center bg-[#151618] rounded-full border border-zinc-800 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                <svg className="w-8 h-8 transform -rotate-90">
                  <circle
                    cx="16"
                    cy="16"
                    r="12"
                    className="stroke-[#202225] stroke-[3] fill-none"
                  />
                  <circle
                    cx="16"
                    cy="16"
                    r="12"
                    className="stroke-blue-500 stroke-[3] fill-none transition-all duration-75 text-blue-500"
                    style={{
                      strokeDasharray: 75.4,
                      strokeDashoffset: 75.4 - (75.4 * Math.min(pullProgress / 65, 1))
                    }}
                  />
                </svg>
                {/* Tiny high-contrast centered index dot turning deep color as progress fully builds */}
                <div className="absolute w-2.5 h-2.5 rounded-full bg-blue-500 transition-all duration-150" style={{ transform: `scale(${0.35 + (Math.min(pullProgress / 65, 1) * 0.75)})` }} />
              </div>
            )}
          </div>
        )}
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Manage Webhooks Card */}
                <button 
                  onClick={() => { playButtonSound(); setActiveView('manage_webhooks'); }}
                  className="flex flex-col items-start p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-cyan-500/50 transition-all group hover:shadow-[0_8px_32px_rgba(6,182,212,0.2)] hover:-translate-y-1 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition-colors relative z-10">
                    <Hash className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2 relative z-10">Manage Webhooks</h4>
                  <p className="text-sm text-zinc-400 text-left mb-6 relative z-10">View, edit, and manage all your connected Discord webhooks.</p>
                  <div className="mt-auto flex items-center text-cyan-400 text-sm font-bold group-hover:translate-x-1 transition-transform relative z-10">
                    View Webhooks <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </button>

                {/* Create Webhook Card */}
                <button 
                  onClick={() => { playButtonSound(); setActiveView('create_webhook'); }}
                  className="flex flex-col items-start p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-[#5865F2]/50 transition-all group hover:shadow-[0_8px_32px_rgba(88,101,242,0.2)] hover:-translate-y-1 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-12 h-12 bg-[#5865F2]/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#5865F2]/20 transition-colors relative z-10">
                    <Plus className="w-6 h-6 text-[#5865F2]" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2 relative z-10">Create Webhook</h4>
                  <p className="text-sm text-zinc-400 text-left mb-6 relative z-10">Add a new webhook manually or connect via Discord OAuth.</p>
                  <div className="mt-auto flex items-center text-[#5865F2] text-sm font-bold group-hover:translate-x-1 transition-transform relative z-10">
                    Add New <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </button>

                {/* Create Template Card */}
                <button 
                  onClick={() => { playButtonSound(); setActiveView('templates'); }}
                  className="flex flex-col items-start p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-purple-500/50 transition-all group hover:shadow-[0_8px_32px_rgba(168,85,247,0.2)] hover:-translate-y-1 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors relative z-10">
                    <Copy className="w-6 h-6 text-purple-400" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2 relative z-10">Templates</h4>
                  <p className="text-sm text-zinc-400 text-left mb-6 relative z-10">Save and load your message designs as reusable templates.</p>
                  <div className="mt-auto flex items-center text-purple-400 text-sm font-bold group-hover:translate-x-1 transition-transform relative z-10">
                    Manage Templates <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </button>

                {/* My Feedback Card */}
                <button 
                  onClick={() => { playButtonSound(); loadMyFeedback(); setActiveView('feedback'); }}
                  className="flex flex-col items-start p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-rose-500/50 transition-all group hover:shadow-[0_8px_32px_rgba(244,63,94,0.2)] hover:-translate-y-1 relative overflow-hidden text-left"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-rose-500/20 transition-colors relative z-10">
                    <MessageSquare className="w-6 h-6 text-rose-400" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2 relative z-10">My Feedback</h4>
                  <p className="text-sm text-zinc-400 mb-6 relative z-10">View, edit, and delete comments or replies you've made.</p>
                  <div className="mt-auto flex items-center text-rose-400 text-sm font-bold group-hover:translate-x-1 transition-transform relative z-10">
                    Manage Feedback <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </button>
              </div>

              {/* Stats Card */}
              <div className="p-5 sm:p-6 bg-white/5 rounded-2xl border border-white/10 mt-4 shadow-[0_8px_32px_rgba(0,0,0,0.2)] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-5" />
                <h4 className="text-xs sm:text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4 sm:mb-6 relative z-10">Overview</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-4 relative z-10 divide-y-0 sm:divide-x divide-white/10">
                  <div className="text-center py-2 sm:py-0">
                    <div className="text-3xl sm:text-4xl font-black text-white mb-2 drop-shadow-lg">{webhooks.length}</div>
                    <div className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Total Webhooks</div>
                  </div>
                  <div className="text-center py-2 sm:py-0 sm:px-4">
                    <div className="text-3xl sm:text-4xl font-black text-cyan-400 mb-2 drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                      {Object.values(messageCounts).reduce((a, b) => a + b, 0)}
                    </div>
                    <div className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Messages Sent</div>
                  </div>
                  <div className="text-center py-2 sm:py-0">
                    <div className="text-3xl sm:text-4xl font-black text-purple-400 mb-2 drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]">{templates.length}</div>
                    <div className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Templates</div>
                  </div>
                  <div className="text-center py-2 sm:py-0">
                    <div className="text-3xl sm:text-4xl font-black text-rose-400 mb-2 drop-shadow-[0_0_15px_rgba(244,63,94,0.35)]">{myFeedbackList.length}</div>
                    <div className="text-xs text-zinc-400 font-bold uppercase tracking-widest">My Feedback</div>
                  </div>
                </div>
              </div>

              {/* Webhook History Card */}
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10 mt-4 shadow-[0_8px_32px_rgba(0,0,0,0.2)] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Recent Activity</h4>
                  <button 
                    onClick={() => {
                      localStorage.removeItem('webhook_history');
                      setWebhookHistory([]);
                      toast.success('History cleared');
                    }}
                    className="text-xs text-zinc-400 hover:text-white transition-colors font-medium bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/20"
                  >
                    Clear History
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10">
                  {webhookHistory.length === 0 ? (
                    <div className="text-center py-8 bg-white/5 rounded-xl border border-white/5 col-span-full">
                      <p className="text-sm text-zinc-400 font-medium">No recent webhook activity.</p>
                    </div>
                  ) : (
                    webhookHistory.slice(0, 5).map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors rounded-xl border border-white/5 hover:border-white/10 group">
                        <div className="flex items-center gap-4">
                          <div className={`w-2.5 h-2.5 rounded-full shadow-lg ${item.status === 'success' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`} />
                          <div>
                            <p className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">{item.name}</p>
                            <p className="text-xs text-zinc-400 font-medium mt-0.5">{new Date(item.time).toLocaleString()}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${item.status === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                          {item.status === 'success' ? 'Sent' : 'Failed'}
                        </span>
                      </div>
                    ))
                  )}
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
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between mb-6">
                <button 
                  onClick={() => { playButtonSound(); setActiveView('dashboard'); }}
                  className="flex items-center text-sm font-bold text-zinc-400 hover:text-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4 mr-1 rotate-180" /> 
                  <span className="sm:inline hidden">Back to Dashboard</span>
                  <span className="inline sm:hidden">Back</span>
                </button>
                <div className="flex items-center gap-3">
                  <h3 className="text-xs sm:text-sm font-bold text-cyan-400 uppercase tracking-widest bg-cyan-950/40 border border-cyan-800/20 px-2.5 sm:px-3 py-1.5 rounded-xl">
                    <span className="sm:inline hidden">Your Webhooks Dashboard</span>
                    <span className="inline sm:hidden">Webhooks</span>
                  </h3>
                </div>
              </div>

              {/* SCNX-Style Server Folder/Directory layout wrapping both Servers and Webhooks */}
              <div className="flex flex-col lg:flex-row gap-6 items-start">
                
                {/* Left Column: Servers Folders Directory */}
                <div className="w-full lg:w-64 bg-zinc-950/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 space-y-4 shrink-0 lg:sticky lg:top-4">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                      <Server className="w-4 h-4 text-cyan-400" /> Server Folders
                    </span>
                    <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2.5 py-0.5 rounded-full font-bold font-mono">
                      {(() => {
                        const serverMap = new Map<string, { id?: string; name: string; icon?: string }>();
                        userGuilds.forEach(g => serverMap.set(g.name, g));
                        webhooks.forEach(w => {
                          if (w.guild_name && !serverMap.has(w.guild_name)) {
                            serverMap.set(w.guild_name, { name: w.guild_name, id: w.guild_id });
                          }
                        });
                        return serverMap.size;
                      })()}
                    </span>
                  </div>

                  {/* Servers List Panel */}
                  <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto max-h-[220px] lg:max-h-[500px] pb-2 lg:pb-0 no-scrollbar scroll-smooth">
                    {/* All Servers Option */}
                    <button
                      onClick={() => { playButtonSound(); setServerFilter('all'); }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer text-left shrink-0 lg:shrink-0 lg:w-full border text-xs font-bold ${
                        serverFilter === 'all'
                          ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                          : "bg-zinc-900/40 border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-400 font-bold shrink-0">
                        <Globe className="w-4 h-4" />
                      </div>
                      <span className="truncate">All Servers</span>
                    </button>

                    {/* Server list items mapped from actual Discord servers */}
                    {(() => {
                      const serverMap = new Map<string, { id?: string; name: string; icon?: string }>();
                      userGuilds.forEach(g => {
                        if (g && g.name) serverMap.set(g.name, g);
                      });
                      webhooks.forEach(w => {
                        if (w.guild_name && !serverMap.has(w.guild_name)) {
                          serverMap.set(w.guild_name, { name: w.guild_name, id: w.guild_id });
                        }
                      });
                      const allServers = Array.from(serverMap.values());

                      if (allServers.length === 0) {
                        return (
                          <div className="text-[11px] text-zinc-500 py-4 text-center w-full">
                            Please connect your Discord to import servers.
                          </div>
                        );
                      }

                      return allServers.map((server) => {
                        const count = webhooks.filter(w => w.guild_name === server.name).length;
                        const isSelected = serverFilter === server.name;

                        return (
                          <button
                            key={server.name}
                            onClick={() => { playButtonSound(); setServerFilter(server.name); }}
                            className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer text-left shrink-0 lg:shrink-0 lg:w-full border select-none ${
                              isSelected
                                ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 font-bold"
                                : "bg-zinc-900/40 border-transparent text-zinc-400 hover:text-white hover:bg-white/5"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {server.id && server.icon ? (
                                <img
                                  src={`https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png`}
                                  alt={server.name}
                                  className={`w-8 h-8 rounded-full border shrink-0 object-cover ${
                                    isSelected ? "border-cyan-400/50" : "border-zinc-800"
                                  }`}
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                    if (fallback) fallback.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div 
                                style={{ display: (server.id && server.icon) ? 'none' : 'flex' }}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] shrink-0 border uppercase font-mono font-black ${
                                  isSelected
                                    ? "bg-cyan-500/20 border-cyan-400 text-cyan-400"
                                    : "bg-zinc-800 border-zinc-700 text-zinc-400"
                                }`}
                              >
                                {server.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                              </div>
                              <span className="text-xs truncate max-w-[110px] lg:max-w-[140px]">
                                {server.name}
                              </span>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                              isSelected ? "bg-cyan-400/20 text-cyan-300" : "bg-zinc-800 text-zinc-500"
                            }`}>
                              {count}
                            </span>
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Right Column: Webhooks list & actions */}
                <div className="flex-1 w-full space-y-4">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input 
                      type="text" 
                      placeholder={`Search webhooks in ${serverFilter === 'all' ? 'all servers' : serverFilter}...`} 
                      className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      onChange={(e) => {
                        const val = e.target.value.toLowerCase();
                        const cards = document.querySelectorAll('.webhook-card-item');
                        cards.forEach(card => {
                          const name = card.getAttribute('data-name')?.toLowerCase() || '';
                          const guild = card.getAttribute('data-guild')?.toLowerCase() || '';
                          if (name.includes(val) || guild.includes(val)) {
                            (card as HTMLElement).style.display = 'flex';
                          } else {
                            (card as HTMLElement).style.display = 'none';
                          }
                        });
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {serverWebhooksError && serverFilter !== 'all' && (
                      <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-sm text-red-100 col-span-full">
                        {serverWebhooksError}
                      </div>
                    )}
                    {isLoadingServerWebhooks && (
                      <div className="text-center text-sm text-zinc-500 py-6 col-span-full">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-400" />
                        Loading server webhooks in background...
                      </div>
                    )}
                    {(() => {
                      const displayWebhooks = [...webhooks.filter(w => serverFilter === 'all' || w.guild_name === serverFilter), ...serverWebhooks.filter(sw => !webhooks.some(w => w.id === sw.id))];

                      if (displayWebhooks.length === 0) {
                        return (
                          <div className="text-center py-12 px-4 bg-[#121212]/50 rounded-xl border border-dashed border-zinc-700 col-span-full">
                            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Hash className="w-8 h-8 text-zinc-500" />
                            </div>
                            <h4 className="text-base font-bold text-white mb-2">No Webhooks Found</h4>
                            <p className="text-sm text-zinc-400 mb-6 font-medium">
                              {serverFilter === 'all' 
                                ? "You haven't added any webhooks yet." 
                                : `No webhooks are configured for ${serverFilter} in the database yet.`}
                            </p>
                            <button 
                              onClick={() => { playButtonSound(); setActiveView('create_webhook'); }}
                              className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg text-sm font-bold transition-colors inline-flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer"
                            >
                              <Plus className="w-4 h-4" /> Create Webhook
                            </button>
                          </div>
                        );
                      }

                      return displayWebhooks.map(webhook => (
                        <div key={webhook.id} data-name={webhook.name} data-guild={webhook.guild_name} className="webhook-card-item flex flex-col p-4 bg-[#121212]/80 backdrop-blur-md rounded-xl border border-white/5 hover:border-cyan-500/30 transition-colors group justify-between h-auto gap-4">
                          <div className="flex items-start gap-3">
                            {webhook.avatar ? (
                              <img src={webhook.avatar.startsWith('http') ? webhook.avatar : `https://cdn.discordapp.com/avatars/${webhook.id}/${webhook.avatar}.png`} alt={webhook.name} className="w-12 h-12 rounded-full border border-zinc-700 shrink-0" />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 shrink-0">
                                <Hash className="w-6 h-6 text-zinc-500" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="text-base font-bold text-white mb-0.5 truncate">{webhook.name || 'Unnamed Webhook'}</div>
                              <div className="flex flex-col gap-1">
                                <div className="text-xs text-zinc-400 flex items-center gap-1.5 bg-zinc-800/50 w-fit px-2 py-0.5 rounded truncate max-w-full">
                                  <Server className="w-3 h-3 text-indigo-400 shrink-0" /> <span className="truncate">{webhook.guild_name || 'Unknown Server'}</span>
                                </div>
                                <div className="text-[10px] text-zinc-500 flex items-center gap-1 font-mono">
                                  <Hash className="w-3 h-3" /> {webhook.channel_id}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex justify-start sm:justify-end items-center gap-1 sm:gap-1.5 border-t border-white/5 pt-2 md:pt-0 md:border-t-0 md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity flex-wrap">
                            <button 
                              onClick={() => {
                                if (onSelectWebhook) {
                                  onSelectWebhook(webhook.url, webhook.name || 'Unnamed');
                                  playButtonSound();
                                }
                              }} 
                              className="px-2.5 py-1.5 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-colors flex items-center gap-1 cursor-pointer" 
                              title="Use Webhook"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-bold md:hidden">Use</span>
                            </button>
                            <button 
                              onClick={() => openSettings(webhook)} 
                              className="px-2.5 py-1.5 text-zinc-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-colors flex items-center gap-1 cursor-pointer" 
                              title="Edit Webhook"
                            >
                              <Settings className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-bold md:hidden">Edit</span>
                            </button>
                            <button 
                              onClick={() => handleCopyUrl(webhook.url)} 
                              className="px-2.5 py-1.5 text-zinc-400 hover:text-green-400 hover:bg-green-400/10 rounded-lg transition-colors flex items-center gap-1 cursor-pointer" 
                              title="Copy Webhook URL"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-bold md:hidden">Copy</span>
                            </button>
                            <button 
                              onClick={() => handleDeleteWebhook(webhook.id)} 
                              className="px-2.5 py-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors flex items-center gap-1 cursor-pointer" 
                              title="Delete Webhook"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-bold md:hidden">Delete</span>
                            </button>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
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
              {isBotConnected ? (
                <div className="p-6 bg-[#121212]/80 backdrop-blur-md rounded-2xl border border-cyan-500/30 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-bold text-white flex items-center gap-2 font-sans">
                      <span className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800"><Settings className="w-5 h-5 text-cyan-400" /></span>
                      Manual SP
                    </h4>
                    <span className="px-2 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold uppercase tracking-wider font-mono">
                      Bot Active
                    </span>
                  </div>

                  <p className="text-sm text-zinc-400">Configure your webhook details below. Generates automatically using the online companion bot.</p>

                  {/* Webhook Name */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Webhook Name *</label>
                    <input 
                      type="text" 
                      value={newWebhookName}
                      onChange={(e) => setNewWebhookName(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="e.g. Announcements Server"
                    />
                  </div>

                  {/* Avatar upload / url paste */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Webhook Avatar</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Device Upload */}
                      <div className="p-4 bg-[#0a0a0a] border border-zinc-800 rounded-xl flex flex-col items-center justify-center relative cursor-pointer hover:border-zinc-700 transition-colors group">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleAvatarFileSelect}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        />
                        <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-2 overflow-hidden shadow-inner shrink-0 group-hover:scale-105 transition-transform relative z-0">
                          {newWebhookAvatar ? (
                            <img src={newWebhookAvatar} alt="avatar preview" className="w-full h-full object-cover" />
                          ) : (
                            <Upload className="w-5 h-5 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
                          )}
                        </div>
                        <span className="text-xs font-bold text-zinc-300 group-hover:text-white transition-colors">Upload Avatar Image</span>
                        <span className="text-[10px] text-zinc-500 mt-1">Select PNG/JPG image file</span>
                      </div>

                      {/* Image URL Paste */}
                      <div className="p-4 bg-[#0a0a0a] border border-zinc-800 rounded-xl flex flex-col justify-between space-y-3">
                        <div>
                          <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                            <LinkIcon className="w-3.5 h-3.5 text-zinc-500" /> Paste Image URL
                          </span>
                          <p className="text-[10px] text-zinc-500 mt-1">Paste any direct image web link to crop & zoom it</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <input 
                            type="text" 
                            placeholder="https://example.com/avatar.png"
                            id="avatar-paste-url-input"
                            className="w-full bg-[#050505] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              playButtonSound();
                              const inputEle = document.getElementById('avatar-paste-url-input') as HTMLInputElement;
                              const url = inputEle?.value?.trim();
                              if (url) {
                                setOriginalImageSrc(url);
                                setCropModalOpen(true);
                              } else {
                                toast.error("Please paste an image URL first");
                              }
                            }}
                            className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-350 hover:text-white font-bold text-xs rounded-lg border border-zinc-700 transition-all cursor-pointer text-center"
                          >
                            Crop Image [URL]
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {/* Server Selection Dropdown */}
                    <div className="relative">
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Select Server *</label>
                      <button
                        type="button"
                        onClick={() => { playButtonSound(); setShowBotServerDropdown(!showBotServerDropdown); setShowBotChannelDropdown(false); }}
                        className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white flex items-center justify-between hover:border-zinc-700 transition-colors"
                      >
                        {selectedBotGuild ? (
                          <span className="flex items-center gap-2 font-bold text-cyan-400">
                            {selectedBotGuild.icon ? (
                              <img src={selectedBotGuild.icon} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                            ) : (
                              <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-800 text-[10px] text-cyan-400 flex items-center justify-center font-mono uppercase shrink-0">
                                {selectedBotGuild.name.split(' ').map((word) => word[0] || '').join('').slice(0, 2)}
                              </span>
                            )}
                            <span className="truncate max-w-[150px]">{selectedBotGuild.name}</span>
                          </span>
                        ) : (
                          <span className="text-zinc-500 font-bold">-- Choose Server --</span>
                        )}
                        <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform shrink-0 ${showBotServerDropdown ? 'rotate-90' : ''}`} />
                      </button>

                      {showBotServerDropdown && (
                        <>
                          <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowBotServerDropdown(false)} />
                          <div className="absolute left-0 right-0 mt-1.5 max-h-60 overflow-y-auto bg-[#0d0d0d] border border-zinc-800 rounded-xl shadow-2xl z-50 divide-y divide-zinc-900 custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-100">
                            {botGuilds.length === 0 ? (
                              <div className="p-4 text-center text-xs font-medium text-zinc-500 animate-pulse">
                                Loading servers... (Verify your bot invite is complete)
                              </div>
                            ) : (
                              botGuilds.map((guild) => (
                                <button
                                  key={guild.id}
                                  type="button"
                                  onClick={() => {
                                    playButtonSound();
                                    setSelectedBotGuild(guild);
                                    setSelectedBotChannel(null); // Reset selected channel
                                    setShowBotServerDropdown(false);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-cyan-500/10 text-left transition-colors text-xs font-bold text-zinc-350 hover:text-cyan-400 cursor-pointer"
                                >
                                  {guild.icon ? (
                                    <img src={guild.icon} alt="" className="w-6 h-6 rounded-full object-cover border border-zinc-800 shrink-0" />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-400 flex items-center justify-center font-mono uppercase shrink-0">
                                      {guild.name.split(' ').map((word) => word[0] || '').join('').slice(0, 2)}
                                    </div>
                                  )}
                                  <span className="truncate flex-1">{guild.name}</span>
                                </button>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Channel Selection Dropdown */}
                    <div className="relative">
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Targeted Channel *</label>
                      <button
                        type="button"
                        disabled={!selectedBotGuild}
                        onClick={() => { playButtonSound(); setShowBotChannelDropdown(!showBotChannelDropdown); setShowBotServerDropdown(false); }}
                        className={`w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white flex items-center justify-between hover:border-zinc-750 transition-colors ${!selectedBotGuild ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        {selectedBotChannel ? (
                          <span className="flex items-center gap-1.5 font-bold text-purple-400">
                            <Hash className="w-4 h-4 text-purple-500 shrink-0" />
                            <span className="truncate max-w-[150px]">{selectedBotChannel.name}</span>
                          </span>
                        ) : (
                          <span className="text-zinc-500 font-bold">
                            {selectedBotGuild ? '-- Select Channel --' : 'Select server first'}
                          </span>
                        )}
                        <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform shrink-0 ${showBotChannelDropdown ? 'rotate-90' : ''}`} />
                      </button>

                      {showBotChannelDropdown && selectedBotGuild && (
                        <>
                          <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowBotChannelDropdown(false)} />
                          <div className="absolute left-0 right-0 mt-1.5 max-h-60 overflow-y-auto bg-[#0d0d0d] border border-zinc-800 rounded-xl shadow-2xl z-50 divide-y divide-zinc-900 custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-100">
                            {(!selectedBotGuild.channels || selectedBotGuild.channels.length === 0) ? (
                              <div className="p-4 text-center text-xs font-medium text-zinc-500">
                                No text channels found.
                              </div>
                            ) : (
                              selectedBotGuild.channels.map((channel) => (
                                <button
                                  key={channel.id}
                                  type="button"
                                  onClick={() => {
                                    playButtonSound();
                                    setSelectedBotChannel(channel);
                                    setShowBotChannelDropdown(false);
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-3 hover:bg-purple-500/10 text-left transition-colors text-xs font-bold text-zinc-350 hover:text-purple-400 cursor-pointer"
                                >
                                  <Hash className="w-4 h-4 text-zinc-500 shrink-0" />
                                  <span className="truncate flex-1">{channel.name}</span>
                                </button>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={handleBotWebhookCreate}
                    disabled={isCreatingWebhookWithBot || !newWebhookName || !selectedBotGuild || !selectedBotChannel}
                    className="w-full py-3.5 mt-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]"
                  >
                    {isCreatingWebhookWithBot ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating Webhook...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" /> Create & Sync Custom Webhook
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="p-6 bg-[#121212]/80 backdrop-blur-md rounded-2xl border border-white/5 space-y-4">
                  <h4 className="text-lg font-bold text-white mb-2 flex items-center gap-2 font-sans">
                    <span className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800"><Settings className="w-5 h-5 text-yellow-500 animate-pulse" /></span>
                    Manual 1-Click Webhook Creator
                  </h4>
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-xs text-zinc-300 leading-relaxed space-y-3 font-sans">
                    <p className="font-semibold text-yellow-400">DWM Companion Bot Not Connected / Offline</p>
                    <p>
                      The advanced manual 1-Click Webhook Creator, containing customized Webhook Avatar Uploading, Zooming/Cropping, and Server/Channel selector dropdowns, is unlocked when the <strong>DWM Companion Bot</strong> is connected and online on your server!
                    </p>
                    <p>
                      The bot runs under the hood as a proxy agent creating, renaming, and custom avatar-aligning webhooks natively to bypass manually fetching URL secrets from Discord's client.
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <a 
                      href={botId ? `https://discord.com/oauth2/authorize?client_id=${botId}&permissions=8&scope=bot%20applications.commands` : `https://discord.com/oauth2/authorize?client_id=1130089851759083520&permissions=8&scope=bot%20applications.commands`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => playButtonSound()}
                      className="flex-1 py-3 text-center bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(202,138,4,0.2)]"
                    >
                      Add DWM Companion Bot
                    </a>
                    <button 
                      onClick={() => { playButtonSound(); setActiveView('dashboard'); }}
                      className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold rounded-xl transition-colors"
                    >
                      Back to Dashboard
                    </button>
                  </div>

                  <div className="pt-4 border-t border-zinc-800">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 font-mono">Fallback Passive Webhook Entry</p>
                    <p className="text-xs text-zinc-400 mb-4">Alternatively, if you already copied a Webhook URL manually from your Discord Server, you can register it here instantly:</p>
                    <div className="space-y-4">
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
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Name *</label>
                          <input 
                            type="text" 
                            value={newWebhookName}
                            onChange={(e) => setNewWebhookName(e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                            placeholder="My Custom Webhook"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Server Name</label>
                          <input 
                            type="text" 
                            value={newWebhookGuild}
                            onChange={(e) => setNewWebhookGuild(e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                            placeholder="My Server"
                          />
                        </div>
                      </div>

                      <button 
                        onClick={handleManualWebhookCreate}
                        disabled={!newWebhookUrl || !newWebhookName}
                        className="w-full py-3 bg-zinc-850 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 border border-zinc-700 hover:text-white"
                      >
                        <Save className="w-4 h-4" /> Save Passive Entry Webhook
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
                  className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${templateTab === 'list' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                >
                  My Saved
                </button>
                <button
                  onClick={() => { playButtonSound(); setTemplateTab('create'); }}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${templateTab === 'create' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                >
                  Create
                </button>
                <button
                  onClick={() => { playButtonSound(); setTemplateTab('community'); }}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${templateTab === 'community' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                >
                  Community
                </button>
              </div>

              {templateTab === 'list' && (
                <div className="space-y-4">
                  <div className="relative mb-4">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input 
                      type="text" 
                      placeholder="Search templates..." 
                      className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                      onChange={(e) => {
                        // We will just filter inline for simplicity
                        const val = e.target.value.toLowerCase();
                        const cards = document.querySelectorAll('.template-card-item');
                        cards.forEach(card => {
                          const name = card.getAttribute('data-name')?.toLowerCase() || '';
                          if (name.includes(val)) {
                            (card as HTMLElement).style.display = 'flex';
                          } else {
                            (card as HTMLElement).style.display = 'none';
                          }
                        });
                      }}
                    />
                  </div>
                  {templates.length === 0 ? (
                    <div className="text-center py-12 bg-[#121212]/50 rounded-2xl border border-white/5 border-dashed">
                      <Copy className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-white mb-2">No Templates Yet</h3>
                      <p className="text-sm text-zinc-400 mb-6 max-w-xs mx-auto">Create a template to save your message designs for quick reuse.</p>
                      <button 
                        onClick={() => { playButtonSound(); setTemplateTab('create'); }}
                        className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]"
                      >
                        Create Your First Template
                      </button>
                    </div>
                  ) : (
                    templates.map((template) => (
                      <div key={template.id} data-name={template.name} className="template-card-item p-4 bg-purple-950/10 backdrop-blur-md rounded-2xl border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-purple-500/45 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center overflow-hidden shrink-0">
                            {template.thumbnail ? (
                              <SafeTemplateImage src={template.thumbnail} alt="" className="w-full h-full object-cover" size="small" />
                            ) : (
                              <Copy className="w-5 h-5 text-purple-400" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-white flex items-center gap-2">
                              {template.name}
                              {template.audience === 'public' && <Globe className="w-3 h-3 text-purple-400" />}
                            </h4>
                            <p className="text-xs text-zinc-400">{template.message.embeds?.length || 0} Embeds • {template.message.content ? 'Has Content' : 'No Content'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap sm:flex-nowrap">
                          <button 
                            onClick={() => setPreviewTemplate(template)}
                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-lg transition-all"
                          >
                            Preview
                          </button>
                          <button 
                            onClick={() => handleLoadTemplate(template)}
                            className="px-4 py-2 bg-purple-500/10 hover:bg-purple-600 text-purple-400 hover:text-white text-sm font-bold rounded-lg transition-all"
                          >
                            Load
                          </button>
                          <button 
                            onClick={() => setEditingTemplate(template)}
                            className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                            title="Edit Template"
                          >
                            <Settings className="w-4 h-4" />
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

              {templateTab === 'community' && (
                <div className="space-y-4">
                  <div className="relative mb-4">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input 
                      type="text" 
                      placeholder="Search community templates..." 
                      className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                      onChange={(e) => {
                        const val = e.target.value.toLowerCase();
                        const cards = document.querySelectorAll('.community-card-item');
                        cards.forEach(card => {
                          const name = card.getAttribute('data-name')?.toLowerCase() || '';
                          if (name.includes(val)) {
                            (card as HTMLElement).style.display = 'flex';
                          } else {
                            (card as HTMLElement).style.display = 'none';
                          }
                        });
                      }}
                    />
                  </div>
                  
                  {/* For now, just show public templates from local storage as community templates */}
                  {templates.filter(t => t.audience === 'public').length === 0 ? (
                    <div className="text-center py-12 bg-[#121212]/50 rounded-2xl border border-white/5 border-dashed">
                      <Globe className="w-12 h-12 text-zinc-650 mx-auto mb-4 text-purple-400" />
                      <h3 className="text-lg font-bold text-white mb-2">No Community Templates</h3>
                      <p className="text-sm text-zinc-400 mb-6 max-w-xs mx-auto">Be the first to share a template with the community!</p>
                      <button 
                        onClick={() => { playButtonSound(); setTemplateTab('create'); setNewTemplateAudience('public'); }}
                        className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]"
                      >
                        Share a Template
                      </button>
                    </div>
                  ) : (
                    templates.filter(t => t.audience === 'public').map((template) => (
                      <div key={template.id} data-name={template.name} className="community-card-item p-4 bg-purple-950/10 backdrop-blur-md rounded-2xl border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-purple-500/45 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center overflow-hidden shrink-0 border border-purple-500/20">
                            {template.thumbnail ? (
                              <SafeTemplateImage src={template.thumbnail} alt="" className="w-full h-full object-cover" size="small" />
                            ) : (
                              <Globe className="w-6 h-6 text-purple-400" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-base">{template.name}</h4>
                            <p className="text-xs text-zinc-400 mt-0.5">
                              {template.message.embeds?.length || 0} Embeds • {template.message.content ? 'Has Content' : 'No Content'}
                            </p>
                            <p className="text-[10px] text-purple-400 mt-1 font-medium">
                              {Math.floor(Math.random() * 1000)} Downloads
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap sm:flex-nowrap">
                          <button 
                            onClick={() => {
                              setPreviewTemplate(template);
                            }}
                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-lg transition-all"
                          >
                            Preview
                          </button>
                          <button 
                            onClick={() => handleLoadTemplate(template)}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {templateTab === 'create' && (
                <div className="p-8 bg-[#121212]/80 backdrop-blur-md rounded-2xl border border-white/5 text-center space-y-6">
                  <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto">
                    <Save className="w-8 h-8 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2 font-mono">Unified Creator Active</h3>
                    <p className="text-sm text-zinc-400 max-w-sm mx-auto">
                      Our premium, mobile-optimized template creation engine loads Discord URLs, synchronizes editor messages in real-time, and handles granular audience controls.
                    </p>
                  </div>
                  <button
                    onClick={() => { playButtonSound(); window.dispatchEvent(new Event('OPEN_TEMPLATE_CREATOR')); }}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-440 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.35)] hover:scale-105 active:scale-95"
                  >
                    Launch Upgraded Creator
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {activeView === 'feedback' && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Top Navigation Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { playButtonSound(); setActiveView('dashboard'); }}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-zinc-400 hover:text-white transition-all active:scale-95 cursor-pointer flex items-center justify-center"
                    title="Back to Dashboard"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2 font-sans">
                      <MessageSquare className="w-5 h-5 text-rose-400" />
                      My Feedback
                    </h3>
                    <p className="text-xs text-zinc-400">View, edit, and moderate comments and replies across templates</p>
                  </div>
                </div>

                {/* Filter and Actions panel */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { playButtonSound(); loadMyFeedback(); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                      isLoadingFeedback
                        ? 'bg-zinc-800/80 text-zinc-400 border-zinc-850'
                        : 'bg-zinc-900 border-zinc-800 hover:bg-[#1f2024] hover:text-white text-zinc-300'
                    }`}
                  >
                    <Loader2 className={`w-3.5 h-3.5 ${isLoadingFeedback ? 'animate-spin' : ''}`} />
                    Sync
                  </button>
                </div>
              </div>

              {/* Loader Skeleton Container */}
              {isLoadingFeedback ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((skeletonIdx) => (
                    <div key={skeletonIdx} className="p-5 bg-white/5 rounded-2xl border border-white/5 animate-pulse space-y-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-zinc-805" />
                        <div className="space-y-1.5 flex-1">
                          <div className="w-1/4 h-3.5 bg-zinc-800 rounded" />
                          <div className="w-1/6 h-2 bg-zinc-800/60 rounded" />
                        </div>
                      </div>
                      <div className="w-3/4 h-3.5 bg-zinc-800/80 rounded" />
                      <div className="w-1/2 h-3 bg-zinc-800/40 rounded" />
                      <div className="flex gap-2 pt-2">
                        <div className="w-16 h-7 bg-zinc-800 rounded-lg" />
                        <div className="w-16 h-7 bg-zinc-800 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : myFeedbackList.length === 0 ? (
                /* Empty feedback view placeholder */
                <div className="p-12 text-center bg-[#121212]/50 rounded-2xl border border-white/5 max-w-lg mx-auto space-y-4">
                  <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto text-rose-400">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white mb-1">No feedback activity found</h4>
                    <p className="text-xs text-zinc-400 max-w-sm mx-auto font-sans leading-relaxed">
                      Any comments or replies you write under community templates will show up here, enabling fast edits or deletion.
                    </p>
                  </div>
                  <button
                    onClick={() => { playButtonSound(); setActiveView('templates'); }}
                    className="px-5 py-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-bold rounded-lg border border-rose-500/20 hover:border-rose-500/35 transition-all cursor-pointer"
                  >
                    Explore Templates
                  </button>
                </div>
              ) : (
                /* Activity Feedback Thread Items list */
                <div className="space-y-4">
                  {myFeedbackList.map((item) => (
                    <div 
                      key={item.id} 
                      className="p-5 bg-white/5 rounded-2xl border border-white/10 hover:border-zinc-700/80 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.15)] relative overflow-hidden"
                    >
                      {/* Accent strip based on comment vs reply type */}
                      <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${item.type === 'comment' ? 'bg-cyan-500' : 'bg-rose-500'}`} />

                      <div className="pl-3.5 space-y-3.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase font-mono ${
                              item.type === 'comment' 
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {item.type}
                            </span>
                            <span className="text-xs text-zinc-400">
                              on <span className="font-bold text-white hover:underline cursor-pointer" onClick={() => handleViewTemplateDetails(item.templateId)}>{item.templateName}</span>
                            </span>
                          </div>
                          
                          <span className="text-[10px] text-zinc-500 font-medium font-mono">
                            {new Date(item.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        {/* If commenting on replies, preview parent message text */}
                        {item.type === 'reply' && item.parentCommentText && (
                          <div className="p-3 bg-[#0c0c0d] border border-white/5 rounded-xl text-xs space-y-1 text-zinc-400 relative">
                            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Original Comment:</div>
                            <p className="italic line-clamp-2">"{item.parentCommentText}"</p>
                          </div>
                        )}

                        {/* Inline editor panel */}
                        {editingFeedbackId === item.id ? (
                          <div className="space-y-2.5">
                            <textarea
                              value={editingFeedbackText}
                              onChange={(e) => setEditingFeedbackText(e.target.value)}
                              rows={3}
                              className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors placeholder-zinc-600 font-sans"
                            />
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                onClick={() => { playButtonSound(); setEditingFeedbackId(null); }}
                                className="px-3.5 py-1.5 text-zinc-400 hover:text-white text-xs font-semibold rounded-lg transition-colors bg-white/5 hover:bg-white/10"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => {
                                  playButtonSound();
                                  handleEditFeedback(item, editingFeedbackText);
                                  setEditingFeedbackId(null);
                                }}
                                className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold rounded-lg transition-colors shadow-[0_0_15px_rgba(244,63,94,0.35)] cursor-pointer"
                              >
                                Save Changes
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap break-words pr-2">
                              {item.text}
                            </p>

                            {confirmDeleteId === item.id ? (
                              <div className="flex items-center gap-2 bg-[#1c1214] rounded-xl p-1.5 border border-rose-500/30 w-fit shrink-0 z-10">
                                <span className="text-[10px] text-rose-400 font-extrabold px-1 tracking-tight">Sure? Delete permanently?</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFeedback(item);
                                    setConfirmDeleteId(null);
                                  }}
                                  className="px-2.5 py-1 text-[11px] bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-md transition-colors cursor-pointer"
                                >
                                  Yes
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    playButtonSound();
                                    setConfirmDeleteId(null);
                                  }}
                                  className="px-2 py-1 text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-extrabold rounded-md transition-colors cursor-pointer"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 bg-[#121212]/60 rounded-xl p-1 border border-white/5 w-fit flex-nowrap shrink-0 z-10 font-sans">
                                <button
                                  onClick={() => {
                                    playButtonSound();
                                    setEditingFeedbackId(item.id);
                                    setEditingFeedbackText(item.text);
                                  }}
                                  className="px-3 py-1.5 text-[11px] font-bold text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-yellow-400" />
                                  Edit
                                </button>
                                <div className="w-[1px] h-3.5 bg-zinc-800" />
                                <button
                                  onClick={() => {
                                    playButtonSound();
                                    setConfirmDeleteId(item.id);
                                  }}
                                  className="px-3 py-1.5 text-[11px] font-bold text-zinc-300 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                  Delete
                                </button>
                                <div className="w-[1px] h-3.5 bg-zinc-800" />
                                <button
                                  onClick={() => {
                                    playButtonSound();
                                    handleViewTemplateDetails(item.templateId);
                                  }}
                                  className="px-3 py-1.5 text-[11px] font-bold text-zinc-300 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                                  Layout Detail
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {editingWebhook && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
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

      {/* Template Settings Modal */}
      <AnimatePresence>
        {editingTemplate && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#121212] rounded-2xl shadow-2xl w-full max-w-md border border-zinc-800 overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-[#1a1a1a]">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-400" />
                  Template Settings
                </h3>
                <button 
                  onClick={() => setEditingTemplate(null)}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Template Name
                  </label>
                  <input 
                    type="text" 
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})}
                    className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="Enter template name"
                  />
                </div>

                <div className="pt-4 border-t border-white/5">
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
                    Template Audience
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setEditingTemplate({...editingTemplate, audience: 'public'})}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${editingTemplate.audience === 'public' ? 'border-purple-500 bg-purple-500/10' : 'border-zinc-800 bg-[#0a0a0a] hover:border-zinc-700'}`}
                    >
                      <Globe className={`w-6 h-6 mb-2 ${editingTemplate.audience === 'public' ? 'text-purple-400' : 'text-zinc-500'}`} />
                      <span className={`text-sm font-bold ${editingTemplate.audience === 'public' ? 'text-purple-400' : 'text-zinc-400'}`}>Public</span>
                      <span className="text-xs text-zinc-500 text-center mt-1">Share with community</span>
                    </button>
                    <button
                      onClick={() => setEditingTemplate({...editingTemplate, audience: 'private'})}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${editingTemplate.audience === 'private' ? 'border-purple-500 bg-purple-500/10' : 'border-zinc-800 bg-[#0a0a0a] hover:border-zinc-700'}`}
                    >
                      <Shield className={`w-6 h-6 mb-2 ${editingTemplate.audience === 'private' ? 'text-purple-400' : 'text-zinc-500'}`} />
                      <span className={`text-sm font-bold ${editingTemplate.audience === 'private' ? 'text-purple-400' : 'text-zinc-400'}`}>Private</span>
                      <span className="text-xs text-zinc-500 text-center mt-1">Only for you</span>
                    </button>
                  </div>
                </div>

                {editingTemplate.audience === 'public' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="pt-4 border-t border-white/5"
                  >
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                      Thumbnail URL (Optional)
                    </label>
                    <input 
                      type="text" 
                      value={editingTemplate.thumbnail || ''}
                      onChange={(e) => setEditingTemplate({...editingTemplate, thumbnail: e.target.value})}
                      className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder="https://example.com/image.png"
                    />
                    <p className="text-xs text-zinc-500 mt-2">Add an image to make your template stand out in the community.</p>
                  </motion.div>
                )}
              </div>
              
              <div className="p-5 border-t border-zinc-800 bg-[#1a1a1a] flex justify-end gap-3">
                <button 
                  onClick={() => setEditingTemplate(null)}
                  className="px-4 py-2 text-sm font-bold text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    const updatedTemplates = templates.map(t => t.id === editingTemplate.id ? editingTemplate : t);
                    setTemplates(updatedTemplates);
                    localStorage.setItem('discord_templates', JSON.stringify(updatedTemplates));
                    setEditingTemplate(null);
                    toast.success('Template updated successfully!');
                    playButtonSound();
                  }}
                  className="flex items-center gap-2 px-5 py-2 bg-purple-500 hover:bg-purple-400 text-white rounded-lg text-sm font-bold transition-colors shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                >
                  <Save className="w-4 h-4" />
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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
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

      {/* Preview Modal */}
      <AnimatePresence>
        {selectedTemplateForView && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#121212] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-zinc-800 overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-[#1a1a1a]">
                <h3 className="text-lg font-bold text-white flex items-center gap-3">
                  <Globe className="w-5 h-5 text-rose-400 animate-pulse" />
                  Template Source Context: <span className="text-rose-300 font-mono">{selectedTemplateForView.name}</span>
                </h3>
                <button 
                  onClick={() => setSelectedTemplateForView(null)}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 bg-[#313338]">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0 border border-rose-500/30">
                    <span className="text-rose-400 font-bold font-mono">{selectedTemplateForView.name?.charAt(0).toUpperCase() || 'T'}</span>
                  </div>
                  <div className="flex-1 min-w-0 space-y-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white">{selectedTemplateForView.author || 'Anonymous'}</span>
                      <span className="text-[9px] bg-rose-500/15 text-rose-300 border border-rose-500/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Author</span>
                      <span className="text-xs text-[#949BA4]">community shared layout</span>
                    </div>

                    {selectedTemplateForView.description && (
                      <p className="text-zinc-400 text-xs leading-relaxed italic border-l-2 border-rose-500/30 pl-3">
                        "{selectedTemplateForView.description}"
                      </p>
                    )}
                    
                    {selectedTemplateForView.message && (
                      <div className="p-3 bg-[#1e2022]/40 rounded-xl border border-white/5 space-y-1">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Layout Preview:</span>
                        <div className="bg-[#313338] p-4 rounded-lg border border-white/5">
                          <MessagePreview message={selectedTemplateForView.message} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="p-5 border-t border-zinc-800 bg-[#1a1a1a] flex justify-end gap-3 shrink-0">
                <button 
                  onClick={() => setSelectedTemplateForView(null)}
                  className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer bg-white/5 hover:bg-white/10 rounded-lg"
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    handleLoadTemplate(selectedTemplateForView as MessageTemplate);
                    setSelectedTemplateForView(null);
                    toast.success(`Loaded "${selectedTemplateForView.name}" layout`);
                  }}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white rounded-lg text-xs font-bold transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)] cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  Apply Template Design
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {previewTemplate && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#121212] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-zinc-800 overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-[#1a1a1a]">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-purple-400" />
                  Preview: {previewTemplate.name}
                </h3>
                <button 
                  onClick={() => setPreviewTemplate(null)}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 bg-[#313338]">
                {/* Simplified Discord Message Preview */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#5865F2] flex items-center justify-center shrink-0">
                    <span className="text-white font-bold">B</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white">Bot Name</span>
                      <span className="text-xs bg-[#5865F2] text-white px-1.5 py-0.5 rounded font-medium">BOT</span>
                      <span className="text-xs text-[#949BA4]">Today at 12:00 PM</span>
                    </div>
                    
                    {previewTemplate.message.content && (
                      <div className="text-[#DBDEE1] whitespace-pre-wrap break-words mb-2">
                        {previewTemplate.message.content.split('\n').map((line, i) => (
                          <React.Fragment key={i}>
                            {line}
                            {i < previewTemplate.message.content!.split('\n').length - 1 && <br />}
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                    
                    {previewTemplate.message.embeds?.map((embed, i) => (
                      <div key={i} className="mt-2 max-w-[520px] rounded border-l-4 bg-[#2B2D31] p-4" style={{ borderLeftColor: embed.color ? `#${embed.color.toString(16).padStart(6, '0')}` : '#202225' }}>
                        {embed.author && (
                          <div className="flex items-center gap-2 mb-2 text-sm font-medium text-white">
                            {embed.author.icon_url && <img src={embed.author.icon_url} alt="" className="w-6 h-6 rounded-full" />}
                            {embed.author.name}
                          </div>
                        )}
                        {embed.title && (
                          <div className="font-bold text-white mb-2">{embed.title}</div>
                        )}
                        {embed.description && (
                          <div className="text-sm text-[#DBDEE1] whitespace-pre-wrap">
                            {embed.description.split('\n').map((line, j) => (
                              <React.Fragment key={j}>
                                {line}
                                {j < embed.description!.split('\n').length - 1 && <br />}
                              </React.Fragment>
                            ))}
                          </div>
                        )}
                        {embed.fields && embed.fields.length > 0 && (
                          <div className="mt-4 grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                            {embed.fields.map((field, j) => (
                              <div key={j} className={field.inline ? 'col-span-1' : 'col-span-full'}>
                                <div className="text-sm font-bold text-white mb-1">{field.name}</div>
                                <div className="text-sm text-[#DBDEE1] whitespace-pre-wrap">
                                  {field.value.split('\n').map((line, k) => (
                                    <React.Fragment key={k}>
                                      {line}
                                      {k < field.value.split('\n').length - 1 && <br />}
                                    </React.Fragment>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {embed.image && (
                          <img src={embed.image.url} alt="" className="mt-4 max-w-full rounded-lg" />
                        )}
                        {embed.footer && (
                          <div className="flex items-center gap-2 mt-4 text-xs text-[#DBDEE1]">
                            {embed.footer.icon_url && <img src={embed.footer.icon_url} alt="" className="w-5 h-5 rounded-full" />}
                            {embed.footer.text}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="p-5 border-t border-zinc-800 bg-[#1a1a1a] flex justify-end gap-3">
                <button 
                  onClick={() => setPreviewTemplate(null)}
                  className="px-4 py-2 text-sm font-bold text-zinc-400 hover:text-white transition-colors"
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    handleLoadTemplate(previewTemplate);
                    setPreviewTemplate(null);
                    toast.success(`Loaded ${previewTemplate.name}`);
                  }}
                  className="flex items-center gap-2 px-5 py-2 bg-purple-500 hover:bg-purple-400 text-white rounded-lg text-sm font-bold transition-colors shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                >
                  <Copy className="w-4 h-4" />
                  Apply Template
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Crop/Zoom Pop-up Modal */}
      {cropModalOpen && originalImageSrc && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#121212] border border-zinc-850 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Crop & Zoom Webhook Avatar</h4>
                <p className="text-[10px] text-zinc-400">Position avatar perfectly inside circle</p>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setCropModalOpen(false);
                  setOriginalImageSrc(null);
                }}
                className="text-zinc-400 hover:text-white p-1 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center">
              {/* Cropping Workspace Container */}
              <div 
                className="w-[260px] h-[260px] relative overflow-hidden bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-center cursor-move select-none"
                onMouseDown={handleCropMouseDown}
                onMouseMove={handleCropMouseMove}
                onMouseUp={handleCropMouseUp}
                onMouseLeave={handleCropMouseUp}
                onTouchStart={handleCropTouchStart}
                onTouchMove={handleCropTouchMove}
                onTouchEnd={handleCropTouchEnd}
              >
                {/* Image */}
                <img
                  src={originalImageSrc}
                  alt="To crop"
                  draggable={false}
                  className="absolute max-w-none origin-center pointer-events-none"
                  style={{
                    transform: `translate(${panX}px, ${panY}px) scale(${zoomScale})`,
                    width: imgRatio > 1 ? `${250 * imgRatio}px` : '250px',
                    height: imgRatio > 1 ? '250px' : `${250 / imgRatio}px`,
                    transition: isDraggingCrop ? 'none' : 'transform 0.1s ease-out',
                  }}
                />

                {/* Circular Mask */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-[180px] h-[180px] rounded-full border-2 border-dashed border-cyan-450/85 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)]" />
                </div>
              </div>

              {/* Dynamic Scaling Slider */}
              <div className="w-full mt-6 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-400">
                  <span className="flex items-center gap-1 font-sans"><ZoomIn className="w-3.5 h-3.5" /> Circle Zoom</span>
                  <span className="font-mono text-[10px] text-cyan-400">{Math.round(zoomScale * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="4"
                  step="0.05"
                  value={zoomScale}
                  onChange={(e) => setZoomScale(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 bg-zinc-800 rounded-lg appearance-none h-1.5 cursor-pointer"
                />
                <p className="text-[10px] text-zinc-500 text-center font-sans">Drag image directly in container box to align properly.</p>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-900/30 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setCropModalOpen(false);
                  setOriginalImageSrc(null);
                }}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-350 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeCropCrop}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-95 text-white text-xs font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer"
              >
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};
