import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Plus, Smile, Hash, Search, ArrowLeft, Gift, LayoutGrid, Mic } from 'lucide-react';
import { DiscordWebhookMessage } from '../types';
import { MessagePreview } from './MessagePreview';
import { cn } from '../utils';
import { useVirtualKeyboard } from '../contexts/VirtualKeyboardContext';

interface ChatMessage {
  id: string;
  sender: {
    name: string;
    avatar: string;
    isBot: boolean;
  };
  content: string;
  timestamp: Date;
  isTemp?: boolean;
}

interface DiscordMobileChatProps {
  message: DiscordWebhookMessage;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webhookData: any;
  onExit: () => void;
  channelName: string;
}

export const DiscordMobileChat: React.FC<DiscordMobileChatProps> = ({ message, webhookData, onExit, channelName }) => {
  const [inputText, setInputText] = useState('');
  const [tempMessages, setTempMessages] = useState<ChatMessage[]>([]);
  const [showNitroModal, setShowNitroModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const { isOpen: isKeyboardOpen, openKeyboard } = useVirtualKeyboard();
  
  const [randomBg] = useState(() => {
    const colors = ['#EB459E', '#ED4245', '#57F187', '#5865F2'];
    return colors[Math.floor(Math.random() * colors.length)];
  });

  // User profile from localStorage
  const username = localStorage.getItem('username') || 'You';
  const avatar = localStorage.getItem('user_avatar');
  const userId = localStorage.getItem('user_id');
  const userAvatarUrl = avatar && userId ? `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png` : '';

  const handleSendMessage = (content?: string) => {
    const text = content || inputText;
    if (!text.trim()) return;
    
    const newMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      sender: {
        name: username,
        avatar: userAvatarUrl || 'U',
        isBot: false
      },
      content: text,
      timestamp: new Date(),
      isTemp: true
    };
    
    setTempMessages(prev => [...prev, newMsg]);
    if (!content) setInputText('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleSendMessage(`📎 Attached file: ${file.name}`);
    }
  };

  const sendNitroGift = (tier: string) => {
    const giftMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      sender: {
        name: username,
        avatar: userAvatarUrl || 'U',
        isBot: false
      },
      content: `🎁 Sent a Nitro ${tier} Gift!`,
      timestamp: new Date(),
      isTemp: true
    };
    setTempMessages(prev => [...prev, giftMsg]);
    setShowNitroModal(false);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [tempMessages]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed inset-0 z-[600] bg-[#313338] flex flex-col font-sans text-white overflow-hidden",
        isKeyboardOpen && "pb-[280px]"
      )}
    >
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        className="hidden" 
      />

      {/* Discord Header - Matched to Image */}
      <div className="h-[52px] bg-[#313338] border-b border-black/10 flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onExit} className="text-[#DBDEE1]">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Hash className="w-5 h-5 text-[#949BA4]" />
            <div className="flex items-center gap-1">
              <span className="font-bold text-base leading-tight text-[#f2f3f5]">{channelName}</span>
              <ArrowLeft className="w-3 h-3 text-[#949BA4] rotate-180 ml-0.5" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-5 text-[#DBDEE1]">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-[#23a559] border-2 border-[#313338]" />
            <span className="text-[10px] text-[#949BA4] font-medium">1 Online</span>
          </div>
          <Search className="w-6 h-6" />
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar bg-[#313338]"
      >
        {/* Date Separator */}
        <div className="flex items-center gap-4 my-6">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs font-bold text-[#949BA4] shrink-0">May 3, 2026</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* The Actual Webhook Message - Matched to image structure */}
        <div className="relative group mb-8">
            <div className="flex gap-4">
                <div 
                    className="w-[40px] h-[40px] rounded-full flex items-center justify-center shrink-0 overflow-hidden shadow-lg mt-0.5" 
                    style={{ backgroundColor: webhookData?.avatar ? 'transparent' : randomBg }}
                >
                    {webhookData?.avatar ? (
                        <img src={webhookData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                             <img src="https://cdn.discordapp.com/embed/avatars/0.png" alt="Default Avatar" className="w-[60%] h-[60%] opacity-80" />
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-bold text-base text-white hover:underline cursor-pointer leading-none">{webhookData?.name || 'Webhook'}</span>
                        <span className="bg-[#5865f2] text-[10px] px-1.5 rounded-[3px] font-bold uppercase py-0.5 text-white leading-none flex items-center h-4">APP</span>
                        <span className="text-[11px] text-[#949BA4] font-medium ml-1">Yesterday at 9:57 PM</span>
                    </div>
                    <div className="text-[#dbdee1] leading-relaxed">
                        <MessagePreview message={message} webhookData={webhookData} darkMode={true} />
                        
                        {/* Buttons section */}
                        {message.components && message.components.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                                {message.components.flatMap(row => row.components).map((btn, bIdx) => (
                                    <button 
                                        key={bIdx}
                                        className={cn(
                                            "px-4 py-2 rounded-[3px] text-sm font-medium flex items-center gap-2 transition-all active:scale-95",
                                            btn.style === 1 ? "bg-[#5865f2] hover:bg-[#4752c4] text-white" :
                                            btn.style === 2 ? "bg-[#4e5058] hover:bg-[#6d6f78] text-white" :
                                            btn.style === 3 ? "bg-[#248046] hover:bg-[#1a6334] text-white" :
                                            btn.style === 4 ? "bg-[#da373c] hover:bg-[#a12828] text-white" :
                                            "bg-[#4e5058] hover:bg-[#6d6f78] text-white"
                                        )}
                                    >
                                        {btn.label}
                                        {btn.style === 5 && (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Temporary Messages */}
        <AnimatePresence mode="popLayout">
          {tempMessages.map(msg => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex gap-4 group mb-4"
            >
                <div 
                    className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden shadow-md"
                    style={{ backgroundColor: msg.sender.avatar && msg.sender.avatar !== 'U' ? 'transparent' : randomBg }}
                >
                    {msg.sender.avatar && msg.sender.avatar !== 'U' ? (
                        <img src={msg.sender.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-black text-white">
                             {msg.sender.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-sm hover:underline cursor-pointer">{msg.sender.name}</span>
                        <span className="text-[10px] text-[#949BA4] font-medium">Just now</span>
                    </div>
                    {msg.content.startsWith('🎁') ? (
                       <div className="mt-2 p-4 bg-[#232428] rounded-lg border border-[#1e1f22] max-w-sm">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#ff73fa] rounded-lg flex items-center justify-center shadow-lg transform rotate-3">
                               <Gift className="w-7 h-7 text-white" />
                            </div>
                            <div className="flex-1">
                               <p className="text-white font-bold">You received a gift!</p>
                               <p className="text-[#b5bac1] text-xs">Nitro monthly</p>
                            </div>
                            <button className="px-4 py-1.5 bg-[#248046] hover:bg-[#1a6334] rounded-[3px] text-xs font-bold text-white transition-colors">
                               Accept
                            </button>
                          </div>
                       </div>
                    ) : (
                      <p className="text-sm text-[#DBDEE1] whitespace-pre-wrap">{msg.content}</p>
                    )}
                </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input Area - Matched to Image */}
      <div className={cn(
        "p-4 bg-[#313338] transition-all duration-300",
        isKeyboardOpen ? "pb-2" : "pb-6"
      )}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 text-[#B5BAC1]">
            <Plus 
              onClick={() => fileInputRef.current?.click()}
              className="w-6 h-6 p-0.5 bg-white/10 rounded-full text-white cursor-pointer hover:bg-white/20 transition-colors" 
            />
            <LayoutGrid className="w-6 h-6 opacity-60" />
            <Gift 
              onClick={() => setShowNitroModal(true)}
              className="w-6 h-6 cursor-pointer hover:text-white transition-colors" 
            />
          </div>
          
          <div className="bg-[#383A40] rounded-full flex-1 flex items-center px-4 py-2 gap-2 min-h-[40px]">
             <input 
               ref={chatInputRef}
               value={inputText}
               onFocus={() => chatInputRef.current && openKeyboard(chatInputRef.current)}
               onChange={(e) => setInputText(e.target.value)}
               onKeyDown={(e) => {
                 if (e.key === 'Enter') {
                   e.preventDefault();
                   handleSendMessage();
                 }
               }}
               placeholder={`Message #${channelName}`}
               className="bg-transparent flex-1 focus:outline-none text-sm text-[#DBDEE1] placeholder-[#949BA4]"
             />
             <Smile 
               onClick={() => chatInputRef.current && openKeyboard(chatInputRef.current)}
               className="w-6 h-6 text-[#B5BAC1] cursor-pointer hover:text-white transition-colors" 
             />
          </div>

          <button 
            onClick={inputText.trim() ? () => handleSendMessage() : undefined}
            className="text-[#DBDEE1] hover:text-white transition-all transform active:scale-90"
          >
            {inputText.trim() ? (
              <Send className="w-6 h-6 text-[#5865F2]" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Nitro Gift Modal */}
      <AnimatePresence>
        {showNitroModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[300] bg-black/80 flex items-end justify-center sm:items-center sm:p-4"
            onPointerDown={() => setShowNitroModal(false)}
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              onPointerDown={e => e.stopPropagation()}
              className="w-full sm:max-w-md bg-[#2b2d31] rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl border-t border-white/5"
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-[#ff73fa] rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-pink-500/20 transform -rotate-6">
                  <Gift className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-black text-white">Gift Nitro</h3>
                <p className="text-[#b5bac1] text-sm">Select a gift to send to this channel.</p>
                
                <div className="grid grid-cols-1 gap-3 py-4">
                   <button 
                    onClick={() => sendNitroGift('Monthly')}
                    className="p-4 bg-[#383a40] hover:bg-[#404249] rounded-xl flex items-center justify-between border border-white/5 transition-all active:scale-95 group text-left"
                   >
                     <div>
                       <p className="font-bold text-white">Nitro Monthly</p>
                       <p className="text-xs text-[#b5bac1]">Standard Nitro Monthly Gift</p>
                     </div>
                     <Send className="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                   </button>
                   <button 
                    onClick={() => sendNitroGift('Basic')}
                    className="p-4 bg-[#383a40] hover:bg-[#404249] rounded-xl flex items-center justify-between border border-white/5 transition-all active:scale-95 group text-left"
                   >
                     <div>
                       <p className="font-bold text-white">Nitro Basic</p>
                       <p className="text-xs text-[#b5bac1]">Essential Nitro Basic Gift</p>
                     </div>
                     <Send className="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                   </button>
                </div>

                <button 
                  onClick={() => setShowNitroModal(false)}
                  className="w-full py-3 text-zinc-400 font-bold hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

