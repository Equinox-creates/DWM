import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
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

export const CommandManualInline: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedCommand, setExpandedCommand] = useState<string | null>(null);

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
      name: 'welcomer set',
      description: 'Enable and configure onboarding greeting posts in a channel with welcome templates.',
      syntax: '/welcomer set channel:<channel> welcome_message:<text_template>',
      example: '/welcomer set channel:#welcome welcome_message:"Hello {user}! Welcome to our dev server!"',
      category: 'Interactive',
      options: [
        { name: 'channel', description: 'Target onboarding channel to display greet alerts', required: true, type: 'Discord Channel' },
        { name: 'welcome_message', description: 'Custom welcome greeting string. Supports "{user}" placeholder variable', required: true, type: 'String/Text' }
      ]
    }
  ], []);

  const filteredCommands = useMemo(() => {
    return commands.filter((cmd) => {
      const matchesCategory = activeCategory === 'All' || cmd.category === activeCategory;
      const lowerSearch = searchQuery.toLowerCase();
      const matchesSearch = 
        cmd.name.toLowerCase().includes(lowerSearch) ||
        cmd.description.toLowerCase().includes(lowerSearch) ||
        cmd.syntax.toLowerCase().includes(lowerSearch);
      
      return matchesCategory && matchesSearch;
    });
  }, [commands, activeCategory, searchQuery]);

  const categories = ['All', 'Utility', 'Interactive', 'Formatting', 'Personalization'];

  const handleCopy = (text: string, key: string, label: string) => {
    playButtonSound();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`Copied ${label} syntax!`);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const toggleExpand = (cmdName: string) => {
    playButtonSound();
    setExpandedCommand((prev) => (prev === cmdName ? null : cmdName));
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Search commands..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#070709] border border-zinc-800 focus:border-[#5865F2] text-xs text-white rounded-xl pl-9 pr-8 py-2 outline-none transition-all placeholder:text-zinc-600"
        />
        {searchQuery && (
          <button
            onClick={() => { playButtonSound(); setSearchQuery(''); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-[10px]"
          >
            Clear
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-1.5 max-w-full">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => { playButtonSound(); setActiveCategory(cat); }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all duration-150 ${
              activeCategory === cat
                ? 'bg-[#5865F2] text-white shadow-md shadow-[#5865F2]/20'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800/60'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Commands List */}
      <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
        {filteredCommands.length === 0 ? (
          <div className="text-center py-8 text-zinc-600 text-xs">
            No matching commands found.
          </div>
        ) : (
          filteredCommands.map((cmd) => {
            const isExpanded = expandedCommand === cmd.name;
            const isSyntaxCopied = copiedKey === `${cmd.name}_syntax`;
            const isExampleCopied = copiedKey === `${cmd.name}_example`;

            return (
              <div
                key={cmd.name}
                className="rounded-xl border border-zinc-900 bg-[#070709]/80 overflow-hidden"
              >
                {/* Accordion Trigger Header */}
                <button
                  onClick={() => toggleExpand(cmd.name)}
                  className="w-full text-left p-3 flex items-center justify-between gap-2 hover:bg-zinc-800/10 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-mono font-bold text-cyan-400">
                        /{cmd.name}
                      </span>
                      <span className="text-[8px] uppercase font-black px-1.5 py-0.2 rounded bg-zinc-800/80 text-zinc-400 tracking-wider">
                        {cmd.category}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1 truncate">
                      {cmd.description}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-zinc-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
                  )}
                </button>

                {/* Extended Segment */}
                {isExpanded && (
                  <div className="p-3 bg-black/40 border-t border-zinc-900 text-[11px] space-y-3">
                    <p className="text-zinc-400 leading-relaxed text-[11px]">
                      {cmd.description}
                    </p>

                    {cmd.options && cmd.options.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider block">Parameters:</span>
                        <div className="border border-zinc-900 rounded-lg overflow-hidden text-[10px] bg-zinc-950/60 divide-y divide-zinc-900">
                          {cmd.options.map((opt) => (
                            <div key={opt.name} className="p-1 px-2 flex justify-between gap-1 items-start">
                              <span className="font-mono text-white shrink-0">{opt.name}</span>
                              <span className="text-zinc-500 leading-normal text-right max-w-[150px] truncate" title={opt.description}>
                                {opt.description}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider">
                          <span>Syntax Blueprint:</span>
                          <button
                            onClick={() => handleCopy(cmd.syntax, `${cmd.name}_syntax`, 'blueprint')}
                            className="text-[#5865F2] hover:underline flex items-center gap-1 uppercase"
                          >
                            {isSyntaxCopied ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                        <pre className="p-2 bg-black text-[10px] rounded-lg border border-zinc-900 font-mono text-zinc-300 overflow-x-auto break-all whitespace-pre-wrap select-all">
                          {cmd.syntax}
                        </pre>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[9px] text-cyan-400/80 font-extrabold uppercase tracking-wider">
                          <span>Example Run:</span>
                          <button
                            onClick={() => handleCopy(cmd.example, `${cmd.name}_example`, 'example')}
                            className="text-cyan-400 hover:underline flex items-center gap-1 uppercase"
                          >
                            {isExampleCopied ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                        <pre className="p-2 bg-[#0c2020]/20 text-[10px] rounded-lg border border-teal-950/40 font-mono text-cyan-300 overflow-x-auto break-all whitespace-pre-wrap select-all">
                          {cmd.example}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
