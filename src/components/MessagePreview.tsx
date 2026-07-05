import React from 'react';
import { cn, isValidUrl } from '@/utils';
import { DiscordWebhookMessage, DiscordEmbed } from '@/types';
import { Hash } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface PreviewProps {
  message: DiscordWebhookMessage;
  webhookData?: { name?: string, avatar?: string } | null;
  darkMode?: boolean;
  previewType?: 'default' | 'chat';
  channelName?: string;
}

const MarkdownRenderer = React.memo(({ content, className, darkMode = true }: { content: string, className?: string, darkMode?: boolean }) => {
  return (
    <div className={cn("markdown-body", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          p: ({node, ...props}) => <p className="mb-1 last:mb-0" {...props} />,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          a: ({node, ...props}) => <a className="text-[#00A8FC] hover:underline" target="_blank" rel="noreferrer" {...props} />,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          blockquote: ({node, ...props}) => (
              <div className="flex">
                  <div className="w-1 bg-[#4f545c] rounded-l mr-2"></div>
                  <blockquote className={`${darkMode ? 'text-[#dbdee1]' : 'text-[#4e5058]'} opacity-90`} {...props} />
              </div>
          ),
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          code: ({node, inline, className, children, ...props}: {node?: unknown, inline?: boolean, className?: string, children?: React.ReactNode}) => {
            return inline ? (
              <code className={`${darkMode ? 'bg-[#2b2d31]' : 'bg-[#f2f3f5]'} px-1.5 py-0.5 rounded text-[85%] font-mono`} {...props}>
                {children}
              </code>
            ) : (
              <div className={`${darkMode ? 'bg-[#2b2d31] border-[#1e1f22]' : 'bg-[#f2f3f5] border-[#e3e5e8]'} p-2 rounded border mt-1 mb-1 overflow-x-auto font-mono text-sm`}>
                  <code {...props}>{children}</code>
              </div>
            )
          },
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          ul: ({node, ...props}) => <ul className="list-disc list-inside mb-1" {...props} />,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-1" {...props} />,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          h1: ({node, ...props}) => <h1 className="text-xl font-bold mb-2 border-b border-[#4f545c] pb-1" {...props} />,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          h2: ({node, ...props}) => <h2 className="text-lg font-bold mb-2 border-b border-[#4f545c] pb-1" {...props} />,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          h3: ({node, ...props}) => <h3 className="text-base font-bold mb-1" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

export const MessagePreview: React.FC<PreviewProps> = React.memo(({ message, webhookData, darkMode = true, previewType = 'default', channelName = 'general' }) => {
  const [viewMode, setViewMode] = React.useState<'forum' | 'thread'>(message.forum_mode ? 'forum' : 'thread');
  const [randomBg, setRandomBg] = React.useState('#5865F2');

  React.useEffect(() => {
    const colors = ['#EB459E', '#ED4245', '#57F187', '#5865F2']; // pink, red, green, blue
    setRandomBg(colors[Math.floor(Math.random() * colors.length)]);
  }, [message]);
  
  React.useEffect(() => {
    if (!message.forum_mode && viewMode !== 'thread') {
      setViewMode('thread');
    }
  }, [message.forum_mode, viewMode]);

  const username = message.username || webhookData?.name || "Spidey Bot";
  const avatarUrl = message.avatar_url || webhookData?.avatar || "https://cdn.discordapp.com/embed/avatars/0.png";

  // Use Discord blue for default, random for chat
  // The user requested: blue for live preview (desktop/mobile message view), random for chat preview
  const avatarBgColor = previewType === 'chat' ? randomBg : '#5865F2';

  if (previewType === 'chat') {
    return (
        <div className={cn(
            "h-full flex flex-col font-sans",
            darkMode ? 'bg-[#313338] text-gray-100' : 'bg-white text-[#313338]'
        )}>
            <div className="flex-1 p-4 space-y-6 overflow-y-auto">
                 {/* Mock User Message (if not logged in) */}
                <div className="flex items-start gap-4 hover:bg-white/[0.02] p-1 -m-1 rounded-sm transition-colors">
                    <div 
                        className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center transition-colors shadow-lg"
                        style={{ backgroundColor: randomBg }}
                    >
                        <DiscordLogo />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className={cn("font-bold text-sm hover:underline cursor-pointer", darkMode ? 'text-white' : 'text-black')}>User</span>
                            <span className="text-[10px] text-zinc-500 font-medium">Today at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className={cn("text-sm mt-0.5 leading-normal", darkMode ? 'text-[#dbdee1]' : 'text-zinc-700')}>
                            Hey! I'm creating this awesome webhook with DWM Studio. Check it out below!
                        </p>
                    </div>
                </div>

                {/* Webhook Message */}
                <div className="flex items-start gap-4 hover:bg-white/[0.02] p-1 -m-1 rounded-sm transition-colors relative">
                    <div className="flex-shrink-0 mt-0.5">
                        {isValidUrl(avatarUrl) && !avatarUrl.includes('embed/avatars') ? (
                            <img src={avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover shadow-lg" referrerPolicy="no-referrer" />
                        ) : (
                            <div 
                                className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                                style={{ backgroundColor: avatarBgColor }}
                            >
                                <DiscordLogo />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className={cn("font-bold text-sm", darkMode ? 'text-white' : 'text-black')}>{username}</span>
                            <span className="bg-[#5865F2] text-white text-[10px] px-1 rounded-[3px] font-bold h-[14px] flex items-center">BOT</span>
                            <span className="text-[10px] text-zinc-500">Today at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        
                        <div className="mt-1 space-y-2">
                            {message.content && (
                                <div className="text-sm leading-relaxed">
                                    <MarkdownRenderer content={message.content} darkMode={darkMode} />
                                </div>
                            )}
                            {message.embeds && message.embeds.map((embed, i) => (
                                <EmbedPreview key={i} embed={embed} darkMode={darkMode} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Discord Input Bar Mock */}
            <div className={cn(
                "p-4 border-t",
                darkMode ? 'bg-[#313338] border-white/5' : 'bg-zinc-50 border-zinc-200'
            )}>
                <div className={cn(
                    "w-full h-11 rounded-lg flex items-center px-4 gap-3",
                    darkMode ? 'bg-[#383a40]' : 'bg-zinc-200'
                )}>
                    <div className="w-6 h-6 rounded-full bg-zinc-500/20 flex items-center justify-center text-zinc-400 font-bold">+</div>
                    <div className="text-sm text-zinc-500">Message #{channelName || 'general'}</div>
                </div>
            </div>
        </div>
    );
  }

  if (message.forum_mode && viewMode === 'forum') {
    return (
      <div className={cn(
        "flex flex-col gap-3 p-4 rounded-lg border transition-all cursor-pointer group",
        darkMode ? 'bg-[#2B2D31] border-[#1e1f22] hover:border-[#383A40]' : 'bg-[#ffffff] border-[#e3e5e8] hover:border-[#c9ccd1]'
      )} onClick={() => setViewMode('thread')}>
        <div className="flex justify-between gap-4">
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-1">
              {message.applied_tags && message.applied_tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {message.applied_tags.map(tag => (
                    <span key={tag} className="px-1.5 py-0.5 rounded-full bg-[#4f545c]/20 text-[#b5bac1] text-[10px] font-bold uppercase tracking-wider border border-[#4f545c]/30">
                      Tag: {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <h3 className={cn("text-lg font-black leading-tight truncate", darkMode ? 'text-white' : 'text-[#060607]')}>
              {message.thread_name || "Untitled Post"}
            </h3>
            <div className={cn("text-sm line-clamp-3 opacity-80", darkMode ? 'text-[#dbdee1]' : 'text-[#313338]')}>
              {message.content || (message.embeds?.[0]?.description) || "No content provided."}
            </div>
          </div>
          {message.forum_thumbnail_url && (
            <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 border border-white/5 shadow-xl">
              <img src={message.forum_thumbnail_url} alt="Thumbnail" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div 
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-lg"
              style={{ backgroundColor: avatarBgColor }}
            >
                {username.charAt(0)}
            </div>
            <span className="text-[11px] font-bold text-[#80848E]">{username}</span>
            <span className="text-[11px] text-[#80848E]">• Just now</span>
          </div>
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-[10px] uppercase tracking-widest">
            Open Post
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${darkMode ? 'bg-[#313338] text-gray-100' : 'bg-[#ffffff] text-[#313338]'} font-sans p-4 rounded-md shadow-sm w-full h-full overflow-y-auto transition-colors`}>
      {message.forum_mode && (
        <div className="mb-4 -mx-4 -mt-4 p-3 bg-[#1e1f22] border-b border-[#111214] flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
             <button 
                onClick={() => setViewMode('forum')}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
             >
                <div className="bg-cyan-500/20 p-1 rounded">
                  <Hash className="w-3.5 h-3.5" />
                </div>
                Back to Forum
             </button>
             <div className="h-4 w-px bg-white/10 mx-1" />
             <span className="text-white font-bold text-sm truncate max-w-[150px]">{message.thread_name || "Post"}</span>
          </div>
          <div className="flex items-center gap-2">
              <div className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] font-bold text-zinc-500 uppercase">Thread View</div>
          </div>
        </div>
      )}
      <div className={`flex items-start gap-4 group ${darkMode ? 'hover:bg-[#2e3035]' : 'hover:bg-[#f2f3f5]'} -mx-4 px-4 py-2 transition-colors`}>
        {/* Avatar */}
        <div className="flex-shrink-0 mt-0.5 cursor-pointer">
          {isValidUrl(avatarUrl) && !avatarUrl.includes('embed/avatars') ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-10 h-10 rounded-full object-cover hover:opacity-80 transition-opacity ring-2 ring-transparent active:ring-cyan-500/50"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity shadow-lg"
              style={{ backgroundColor: avatarBgColor }}
            >
              <DiscordLogo />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2">
            <span className={`font-medium ${darkMode ? 'text-white' : 'text-[#060607]'} hover:underline cursor-pointer`}>
              {username}
            </span>
            <span className="bg-[#5865F2] text-white text-[10px] px-1 rounded-[3px] h-[15px] flex items-center font-medium">
              BOT
            </span>
            <span className={`text-xs ${darkMode ? 'text-[#949BA4]' : 'text-[#5c5e66]'} ml-1`}>
              Today at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Message Body */}
          {message.content && (
            <div className={`${darkMode ? 'text-[#dbdee1]' : 'text-[#313338]'} whitespace-pre-wrap mt-1 leading-[1.375rem]`}>
              <MarkdownRenderer content={message.content} darkMode={darkMode} />
            </div>
          )}

          {/* Embeds */}
          {message.embeds && message.embeds.map((embed, index) => (
            <EmbedPreview key={index} embed={embed} darkMode={darkMode} />
          ))}

          {/* Files (Attachments) */}
          {message.files && message.files.length > 0 && (
            <div className="mt-2 space-y-2">
                {message.files.map((file, index) => (
                    <div key={index} className="max-w-[520px]">
                        {file.file?.type.startsWith('image/') || file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <div className="rounded-[4px] overflow-hidden cursor-pointer inline-block">
                                <img 
                                    src={file.dataUrl} 
                                    alt={file.name} 
                                    className="max-w-full max-h-[300px] object-contain rounded-[4px]" 
                                    referrerPolicy="no-referrer"
                                />
                            </div>
                        ) : (
                            <div className={`flex items-center gap-3 ${darkMode ? 'bg-[#2B2D31] border-[#1E1F22]' : 'bg-[#f2f3f5] border-[#e3e5e8]'} p-3 rounded-[4px] border max-w-xs`}>
                                <div className="w-8 h-8 flex items-center justify-center">
                                    <svg width="30" height="40" viewBox="0 0 30 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M0 4C0 1.79086 1.79086 0 4 0H18L30 12V36C30 38.2091 28.2091 40 26 40H4C1.79086 40 0 38.2091 0 36V4Z" fill={darkMode ? "#2B2D31" : "#f2f3f5"}/>
                                        <path d="M20 2L28 10H20V2Z" fill={darkMode ? "#1E1F22" : "#e3e5e8"}/>
                                        <path d="M0 4C0 1.79086 1.79086 0 4 0H18V12H30V36C30 38.2091 28.2091 40 26 40H4C1.79086 40 0 38.2091 0 36V4Z" stroke={darkMode ? "#1E1F22" : "#e3e5e8"} strokeWidth="2"/>
                                    </svg>
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[#00A8FC] text-sm font-medium truncate hover:underline cursor-pointer">{file.name}</span>
                                    <span className={`${darkMode ? 'text-[#949BA4]' : 'text-[#5c5e66]'} text-xs`}>{file.file ? (file.file.size / 1024).toFixed(2) + ' KB' : 'Unknown Size'}</span>
                                </div>
                                <div className="ml-auto">
                                    <svg className={`w-6 h-6 ${darkMode ? 'text-[#B5BAC1] hover:text-[#dbdee1]' : 'text-[#5c5e66] hover:text-[#313338]'} cursor-pointer`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
          )}

          {/* Components (Buttons) */}
          {message.components && message.components.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.components.map((row, rowIndex) => (
                <div key={rowIndex} className="flex flex-wrap gap-3">
                  {row.components.map((btn, btnIndex) => (
                    <a
                      key={btnIndex}
                      href={btn.url || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(
                        "px-4 py-2 rounded-[3px] text-sm font-medium transition-colors flex items-center gap-2 no-underline",
                        // Style 1: Primary (Blurple)
                        btn.style === 1 && "bg-[#5865F2] hover:bg-[#4752C4] text-white",
                        // Style 2: Secondary (Grey)
                        btn.style === 2 && "bg-[#4F545C] hover:bg-[#686D73] text-white",
                        // Style 3: Success (Green)
                        btn.style === 3 && "bg-[#2D7D46] hover:bg-[#3BA55D] text-white",
                        // Style 4: Danger (Red)
                        btn.style === 4 && "bg-[#ED4245] hover:bg-[#D53B3E] text-white",
                        // Style 5: Link (Grey with external icon usually, but simplified here)
                        btn.style === 5 && "bg-[#4F545C] hover:bg-[#686D73] text-white",
                        btn.disabled && "opacity-50 cursor-not-allowed pointer-events-none"
                      )}
                      onClick={(e) => {
                          if (!btn.url) e.preventDefault();
                      }}
                    >
                      {btn.label}
                      {btn.style === 5 && <ExternalLinkIcon className="w-3 h-3" />}
                    </a>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

const DiscordLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="w-[65%] h-[65%]">
    <path d="M19.73 4.87c-1.28-.6-2.65-1.03-4.11-1.27-.18.33-.4.69-.53 1.02-1.57-.24-3.13-.24-4.66 0-.14-.33-.35-.69-.53-1.02-1.46.24-2.83.67-4.11 1.27-2.62 3.93-3.33 7.76-2.98 11.54 1.74 1.29 3.43 2.07 5.08 2.58.41-.56.78-1.17 1.09-1.81-.59-.22-1.16-.51-1.7-.86.14-.1.28-.21.41-.32 3.35 1.55 6.98 1.55 10.28 0 .13.11.27.22.41.32-.54.35-1.11.64-1.7.86.31.64.68 1.25 1.09 1.81 1.65-.51 3.34-1.29 5.08-2.58.43-4.42-.72-8.2-2.98-11.54zM8.51 13.91c-.98 0-1.79-.91-1.79-2.03s.79-2.03 1.79-2.03 1.79.91 1.79 2.03-.79 2.03-1.79 2.03zm6.98 0c-.98 0-1.79-.91-1.79-2.03s.79-2.03 1.79-2.03 1.79.91 1.79 2.03-.79 2.03-1.79 2.03z"/>
  </svg>
);

const ExternalLinkIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 6H6C4.89543 6 4 6.89543 4 8V18C4 19.1046 4.89543 20 6 20H16C17.1046 20 18 19.1046 18 18V14M14 4H20M20 4V10M20 4L10 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EmbedPreview: React.FC<{ embed: DiscordEmbed, darkMode?: boolean }> = ({ embed, darkMode = true }) => {
  const borderColor = embed.color ? `#${embed.color.toString(16).padStart(6, '0')}` : (darkMode ? '#1E1F22' : '#e3e5e8');

  return (
    <div
      className={`mt-2 ${darkMode ? 'bg-[#2B2D31]' : 'bg-[#f2f3f5]'} rounded-[4px] border-l-4 grid max-w-[520px] w-full shadow-sm overflow-hidden`}
      style={{ borderLeftColor: borderColor }}
    >
      <div className="grid grid-cols-[1fr_auto] p-3 gap-2">
        <div className="min-w-0 space-y-1">
          {/* Author */}
          {embed.author?.name && (
            <div className={`flex items-center gap-2 text-[13px] font-bold ${darkMode ? 'text-white' : 'text-[#313338]'} mb-1`}>
              {isValidUrl(embed.author.icon_url) && (
                <img src={embed.author.icon_url} alt="" className="w-5 h-5 rounded-full object-cover" referrerPolicy="no-referrer" />
              )}
              {embed.author.url ? (
                <a href={embed.author.url} target="_blank" rel="noreferrer" className="hover:underline truncate">
                  {embed.author.name}
                </a>
              ) : (
                <span className="truncate">{embed.author.name}</span>
              )}
            </div>
          )}

          {/* Title */}
          {embed.title && (
            <div className={`text-base font-bold ${darkMode ? 'text-white' : 'text-[#060607]'} leading-tight`}>
              {embed.url ? (
                <a href={embed.url} target="_blank" rel="noreferrer" className="text-[#00A8FC] hover:underline">
                  {embed.title}
                </a>
              ) : (
                embed.title
              )}
            </div>
          )}

          {/* Description */}
          {embed.description && (
            <div className={`text-[14px] ${darkMode ? 'text-[#dbdee1]' : 'text-[#313338]'} whitespace-pre-wrap leading-[1.375rem] opacity-90`}>
              <MarkdownRenderer content={embed.description} darkMode={darkMode} />
            </div>
          )}

          {/* Fields */}
          {embed.fields && embed.fields.length > 0 && (
            <div className="grid gap-x-4 gap-y-2 mt-2 grid-cols-12">
              {embed.fields.map((field, i) => (
                <div key={i} className={cn("col-span-12", field.inline && "sm:col-span-12 lg:col-span-4")}>
                  <div className={`text-[13px] font-bold ${darkMode ? 'text-white' : 'text-[#313338]'} mb-0.5`}>{field.name}</div>
                  <div className={`text-[14px] ${darkMode ? 'text-[#dbdee1]' : 'text-[#313338]'} whitespace-pre-wrap leading-tight`}>
                    <MarkdownRenderer content={field.value} darkMode={darkMode} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Thumbnail */}
        {isValidUrl(embed.thumbnail?.url) && (
          <div className="flex-shrink-0">
            <img
              src={embed.thumbnail!.url}
              alt="Thumbnail"
              className="max-w-[48px] max-h-[48px] rounded-[4px] object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
      </div>

      {/* Image */}
      {isValidUrl(embed.image?.url) && (
        <div className="px-3 pb-3">
          <img
            src={embed.image!.url}
            alt="Embed Image"
            className="max-w-full rounded-[4px] object-cover shadow-inner"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* Footer */}
      {(embed.footer?.text || embed.timestamp) && (
        <div className={`px-3 pb-3 pt-0 flex items-center gap-2 text-[11px] font-medium ${darkMode ? 'text-[#949BA4]' : 'text-[#5c5e66]'}`}>
          {isValidUrl(embed.footer?.icon_url) && (
            <img src={embed.footer!.icon_url} alt="" className="w-4 h-4 rounded-full object-cover" referrerPolicy="no-referrer" />
          )}
          <span className="opacity-80">
            {embed.footer?.text}
            {embed.footer?.text && embed.timestamp && " • "}
            {embed.timestamp && (
              <span>
                {new Date(embed.timestamp).toLocaleDateString()} at {new Date(embed.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  );
};
