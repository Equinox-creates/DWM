import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Copy, Check, ChevronDown, ChevronUp, BookOpen, X, Info } from 'lucide-react';
import { playButtonSound } from '../utils/sounds';
import { toast } from '../utils/toast';

interface CommandOption {
  name: string;
  description: string;
  required?: boolean;
  type?: string; 
}

interface Command {
  name: string;
  description: string;
  syntax: string;
  example: string;
  category: 'Utility' | 'Interactive' | 'Integration' | 'Personalization' | 'Formatting';
  options?: CommandOption[];
}

interface CommandCheatSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandCheatSheetModal: React.FC<CommandCheatSheetModalProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedCommand, setExpandedCommand] = useState<string | null>(null);

  // Set up the static command documentation matching the bot's commandsList exactly
  const commands: Command[] = useMemo(() => [
    {
      name: 'help',
      description: 'Interactive guide and syntax manual for all active companion bot commands.',
      syntax: '/help',
      example: '/help',
      category: 'Utility'
    },
    {
      name: 'buttons add',
      description: 'Configure and attach a custom link button with an optional emoji to active default profiles, mimicking discohook buttons.',
      syntax: '/buttons add label:<text> url:<destination_url> [emoji:<emoji>]',
      example: '/buttons add label:"Get Started" url:"https://discord.gg" emoji:"✨"',
      category: 'Utility',
      options: [
        { name: 'label', description: 'Label text visible on the Discord button', required: true, type: 'String/Text' },
        { name: 'url', description: 'Destination link URL when button is clicked', required: true, type: 'URL String' },
        { name: 'emoji', description: 'Optional default emoji to display alongside the text label', required: false, type: 'Emoji' }
      ]
    },
    {
      name: 'buttons delete',
      description: 'Remove a custom button from your configured interactive channel profiles.',
      syntax: '/buttons delete label:<text>',
      example: '/buttons delete label:"Get Started"',
      category: 'Utility',
      options: [
        { name: 'label', description: 'Exact label of the button you wish to remove', required: true, type: 'String/Text' }
      ]
    },
    {
      name: 'buttons edit',
      description: 'Modify parameters of an active configured button.',
      syntax: '/buttons edit label:<text> [new_label:<text>] [new_url:<destination_url>]',
      example: '/buttons edit label:"Get Started" new_label:"Explore Now" new_url:"https://ai.studio/build"',
      category: 'Utility',
      options: [
        { name: 'label', description: 'Target button label used to identify the configuration', required: true, type: 'String/Text' },
        { name: 'new_label', description: 'Modified label text to set on the button', required: false, type: 'String/Text' },
        { name: 'new_url', description: 'Modified link URL to bind to the button', required: false, type: 'URL String' }
      ]
    },
    {
      name: 'buttons migrate',
      description: 'Batch migrate your active custom buttons from one channel to another live.',
      syntax: '/buttons migrate source_channel:<channel> target_channel:<channel>',
      example: '/buttons migrate source_channel:#welcome target_channel:#announcements',
      category: 'Utility',
      options: [
        { name: 'source_channel', description: 'The origin channel containing current active custom buttons stream', required: true, type: 'Discord Channel' },
        { name: 'target_channel', description: 'The target destination channel where buttons should migrate', required: true, type: 'Discord Channel' }
      ]
    },
    {
      name: 'format channel',
      description: 'Format selected channel ID to its ready-to-tag Discord markdown sequence.',
      syntax: '/format channel channel:<channel>',
      example: '/format channel channel:#general',
      category: 'Formatting',
      options: [
        { name: 'channel', description: 'Select the guild target channel to format', required: true, type: 'Discord Channel' }
      ]
    },
    {
      name: 'format emoji',
      description: 'Convert custom regional emojis search into their proper Discord raw markdown sequence.',
      syntax: '/format emoji emoji_name:<text>',
      example: '/format emoji emoji_name:kekw',
      category: 'Formatting',
      options: [
        { name: 'emoji_name', description: 'Emoji key name or identifier inside the current server', required: true, type: 'String/Text' }
      ]
    },
    {
      name: 'format mention',
      description: 'Convert any role or member mention into its raw snowflake code block strings.',
      syntax: '/format mention user_or_role:<mention>',
      example: '/format mention user_or_role:@Administrator',
      category: 'Formatting',
      options: [
        { name: 'user_or_role', description: 'Select target model user or role entity to format', required: true, type: 'Discord User/Role' }
      ]
    },
    {
      name: 'id channel',
      description: 'Retrieve the raw 18-character Discord Snowflake ID of any selected channel.',
      syntax: '/id channel channel:<channel>',
      example: '/id channel channel:#welcome',
      category: 'Utility',
      options: [
        { name: 'channel', description: 'Selected channel to parse Snowflake from', required: true, type: 'Discord Channel' }
      ]
    },
    {
      name: 'id emoji',
      description: 'Extract raw Snowflake ID from custom guild emoji terms.',
      syntax: '/id emoji emoji_name:<text>',
      example: '/id emoji emoji_name:pepe_happy',
      category: 'Utility',
      options: [
        { name: 'emoji_name', description: 'The name or label of custom emoji search query', required: true, type: 'String/Text' }
      ]
    },
    {
      name: 'id mention',
      description: 'Extract direct raw ID from specific role or general user mention tags.',
      syntax: '/id mention user_or_role:<mention>',
      example: '/id mention user_or_role:@Moderator',
      category: 'Utility',
      options: [
        { name: 'user_or_role', description: 'Target user or role mention reference to query', required: true, type: 'Discord User/Role' }
      ]
    },
    {
      name: 'invite',
      description: 'Retrieve direct secure OAuth authorization link to invite the DWM Companion to other servers.',
      syntax: '/invite',
      example: '/invite',
      category: 'Integration'
    },
    {
      name: 'profile set',
      description: 'Configure active default branding overrides (name and avatar URL) for webhooks sent in the guild.',
      syntax: '/profile set username:<text> [avatar_url:<url>]',
      example: '/profile set username:"Spidey Alerts" avatar_url:"https://i.imgur.com/K75M5n4.png"',
      category: 'Personalization',
      options: [
        { name: 'username', description: 'The custom override display username for webhooks', required: true, type: 'String/Text' },
        { name: 'avatar_url', description: 'Optional custom image HTTPS linkage for avatar profile pic override', required: false, type: 'URL String' }
      ]
    },
    {
      name: 'profile clear',
      description: 'Remove custom branding profiles, reverting webhook messages to their default values.',
      syntax: '/profile clear',
      example: '/profile clear',
      category: 'Personalization'
    },
    {
      name: 'reaction-role create',
      description: 'Establish automated role reward system on a message. Users reacting with specified emoji gain the role.',
      syntax: '/reaction-role create message_id:<snowflake> emoji:<emoji> role:<role>',
      example: '/reaction-role create message_id:1221342674393661520 emoji:✅ role:@Verified Member',
      category: 'Interactive',
      options: [
        { name: 'message_id', description: 'The raw Discord Snowflake ID of the targeted post/message', required: true, type: 'Snowflake/String' },
        { name: 'emoji', description: 'Emoji reaction trigger (supports standard/custom emoji)', required: true, type: 'Emoji' },
        { name: 'role', description: 'Target Discord role rewarded during click', required: true, type: 'Discord Role' }
      ]
    },
    {
      name: 'reaction-role delete',
      description: 'Disable a specific reaction role trigger rule from an existing rewards configuration.',
      syntax: '/reaction-role delete message_id:<snowflake> emoji:<emoji>',
      example: '/reaction-role delete message_id:1221342674393661520 emoji:✅',
      category: 'Interactive',
      options: [
        { name: 'message_id', description: 'The target raw Discord message Snowflake ID', required: true, type: 'Snowflake/String' },
        { name: 'emoji', description: 'Emoji reaction trigger key to invalidate', required: true, type: 'Emoji' }
      ]
    },
    {
      name: 'reaction-role list',
      description: 'List active role rewards rules configurations across the entire server.',
      syntax: '/reaction-role list',
      example: '/reaction-role list',
      category: 'Interactive'
    },
    {
      name: 'restore',
      description: 'Restore previous webhook design templates or auto-saving backups right back into active designer canvas.',
      syntax: '/restore [template_id:<text>]',
      example: '/restore template_id:"tpl_weekly_newsletter"',
      category: 'Integration',
      options: [
        { name: 'template_id', description: 'Optional specific design ID from templates library to load directly', required: false, type: 'String/Text' }
      ]
    },
    {
      name: 'triggers add',
      description: 'Map a custom scanning auto-responder keyphrase. The bot responds instantly when the text is triggered.',
      syntax: '/triggers add trigger:<keyword> response:<text_output>',
      example: '/triggers add trigger:"!ping" response:"Pong! Average latency is 24ms."',
      category: 'Interactive',
      options: [
        { name: 'trigger', description: 'The target case-insensitive word or keyphrase the bot scans for', required: true, type: 'String/Text' },
        { name: 'response', description: 'The automated output message sent when trigger phrase matches', required: true, type: 'String/Text' }
      ]
    },
    {
      name: 'triggers view',
      description: 'Display interactive list mapping all active keywords with their respective responder scripts.',
      syntax: '/triggers view',
      example: '/triggers view',
      category: 'Interactive'
    },
    {
      name: 'webhook create',
      description: 'Instantly provision and secure a clean Discord Webhook inside a channel from within Discord chats.',
      syntax: '/webhook create name:<text> [channel:<channel>]',
      example: '/webhook create name:"Announcements Channel" channel:#general',
      category: 'Integration',
      options: [
        { name: 'name', description: 'The display name set for the newly generated webhook', required: true, type: 'String/Text' },
        { name: 'channel', description: 'Optional channel destination. Defaults to current channel context', required: false, type: 'Discord Channel' }
      ]
    },
    {
      name: 'webhook delete',
      description: 'Request automated cleanup and direct deletion of a specified target webhook.',
      syntax: '/webhook delete webhook_url_or_id:<text>',
      example: '/webhook delete webhook_url_or_id:"https://discord.com/api/webhooks/123/abc"',
      category: 'Integration',
      options: [
        { name: 'webhook_url_or_id', description: 'Complete Discord Webhook URL or specific identifier Snowflake text', required: true, type: 'String/Text/URL' }
      ]
    },
    {
      name: 'webhook info',
      description: 'Scan, audit, and inspect active webhooks registered safely inside your server channel scopes.',
      syntax: '/webhook info [webhook_url:<url>]',
      example: '/webhook info',
      category: 'Integration',
      options: [
        { name: 'webhook_url', description: 'Optional specific webhook endpoint to query audit history parameters', required: false, type: 'URL String' }
      ]
    },
    {
      name: 'welcomer set',
      description: 'Enable and configure onboarding greeting posts in a channel with custom template support.',
      syntax: '/welcomer set channel:<channel> welcome_message:<text_template>',
      example: '/welcomer set channel:#welcome welcome_message:"Hello {user}! Welcome to our development community!"',
      category: 'Interactive',
      options: [
        { name: 'channel', description: 'Target onboarding chamber/channel to display greet alerts', required: true, type: 'Discord Channel' },
        { name: 'welcome_message', description: 'Custom welcome greeting string. Supports live tagging with "{user}" placeholder variable', required: true, type: 'String/Text' }
      ]
    },
    {
      name: 'welcomer delete',
      description: 'Deactivate welcomer automatic onboarding notifications in this guild.',
      syntax: '/welcomer delete',
      example: '/welcomer delete',
      category: 'Interactive'
    },
    {
      name: 'welcomer view',
      description: 'Confirm current welcomer state parameters, current onboarding text, and destination channel.',
      syntax: '/welcomer view',
      example: '/welcomer view',
      category: 'Interactive'
    },
    {
      name: 'change-embeds color',
      description: 'Dynamically customize current embedded styling accent HEX colors of templates.',
      syntax: '/change-embeds color hex_color:<hex>',
      example: '/change-embeds color hex_color:"#3B82F6"',
      category: 'Formatting',
      options: [
        { name: 'hex_color', description: 'Target HEX sequence (e.g., #EC4899) used to style dynamic content', required: true, type: 'String/HEX' }
      ]
    }
  ], []);

  // Filter commands by search and active category
  const filteredCommands = useMemo(() => {
    return commands.filter((cmd) => {
      const matchesCategory = activeCategory === 'All' || cmd.category === activeCategory;
      const lowerSearch = searchQuery.toLowerCase();
      const matchesSearch = 
        cmd.name.toLowerCase().includes(lowerSearch) ||
        cmd.description.toLowerCase().includes(lowerSearch) ||
        cmd.syntax.toLowerCase().includes(lowerSearch) ||
        (cmd.options && cmd.options.some(opt => opt.name.toLowerCase().includes(lowerSearch) || opt.description.toLowerCase().includes(lowerSearch)));
      
      return matchesCategory && matchesSearch;
    });
  }, [commands, activeCategory, searchQuery]);

  const categories = ['All', 'Utility', 'Interactive', 'Integration', 'Formatting', 'Personalization'];

  const handleCopy = (text: string, key: string, label: string) => {
    playButtonSound();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`Copied ${label} syntax to clipboard!`);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const toggleExpand = (cmdName: string) => {
    playButtonSound();
    setExpandedCommand((prev) => (prev === cmdName ? null : cmdName));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              playButtonSound();
              onClose();
            }}
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
            id="cheat-sheet-backdrop"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-4xl max-h-[85vh] bg-[#111113] border border-[#2c2c30] rounded-2xl flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden"
            id="cheat-sheet-modal-content"
          >
            {/* Header */}
            <div className="p-6 border-b border-[#222] flex items-center justify-between bg-gradient-to-r from-[#17171a] to-[#121214] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#5865F2]/10 border border-[#5865F2]/30 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                    DWM Companion Slash Commands
                  </h2>
                  <p className="text-xs text-zinc-500 font-medium">
                    Cheat sheet, live documentation, and quick-copy blueprints for companion robot integrations.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  playButtonSound();
                  onClose();
                }}
                className="w-8 h-8 rounded-full bg-[#1c1c1f] border border-[#2d2d30] text-zinc-400 hover:text-white flex items-center justify-center transition-all hover:bg-[#2c2c30] active:scale-95"
                title="Close"
                id="cheat-sheet-close-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter and Search Utility Bar */}
            <div className="p-4 bg-[#141417]/90 border-b border-[#222] flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center shrink-0">
              {/* Categories scrollable drawer row */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none max-w-full">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      playButtonSound();
                      setActiveCategory(cat);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                      activeCategory === cat
                        ? 'bg-gradient-to-r from-[#5865F2] to-cyan-500 text-black shadow-[0_0_15px_rgba(88,101,242,0.25)]'
                        : 'bg-[#1a1a1c] text-zinc-400 hover:text-white border border-[#2a2a2d] hover:border-[#38383c]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Live search input field */}
              <div className="relative min-w-[260px] flex-1 md:flex-initial">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Query command, option, parameter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-[#2c2c30] hover:border-[#3a3a3e] focus:border-[#5865F2] text-xs text-white rounded-xl pl-9 pr-8 py-2.5 outline-none transition-all placeholder:text-zinc-600 font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      playButtonSound();
                      setSearchQuery('');
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Commands List Scope */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-[#0f0f11]/60">
              {filteredCommands.length === 0 ? (
                <div className="text-center py-16 px-4 bg-[#141416]/40 border border-[#222] rounded-2xl">
                  <div className="w-12 h-12 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto mb-3">
                    <Search className="w-5 h-5 text-zinc-600" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">No matching commands</h4>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                    Try checking spelling or adjusting category filters. All commands are in lowercase.
                  </p>
                </div>
              ) : (
                filteredCommands.map((cmd) => {
                  const isExpanded = expandedCommand === cmd.name;
                  const isSyntaxCopied = copiedKey === `${cmd.name}_syntax`;
                  const isExampleCopied = copiedKey === `${cmd.name}_example`;

                  return (
                    <div
                      key={cmd.name}
                      className="rounded-xl border border-[#232326] bg-[#141416]/90 overflow-hidden hover:border-[#2d2d31] transition-colors"
                      id={`cmd-card-${cmd.name.replace(' ', '-')}`}
                    >
                      {/* Card Primary Header */}
                      <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#17171a]/40">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black tracking-wide text-cyan-400 font-mono bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded-md">
                              /{cmd.name}
                            </span>
                            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-400 tracking-wider">
                              {cmd.category}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 leading-normal">
                            {cmd.description}
                          </p>
                        </div>

                        <button
                          onClick={() => toggleExpand(cmd.name)}
                          className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-[#1c1c1f] hover:bg-[#252529] border border-[#2d2d30] text-zinc-300 hover:text-white transition-all shrink-0 active:scale-95"
                        >
                          <span>{isExpanded ? 'Hide Syntax' : 'Verify Details'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* Card Expanded Segment */}
                      {isExpanded && (
                        <div className="p-4 border-t border-[#1c1c1e] bg-[#0c0c0e]/90 space-y-4">
                          {/* Options Table */}
                          {cmd.options && cmd.options.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                                <Info className="w-3 h-3 text-cyan-400" /> Parameters & Variables list
                              </h4>
                              <div className="border border-[#1e1e21] rounded-xl overflow-hidden bg-[#101012]">
                                <table className="w-full text-left border-collapse text-[11px]">
                                  <thead>
                                    <tr className="bg-[#151518] text-zinc-400 font-bold border-b border-[#1e1e21]">
                                      <th className="px-4 py-2">Parameter</th>
                                      <th className="px-4 py-2">Data Type</th>
                                      <th className="px-4 py-2">Requirement</th>
                                      <th className="px-4 py-2">Function</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#18181b] text-zinc-300 font-medium">
                                    {cmd.options.map((opt) => (
                                      <tr key={opt.name} className="hover:bg-[#1a1a1d]/30 transition-colors">
                                        <td className="px-4 py-2 text-white font-mono">{opt.name}</td>
                                        <td className="px-4 py-2 text-[#5865F2] font-semibold">{opt.type || 'String'}</td>
                                        <td className="px-4 py-2">
                                          {opt.required ? (
                                            <span className="text-[9px] bg-red-950/40 text-red-400 border border-red-900/40 px-1.5 py-0.5 rounded font-black uppercase">
                                              Required
                                            </span>
                                          ) : (
                                            <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-bold uppercase">
                                              Optional
                                            </span>
                                          )}
                                        </td>
                                        <td className="px-4 py-2 text-zinc-400 leading-normal">{opt.description}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Blueprints / Code Boxes */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Syntax Blueprint */}
                            <div className="space-y-1.5">
                              <span className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-wider block">
                                Command Structure blueprint
                              </span>
                              <div className="relative group/copy bg-black/70 border border-[#1d1d21] rounded-xl p-3 flex flex-col justify-between min-h-[70px]">
                                <code className="text-xs font-mono text-zinc-300 pr-8 break-all select-all leading-normal whitespace-pre-wrap">
                                  {cmd.syntax}
                                </code>
                                <button
                                  onClick={() => handleCopy(cmd.syntax, `${cmd.name}_syntax`, 'blueprint')}
                                  className="absolute top-2.5 right-2.5 w-7 h-7 bg-[#1a1a1c] hover:bg-[#252529] border border-[#2d2d30] hover:border-zinc-700 rounded-lg flex items-center justify-center transition-all opacity-0 group-hover/copy:opacity-100 focus:opacity-100 active:scale-95"
                                  title="Copy syntactic blueprint"
                                >
                                  {isSyntaxCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                                </button>
                              </div>
                            </div>

                            {/* Practical Example */}
                            <div className="space-y-1.5">
                              <span className="text-[9px] font-extrabold text-cyan-400/80 uppercase tracking-wider block">
                                Production live example
                              </span>
                              <div className="relative group/copy bg-[#0f0a1c]/30 border border-[#2d1b42]/30 rounded-xl p-3 flex flex-col justify-between min-h-[70px]">
                                <code className="text-xs font-mono text-indigo-200 pr-8 break-all select-all leading-normal whitespace-pre-wrap">
                                  {cmd.example}
                                </code>
                                <button
                                  onClick={() => handleCopy(cmd.example, `${cmd.name}_example`, 'example')}
                                  className="absolute top-2.5 right-2.5 w-7 h-7 bg-[#1c142e] hover:bg-[#291e42] border border-[#3e2963]/50 hover:border-[#523585] rounded-lg flex items-center justify-center transition-all opacity-0 group-hover/copy:opacity-100 focus:opacity-100 active:scale-95"
                                  title="Copy runnable example"
                                >
                                  {isExampleCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-300" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer containing quick help tip */}
            <div className="p-4 bg-[#111113] border-t border-[#222] flex flex-col sm:flex-row gap-3 items-center justify-between text-zinc-500 shrink-0">
              <span className="text-[11px] font-semibold flex items-center gap-1.5 text-left leading-normal">
                <Info className="w-3.5 h-3.5 text-[#5865F2] shrink-0" />
                Slash commands require matching context scopes (e.g., #channels) to execute successfully in your Discord guild.
              </span>
              <span className="text-[10px] font-mono select-none bg-[#1a1a1c] px-2 py-1 rounded border border-[#2c2c30]">
                Esc to dismiss
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
