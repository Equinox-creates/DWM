import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { DiscordWebhookMessage } from '@/types';
import { Download, Trash2, Globe, Share2, Search, Plus, Loader2, Send, MessageSquare, User, X, ThumbsUp, ThumbsDown, ArrowLeft, CornerDownRight, Tag, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs, getDoc, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove, increment, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { playDeleteSound } from '@/utils/sounds';
import { safeUUID } from '@/utils';
import { MessagePreview } from './MessagePreview';

export interface CommentReply {
  id: string;
  author: string;
  authorId: string;
  text: string;
  createdAt: string;
  authorAvatar?: string;
}

export interface Comment {
  id: string;
  author: string;
  authorId: string;
  text: string;
  createdAt: string;
  authorAvatar?: string;
  replies?: CommentReply[];
}

interface Template {
  id: string;
  name: string;
  description: string;
  author: string;
  authorId?: string;
  message: DiscordWebhookMessage;
  isPublic: boolean;
  downloads: number;
  likes?: number;
  dislikes?: number;
  likedBy?: string[];
  dislikedBy?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createdAt?: any;
  thumbnail?: string;
  thumbnailPoster?: string;
  comments?: Comment[];
  authorAvatar?: string;
  category?: string;
}

const getAvatarUrl = (authorId?: string, authorAvatar?: string) => {
  if (authorAvatar && authorAvatar.startsWith('http')) {
    return authorAvatar;
  }
  if (authorId && authorAvatar) {
    return `https://cdn.discordapp.com/avatars/${authorId}/${authorAvatar}.png`;
  }
  return null;
};

interface LocalTemplate {
  id?: string;
  name: string;
  description?: string;
  author?: string;
  authorId?: string;
  message: DiscordWebhookMessage;
  audience?: 'public' | 'private';
  downloads?: number;
  createdAt?: string;
  likes?: number;
  dislikes?: number;
  likedBy?: string[];
  dislikedBy?: string[];
  thumbnail?: string;
  comments?: Comment[];
  category?: string;
}

interface TemplatesPanelProps {
  onApply: (message: DiscordWebhookMessage) => void;
  onSend?: (message: DiscordWebhookMessage) => void;
}

const MOCK_ONLINE_TEMPLATES: Template[] = [
  {
    id: '1',
    name: 'Welcome Message',
    description: 'A friendly welcome message for new members with custom rules highlight and layout headers.',
    author: 'System',
    isPublic: true,
    downloads: 120,
    likes: 24,
    dislikes: 1,
    likedBy: [],
    dislikedBy: [],
    createdAt: '2026-01-01T12:00:00.000Z',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    category: 'Welcome',
    message: {
      content: '# Welcome to The Our Server !!\n[A exaple server banner img]\nWe Are Galde That You All Have Supported us That much,\nThanks for joining our server too much.\n\n## Our Goal \n\n[Add Any Text]\n\n** Please read the Rules To Get Started !!! ** #📘 rules',
      embeds: []
    }
  },
  {
    id: '2',
    name: 'Server Update',
    description: 'Template for announcing server updates with fields, structured notes, and footer.',
    author: 'System',
    isPublic: true,
    downloads: 85,
    likes: 15,
    dislikes: 0,
    likedBy: [],
    dislikedBy: [],
    createdAt: '2026-01-02T12:00:00.000Z',
    thumbnail: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?auto=format&fit=crop&w=600&q=80',
    category: 'Update',
    message: {
      content: '@everyone 📢 **Server Update is Here!**',
      embeds: [
        {
          title: '🚀 Update v2.0.0 - The Big One',
          description: 'We have been working hard on this update and we are excited to finally share it with you all! This update brings massive improvements to the server infrastructure and new features for everyone to enjoy.',
          color: 5763719,
          fields: [
            { name: '✨ New Features', value: '• Added 3 new voice channels\n• New leveling system with rewards\n• Custom bot commands are now live', inline: false },
            { name: '🐛 Bug Fixes', value: '• Fixed role assignment issues\n• Resolved lag in music bot\n• Cleaned up old channels', inline: false },
            { name: '📅 Next Steps', value: 'We will be hosting a community event this weekend to celebrate. Stay tuned for more details!', inline: false }
          ],
          footer: { text: 'Thank you for your continued support!' },
          timestamp: new Date().toISOString()
        }
      ]
    }
  }
];

const getUnifiedUserId = (authUserId?: string) => {
  if (authUserId) return authUserId;
  const discordId = localStorage.getItem('user_id');
  if (discordId) return discordId;
  const username = localStorage.getItem('username');
  if (username) return `name_${username}`;
  let deviceId = localStorage.getItem('templates_device_client_id');
  if (!deviceId) {
    deviceId = safeUUID();
    localStorage.setItem('templates_device_client_id', deviceId);
  }
  return `guest_${deviceId}`;
};

const TemplateSkeleton = () => (
  <div className="bg-[#18191c]/30 border border-white/5 rounded-3xl p-5 flex flex-col h-full space-y-4 shadow-lg overflow-hidden relative">
    {/* Aspect Video Widescreen Thumbnail Outline */}
    <div className="w-full aspect-video rounded-2xl bg-white/5 shimmer-loader overflow-hidden relative" />

    {/* Avatar + Details Row */}
    <div className="flex gap-3.5 items-center">
      <div className="w-10 h-10 rounded-full bg-white/5 shimmer-loader shrink-0" />
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-white/10 shimmer-loader rounded-md w-3/4" />
        <div className="h-3 bg-white/5 shimmer-loader rounded-md w-1/3" />
      </div>
    </div>

    {/* Description Block lines */}
    <div className="space-y-3 pt-1 flex-1">
      <div className="h-3 bg-white/5 shimmer-loader rounded-md w-full" />
      <div className="h-3 bg-white/5 shimmer-loader rounded-md w-5/6" />
    </div>

    {/* Footer Row */}
    <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-auto">
      <div className="flex gap-2">
        <div className="h-6 bg-white/5 shimmer-loader rounded-md w-12" />
        <div className="h-6 bg-white/5 shimmer-loader rounded-md w-12" />
      </div>
      <div className="h-8 bg-white/10 shimmer-loader rounded-md w-16" />
    </div>
  </div>
);

const getLocalReactions = () => {
  try {
    const data = localStorage.getItem('templates_local_reactions');
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

const saveLocalReaction = (templateId: string, type: 'like' | 'dislike', myId: string) => {
  const reactions = getLocalReactions();
  if (!reactions[templateId]) {
    reactions[templateId] = { likes: 0, dislikes: 0, likedBy: [], dislikedBy: [] };
  }
  
  const r = reactions[templateId];
  const likedBy = r.likedBy || [];
  const dislikedBy = r.dislikedBy || [];
  const hasLiked = likedBy.includes(myId);
  const hasDisliked = dislikedBy.includes(myId);

  if (type === 'like') {
    if (hasLiked) {
      r.likedBy = likedBy.filter((uid: string) => uid !== myId);
      r.likes = Math.max(0, (r.likes || 0) - 1);
    } else {
      r.likedBy = [...likedBy, myId];
      r.likes = (r.likes || 0) + 1;
      if (hasDisliked) {
        r.dislikedBy = dislikedBy.filter((uid: string) => uid !== myId);
        r.dislikes = Math.max(0, (r.dislikes || 0) - 1);
      }
    }
  } else {
    if (hasDisliked) {
      r.dislikedBy = dislikedBy.filter((uid: string) => uid !== myId);
      r.dislikes = Math.max(0, (r.dislikes || 0) - 1);
    } else {
      r.dislikedBy = [...dislikedBy, myId];
      r.dislikes = (r.dislikes || 0) + 1;
      if (hasLiked) {
        r.likedBy = likedBy.filter((uid: string) => uid !== myId);
        r.likes = Math.max(0, (r.likes || 0) - 1);
      }
    }
  }
  
  localStorage.setItem('templates_local_reactions', JSON.stringify(reactions));
  return r;
};

const enrichTemplateWithLocal = (template: Template): Template => {
  const localReactions = getLocalReactions();
  const reactions = localReactions[template.id];
  
  if (reactions) {
    return {
      ...template,
      likes: reactions.likes !== undefined ? reactions.likes : template.likes,
      dislikes: reactions.dislikes !== undefined ? reactions.dislikes : template.dislikes,
      likedBy: reactions.likedBy || template.likedBy || [],
      dislikedBy: reactions.dislikedBy || template.dislikedBy || [],
    };
  }
  return template;
};

let cachedPublicTemplates: Template[] | null = (() => {
  try {
    const raw = localStorage.getItem('cached_online_templates');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
})();

let cachedUserTemplates: Template[] | null = (() => {
  try {
    const raw = localStorage.getItem('cached_saved_templates');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
})();

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
          className="w-10 h-10 text-red-500/70"
        >
          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
          <path d="M14 2v4a2 2 0 0 0 2 2h4" />
          <circle cx="10" cy="12" r="2" />
          <path d="m20 17-1.296-1.296a2.41 2.41 0 0 0-3.408 0L9 22" />
          <line x1="2" y1="2" x2="22" y2="22" />
        </svg>
        <span className="text-xs font-semibold text-zinc-400 text-center select-none">Failed to load Image</span>
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

export const TemplatesPanel: React.FC<TemplatesPanelProps> = ({ onApply, onSend }) => {
  const { user } = useAuth();
  const isLoggedIn = !!user || !!localStorage.getItem('username');
  const username = user?.displayName || localStorage.getItem('username') || 'Anonymous';
  const [activeTab, setActiveTab] = useState<'online' | 'saved'>('online');
  const [savedTemplates, setSavedTemplates] = useState<Template[]>(() => cachedUserTemplates || []);
  const [publicTemplates, setPublicTemplates] = useState<Template[]>(() => cachedPublicTemplates || MOCK_ONLINE_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(false);

  // Pull-to-refresh logic
  const [pullProgress, setPullProgress] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const startYRef = React.useRef(0);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const myId = useMemo(() => getUnifiedUserId(user?.uid), [user?.uid]);

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
      triggerRefresh();
    } else {
      setPullProgress(0);
    }
  };

  const triggerRefresh = async () => {
    setIsRefreshing(true);
    setPullProgress(65);
    
    const startTime = Date.now();
    try {
      if (activeTab === 'online') {
        await fetchPublicTemplates();
      } else {
        await fetchUserTemplates();
      }
      
      // Force minimum duration of 1400ms for active refreshing so the cool blue portal orbital animation can rotate gracefully and never get abruptly cut off.
      const elapsed = Date.now() - startTime;
      const minDuration = 1400;
      if (elapsed < minDuration) {
        await new Promise(resolve => setTimeout(resolve, minDuration - elapsed));
      }
      
      // Show success checkmark animation
      setShowSuccess(true);
      setIsRefreshing(false);
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Templates reloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to refresh templates.");
    } finally {
      setIsRefreshing(false);
      setShowSuccess(false);
      setPullProgress(0);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTemplateId = params.get('templateId') || params.get('template');
    if (!urlTemplateId) return;

    const loadUrlTemplate = async () => {
      const found = [...publicTemplates, ...savedTemplates].find(t => t.id === urlTemplateId);
      if (found) {
        setSelectedTemplate(found);
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        return;
      }

      if (db) {
        try {
          const docRef = doc(db, 'templates', urlTemplateId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const fetchedT = { id: snap.id, ...snap.data() } as Template;
            setSelectedTemplate(fetchedT);
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
          }
        } catch (err) {
          console.error("Error fetching shared template:", err);
        }
      }
    };

    loadUrlTemplate();
  }, [publicTemplates, savedTemplates]);

  const sendNotification = async (
    recipientId: string, 
    title: string, 
    message: string, 
    type: 'info' | 'success' | 'warning' | 'error' | 'mention' | 'message', 
    actionUrl: string
  ) => {
    if (recipientId === myId) {
      window.dispatchEvent(new CustomEvent('ADD_APP_NOTIFICATION', {
        detail: { title, message, type, actionUrl }
      }));
    }

    if (db && recipientId && recipientId !== 'local-user') {
      try {
        await addDoc(collection(db, 'notifications'), {
          recipientId,
          senderId: myId,
          senderName: username,
          title,
          message,
          type,
          actionUrl,
          timestamp: new Date().toISOString(),
          read: false
        });
      } catch (err) {
        console.error("Error setting up DB notification:", err);
      }
    }
  };

  useEffect(() => {
    if (!db || !isLoggedIn) return;
    const currentId = user?.uid || localStorage.getItem('user_id');
    if (!currentId) return;

    let unsubscribe = () => {};
    
    // Real-time notification listener for community interactions
    const setupListener = () => {
      try {
        const q = query(
          collection(db, 'notifications'),
          where('recipientId', '==', currentId),
          orderBy('timestamp', 'desc'),
          limit(30)
        );
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const data = change.doc.data();
              const notificationId = change.doc.id;
              const handledKey = `handled_notif_${notificationId}`;
              if (!localStorage.getItem(handledKey)) {
                localStorage.setItem(handledKey, 'true');
                
                const addEvent = new CustomEvent('ADD_APP_NOTIFICATION', {
                  detail: {
                    title: data.title,
                    message: data.message,
                    type: data.type || 'info',
                    actionUrl: data.actionUrl || ''
                  }
                });
                window.dispatchEvent(addEvent);
              }
            }
          });
        }, (err) => {
          console.warn("Notification stream error (expected if permissions/rules not ready):", err);
        });
      } catch (err) {
        console.error("Error preparing notifications listener:", err);
      }
    };

    setupListener();
    return () => unsubscribe();
  }, [isLoggedIn, user]);

  useEffect(() => {
    const handleJump = (e: Event) => {
      const customEvent = e as CustomEvent<{ templateId: string, commentId?: string }>;
      if (customEvent.detail) {
        const { templateId, commentId } = customEvent.detail;
        
        const found = [...publicTemplates, ...savedTemplates].find(t => t.id === templateId);
        if (found) {
          setSelectedTemplate(found);
          
          if (commentId) {
            setTimeout(() => {
              const el = document.getElementById(`comment-item-${commentId}`);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('bg-indigo-500/20', 'ring-2', 'ring-indigo-500');
                
                // Pulse feedback highlight
                setTimeout(() => {
                  el.classList.remove('bg-indigo-500/20', 'ring-2', 'ring-indigo-500');
                }, 3000);
              }
            }, 800);
          }
        }
      }
    };
    window.addEventListener('JUMP_TO_TEMPLATE_COMMENT', handleJump as EventListener);
    return () => window.removeEventListener('JUMP_TO_TEMPLATE_COMMENT', handleJump as EventListener);
  }, [publicTemplates, savedTemplates]);

  const handleCommentAdded = (templateId: string, newComment: Comment) => {
    const updater = (prev: Template[]) => prev.map(t => {
      if (t.id === templateId) {
        const existingComments = t.comments || [];
        return {
          ...t,
          comments: [newComment, ...existingComments]
        };
      }
      return t;
    });
    setPublicTemplates(updater);
    setSavedTemplates(updater);
    
    if (cachedPublicTemplates) cachedPublicTemplates = updater(cachedPublicTemplates);
    if (cachedUserTemplates) cachedUserTemplates = updater(cachedUserTemplates);
  };

  const activeSelectedTemplate = useMemo(() => {
    if (!selectedTemplate) return null;
    const found = [...publicTemplates, ...savedTemplates].find(t => t.id === selectedTemplate.id);
    return found || selectedTemplate;
  }, [selectedTemplate, publicTemplates, savedTemplates]);

  const handleLike = async (template: Template) => {
    const isMock = MOCK_ONLINE_TEMPLATES.some(t => t.id === template.id);
    const usesLocal = !db || isMock || template.id.startsWith('local_') || !template.authorId;

    if (usesLocal) {
      const updatedReaction = saveLocalReaction(template.id, 'like', myId);
      const isNewLike = updatedReaction.likedBy?.includes(myId);
      toast.success(isNewLike ? "Liked template!" : "Removed like");
      
      const updater = (prev: Template[]) => prev.map(t => t.id === template.id ? {
        ...t,
        likes: updatedReaction.likes,
        dislikes: updatedReaction.dislikes,
        likedBy: updatedReaction.likedBy,
        dislikedBy: updatedReaction.dislikedBy
      } : t);
      
      setPublicTemplates(updater);
      setSavedTemplates(updater);

      if (isNewLike && template.authorId && template.authorId !== myId) {
        sendNotification(
          template.authorId,
          'New Layout Reaction',
          `@${username} liked your template "${template.name}"!`,
          'success',
          `template:${template.id}`
        );
      }
      return;
    }

    const tDocRef = doc(db, 'templates', template.id);
    const likedBy = template.likedBy || [];
    const dislikedBy = template.dislikedBy || [];

    const hasLiked = likedBy.includes(myId);
    const hasDisliked = dislikedBy.includes(myId);

    try {
      if (hasLiked) {
        await updateDoc(tDocRef, {
          likedBy: arrayRemove(myId),
          likes: increment(-1)
        });
        toast.success("Removed like");
      } else {
        const updates: Record<string, unknown> = {
          likedBy: arrayUnion(myId),
          likes: increment(1)
        };
        if (hasDisliked) {
          updates.dislikedBy = arrayRemove(myId);
          updates.dislikes = increment(-1);
        }
        await updateDoc(tDocRef, updates);
        toast.success("Liked template!");

        if (template.authorId && template.authorId !== myId) {
          await sendNotification(
            template.authorId,
            'New Layout Reaction',
            `@${username} liked your template "${template.name}"!`,
            'success',
            `template:${template.id}`
          );
        }
      }
      fetchPublicTemplates();
      fetchUserTemplates();
    } catch (err) {
      console.error("Error liking template:", err);
      toast.error("Failed to update reaction.");
    }
  };

  const handleDislike = async (template: Template) => {
    const isMock = MOCK_ONLINE_TEMPLATES.some(t => t.id === template.id);
    const usesLocal = !db || isMock || template.id.startsWith('local_') || !template.authorId;

    if (usesLocal) {
      const updatedReaction = saveLocalReaction(template.id, 'dislike', myId);
      const isNewDislike = updatedReaction.dislikedBy?.includes(myId);
      toast.success(isNewDislike ? "Disliked template!" : "Removed dislike");
      
      const updater = (prev: Template[]) => prev.map(t => t.id === template.id ? {
        ...t,
        likes: updatedReaction.likes,
        dislikes: updatedReaction.dislikes,
        likedBy: updatedReaction.likedBy,
        dislikedBy: updatedReaction.dislikedBy
      } : t);
      
      setPublicTemplates(updater);
      setSavedTemplates(updater);

      if (isNewDislike && template.authorId && template.authorId !== myId) {
        sendNotification(
          template.authorId,
          'New Layout Reaction',
          `@${username} disliked your template "${template.name}".`,
          'warning',
          `template:${template.id}`
        );
      }
      return;
    }

    const tDocRef = doc(db, 'templates', template.id);
    const likedBy = template.likedBy || [];
    const dislikedBy = template.dislikedBy || [];

    const hasLiked = likedBy.includes(myId);
    const hasDisliked = dislikedBy.includes(myId);

    try {
      if (hasDisliked) {
        await updateDoc(tDocRef, {
          dislikedBy: arrayRemove(myId),
          dislikes: increment(-1)
        });
        toast.success("Removed dislike");
      } else {
        const updates: Record<string, unknown> = {
          dislikedBy: arrayUnion(myId),
          dislikes: increment(1)
        };
        if (hasLiked) {
          updates.likedBy = arrayRemove(myId);
          updates.likes = increment(-1);
        }
        await updateDoc(tDocRef, updates);
        toast.success("Disliked template!");

        if (template.authorId && template.authorId !== myId) {
          await sendNotification(
            template.authorId,
            'New Layout Reaction',
            `@${username} disliked your template "${template.name}".`,
            'warning',
            `template:${template.id}`
          );
        }
      }
      fetchPublicTemplates();
      fetchUserTemplates();
    } catch (err) {
      console.error("Error disliking template:", err);
      toast.error("Failed to update reaction.");
    }
  };

  const fetchUserTemplates = useCallback(async () => {
      const hasCache = cachedUserTemplates !== null;
      if (!hasCache) {
          setIsLoading(true);
      }
      try {
          const currentId = user?.uid || localStorage.getItem('user_id') || 'local-user';
          const dbTemplates: Template[] = [];
          
          if (db && isLoggedIn) {
              // Using a simple query with a single filter which DOES NOT require a composite index.
              // This is incredibly fast and complies perfectly with security rules.
              const q = query(
                  collection(db, 'templates'), 
                  where('authorId', '==', currentId)
              );
              try {
                  const querySnapshot = await Promise.race([
                      getDocs(q),
                      new Promise<null>((resolve) => setTimeout(() => resolve(null), 1200))
                  ]);
                  if (querySnapshot) {
                      querySnapshot.forEach((doc) => {
                          dbTemplates.push({ id: doc.id, ...doc.data() } as Template);
                      });
                  } else {
                      console.warn("Firestore user templates fetch timed out. Using local/cached data.");
                  }
              } catch (err) {
                  console.error("Error fetching user templates from DB:", err);
                  handleFirestoreError(err, OperationType.LIST, 'templates');
              }
          }

          // Load local templates
          const localString = localStorage.getItem('discord_templates');
          let localTemplates: Template[] = [];
          if (localString) {
              try {
                  const parsed = JSON.parse(localString);
                  if (Array.isArray(parsed)) {
                      localTemplates = parsed.map((lt: LocalTemplate) => ({
                          id: lt.id || safeUUID(),
                          name: lt.name,
                          description: lt.description || 'Saved Template',
                          author: lt.author || username || 'My Account',
                          authorId: lt.authorId || currentId,
                          message: lt.message,
                          isPublic: lt.audience === 'public',
                          downloads: lt.downloads || 0,
                          createdAt: lt.createdAt || new Date().toISOString()
                      }));
                  }
              } catch (err) {
                  console.error("Error parsing local templates:", err);
              }
          }

          // Merge dbTemplates and localTemplates, deduplicating by ID or name
          const merged: Template[] = [...dbTemplates];
          localTemplates.forEach(lt => {
              const duplicate = merged.some(t => t.id === lt.id || t.name.toLowerCase() === lt.name.toLowerCase());
              if (!duplicate) {
                  merged.push(lt);
              }
          });

          // Enrich with local rating values
          const enrichedMerged = merged.map(t => enrichTemplateWithLocal(t));

          // Sort by createdAt descending on the client
          enrichedMerged.sort((a, b) => {
              const valA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const valB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return valB - valA;
          });

          cachedUserTemplates = enrichedMerged;
          try {
            localStorage.setItem('cached_saved_templates', JSON.stringify(enrichedMerged));
          } catch (e) {
            console.error(e);
          }
          setSavedTemplates(enrichedMerged);
      } catch (error) {
          console.error("Error fetching templates:", error);
          if (!hasCache) {
              toast.error("Failed to load your templates.");
          }
      } finally {
          setIsLoading(false);
      }
  }, [user, isLoggedIn, username]);

  const fetchPublicTemplates = useCallback(async () => {
      const hasCache = cachedPublicTemplates !== null;
      if (!hasCache) {
          setIsLoading(true);
      }
      try {
          const dbTemplates: Template[] = [];
          if (db) {
              // Using a single-field filter query which DOES NOT require a custom composite index,
              // satisfies Firestore security rules (only reading isPublic === true), and loads instantly.
              const q = query(
                  collection(db, 'templates'), 
                  where('isPublic', '==', true)
              );
              try {
                  const querySnapshot = await Promise.race([
                      getDocs(q),
                      new Promise<null>((resolve) => setTimeout(() => resolve(null), 1200))
                  ]);
                  if (querySnapshot) {
                      querySnapshot.forEach((doc) => {
                          dbTemplates.push({ id: doc.id, ...doc.data() } as Template);
                      });
                  } else {
                      console.warn("Firestore public templates fetch timed out. Using local/cached data.");
                  }
              } catch (err) {
                  console.error("Error fetching public templates from DB:", err);
                  handleFirestoreError(err, OperationType.LIST, 'templates');
              }
          }
          
          // Load local public templates
          const localString = localStorage.getItem('discord_templates');
          let localPublicTemplates: Template[] = [];
          if (localString) {
              try {
                  const parsed = JSON.parse(localString);
                  if (Array.isArray(parsed)) {
                      localPublicTemplates = parsed
                          .filter((lt: LocalTemplate) => lt.audience === 'public')
                          .map((lt: LocalTemplate) => ({
                              id: lt.id || safeUUID(),
                              name: lt.name,
                              description: lt.description || 'Shared Template from Discord Webhook Designer',
                              author: lt.author || username || 'Anonymous User',
                              authorId: lt.authorId || 'local-user',
                              message: lt.message,
                              isPublic: true,
                              downloads: lt.downloads || 0,
                              createdAt: lt.createdAt || new Date().toISOString(),
                              likes: lt.likes || 0,
                              dislikes: lt.dislikes || 0,
                              likedBy: lt.likedBy || [],
                              dislikedBy: lt.dislikedBy || [],
                              thumbnail: lt.thumbnail
                          }));
                  }
              } catch (err) {
                  console.error("Error parsing local templates:", err);
              }
          }

          // Merge dbTemplates, localPublicTemplates, and deduplicate by ID or name
          const merged: Template[] = [...dbTemplates];
          localPublicTemplates.forEach(lt => {
              const duplicate = merged.some(t => t.id === lt.id || t.name.toLowerCase() === lt.name.toLowerCase());
              if (!duplicate) {
                  merged.push(lt);
              }
          });

          // Enrich both standard templates and Mock templates with local reactions
          const enrichedMerged = merged.map(t => enrichTemplateWithLocal(t));
          const enrichedMocks = MOCK_ONLINE_TEMPLATES.map(t => enrichTemplateWithLocal(t));

          const allTemplates = [...enrichedMocks, ...enrichedMerged];

          // Sort by createdAt descending on the client (newer templates at top!)
          allTemplates.sort((a, b) => {
              const valA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const valB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return valB - valA;
          });

          cachedPublicTemplates = allTemplates;
          try {
            localStorage.setItem('cached_online_templates', JSON.stringify(allTemplates));
          } catch (e) {
            console.error(e);
          }
          setPublicTemplates(allTemplates);
      } catch (error) {
          console.error("Error fetching public templates:", error);
          if (!hasCache) {
              const enrichedMocks = MOCK_ONLINE_TEMPLATES.map(t => enrichTemplateWithLocal(t));
              setPublicTemplates(enrichedMocks);
          }
      } finally {
          setIsLoading(false);
      }
  }, [username]);

  useEffect(() => {
    if (activeTab === 'saved') {
        fetchUserTemplates();
    } else if (activeTab === 'online') {
        fetchPublicTemplates();
    }
  }, [activeTab, fetchUserTemplates, fetchPublicTemplates]);

  useEffect(() => {
    const handleTemplatesUpdated = () => {
      if (activeTab === 'saved') {
        fetchUserTemplates();
      }
    };
    window.addEventListener('discord_templates_updated', handleTemplatesUpdated);
    return () => {
      window.removeEventListener('discord_templates_updated', handleTemplatesUpdated);
    };
  }, [activeTab, fetchUserTemplates]);

  const deleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    
    try {
        // Delete from local storage
        const localString = localStorage.getItem('discord_templates');
        if (localString) {
            try {
                const parsed = JSON.parse(localString);
                if (Array.isArray(parsed)) {
                    const updated = parsed.filter((t: { id: string }) => t.id !== id);
                    localStorage.setItem('discord_templates', JSON.stringify(updated));
                }
            } catch (err) {
                console.error("Error parsing local templates during delete:", err);
            }
        }

        // Delete from database if enabled and logged in
        if (db && isLoggedIn) {
            try {
                await deleteDoc(doc(db, 'templates', id));
            } catch (err) {
                console.warn("Could not delete from Firestore:", err);
            }
        }

        setSavedTemplates(prev => prev.filter(t => t.id !== id));
        window.dispatchEvent(new Event('discord_templates_updated'));
        toast.success("Template deleted successfully.");
    } catch (error) {
        console.error("Error deleting template:", error);
        toast.error("Failed to delete template.");
    }
  };

  const filteredOnline = publicTemplates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredSaved = savedTemplates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="h-full flex flex-col bg-transparent relative">
      {/* Global CSS Styles for Stars Orbits and Shimmer animations */}
      <style>{`
        @keyframes starOrbit1 {
          0% { transform: translate(-14px, -14px) rotate(0deg) scale(0.65); }
          50% { transform: translate(16px, -10px) rotate(180deg) scale(0.95); }
          100% { transform: translate(-14px, -14px) rotate(360deg) scale(0.65); }
        }
        @keyframes starOrbit2 {
          0% { transform: translate(16px, 12px) rotate(0deg) scale(0.85); }
          50% { transform: translate(-16px, -14px) rotate(180deg) scale(0.55); }
          100% { transform: translate(16px, 12px) rotate(360deg) scale(0.85); }
        }
        @keyframes starOrbit3 {
          0% { transform: translate(-12px, 16px) rotate(0deg) scale(0.55); }
          50% { transform: translate(14px, -12px) rotate(-180deg) scale(1.15); }
          100% { transform: translate(-12px, 16px) rotate(-360deg) scale(0.55); }
        }
        @keyframes starOrbit4 {
          0% { transform: translate(14px, -16px) rotate(0deg) scale(0.75); }
          50% { transform: translate(-16px, 10px) rotate(180deg) scale(0.95); }
          100% { transform: translate(14px, -16px) rotate(360deg) scale(0.75); }
        }
        @keyframes checkMarkDraw {
          0% { stroke-dashoffset: 24; transform: scale(0.4); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { stroke-dashoffset: 0; transform: scale(1); opacity: 1; }
        }
        @keyframes pulseStarGlow {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 2px rgba(96, 165, 250, 0.4)); }
          50% { transform: scale(1.15); filter: drop-shadow(0 0 6px rgba(96, 165, 250, 0.8)); }
        }
        .shimmer-loader {
          background: linear-gradient(90deg, rgba(255,255,255,0.01) 25%, rgba(255,255,255,0.05) 37%, rgba(255,255,255,0.01) 63%);
          background-size: 200% 100%;
          animation: shimmerSwipe 1.8s infinite linear;
        }
        @keyframes shimmerSwipe {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      <div className="p-4 border-b border-[#1e1f22]/80 space-y-4 relative z-10 bg-[#121212] sm:rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#949ba4]" />
            <h2 className="font-bold text-lg text-white">Templates</h2>
          </div>
        </div>
        
        {/* Rounded Pill Tabs matching mockup layout */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
          <button
            onClick={() => setActiveTab('online')}
            className={`px-4 py-1.5 text-xs sm:text-sm font-bold rounded-full transition-all duration-300 ${activeTab === 'online' ? 'bg-[#5865f2] text-white shadow-[0_0_12px_rgba(88,101,242,0.35)]' : 'bg-[#1e1f22] text-[#949ba4] hover:text-[#dbdee1] hover:bg-[#2b2d31]'}`}
          >
            Online / Community
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-1.5 text-xs sm:text-sm font-bold rounded-full transition-all duration-300 ${activeTab === 'saved' ? 'bg-[#5865f2] text-white shadow-[0_0_12px_rgba(88,101,242,0.35)]' : 'bg-[#1e1f22] text-[#949ba4] hover:text-[#dbdee1] hover:bg-[#2b2d31]'}`}
          >
            My Saved
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#949ba4]" />
          <input 
            type="text" 
            placeholder="Search templates..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1e1f22] border-none rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#5865f2] text-[#dbdee1] placeholder-[#949ba4]"
          />
        </div>

        {/* Category Pill Filters */}
        <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-0.5 pt-1.5 flex-nowrap text-xs shrink-0 select-none">
          {['All', 'Announcement', 'Support', 'Rules', 'Welcome', 'Update', 'Event', 'Other'].map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full font-semibold transition-all duration-200 select-none cursor-pointer whitespace-nowrap border text-[11px] ${
                  isSelected 
                    ? 'bg-[#5865f2]/10 text-white border-[#5865f2] bg-[#5865f2] shadow-[0_0_8px_rgba(88,101,242,0.25)] font-bold' 
                    : 'bg-[#1e1f22]/60 hover:bg-[#2b2d31] text-[#949ba4] border-zinc-800 hover:text-[#dbdee1]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
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
        className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar pb-20 relative z-10"
      >
        {/* Pull-to-refresh visual indicator with charging progress ring morphing into glowing quantum portal */}
        {(isPulling || isRefreshing || showSuccess) && (
          <div 
            className="w-full flex items-center justify-center pointer-events-none transition-all duration-300 relative z-30 mb-2 overflow-visible"
            style={{ 
              height: showSuccess ? '55px' : `${pullProgress}px`, 
              marginTop: (isRefreshing || showSuccess) ? '0px' : '-8px', 
              opacity: showSuccess ? 1 : Math.min(pullProgress / 40, 1) 
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
                    className="stroke-blue-550 stroke-[3] fill-none transition-all duration-75 text-blue-500"
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

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <TemplateSkeleton key={i} />
            ))}
          </div>
        ) : activeTab === 'online' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredOnline.map(template => (
               <TemplateCard 
                 key={template.id} 
                 template={template} 
                 myId={myId}
                 onApply={onApply} 
                 onSend={isLoggedIn ? onSend : undefined} 
                 onDelete={(template.authorId === myId || template.authorId === 'local-user') ? () => deleteTemplate(template.id) : undefined}
                 onLike={handleLike}
                 onDislike={handleDislike}
                 onSelect={setSelectedTemplate}
                 onShare={() => {
                   const shareUrl = `${window.location.origin}?templateId=${template.id}`;
                   navigator.clipboard.writeText(shareUrl).then(() => {
                     toast.success("Share link copied to clipboard!");
                   }).catch(() => {
                     toast.error("Failed to copy share link.");
                   });
                 }}
               />
            ))}
          </div>
        ) : (
          filteredSaved.length > 0 ? (
            <div className="space-y-4">
              {!isLoggedIn && (
                <div className="bg-[#5865f2]/10 border border-[#5865f2]/30 rounded-lg p-3 text-xs text-[#dbdee1] flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#5865f2] shrink-0" />
                    Viewing local templates. Sign in to access your cloud account.
                  </span>
                  <button 
                    onClick={() => document.dispatchEvent(new CustomEvent('OPEN_ACCOUNT_SETTINGS'))}
                    className="text-[#5865f2] hover:underline font-bold"
                  >
                    Sign In
                  </button>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredSaved.map(template => (
                  <TemplateCard 
                      key={template.id} 
                      template={template} 
                      myId={myId}
                      onApply={onApply} 
                      onSend={isLoggedIn ? onSend : undefined}
                      onDelete={() => deleteTemplate(template.id)}
                      onLike={handleLike}
                      onDislike={handleDislike}
                      onSelect={setSelectedTemplate}
                      onShare={() => {
                        const shareUrl = `${window.location.origin}?templateId=${template.id}`;
                        navigator.clipboard.writeText(shareUrl).then(() => {
                          toast.success("Share link copied to clipboard!");
                        }).catch(() => {
                          toast.error("Failed to copy share link.");
                        });
                      }}
                  />
                ))}
              </div>
            </div>
          ) : (
            isLoggedIn ? (
              <div className="text-center py-10 text-[#949ba4] bg-[#2b2d31] rounded-xl border border-[#1e1f22] border-dashed">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-bold text-[#dbdee1]">No saved templates found</p>
                <p className="text-xs mt-2">Press the bottom-right + button to save your current message!</p>
              </div>
            ) : (
              <div className="text-center py-10 text-[#949ba4] bg-[#2b2d31] rounded-xl border border-[#1e1f22] border-dashed p-6">
                  <User className="w-12 h-12 mx-auto mb-4 opacity-50 text-[#5865f2]" />
                  <p className="font-bold text-[#dbdee1]">Unlock Cloud Sync & Sharing</p>
                  <p className="text-xs text-[#949ba4] mt-2 max-w-sm mx-auto">
                    Sign in to save templates to the cloud, share with the community, and synchronize across all your devices.
                  </p>
                  <div className="mt-4 flex justify-center">
                    <button 
                        onClick={() => document.dispatchEvent(new CustomEvent('OPEN_ACCOUNT_SETTINGS'))}
                        className="px-5 py-2.5 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-lg text-sm font-bold transition-all shadow-[0_0_15px_rgba(88,101,242,0.3)] hover:shadow-[0_0_25px_rgba(88,101,242,0.5)]"
                    >
                        Sign In
                    </button>
                  </div>
              </div>
            )
          )
        )}
      </div>

      {activeSelectedTemplate && (
        <TemplateDetailModal 
          template={activeSelectedTemplate} 
          onClose={() => setSelectedTemplate(null)} 
          onApply={onApply}
          onLike={handleLike}
          onDislike={handleDislike}
          myId={myId}
          isLoggedIn={isLoggedIn}
          username={username}
          db={db}
          sendNotification={sendNotification}
          onCommentAdded={handleCommentAdded}
        />
      )}

      {/* Floating Action Button */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-3 items-end z-20">
        <div className="group relative flex items-center gap-2">
            <span className="absolute right-14 bg-[#111214] text-zinc-300 text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-medium shadow-xl border border-white/5">
                Save current message as template
            </span>
            <button 
                onClick={() => {
                    window.dispatchEvent(new Event('OPEN_TEMPLATE_CREATOR'));
                }}
                className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-full shadow-lg shadow-blue-500/20 flex items-center justify-center border border-blue-400/30"
            >
                <Plus className="w-6 h-6" />
            </button>
        </div>
      </div>
    </div>
  );
};

const renderFallbackTemplateThumbnail = (name: string) => {
  const index = name.length % 4;
  const gradients = [
    { from: "#1e1b4b", to: "#4c1d95" }, // Deep purple
    { from: "#030712", to: "#1e293b" }, // Midnight blue
    { from: "#061329", to: "#022c22" }, // Rich teal / emerald tint
    { from: "#172554", to: "#1e1b4b" }  // Deep sapphire
  ];
  const grad = gradients[index];

  return (
    <div 
      className="w-full h-full relative flex flex-col justify-between p-4 overflow-hidden select-none"
      style={{ background: `linear-gradient(135deg, ${grad.from} 0%, ${grad.to} 100%)` }}
    >
      {/* Dot Matrix Decorative Pattern */}
      <div className="absolute inset-0 opacity-15" style={{ 
        backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`, 
        backgroundSize: '16px 16px' 
      }} />
      
      {/* Tech line overlays */}
      <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full border border-white/5 pointer-events-none" />
      <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full border border-white/5 pointer-events-none" />

      <div className="flex justify-between items-center relative z-10 w-full">
        <span className="text-[9px] uppercase font-mono tracking-widest text-white/30 bg-black/30 px-2 py-0.5 rounded">Payload</span>
        <MessageSquare className="w-4 h-4 text-white/20" />
      </div>

      <div className="relative z-10 mt-auto">
        <h4 className="text-white/80 font-mono text-xs tracking-wider uppercase truncate max-w-full">{name}</h4>
      </div>
    </div>
  );
};

const TemplateCard: React.FC<{ 
  template: Template, 
  myId: string,
  onApply: (msg: DiscordWebhookMessage) => void, 
  onDelete?: () => void, 
  onShare?: () => void, 
  onSend?: (msg: DiscordWebhookMessage) => void,
  onLike?: (template: Template) => void,
  onDislike?: (template: Template) => void,
  onSelect: (template: Template) => void
}> = ({ template, myId, onDelete, onShare, onLike, onDislike, onSelect }) => {
  const likedBy = template.likedBy || [];
  const dislikedBy = template.dislikedBy || [];
  const hasLiked = likedBy.includes(myId);
  const hasDisliked = dislikedBy.includes(myId);

  return (
    <div 
      className="bg-[#18191c]/30 border border-white/5 hover:border-[#5865f2]/40 rounded-3xl p-5 hover:bg-[#1e1f22]/70 transition-all duration-300 group flex flex-col h-full cursor-pointer relative shadow-lg hover:shadow-[0_12px_32px_rgba(88,101,242,0.12)] overflow-hidden" 
      onClick={() => onSelect(template)}
    >
      {/* 1. Curved Widescreen Thumbnail Group */}
      <div className="w-full aspect-video rounded-2xl bg-[#0b0c0e] overflow-hidden mb-4 border border-white/5 relative z-10 shadow-md group-hover:scale-[1.01] transition-transform duration-300">
        {template.thumbnail ? (
          <SafeTemplateImage src={template.thumbnail} alt={template.name} className="w-full h-full object-cover" size="normal" />
        ) : (
          renderFallbackTemplateThumbnail(template.name)
        )}

        {template.thumbnail && template.thumbnailPoster && (
          <div className="absolute bottom-2.5 left-2.5 z-20 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/5 text-[9px] font-semibold text-zinc-300 flex items-center gap-1 shadow-md select-none">
            <span className="text-purple-400 font-extrabold uppercase text-[8px] tracking-wider">Poster:</span>
            <span className="text-white font-bold">@{template.thumbnailPoster}</span>
          </div>
        )}

        {/* Action button overlay inside the poster */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
          {onShare && (
            <button 
              onClick={(e) => { e.stopPropagation(); onShare(); }} 
              className="p-1.5 bg-[#18191c]/95 text-[#949ba4] hover:text-[#dbdee1] rounded-lg transition-colors border border-white/5 shadow" 
              title="Share to Community"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button 
              onClick={(e) => { e.stopPropagation(); playDeleteSound(); onDelete(); }} 
              className="p-1.5 bg-[#18191c]/95 text-[#949ba4] hover:text-[#ed4245] rounded-lg transition-colors border border-white/5 shadow" 
              title="Delete Template"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Left Icon/Avatar + Title/Author Block (Exactly like Mock Screen) */}
      <div className="flex gap-3 items-center">
        {/* Rounded avatar circle */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#5865f2]/10 to-indigo-500/10 border border-[#5865f2]/25 flex items-center justify-center text-zinc-300 shrink-0 font-bold overflow-hidden shadow-sm select-none text-sm group-hover:border-[#5865f2]/50 transition-colors">
          {template.author ? template.author.substring(0, 1).toUpperCase() : 'U'}
        </div>

        {/* Caption Info Block */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[#f2f3f5] text-base leading-snug group-hover:text-[#5865f2] transition-colors line-clamp-1">
            {template.name}
          </h3>
          <p className="text-xs text-[#949ba4] font-medium leading-normal truncate mt-0.5">
            {template.author || "Unknown"}
          </p>
        </div>
      </div>

      {/* 3. Sleek Description line clamp with category tag to the right below it */}
      <div className="mt-3 flex items-start gap-3 justify-between min-h-8">
        <p className="text-xs text-[#b5bac1] line-clamp-2 leading-relaxed font-normal flex-1">
          {template.description || "No description provided."}
        </p>
        {template.category && (
          <span className="flex items-center gap-1 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/15 text-purple-400 font-bold text-[9px] font-sans shrink-0 self-end tracking-wider uppercase">
            <Tag className="w-2.5 h-2.5 text-purple-400" />
            {template.category}
          </span>
        )}
      </div>

      {/* 4. Toolbar footer with reactions / action badges */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-4 gap-2 relative z-10">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#949ba4] overflow-x-auto shrink-0 scrollbar-none py-0.5 font-sans">
          <span className="flex items-center gap-1 bg-[#1e1f22]/60 px-2 py-1 rounded-md border border-white/5" title="Downloads">
            <Download className="w-3 h-3 text-blue-400" /> {template.downloads || 0}
          </span>
          {template.isPublic && (
            <span className="flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded-md border border-green-500/10 text-[#23a559]">
              <Globe className="w-2.5 h-2.5" /> Public
            </span>
          )}
          {/* Like */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onLike) {
                onLike(template);
              }
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded-md border border-white/5 transition-all ${hasLiked ? 'bg-[#23a559]/20 text-[#23a559] font-bold border-[#23a559]/25' : 'bg-[#1e1f22]/60 hover:bg-white/5'}`}
            title="Like"
          >
            <ThumbsUp className={`w-3 h-3 ${hasLiked ? 'fill-[#23a559]' : ''}`} />
            <span>{template.likes || 0}</span>
          </button>
          {/* Dislike */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onDislike) {
                onDislike(template);
              }
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded-md border border-white/5 transition-all ${hasDisliked ? 'bg-[#f23f43]/20 text-[#f23f43] font-bold border-[#f23f43]/25' : 'bg-[#1e1f22]/60 hover:bg-white/5'}`}
            title="Dislike"
          >
            <ThumbsDown className={`w-3 h-3 ${hasDisliked ? 'fill-[#f23f43]' : ''}`} />
            <span>{template.dislikes || 0}</span>
          </button>
        </div>
        
        <div className="flex gap-1 shrink-0">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onSelect(template);
            }}
            className="px-3 py-1 bg-white/5 group-hover:bg-[#5865f2] text-white text-[11px] font-bold rounded-lg transition-all border border-white/5 hover:border-transparent group-hover:shadow-[0_0_12px_rgba(88,101,242,0.35)]"
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
};

interface TemplateDetailModalProps {
  template: Template;
  onClose: () => void;
  onApply: (msg: DiscordWebhookMessage) => void;
  onLike: (template: Template) => void;
  onDislike: (template: Template) => void;
  myId: string;
  isLoggedIn: boolean;
  username: string;
  db: import('firebase/firestore').Firestore | null;
  sendNotification: (recipientId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' | 'mention' | 'message', actionUrl: string) => Promise<void>;
  onCommentAdded: (templateId: string, newComment: Comment) => void;
}

const CommentRepliesSection: React.FC<{
  comment: Comment;
  isLoggedIn: boolean;
  onPostReply: (parentCommentId: string, text: string) => Promise<void>;
  targetCommentId: string | null;
}> = ({ comment, isLoggedIn, onPostReply, targetCommentId }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if target jumping comment matches parent comment itself, or any of the nested replies
  const containsJumpingReply = useMemo(() => {
    if (!targetCommentId || !comment.replies) return false;
    return comment.replies.some(r => r.id === targetCommentId || r.authorId === targetCommentId);
  }, [comment.replies, targetCommentId]);

  // Expand if we are jumping to a reply inside this comment
  useEffect(() => {
    if (containsJumpingReply || (targetCommentId && targetCommentId === comment.id)) {
      setIsExpanded(true);
    }
  }, [containsJumpingReply, targetCommentId, comment.id]);

  useEffect(() => {
    if (isExpanded && targetCommentId) {
      setTimeout(() => {
        const el = document.getElementById(`reply-item-${targetCommentId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('bg-purple-500/25', 'ring-2', 'ring-purple-500/60');
          setTimeout(() => el.classList.remove('bg-purple-500/25', 'ring-2', 'ring-purple-500/60'), 3000);
        }
      }, 500);
    }
  }, [isExpanded, targetCommentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onPostReply(comment.id, replyText);
      setReplyText('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const replies = comment.replies || [];

  return (
    <div className="mt-2 pl-2 sm:pl-6 border-l border-zinc-800/80 space-y-2" id={`replies-container-${comment.id}`}>
      {/* Expand/Collapse Toggle Button (Showing how many replies exist) */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-zinc-400 hover:text-purple-400 transition-colors select-none cursor-pointer"
      >
        <CornerDownRight className="w-3 h-3 text-purple-500/80" />
        <span>
          {replies.length === 0
            ? "Write a reply..."
            : isExpanded
            ? `Hide replies`
            : `Show replies (${replies.length})`}
        </span>
      </button>

      {/* Replies list & Input container */}
      {isExpanded && (
        <div className="space-y-2 pt-1 animate-in slide-in-from-top-1 duration-150">
          {/* List of existing replies */}
          {replies.length > 0 && (
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-0.5 custom-scrollbar">
              {replies.map(r => (
                <div
                  key={r.id}
                  id={`reply-item-${r.id}`}
                  className="bg-[#1e1f22]/30 p-2 sm:p-2.5 rounded-lg border border-transparent transition-all duration-300"
                >
                  <div className="flex justify-between items-center text-[9px] sm:text-[10px]">
                    <div className="flex items-center gap-1.5">
                      {getAvatarUrl(r.authorId, r.authorAvatar) ? (
                        <img
                          src={getAvatarUrl(r.authorId, r.authorAvatar)!}
                          alt={r.author}
                          className="w-4 h-4 rounded-full object-cover border border-purple-500/10 shrink-0"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallbackEl = e.currentTarget.nextSibling as HTMLDivElement;
                            if (fallbackEl) fallbackEl.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className="w-4 h-4 rounded-full bg-purple-950/40 text-purple-400 border border-purple-500/10 flex items-center justify-center text-[7px] font-extrabold shrink-0"
                        style={{ display: getAvatarUrl(r.authorId, r.authorAvatar) ? 'none' : 'flex' }}
                      >
                        {r.author.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-bold text-zinc-300">@{r.author}</span>
                    </div>
                    <span className="text-zinc-505">{new Date(r.createdAt).toLocaleDateString(undefined, { dateStyle: 'short' })}</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed pl-1 break-all whitespace-pre-wrap">{r.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* Quick inline reply input form */}
          {isLoggedIn ? (
            <form onSubmit={handleSubmit} className="flex gap-1.5 items-center pt-1 animate-fade-in">
              <input
                id={`reply-input-field-${comment.id}`}
                type="text"
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder={`Type a reply to @${comment.author}...`}
                className="flex-1 bg-[#1e1f22]/80 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 text-zinc-200 placeholder-zinc-500 border border-zinc-850"
                disabled={isSubmitting}
              />
              <button
                type="submit"
                disabled={isSubmitting || !replyText.trim()}
                className="px-2.5 py-1 bg-[#4752c4] hover:bg-[#5865f2] disabled:opacity-40 text-white rounded-md text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer active:scale-95"
              >
                {isSubmitting ? (
                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                ) : (
                  <Send className="w-2.5 h-2.5" />
                )}
                <span>Reply</span>
              </button>
            </form>
          ) : (
            <p className="text-[9px] text-zinc-500 italic pl-1">Join conversation to reply.</p>
          )}
        </div>
      )}
    </div>
  );
};

const TemplateDetailModal: React.FC<TemplateDetailModalProps> = ({
  template,
  onClose,
  onApply,
  onLike,
  onDislike,
  myId,
  isLoggedIn,
  username,
  db,
  sendNotification,
  onCommentAdded
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ authorId: string; authorName: string; commentId: string } | null>(null);
  const [previewTab, setPreviewTab] = useState<'preview' | 'json'>('preview');
  const [showPreview, setShowPreview] = useState(false);
  const [jumpingCommentId, setJumpingCommentId] = useState<string | null>(null);
  
  const commentInputRef = React.useRef<HTMLTextAreaElement>(null);
  const [isFavorited, setIsFavorited] = useState(false);

  // Load and cache favorite state
  useEffect(() => {
    const stored = localStorage.getItem('discord_templates');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Template[];
        if (Array.isArray(parsed)) {
          const exists = parsed.some((t: Template) => t.id === template.id);
          setIsFavorited(exists);
        }
      } catch (err) {
        console.error(err);
      }
    }
  }, [template.id]);

  const handleToggleFavorite = async () => {
    try {
      const currentId = myId || localStorage.getItem('user_id') || 'local-user';
      const stored = localStorage.getItem('discord_templates') || '[]';
      let localTemplates: Template[] = [];
      try {
        localTemplates = JSON.parse(stored) as Template[];
        if (!Array.isArray(localTemplates)) localTemplates = [];
      } catch {
        localTemplates = [];
      }

      const alreadyFavorited = localTemplates.some((t: Template) => t.id === template.id);

      if (alreadyFavorited) {
        // Remove from favorites
        const updated = localTemplates.filter((t: Template) => t.id !== template.id);
        localStorage.setItem('discord_templates', JSON.stringify(updated));
        window.dispatchEvent(new Event('discord_templates_updated'));
        setIsFavorited(false);
        toast.info("Removed from your saved list.");
      } else {
        // Add to favorites
        const templateToSave: Template = {
          ...template,
          id: template.id,
          createdAt: template.createdAt || new Date().toISOString(),
          authorId: currentId, // Associate with current user ID to show up in "My Saved" panel
        };
        
        localTemplates.push(templateToSave);
        localStorage.setItem('discord_templates', JSON.stringify(localTemplates));
        window.dispatchEvent(new Event('discord_templates_updated'));
        setIsFavorited(true);
        toast.success("Added to favorites! Re-syncing Saved Panel...");

        // If user is logged in, sync to Firestore
        if (isLoggedIn && db) {
          try {
            // Check if there is already a template with this name/source in firestore under their account to prevent duplicates
            const q = query(
              collection(db, 'templates'),
              where('authorId', '==', currentId),
              where('name', '==', template.name)
            );
            const querySnap = await getDocs(q);
            if (querySnap.empty) {
              const { addDoc, collection } = await import('firebase/firestore');
              const templateDoc = {
                name: template.name,
                description: template.description || 'Favorited layout structure',
                author: template.author || username || 'My Account',
                authorId: currentId,
                message: JSON.parse(JSON.stringify(template.message)),
                isPublic: false, // private to their account
                downloads: (template.downloads || 0) + 1,
                createdAt: new Date().toISOString(),
                likes: template.likes || 0,
                dislikes: template.dislikes || 0,
                likedBy: template.likedBy || [],
                dislikedBy: template.dislikedBy || [],
                thumbnail: template.thumbnail || "",
                category: template.category || "Other"
              };
              await addDoc(collection(db, 'templates'), templateDoc);
              toast.success("Synchronized with your cloud account successfully!");
            }
          } catch (fireErr) {
            console.error("Failed to sync favorite to clouds:", fireErr);
          }
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while bookmarking this template.");
    }
  };

  // Jump tracking
  useEffect(() => {
    const handleJump = (e: Event) => {
      const customEvent = e as CustomEvent<{ templateId: string, commentId?: string }>;
      if (customEvent.detail && customEvent.detail.templateId === template.id) {
        if (customEvent.detail.commentId) {
          setJumpingCommentId(customEvent.detail.commentId);
        }
      }
    };
    window.addEventListener('JUMP_TO_TEMPLATE_COMMENT', handleJump as EventListener);
    return () => window.removeEventListener('JUMP_TO_TEMPLATE_COMMENT', handleJump as EventListener);
  }, [template.id]);

  // Load comments
  useEffect(() => {
    const loadComments = () => {
      let mergedComments: Comment[] = [];
      
      if (template.comments) {
        mergedComments = [...template.comments];
      }
      
      try {
        const localCommentsStr = localStorage.getItem(`comments_${template.id}`);
        if (localCommentsStr) {
          const parsed = JSON.parse(localCommentsStr) as Comment[];
          if (Array.isArray(parsed)) {
            parsed.forEach(lc => {
              if (!mergedComments.some(mc => mc.id === lc.id)) {
                mergedComments.push(lc);
              }
            });
          }
        }
      } catch (e) {
        console.error("Error loading local comments:", e);
      }

      // Sort newest first
      mergedComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setComments(mergedComments);
    };

    loadComments();
  }, [template]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error("Please sign in to join the conversation!");
      return;
    }
    if (!newCommentText.trim()) {
      toast.error("Please enter a comment!");
      return;
    }

    setIsPostingComment(true);
    const storedAvatar = localStorage.getItem('user_avatar') || '';
    const commentObj: Comment = {
      id: safeUUID(),
      author: username,
      authorId: myId,
      text: newCommentText.trim(),
      createdAt: new Date().toISOString(),
      authorAvatar: storedAvatar
    };

    try {
      // 1. Save locally for fallback
      const localCommentsStr = localStorage.getItem(`comments_${template.id}`);
      let localCommentsList: Comment[] = [];
      if (localCommentsStr) {
        try {
          localCommentsList = JSON.parse(localCommentsStr);
        } catch {
          // Fallback
        }
      }
      localCommentsList.push(commentObj);
      localStorage.setItem(`comments_${template.id}`, JSON.stringify(localCommentsList));

      // 2. Save inside Firestore
      const isMock = MOCK_ONLINE_TEMPLATES.some(t => t.id === template.id);
      if (db && !isMock && !template.id.startsWith('local_') && template.authorId) {
        const { doc, updateDoc, arrayUnion } = await import('firebase/firestore');
        const tDocRef = doc(db, 'templates', template.id);
        await updateDoc(tDocRef, {
          comments: arrayUnion(commentObj)
        });
      }

      // Update state
      setComments(prev => [commentObj, ...prev]);
      onCommentAdded(template.id, commentObj);
      setNewCommentText('');

      // Send notifications for likes / feedback
      if (replyingTo && replyingTo.authorId !== myId) {
        await sendNotification(
          replyingTo.authorId,
          'Comment Reply Received',
          `@${username} replied to your feedback comment on "${template.name}": "${commentObj.text.slice(0, 100)}"`,
          'mention',
          `template:${template.id}:comment:${commentObj.id}`
        );
      } else if (template.authorId && template.authorId !== myId) {
        await sendNotification(
          template.authorId,
          'Feedback on Layout',
          `@${username} commented on your template "${template.name}": "${commentObj.text.slice(0, 100)}"`,
          'message',
          `template:${template.id}:comment:${commentObj.id}`
        );
      }

      setReplyingTo(null);
      toast.success("Comment posted!");
    } catch (err) {
      console.error("Error adding comment:", err);
      toast.error("Failed to post comment.");
    } finally {
      setIsPostingComment(false);
    }
  };

  const handlePostReply = async (parentCommentId: string, text: string) => {
    if (!isLoggedIn) {
      toast.error("Please sign in to write replies!");
      return;
    }
    const cleanText = text.trim();
    if (!cleanText) {
      toast.error("Reply text cannot be empty!");
      return;
    }

    const parentComment = comments.find(c => c.id === parentCommentId);
    if (!parentComment) return;

    const storedAvatar = localStorage.getItem('user_avatar') || '';
    const replyObj: CommentReply = {
      id: safeUUID(),
      author: username,
      authorId: myId,
      text: cleanText,
      createdAt: new Date().toISOString(),
      authorAvatar: storedAvatar
    };

    const updatedComments = comments.map(c => {
      if (c.id === parentCommentId) {
        return {
          ...c,
          replies: [...(c.replies || []), replyObj]
        };
      }
      return c;
    });

    try {
      localStorage.setItem(`comments_${template.id}`, JSON.stringify(updatedComments));

      const isMock = MOCK_ONLINE_TEMPLATES.some(t => t.id === template.id);
      if (db && !isMock && !template.id.startsWith('local_') && template.authorId) {
        const { doc, updateDoc } = await import('firebase/firestore');
        const tDocRef = doc(db, 'templates', template.id);
        await updateDoc(tDocRef, {
          comments: updatedComments
        });
      }

      setComments(updatedComments);
      
      const parentObj = updatedComments.find(c => c.id === parentCommentId);
      if (parentObj) {
        onCommentAdded(template.id, parentObj);
      }

      if (parentComment.authorId && parentComment.authorId !== myId) {
        await sendNotification(
          parentComment.authorId,
          'Comment Reply Received',
          `@${username} replied to your feedback comment on "${template.name}": "${cleanText.slice(0, 100)}"`,
          'mention',
          `template:${template.id}:comment:${replyObj.id}`
        );
      }

      toast.success("Reply posted!");
    } catch (err) {
      console.error("Error posting nested reply:", err);
      toast.error("Failed to post reply.");
    }
  };

  const handleReplyClick = (authorId: string, authorName: string, commentId: string) => {
    setReplyingTo({ authorId, authorName, commentId });
    setJumpingCommentId(commentId);
    
    setTimeout(() => {
      const field = document.getElementById(`reply-input-field-${commentId}`) as HTMLInputElement;
      if (field) {
        field.focus();
      }
    }, 150);
  };

  const likedBy = template.likedBy || [];
  const dislikedBy = template.dislikedBy || [];
  const hasLiked = likedBy.includes(myId);
  const hasDisliked = dislikedBy.includes(myId);

  return createPortal(
    <div className="fixed inset-0 z-[200] bg-[#111214]/98 text-white flex flex-col w-screen h-screen overflow-hidden animate-fade-in backdrop-blur-sm">
      
      {/* Immersive Header matching app UI perfectly with no bold borders */}
      <div className="p-4 sm:p-5 border-b border-zinc-900 flex items-center bg-[#1e1f22]/95 backdrop-blur-md shrink-0 justify-between sticky top-0 z-[210] shadow-md">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 -ml-2 text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-full transition-all duration-150 active:scale-90 cursor-pointer"
            title="Back to Templates"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 h-6" />
          </button>
          <div className="flex flex-col">
            <h2 className="text-base sm:text-xl font-bold text-white truncate max-w-[240px] sm:max-w-[480px] leading-tight">
              {template.name}
            </h2>
            <p className="text-[10px] text-zinc-400 font-sans tracking-wide mt-0.5">Template Directory & Workspace</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="text-zinc-400 hover:text-white hover:bg-zinc-800/60 p-2 rounded-full transition-all shrink-0 font-medium text-sm flex items-center gap-1.5 px-3 border border-zinc-800 cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span className="hidden sm:inline">Close</span>
        </button>
      </div>

      {/* Main Full-Screen Scroll Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#111214] custom-scrollbar">
        <div className="max-w-[1100px] mx-auto w-full space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-3 duration-250">
          
          {/* 1. Main Banner Image on top */}
          {template.thumbnail ? (
            <div className="w-full h-56 sm:h-80 rounded-2xl overflow-hidden relative shadow-lg bg-[#1e1f22] border border-zinc-850/60 group">
              <SafeTemplateImage 
                src={template.thumbnail} 
                alt={template.name} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.01]" 
                size="normal"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent flex items-end justify-between p-6">
                <span className="bg-purple-650/90 text-[10px] font-black tracking-widest uppercase px-3 py-1 bg-purple-650 border border-purple-500/20 text-white rounded-md shadow-md">
                  {template.category || "Other"}
                </span>
                {template.thumbnailPoster && (
                  <div className="bg-black/60 backdrop-blur-md text-[10px] sm:text-xs font-bold text-zinc-200 border border-white/5 rounded-md px-3 py-1 flex items-center gap-1 shadow select-none">
                    <span className="text-purple-400 font-extrabold uppercase text-[9px] tracking-wider">Cover Poster:</span>
                    <span className="text-white font-extrabold">@{template.thumbnailPoster}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full h-44 sm:h-64 rounded-2xl bg-gradient-to-tr from-indigo-950/40 via-blue-900/10 to-purple-950/35 border border-zinc-855/80 flex flex-col items-center justify-center p-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
              <div className="absolute top-1/4 left-1/3 w-36 h-36 rounded-full bg-blue-500/10 blur-[80px] animate-pulse" />
              <div className="absolute bottom-1/4 right-1/3 w-40 h-40 rounded-full bg-purple-500/10 blur-[90px] animate-pulse delay-700" />
              <MessageSquare className="w-14 h-14 text-purple-400/40 mb-3 animate-bounce" style={{ animationDuration: '6s' }} />
              <span className="text-zinc-200 text-sm sm:text-base font-extrabold tracking-wide uppercase">Discord Layout Template</span>
              <span className="text-zinc-400 text-xs mt-1.5 font-medium/80 max-w-sm text-center">A gorgeous structured community payload awaiting integration</span>
            </div>
          )}

          {/* Re-ordered Layout matching user's specific request */}
          <div className="max-w-[820px] mx-auto w-full space-y-5 mt-4">
            
            {/* Template Poster & Community Stats Card directly below high-quality thumbnail */}
            <div className="bg-[#1e1f22] border border-zinc-800 rounded-2xl p-5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Creator info */}
              <div className="flex items-center gap-3">
                {getAvatarUrl(template.authorId, template.authorAvatar) ? (
                  <img 
                    src={getAvatarUrl(template.authorId, template.authorAvatar)!} 
                    alt={template.author} 
                    className="w-12 h-12 rounded-full object-cover border border-purple-500/10 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 to-[#5865f2] text-white flex items-center justify-center font-bold text-sm shrink-0 uppercase shadow-md shadow-purple-500/10">
                    {template.author.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-[9px] font-extrabold text-purple-400 uppercase tracking-widest block font-sans">Created By</span>
                  <h4 className="font-extrabold text-white text-base truncate leading-tight mt-0.5">@{template.author}</h4>
                  <span className="text-[10px] text-zinc-400 block mt-0.5 font-sans leading-none">
                    {template.createdAt ? `Joined ${new Date(template.createdAt).toLocaleDateString(undefined, { dateStyle: 'short' })}` : "Community Creator"}
                  </span>
                </div>
              </div>

              {/* Other details inside the creator card */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Category Badge */}
                <div className="flex items-center gap-1.5 bg-purple-500/10 px-3 py-1.5 rounded-xl border border-purple-500/15 text-purple-400 font-bold uppercase tracking-wider text-[10px] font-sans h-9">
                  <Tag className="w-3 h-3" />
                  <span>{template.category || "Other"}</span>
                </div>

                {/* Global usage badge */}
                <div className="flex items-center gap-1.5 bg-zinc-900/60 px-3 py-1.5 rounded-xl border border-zinc-805 text-zinc-350 font-bold font-sans text-xs h-9">
                  <Download className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{(template.downloads || 0) + 118} loads</span>
                </div>
              </div>
            </div>

            {/* Interactive Action Options & Apply buttons list */}
            <div className="bg-[#1e1f22]/50 border border-zinc-800/80 p-5 rounded-2xl shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                {/* Apply main action */}
                <button
                  type="button"
                  onClick={() => {
                    onApply(template.message);
                    onClose();
                    toast.success(`Success! Embedded structure applied to your message visualizer!`);
                  }}
                  className="px-6 py-3 bg-[#5865f2] hover:bg-[#4752c4] active:bg-[#3c45ab] text-white font-extrabold text-sm rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer flex-1"
                >
                  <Send className="w-4 h-4" />
                  <span>Apply Layout Template</span>
                </button>

                {/* Reactions & utility grid */}
                <div className="flex items-center gap-2 justify-center">
                  {/* Upvote support */}
                  <button
                    type="button"
                    onClick={() => onLike(template)}
                    className={`flex items-center justify-center gap-1.5 p-3 rounded-xl border transition-all text-xs font-semibold cursor-pointer h-11 ${
                      hasLiked 
                        ? 'bg-[#23a559]/15 text-[#23a559] border-[#23a559]/40 shadow-sm shadow-[#23a559]/10' 
                        : 'bg-[#151618] text-[#949ba4] border-zinc-800 hover:text-[#dbdee1] hover:bg-zinc-800/40'
                    }`}
                    title="Vote useful"
                  >
                    <ThumbsUp className={`w-4 h-4 ${hasLiked ? 'fill-[#23a559]' : ''}`} />
                    <span className="font-bold text-xs">{template.likes || 0}</span>
                  </button>

                  {/* Downvote */}
                  <button
                    type="button"
                    onClick={() => onDislike(template)}
                    className={`flex items-center justify-center gap-1.5 p-3 rounded-xl border transition-all text-xs font-semibold cursor-pointer h-11 ${
                      hasDisliked 
                        ? 'bg-[#f23f43]/15 text-[#f23f43] border-[#f23f43]/40 shadow-sm shadow-[#f23f43]/10' 
                        : 'bg-[#151618] text-[#949ba4] border-zinc-800 hover:text-[#dbdee1] hover:bg-zinc-800/40'
                    }`}
                    title="Vote not useful"
                  >
                    <ThumbsDown className={`w-4 h-4 ${hasDisliked ? 'fill-[#f23f43]' : ''}`} />
                    <span className="font-bold text-xs">{template.dislikes || 0}</span>
                  </button>

                  {/* Saved Favorites */}
                  <button
                    type="button"
                    onClick={handleToggleFavorite}
                    className={`flex items-center justify-center gap-1.5 p-3 rounded-xl border transition-all text-xs font-bold cursor-pointer h-11 ${
                      isFavorited 
                        ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' 
                        : 'bg-[#151618] text-[#949ba4] border-zinc-800 hover:text-rose-400 hover:bg-zinc-800/40'
                    }`}
                    title="Save copy to favorites list"
                  >
                    <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-500 text-rose-500 animate-pulse' : ''}`} />
                    <span className="hidden sm:inline">{isFavorited ? "Saved" : "Save"}</span>
                  </button>

                  {/* Share option link copier */}
                  <button
                    type="button"
                    onClick={async () => {
                      const shareUrl = `${window.location.origin}?templateId=${template.id}`;
                      try {
                        await navigator.clipboard.writeText(shareUrl);
                        toast.success("Share link copied to clipboard!");
                      } catch (err) {
                        console.error(err);
                        toast.error("Failed to copy share link.");
                      }
                    }}
                    className="flex items-center justify-center gap-1.5 p-3 bg-[#151618] hover:bg-[#202225] border border-zinc-800 transition-all text-[#949ba4] text-xs font-bold cursor-pointer h-11 rounded-xl"
                    title="Copy share link to Clipboard"
                  >
                    <Share2 className="w-4 h-4 text-sky-450" />
                    <span className="hidden sm:inline">Share</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Collapsible dropdown Live Preview Simulator panel (CLOSED BY DEFAULT) */}
            <div className="bg-[#1e1f22]/30 border border-zinc-850 rounded-2xl overflow-hidden transition-all duration-300">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="w-full px-5 py-4 flex items-center justify-between text-zinc-200 hover:text-white bg-[#1e1f22]/60 hover:bg-[#1e1f22]/90 transition-all cursor-pointer select-none font-bold text-sm sm:text-base"
              >
                <span className="flex items-center gap-2.5">
                  <MessageSquare className="w-4.5 h-4.5 text-purple-400 animate-pulse" />
                  <span>Interactive Live Preview Simulation</span>
                  <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded font-black uppercase tracking-widest leading-none sm:inline hidden">
                    {showPreview ? "Open" : "Closed"}
                  </span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400 font-sans hidden sm:inline">
                    {showPreview ? "Click to collapse" : "Click to expand preview simulator"}
                  </span>
                  {showPreview ? (
                    <ChevronUp className="w-5 h-5 text-purple-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-zinc-400 shrink-0" />
                  )}
                </div>
              </button>

              {showPreview && (
                <div className="p-5 space-y-4 bg-[#1e1f22]/80 border-t border-zinc-800/80 animate-in slide-in-from-top-3 duration-200">
                  {/* Embedded sub-tabs selector */}
                  <div className="flex flex-col sm:flex-row gap-2 justify-between sm:items-center bg-zinc-900/60 p-2 rounded-xl border border-zinc-800/65">
                    <span className="flex items-center gap-2 pl-1.5">
                      <MessageSquare className="w-4.5 h-4.5 text-purple-400" />
                      <span className="text-xs font-black text-zinc-200">Interactive Preview Simulator</span>
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setPreviewTab('preview')}
                        type="button"
                        className={`px-3.5 py-1 text-[11px] font-extrabold rounded-md transition-all cursor-pointer ${
                          previewTab === 'preview' ? 'bg-[#5865f2] text-white shadow-md' : 'text-[#949ba4] hover:text-[#dbdee1]'
                        }`}
                      >
                        Chat View
                      </button>
                      <button
                        onClick={() => setPreviewTab('json')}
                        type="button"
                        className={`px-3.5 py-1 text-[11px] font-extrabold rounded-md transition-all cursor-pointer ${
                          previewTab === 'json' ? 'bg-[#5865f2] text-white shadow-md' : 'text-[#949ba4] hover:text-[#dbdee1]'
                        }`}
                      >
                        JSON Output
                      </button>
                    </div>
                  </div>

                  {/* Simulated view panel */}
                  <div className="bg-[#313338] rounded-xl overflow-hidden min-h-[220px] max-h-[420px] flex flex-col border border-zinc-800 relative shadow-inner">
                    {previewTab === 'preview' ? (
                      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <div className="text-[9px] font-bold text-[#5fa2f3] mb-3 uppercase tracking-widest bg-[#4752c4]/20 px-2.5 py-1 rounded inline-block">💬 Client Feed Simulator</div>
                        <MessagePreview message={template.message} previewType="chat" darkMode={true} />
                      </div>
                    ) : (
                      <div className="relative flex-1 flex flex-col min-h-0 bg-[#1e1f22]/50">
                        <pre className="flex-1 overflow-y-auto p-4 text-[10px] sm:text-[11px] font-mono text-emerald-400 select-all custom-scrollbar">
                          {JSON.stringify(template.message, null, 2)}
                        </pre>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(template.message, null, 2));
                            toast.success("Payload JSON copied!");
                          }}
                          className="absolute top-2.5 right-2.5 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-[9px] font-bold transition-all border border-zinc-700 cursor-pointer shadow-md"
                        >
                          Copy JSON
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Description Details bento block */}
            <div className="bg-[#1e1f22] border border-zinc-800 rounded-2xl p-6 shadow-sm space-y-2">
              <h4 className="text-[10px] font-extrabold text-purple-400 uppercase tracking-wider font-sans">Description Details</h4>
              <p className="text-sm sm:text-base text-[#dbdee1] leading-relaxed font-normal whitespace-pre-wrap pl-0.5">
                {template.description || "The publisher provided no detailed description."}
              </p>
            </div>

              {/* Discussion Board Panel */}
              <div className="bg-[#1e1f22] border border-zinc-800 p-5 rounded-2xl space-y-4 shadow-sm">
                <h3 className="font-extrabold text-xs text-[#b5bac1] uppercase tracking-wider flex items-center gap-2 border-b border-zinc-850/60 pb-3">
                  <MessageSquare className="w-4 h-4 text-[#949ba4]" />
                  <span>Discussion Board ({comments.length})</span>
                </h3>

                {/* Comment form inside left sheet */}
                <form onSubmit={handlePostComment} className="space-y-2.5">
                  {/* Replying target header preview */}
                  {replyingTo && (
                    <div className="bg-[#111214] border-l-2 border-purple-500 px-3 py-2 rounded-r-xl flex items-center justify-between text-xs text-zinc-400 animate-in slide-in-from-top-1 duration-150">
                      <span className="truncate">
                        Replying to <span className="text-purple-400 font-bold">@{replyingTo.authorName}</span>
                      </span>
                      <button 
                        type="button" 
                        onClick={() => setReplyingTo(null)}
                        className="p-1 text-zinc-500 hover:text-white rounded-full hover:bg-zinc-850 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="relative">
                    <textarea
                      ref={commentInputRef}
                      value={newCommentText}
                      onChange={e => setNewCommentText(e.target.value)}
                      placeholder={isLoggedIn ? "Say something or give suggestions about this layout..." : "Join the discussion after logging in!"}
                      disabled={!isLoggedIn || isPostingComment}
                      className="w-full bg-[#111214] border border-zinc-850 focus:border-purple-500/80 rounded-xl px-4 py-3 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-purple-500/40 text-[#dbdee1] min-h-[90px] resize-none disabled:opacity-55 placeholder-[#949ba4] font-normal transition-all"
                    />
                    {!isLoggedIn && (
                      <div className="absolute inset-0 bg-[#1e1f22]/95 backdrop-blur-[1px] flex flex-col items-center justify-center rounded-xl p-2 text-center select-none">
                        <span className="text-xs text-[#949ba4] font-semibold mb-2">Log in to post a comment feedback</span>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            document.dispatchEvent(new CustomEvent('OPEN_ACCOUNT_SETTINGS'));
                          }}
                          className="px-4 py-1.5 bg-[#5865f2] hover:bg-[#4752c4] text-white text-[10px] uppercase font-bold rounded-lg transition-all cursor-pointer shadow-lg shadow-[#5a65f2]/10 active:scale-95"
                        >
                          Log In
                        </button>
                      </div>
                    )}
                  </div>
                  {isLoggedIn && (
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isPostingComment || !newCommentText.trim()}
                        className="px-5 py-2 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-[#fff] text-xs sm:text-sm font-extrabold rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50 active:scale-95 cursor-pointer shadow hover:shadow-purple-500/10"
                      >
                        {isPostingComment && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>Post Comment</span>
                      </button>
                    </div>
                  )}
                </form>

                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                  {comments.length > 0 ? (
                    comments.map(c => (
                      <div 
                        key={c.id} 
                        id={`comment-item-${c.id}`}
                        className="bg-[#111214]/60 border border-zinc-850 p-4 rounded-xl space-y-2 relative transition-all duration-300 hover:border-zinc-800"
                      >
                        <div className="flex justify-between items-center text-[11px] sm:text-xs">
                          <div className="flex items-center gap-2">
                            {getAvatarUrl(c.authorId, c.authorAvatar) ? (
                              <img 
                                src={getAvatarUrl(c.authorId, c.authorAvatar)!} 
                                alt={c.author} 
                                className="w-7 h-7 rounded-full object-cover border border-purple-550/20 shrink-0 shadow-sm" 
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-[#5865f2]/10 text-[#5865f2] border border-[#5865f2]/10 flex items-center justify-center text-[9px] font-black shrink-0">
                                {c.author.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <span className="font-bold text-[#dbdee1]">@{c.author}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-zinc-500 font-sans">{new Date(c.createdAt).toLocaleDateString(undefined, { dateStyle: 'short' })}</span>
                            {isLoggedIn && (
                              <button
                                type="button"
                                onClick={() => handleReplyClick(c.authorId, c.author, c.id)}
                                className="text-purple-400 hover:text-purple-300 hover:underline font-bold transition-all duration-150 active:scale-95 cursor-pointer"
                              >
                                Reply
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-[#dbdee1] leading-relaxed break-all whitespace-pre-wrap pl-1">{c.text}</p>
                        
                        {/* Collapsible Nested Replies */}
                        <CommentRepliesSection
                          comment={c}
                          isLoggedIn={isLoggedIn}
                          onPostReply={handlePostReply}
                          targetCommentId={jumpingCommentId}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-7 text-zinc-500 bg-[#111214]/40 rounded-xl border border-dashed border-zinc-850">
                      <span className="text-xs font-medium">Be the first to join the conversation! Type comments above.</span>
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>,
    document.body
  );
};

