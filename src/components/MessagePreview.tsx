import React from 'react';
import { cn, isValidUrl } from '@/utils';
import { DiscordWebhookMessage, DiscordEmbed } from '@/types';
import { Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface PreviewProps {
  message: DiscordWebhookMessage;
  webhookData?: { name?: string, avatar?: string } | null;
}

const MarkdownRenderer = ({ content, className }: { content: string, className?: string }) => {
  return (
    <div className={cn("markdown-body", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({node: _node, ...props}) => <p className="mb-1 last:mb-0" {...props} />,
          a: ({node: _node, ...props}) => <a className="text-[#00A8FC] hover:underline" target="_blank" rel="noreferrer" {...props} />,
          blockquote: ({node: _node, ...props}) => (
              <div className="flex">
                  <div className="w-1 bg-[#4f545c] rounded-l mr-2"></div>
                  <blockquote className="text-[#dbdee1] opacity-90" {...props} />
              </div>
          ),
          code: ({node: _node, inline, className: _className, children, ...props}: any) => {
            return inline ? (
              <code className="bg-[#2b2d31] px-1.5 py-0.5 rounded text-[85%] font-mono" {...props}>
                {children}
              </code>
            ) : (
              <div className="bg-[#2b2d31] p-2 rounded border border-[#1e1f22] mt-1 mb-1 overflow-x-auto font-mono text-sm">
                  <code {...props}>{children}</code>
              </div>
            )
          },
          ul: ({node: _node, ...props}) => <ul className="list-disc list-inside mb-1" {...props} />,
          ol: ({node: _node, ...props}) => <ol className="list-decimal list-inside mb-1" {...props} />,
          h1: ({node: _node, ...props}) => <h1 className="text-xl font-bold mb-2 border-b border-[#4f545c] pb-1" {...props} />,
          h2: ({node: _node, ...props}) => <h2 className="text-lg font-bold mb-2 border-b border-[#4f545c] pb-1" {...props} />,
          h3: ({node: _node, ...props}) => <h3 className="text-base font-bold mb-1" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export const MessagePreview: React.FC<PreviewProps> = ({ message, webhookData }) => {
  const username = message.username || webhookData?.name || "Spidey Bot";
  const avatarUrl = message.avatar_url || webhookData?.avatar || "https://cdn.discordapp.com/embed/avatars/0.png";
  return (
    <div className="bg-[#313338] font-sans text-gray-100 p-4 rounded-md shadow-sm w-full h-full overflow-y-auto">
      <div className="flex items-start gap-4 group hover:bg-[#2e3035] -mx-4 px-4 py-2 transition-colors">
        {/* Avatar */}
        <div className="flex-shrink-0 mt-0.5 cursor-pointer">
          {isValidUrl(avatarUrl) ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-10 h-10 rounded-full object-cover hover:opacity-80 transition-opacity"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#5865F2] flex items-center justify-center hover:opacity-80 transition-opacity">
              <Bot className="w-6 h-6 text-white" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2">
            <span className="font-medium text-white hover:underline cursor-pointer">
              {username}
            </span>
            <span className="bg-[#5865F2] text-white text-[10px] px-1 rounded-[3px] h-[15px] flex items-center font-medium">
              BOT
            </span>
            <span className="text-xs text-[#949BA4] ml-1">
              Today at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Message Body */}
          {message.content && (
            <div className="text-[#dbdee1] whitespace-pre-wrap mt-1 leading-[1.375rem]">
              <MarkdownRenderer content={message.content} />
            </div>
          )}

          {/* Embeds */}
          {message.embeds && message.embeds.map((embed, index) => (
            <EmbedPreview key={index} embed={embed} />
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
                            <div className="flex items-center gap-3 bg-[#2B2D31] p-3 rounded-[4px] border border-[#1E1F22] max-w-xs">
                                <div className="w-8 h-8 flex items-center justify-center">
                                    <svg width="30" height="40" viewBox="0 0 30 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M0 4C0 1.79086 1.79086 0 4 0H18L30 12V36C30 38.2091 28.2091 40 26 40H4C1.79086 40 0 38.2091 0 36V4Z" fill="#2B2D31"/>
                                        <path d="M20 2L28 10H20V2Z" fill="#1E1F22"/>
                                        <path d="M0 4C0 1.79086 1.79086 0 4 0H18V12H30V36C30 38.2091 28.2091 40 26 40H4C1.79086 40 0 38.2091 0 36V4Z" stroke="#1E1F22" strokeWidth="2"/>
                                    </svg>
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[#00A8FC] text-sm font-medium truncate hover:underline cursor-pointer">{file.name}</span>
                                    <span className="text-[#949BA4] text-xs">{file.file ? (file.file.size / 1024).toFixed(2) + ' KB' : 'Unknown Size'}</span>
                                </div>
                                <div className="ml-auto">
                                    <svg className="w-6 h-6 text-[#B5BAC1] cursor-pointer hover:text-[#dbdee1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
};

const ExternalLinkIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 6H6C4.89543 6 4 6.89543 4 8V18C4 19.1046 4.89543 20 6 20H16C17.1046 20 18 19.1046 18 18V14M14 4H20M20 4V10M20 4L10 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EmbedPreview: React.FC<{ embed: DiscordEmbed }> = ({ embed }) => {
  const borderColor = embed.color ? `#${embed.color.toString(16).padStart(6, '0')}` : '#1E1F22';

  return (
    <div
      className="mt-2 bg-[#2B2D31] rounded-[4px] border-l-4 grid max-w-[520px] w-full"
      style={{ borderLeftColor: borderColor }}
    >
      <div className="grid grid-cols-[1fr_auto] p-4 gap-4">
        <div className="min-w-0 space-y-2">
          {/* Author */}
          {embed.author?.name && (
            <div className="flex items-center gap-2 text-sm font-medium">
              {isValidUrl(embed.author.icon_url) && (
                <img src={embed.author.icon_url} alt="" className="w-6 h-6 rounded-full object-cover" referrerPolicy="no-referrer" />
              )}
              {embed.author.url ? (
                <a href={embed.author.url} target="_blank" rel="noreferrer" className="text-white hover:underline truncate">
                  {embed.author.name}
                </a>
              ) : (
                <span className="text-white truncate">{embed.author.name}</span>
              )}
            </div>
          )}

          {/* Title */}
          {embed.title && (
            <div className="text-base font-semibold text-white truncate">
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
            <div className="text-sm text-[#dbdee1] whitespace-pre-wrap leading-[1.375rem]">
              <MarkdownRenderer content={embed.description} />
            </div>
          )}

          {/* Fields */}
          {embed.fields && embed.fields.length > 0 && (
            <div className="grid gap-2 mt-2 grid-cols-12">
              {embed.fields.map((field, i) => (
                <div key={i} className={cn("col-span-12", field.inline && "sm:col-span-4")}>
                  <div className="text-sm font-semibold text-[#dbdee1] mb-1">{field.name}</div>
                  <div className="text-sm text-[#dbdee1] whitespace-pre-wrap leading-[1.375rem]">
                    <MarkdownRenderer content={field.value} />
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
              className="max-w-[80px] max-h-[80px] rounded-[4px] object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
      </div>

      {/* Image */}
      {isValidUrl(embed.image?.url) && (
        <div className="px-4 pb-4">
          <img
            src={embed.image!.url}
            alt="Embed Image"
            className="max-w-full rounded-[4px] object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* Footer */}
      {(embed.footer?.text || embed.timestamp) && (
        <div className="px-4 pb-4 pt-0 flex items-center gap-2 text-xs text-[#949BA4]">
          {isValidUrl(embed.footer?.icon_url) && (
            <img src={embed.footer!.icon_url} alt="" className="w-5 h-5 rounded-full object-cover" referrerPolicy="no-referrer" />
          )}
          <span>
            {embed.footer?.text}
            {embed.footer?.text && embed.timestamp && " • "}
            {embed.timestamp && (
              <span>
                {/* Simple formatting for preview */}
                {new Date(embed.timestamp).toLocaleDateString()} at {new Date(embed.timestamp).toLocaleTimeString()}
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  );
};
