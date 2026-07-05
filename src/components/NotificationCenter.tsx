import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Check, Trash2, X, MessageSquare, AtSign, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { useNotifications, AppNotification } from '../context/NotificationContext';
import { cn } from '@/utils';
import { playButtonSound } from '@/utils/sounds';

export interface NotificationCenterProps {
  variant?: 'default' | 'menu-item';
  forceOpen?: boolean;
  onOpenStateChange?: (isOpen: boolean) => void;
}

export function NotificationCenter({ variant = 'default', forceOpen, onOpenStateChange }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(forceOpen || false);
  const [prevForceOpen, setPrevForceOpen] = useState(forceOpen);
  
  if (forceOpen !== prevForceOpen) {
    setPrevForceOpen(forceOpen);
    if (forceOpen !== undefined && forceOpen !== isOpen) {
      setIsOpen(forceOpen);
    }
  }

  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll, deleteNotification } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    onOpenStateChange?.(isOpen);
  }, [isOpen, onOpenStateChange]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    playButtonSound();
    setIsOpen(!isOpen);
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'info': return <Info className="w-4 h-4 text-blue-400" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'mention': return <AtSign className="w-4 h-4 text-purple-400" />;
      case 'message': return <MessageSquare className="w-4 h-4 text-cyan-400" />;
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {!forceOpen && (
        variant === 'default' ? (
          <button
            onClick={toggleDropdown}
            className={cn(
              "relative p-1.5 rounded transition-colors",
              isOpen ? "bg-[#222] text-white" : "text-zinc-400 hover:text-white hover:bg-[#222]"
            )}
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#121212]">
                <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></span>
              </span>
            )}
          </button>
        ) : (
          <button
            onClick={toggleDropdown}
            className={cn(
              "relative flex flex-col items-center justify-center aspect-square rounded-[1.5rem] transition-all active:scale-95 overflow-hidden",
              isOpen || unreadCount > 0
                ? "bg-amber-500/20 text-amber-500 border border-amber-500/30" 
                : "bg-[#1a1a1a] text-zinc-400 border border-white/5"
            )}
          >
            <Bell className="w-6 h-6 mb-2 text-zinc-500" />
            <span className="text-[9px] font-black uppercase tracking-tight">Alerts</span>
            {unreadCount > 0 && (
              <div className="absolute top-4 right-4 w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                <div className="absolute inset-0 bg-amber-500 rounded-full animate-ping opacity-50" />
              </div>
            )}
          </button>
        )
      )}

      <AnimatePresence>
        {isOpen && (
          <>
            {(isMobile || forceOpen) && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000]"
              />
            )}
            <motion.div
              initial={(isMobile || forceOpen) ? { y: '100%' } : { opacity: 0, y: 10, scale: 0.95 }}
              animate={(isMobile || forceOpen) ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
              exit={(isMobile || forceOpen) ? { y: '100%' } : { opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={cn(
                "flex flex-col bg-[#1A1C1F]/98 backdrop-blur-2xl shadow-2xl border border-white/10 z-[1001] overflow-hidden",
                (isMobile || forceOpen) 
                  ? "fixed bottom-0 left-0 right-0 h-[80vh] rounded-t-[2.5rem]" 
                  : "absolute right-0 mt-2 w-80 max-h-[500px] rounded-2xl"
              )}
            >
              {/* Header */}
              <div className={cn(
                "flex items-center justify-between p-4 border-b border-white/5 bg-white/5",
                isMobile ? "py-6 px-8" : "p-4"
              )}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-xl">
                    <Bell className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-base">Center Notifications</h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Updates & Mentions</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <button 
                      onClick={() => { playButtonSound(); markAllAsRead(); }}
                      className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                      title="Mark all as read"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  )}
                  <button 
                    onClick={() => { playButtonSound(); setIsOpen(false); }}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-500">
                  <Bell className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-sm font-medium">No notifications yet</p>
                  <p className="text-xs mt-1">We'll let you know when something happens.</p>
                </div>
              ) : (
                notifications.map(notification => (
                  <motion.div
                    layout
                    key={notification.id}
                    className={cn(
                      "group relative flex flex-col p-3 rounded-xl border border-transparent transition-all",
                      notification.read 
                        ? "bg-transparent hover:bg-white/5" 
                        : "bg-indigo-500/10 border-indigo-500/20 shadow-[0_4px_12px_rgba(99,102,241,0.05)]"
                    )}
                    onClick={() => {
                      if (!notification.read) markAsRead(notification.id);
                      if (notification.actionUrl) {
                        if (notification.actionUrl.startsWith('template:')) {
                          // Parse action link format: template:templateId:comment:commentId
                          const parts = notification.actionUrl.split(':');
                          const templateId = parts[1];
                          const commentId = parts[3];
                          
                          // 1. Switch active app view perspective
                          window.dispatchEvent(new CustomEvent('SWITCH_APP_TAB', { detail: 'templates' }));
                          
                          // 2. Schedule focus on specified template layout and scroll to exact reply card
                          setTimeout(() => {
                            window.dispatchEvent(new CustomEvent('JUMP_TO_TEMPLATE_COMMENT', {
                              detail: { templateId, commentId }
                            }));
                          }, 150);
                          
                          setIsOpen(false);
                        } else {
                          window.open(notification.actionUrl, '_blank');
                        }
                      }
                    }}
                  >
                    <div className="flex gap-3">
                      <div className="mt-0.5 shrink-0">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={cn(
                            "text-sm font-bold truncate",
                            notification.read ? "text-zinc-300" : "text-white"
                          )}>
                            {notification.title}
                          </h4>
                          <span className="text-[10px] whitespace-nowrap text-zinc-500 font-medium">
                            {formatTime(notification.timestamp)}
                          </span>
                        </div>
                        <p className={cn(
                          "text-xs mt-1 line-clamp-2",
                          notification.read ? "text-zinc-500" : "text-zinc-400 font-medium"
                        )}>
                          {notification.message}
                        </p>
                      </div>
                    </div>
                    
                    {/* Hover Actions */}
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-[#2B2D31] p-1 rounded-lg border border-white/10 shadow-lg">
                      {!notification.read && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                          className="p-1 text-zinc-400 hover:text-green-400 hover:bg-white/10 rounded transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                        className="p-1 text-zinc-400 hover:text-red-400 hover:bg-white/10 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-2 border-t border-white/10 bg-[#1a1a1a]/50">
                <button
                  onClick={() => { playButtonSound(); clearAll(); }}
                  className="w-full py-2 flex items-center justify-center gap-2 text-xs font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear All Notifications
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </div>
  );
}
