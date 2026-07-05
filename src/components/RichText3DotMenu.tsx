import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MoreHorizontal, X, Search, Sparkles, Eraser, Check, Shield, User, Server, RefreshCw, Hash } from 'lucide-react';
import { cn } from '@/utils';
import { motion, AnimatePresence } from 'motion/react';
import { playButtonSound, playDeleteSound } from '@/utils/sounds';

interface RichText3DotMenuProps {
  value: string;
  onChange: (value: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

const EMOJI_CATEGORIES = [
  {
    name: 'Smileys & People',
    emojis: ["😀", "😂", "🤣", "😊", "😍", "😘", "🥰", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😢", "😭", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👹", "👺", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾", "🤖", "🎃", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾", "👋", "🤚", "🖐", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦵", "🦿", "🦶", "👣", "👂", "🦻", "👃", "🫀", "🫁", "🧠", "🦷", "🦴", "👀", "👁", "👅", "👄", "💋", "🩸"]
  },
  {
    name: 'Animals & Nature',
    emojis: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🙈", "🙉", "🙊", "🐒", "🐔", "🐧", "🐦", "🐤", "🐣", "🐥", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋", "🐌", "🐞", "🐜", "🦟", "🦗", "🕷", "🕸", "🦂", "🐢", "🐍", "🦎", "🦖", "🦕", "🐙", "🦑", "🦐", "🦞", "🦀", "🐡", "🐠", "🐟", "🐬", "🐳", "🐋", "🦈", "🐊", "🐅", "🐆", "🦓", "🦍", "🦧", "🐘", "🦛", "🦏", "🐪", "🐫", "🦒", "🦘", "🐃", "🐂", "🐄", "🐎", "🐖", "🐏", "🐑", "🦙", "🐐", "🦌", "🐕", "🐩", "🦮", "🐕‍🦺", "🐈", "🐓", "🦃", "🦚", "🦜", "🦢", "🦩", "🕊", "🐇", "🦝", "🦨", "🦡", "🦦", "🦥", "🐁", "🐀", "🐿", "🦔", "🐾", "🐉", "🐲", "🌵", "🎄", "🌲", "🌳", "🌴", "🌱", "🌿", "☘️", "🍀", "🎍", "🎋", "🍃", "🍂", "🍁", "🍄", "🌾", "💐", "🌷", "🌹", "🥀", "🌺", "🌸", "🌼", "🌻", "🌞", "🌝", "🌛", "🌜", "🌚", "🌕", "🌖", "🌗", "🌘", "🌑", "🌒", "🌓", "🌔", "🌙", "🌎", "🌍", "🌏", "🪐", "💫", "⭐️", "🌟", "✨", "⚡️", "☄️", "💥", "🔥", "🌪", "🌈", "☀️", "🌤", "⛅️", "🌥", "☁️", "🌦", "🌧", "⛈", "🌩", "🌨", "❄️", "☃️", "⛄️", "🌬", "💨", "💧", "💦", "☔️", "☂️", "🌊", "🌫"]
  },
  {
    name: 'Food & Drink',
    emojis: ["🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶", "🌽", "🥕", "🧄", "🧅", "🥔", "🍠", "🥐", "🥯", "🍞", "🥖", "🥨", "🧀", "🥚", "🍳", "🧈", "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🌭", "🍔", "🍟", "🍕", "🥪", "🥙", "🧆", "🌮", "🌯", "🥗", "🥘", "🥫", "🍝", "🍜", "🍲", "🍛", "🍣", "🍱", "🥟", "🦪", "🍤", "🍙", "🍚", "🍘", "🍥", "🥠", "🥮", "🍢", "🍡", "🍧", "🍨", "🍦", "🥧", "🧁", "🍰", "🎂", "🍮", "🍭", "🍬", "🍫", "🍿", "🍩", "🍪", "🌰", "🥜", "🍯", "🥛", "🍼", "☕️", "🍵", "🧃", "🥤", "🍶", "🍺", "🍻", "🥂", "🍷", "🥃", "🍸", "🍹", "🧉", "🍾", "🧊", "🥄", "🍴", "🍽", "🥣", "🥡", "🥢", "🥪", "🍕", "🍟", "🌭", "🍖", "🍗", "🥩", "🥓", "🧇", "🥞", "🧈", "🍳", "🥚", "🧀", "🥨", "🥖", "🍞", "🥯", "🥐", "🍠", "🥔", "🧅", "🧄", "🥕", "🌽", "🌶", "🥒", "🥬", "🥦", "🥑", "🍆", "🍅", "🥝", "🥥", "🍍", "🥭", "🍑", "🍒", "🍈", "🍓", "🍇", "🍉", "🍌", "🍋", "🍊", "🍐", "🍎", "🍏", "🍕", "🌭", "🍔"]
  }
];

const EMOJI_NAMES: Record<string, string> = {
  "😀": "grinning smile happy", "😂": "joy lol laugh", "🤣": "rofl laugh", "😊": "blush smile", "😍": "heart_eyes love", 
  "😘": "kissing_heart", "🥰": "smiling_face_with_three_hearts", "😎": "sunglasses cool", "🤩": "star_struck", "🥳": "partying_face", 
  "😏": "smirk", "😒": "unamused", "😞": "disappointed", "😔": "pensive", "😢": "cry", "😭": "sob loud_cry", 
  "😡": "rage angry", "🤬": "cursing", "🤯": "exploding_head", "😳": "flushed", "🥵": "hot", "🥶": "cold", 
  "😱": "scream scared", "😨": "fearful", "😰": "anxious", "😥": "sad relieved", "😓": "sweat", "🤗": "hugs", 
  "🤔": "thinking", "🤭": "shushing_face", "🤫": "shush", "🤥": "lying", "😶": "no_mouth", "😐": "neutral", 
  "😑": "expressionless", "😬": "grimacing", "🙄": "eye_roll", "😯": "hushed", "😦": "frowning", "😧": "anguished", 
  "😮": "open_mouth", "😲": "astonished", "🥱": "yawning", "😴": "sleepy", "🤤": "drooling", "😪": "sleep", 
  "😵": "dizzy", "🤐": "zipper_mouth", "🥴": "woozy", "🤢": "nauseated", "🤮": "vomiting", "🤧": "sneezing", 
  "😷": "mask", "🤒": "thermometer", "🤕": "bandage", "🤑": "money", "🤠": "cowboy", "😈": "smiling_imp", 
  "👿": "imp", "👹": "ogre", "👺": "goblin", "🤡": "clown", "💩": "poop", "👻": "ghost", "💀": "skull", 
  "☠️": "skull_and_crossbones", "👽": "alien", "👾": "space_invader", "🤖": "robot", "🎃": "jack_o_lantern", 
  "😺": "smiley_cat", "😸": "smile_cat", "😹": "joy_cat", "😻": "heart_eyes_cat", "😼": "smirk_cat", 
  "😽": "kissing_cat", "🙀": "scream_cat", "😿": "crying_cat", "😾": "pouting_cat", "👋": "wave", "🤚": "raised_back_of_hand", 
  "🖐": "raised_hand_with_fingers_splayed", "✋": "raised_hand", "🖖": "vulcan_salute", "👌": "ok_hand", "🤌": "pinched_fingers", 
  "🤏": "pinched_hand", "✌️": "victory_hand", "🤞": "crossed_fingers", "🤟": "love_you_gesture", "🤘": "rock_on", 
  "🤙": "call_me", "👈": "backhand_index_pointing_left", "👉": "backhand_index_pointing_right", "👆": "backhand_index_pointing_up", 
  "🖕": "middle_finger", "👇": "backhand_index_pointing_down", "☝️": "index_pointing_up", "👍": "thumbsup", "👎": "thumbsdown", 
  "✊": "fist", "👊": "oncoming_fist", "🤛": "left_facing_fist", "🤜": "right_facing_fist", "👏": "clapping_hands", 
  "🙌": "raising_hands", "👐": "open_hands", "🤲": "palms_up_together", "🤝": "handshake", "🙏": "pray", "✍️": "writing_hand", 
  "💅": "nail_polish", "🤳": "selfie", "💪": "flex biceps", "🦾": "mechanical_arm", "🦵": "leg", "🦿": "mechanical_leg", 
  "🦶": "foot", "👣": "footprints", "👂": "ear", "🦻": "ear_with_hearing_aid", "👃": "nose", "🫀": "anatomical_heart", 
  "🫁": "lungs", "🧠": "brain", "🦷": "tooth", "🦴": "bone", "👀": "eyes", "👁": "eye", "👅": "tongue", 
  "👄": "mouth", "💋": "kiss_mark", "🩸": "drop_of_blood"
};

const TIMESTAMPS = [
  { label: 'Short Time', format: 't', example: '16:20', keywords: 'time short' },
  { label: 'Long Time', format: 'T', example: '16:20:30', keywords: 'time long' },
  { label: 'Short Date', format: 'd', example: '20/04/2021', keywords: 'date short' },
  { label: 'Long Date', format: 'D', example: '20 April 2021', keywords: 'date long' },
  { label: 'Short Date/Time', format: 'f', example: '20 April 2021 16:20', keywords: 'date time short' },
  { label: 'Long Date/Time', format: 'F', example: 'Tuesday, 20 April 2021 16:20', keywords: 'date time long' },
  { label: 'Relative Time', format: 'R', example: '2 months ago', keywords: 'time relative ago' }
];

interface DiscordRole {
  id: string;
  name: string;
  color: string;
}

interface DiscordMember {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  color: string;
}

interface DiscordChannel {
  id: string;
  name: string;
  type?: number;
}

interface DiscordGuild {
  id: string;
  name: string;
  roles: DiscordRole[];
  members: DiscordMember[];
  channels?: DiscordChannel[];
}

const MOCK_GUILDS: DiscordGuild[] = [
  {
    id: "mock-dwm-server",
    name: "DWM Support Server",
    roles: [
      { id: "98765432101", name: "Bot Administrator", color: "#e91e63" },
      { id: "98765432102", name: "DWM Developer", color: "#00bcd4" },
      { id: "98765432103", name: "Community Staff", color: "#4caf50" },
      { id: "98765432104", name: "Active Supporter", color: "#ff9800" },
      { id: "98765432105", name: "Regular Member", color: "#99aab5" }
    ],
    members: [
      { id: "11122233301", username: "picklu", displayName: "Picklu [Creator]", color: "#20b2aa", avatar: "" },
      { id: "11122233302", username: "captain_hook", displayName: "Captain Hook [Bot]", color: "#e91e63", avatar: "" },
      { id: "11122233303", username: "discord_guru", displayName: "Discord Guru", color: "#00ff7f", avatar: "" },
      { id: "11122233304", username: "night_rider", displayName: "Night Rider", color: "#ff8c00", avatar: "" }
    ],
    channels: [
      { id: "11122233311", name: "general" },
      { id: "11122233312", name: "announcements" },
      { id: "11122233313", name: "rules" },
      { id: "11122233314", name: "bot-commands" }
    ]
  },
  {
    id: "mock-lounge",
    name: "Gaming Lounge",
    roles: [
      { id: "87654321091", name: "Lounge Owner", color: "#ffeb3b" },
      { id: "87654321092", name: "Server Moderator", color: "#9c27b0" },
      { id: "87654321093", name: "Elite Gamer", color: "#3f51b5" },
      { id: "87654321094", name: "Lounge Member", color: "#708090" }
    ],
    members: [
      { id: "22233344401", username: "lounge_boss", displayName: "Boss Mane", color: "#ffd700", avatar: "" },
      { id: "22233344402", username: "mod_helper", displayName: "Mod Helper", color: "#ba55d3", avatar: "" },
      { id: "22233344403", username: "pixel_heart", displayName: "Pixel Heart", color: "#ee82ee", avatar: "" }
    ],
    channels: [
      { id: "22233344411", name: "lounge-chat" },
      { id: "22233344412", name: "gaming-voice" },
      { id: "22233344413", name: "memes" }
    ]
  }
];

export function RichText3DotMenu({ value, onChange, textareaRef }: RichText3DotMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(true);
  const [activeTab, setActiveTab] = useState<'actions' | 'emoji' | 'time' | 'pings' | 'roles' | 'users' | 'channels'>('actions');
  const [searchQuery, setSearchQuery] = useState('');
  const [pingsEnabled, setPingsEnabled] = useState(true);
  const [aiEnhancing, setAiEnhancing] = useState(false);
  const [aiSuccess, setAiSuccess] = useState(false);
  
  // Guilds state
  const [guilds, setGuilds] = useState<DiscordGuild[]>(MOCK_GUILDS);
  const [isSyncingGuilds, setIsSyncingGuilds] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  const updateCoords = () => {
    if (containerRef.current) {
      const buttonEl = containerRef.current.querySelector('button');
      if (buttonEl) {
        const rect = buttonEl.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        if (spaceBelow < 380 && spaceAbove > spaceBelow) {
          setOpenUpward(true);
        } else {
          setOpenUpward(false);
        }
        setCoords({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        });
      }
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    updateCoords();
    const handleScrollOrResize = () => {
      updateCoords();
    };
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize, true);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize, true);
    };
  }, [isOpen]);

  const dynamicStyle = useMemo(() => {
    if (!coords) return {};
    
    // Calculate top position
    const menuHeight = 364;
    const itemWidth = 310;
    
    const top = openUpward
      ? coords.top - menuHeight - 8
      : coords.top + coords.height + 8;
      
    // Fit within the viewport horizontally
    const left = Math.min(
      window.innerWidth - itemWidth - 16,
      Math.max(16, coords.left + coords.width - itemWidth)
    );
    
    return {
      position: 'fixed' as const,
      top: `${top}px`,
      left: `${left}px`,
      width: `${itemWidth}px`,
    };
  }, [coords, openUpward]);

  // Sync guilds on mount
  useEffect(() => {
    let active = true;
    const fetchGuilds = async () => {
      setIsSyncingGuilds(true);
      try {
        const res = await fetch('/api/bot/guilds');
        if (!res.ok) throw new Error("Bot status offline");
        const data = await res.json();
        if (active) {
          setGuilds(data && data.length > 0 ? data : MOCK_GUILDS);
        }
      } catch {
        if (active) {
          setGuilds(MOCK_GUILDS);
        }
      } finally {
        if (active) {
          setIsSyncingGuilds(false);
        }
      }
    };
    fetchGuilds();
    return () => { active = false; };
  }, []);

  const handleManualSync = async () => {
    playButtonSound();
    setIsSyncingGuilds(true);
    try {
      const res = await fetch('/api/bot/guilds');
      if (!res.ok) throw new Error("Bot offline");
      const data = await res.json();
      setGuilds(data && data.length > 0 ? data : MOCK_GUILDS);
    } catch {
      setGuilds(MOCK_GUILDS);
    } finally {
      setIsSyncingGuilds(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(value + text);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = value.substring(0, start) + text + value.substring(end);
    
    onChange(newContent);
    
    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
      // Auto expand height if applicable
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }, 0);
  };

  const handleTimestampSelect = (format: string) => {
    const unixTimestamp = Math.floor(new Date().getTime() / 1000);
    handleSelect(`<t:${unixTimestamp}:${format}>`);
  };

  const handleClear = () => {
    onChange('');
    playDeleteSound();
    setIsOpen(false);
  };

  const handleAiEnhance = async () => {
    if (!value.trim()) return;
    playButtonSound();
    setAiEnhancing(true);
    setAiSuccess(false);

    // Simulate smart client-side sentence improvements
    await new Promise(r => setTimeout(r, 600));

    let enhanced = value.trim();
    // 1. Double spacing clean
    enhanced = enhanced.replace(/ {2,}/g, ' ');
    // 2. Capitalize sentences
    enhanced = enhanced.replace(/(^\s*|[.!?]\s+)([a-z])/g, (match, separator, char) => separator + char.toUpperCase());
    // 3. Ensure trailing punctuation
    if (enhanced.length > 0 && !/[.!?:]\s*$/.test(enhanced)) {
      enhanced += '.';
    }

    onChange(enhanced);
    setAiEnhancing(false);
    setAiSuccess(true);
    setTimeout(() => setAiSuccess(false), 1500);
  };

  const filteredEmojis = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return EMOJI_CATEGORIES;
    
    return EMOJI_CATEGORIES.map(category => ({
      ...category,
      emojis: category.emojis.filter(emoji => {
        const name = EMOJI_NAMES[emoji] || "";
        return name.toLowerCase().includes(query) || emoji.includes(query);
      })
    })).filter(cat => cat.emojis.length > 0);
  }, [searchQuery]);

  const filteredTimestamps = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return TIMESTAMPS;
    
    return TIMESTAMPS.filter(ts => 
      ts.label.toLowerCase().includes(query) || 
      ts.format.toLowerCase().includes(query) || 
      ts.keywords.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const filteredRolesByGuild = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return guilds.map(guild => {
      const filtered = (guild.roles || []).filter((role: DiscordRole) => 
        role.name.toLowerCase().includes(query) || role.id.includes(query)
      );
      return { ...guild, roles: filtered };
    }).filter(guild => guild.roles.length > 0);
  }, [guilds, searchQuery]);

  const filteredUsersByGuild = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return guilds.map(guild => {
      const filtered = (guild.members || []).filter((member: DiscordMember) => 
        member.displayName.toLowerCase().includes(query) || 
        member.username.toLowerCase().includes(query) || 
        member.id.includes(query)
      );
      return { ...guild, members: filtered };
    }).filter(guild => guild.members.length > 0);
  }, [guilds, searchQuery]);

  const filteredChannelsByGuild = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return guilds.map(guild => {
      const filtered = (guild.channels || []).filter((channel: DiscordChannel) => 
        channel.name.toLowerCase().includes(query) || channel.id.toLowerCase().includes(query)
      );
      return { ...guild, channels: filtered };
    }).filter(guild => guild.channels && guild.channels.length > 0);
  }, [guilds, searchQuery]);

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button 
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchQuery('');
          setActiveTab('actions');
          playButtonSound();
        }}
        className="p-1.5 text-zinc-400 hover:text-cyan-400 hover:bg-zinc-800 rounded-lg transition-all flex items-center justify-center pointer-events-auto"
        title="More Options & Formatting"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: openUpward ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: openUpward ? 10 : -10 }}
            transition={{ duration: 0.15 }}
            className="fixed bg-[#121212] border border-[#222] rounded-2xl shadow-[0_12px_45px_rgba(0,0,0,0.85)] overflow-hidden z-[100] flex flex-col h-[364px]"
            style={dynamicStyle}
          >
            {/* Header Tabs with Horizontal Scroll */}
            <div className="flex items-center bg-[#161616] border-b border-[#222] shrink-0 overflow-x-auto text-[10px] scrollbar-none select-none">
              <button 
                type="button"
                onClick={() => { setActiveTab('actions'); setSearchQuery(''); playButtonSound(); }}
                className={cn(
                  "px-3 py-2.5 text-[9px] font-black uppercase tracking-wider border-b-2 transition-colors shrink-0",
                  activeTab === 'actions' ? "border-cyan-500 text-cyan-400 bg-white/2" : "border-transparent text-zinc-500 hover:text-zinc-300"
                )}
              >
                Opts
              </button>
              <button 
                type="button"
                onClick={() => { setActiveTab('emoji'); setSearchQuery(''); playButtonSound(); }}
                className={cn(
                  "px-3 py-2.5 text-[9px] font-black uppercase tracking-wider border-b-2 transition-colors shrink-0",
                  activeTab === 'emoji' ? "border-cyan-500 text-cyan-400 bg-white/2" : "border-transparent text-zinc-500 hover:text-zinc-300"
                )}
              >
                Emojis
              </button>
              <button 
                type="button"
                onClick={() => { setActiveTab('time'); setSearchQuery(''); playButtonSound(); }}
                className={cn(
                  "px-3 py-2.5 text-[9px] font-black uppercase tracking-wider border-b-2 transition-colors shrink-0",
                  activeTab === 'time' ? "border-cyan-500 text-cyan-400 bg-white/2" : "border-transparent text-zinc-500 hover:text-zinc-300"
                )}
              >
                Times
              </button>
              <button 
                type="button"
                onClick={() => { setActiveTab('pings'); setSearchQuery(''); playButtonSound(); }}
                className={cn(
                  "px-3 py-2.5 text-[9px] font-black uppercase tracking-wider border-b-2 transition-colors shrink-0",
                  activeTab === 'pings' ? "border-cyan-500 text-cyan-400 bg-white/2" : "border-transparent text-zinc-500 hover:text-zinc-300"
                )}
              >
                Pings
              </button>
              <button 
                type="button"
                onClick={() => { setActiveTab('roles'); setSearchQuery(''); playButtonSound(); }}
                className={cn(
                  "px-3 py-2.5 text-[9px] font-black uppercase tracking-wider border-b-2 transition-colors shrink-0 flex items-center gap-1",
                  activeTab === 'roles' ? "border-cyan-500 text-cyan-400 bg-cyan-500/5" : "border-transparent text-zinc-500 hover:text-zinc-300"
                )}
              >
                <Shield className="w-2.5 h-2.5" />
                Roles
              </button>
              <button 
                type="button"
                onClick={() => { setActiveTab('users'); setSearchQuery(''); playButtonSound(); }}
                className={cn(
                  "px-3 py-2.5 text-[9px] font-black uppercase tracking-wider border-b-2 transition-colors shrink-0 flex items-center gap-1",
                  activeTab === 'users' ? "border-cyan-500 text-cyan-400 bg-cyan-500/5" : "border-transparent text-zinc-500 hover:text-zinc-300"
                )}
              >
                <User className="w-2.5 h-2.5" />
                Users
              </button>
              <button 
                type="button"
                onClick={() => { setActiveTab('channels'); setSearchQuery(''); playButtonSound(); }}
                className={cn(
                  "px-3 py-2.5 text-[9px] font-black uppercase tracking-wider border-b-2 transition-colors shrink-0 flex items-center gap-1",
                  activeTab === 'channels' ? "border-cyan-500 text-cyan-400 bg-cyan-500/5" : "border-transparent text-zinc-500 hover:text-zinc-300"
                )}
              >
                <Hash className="w-2.5 h-2.5" />
                Channels
              </button>
              
              <div className="ml-auto flex items-center pr-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleManualSync}
                  className="p-1.5 text-zinc-600 hover:text-zinc-300 transition-colors"
                  title="Sync Guild Data"
                >
                  <RefreshCw className={cn("w-3 h-3", isSyncingGuilds && "animate-spin")} />
                </button>
                <button 
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-zinc-500 hover:text-white transition-colors"
                  title="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#121212] flex flex-col">
              
              {activeTab !== 'actions' && (
                <div className="p-2 sticky top-0 bg-[#121212] z-10 border-b border-[#222]">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input 
                      type="text"
                      placeholder={`Search ${activeTab === 'emoji' ? 'emoji' : activeTab === 'roles' ? 'roles' : activeTab === 'users' ? 'members' : activeTab === 'channels' ? 'channels' : 'style'}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#222] text-white text-xs rounded-lg pl-8 pr-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 focus:border-cyan-500/50 placeholder-zinc-600 transition-all font-sans"
                    />
                  </div>
                </div>
              )}

              {/* ACTIONS TAB */}
              {activeTab === 'actions' && (
                <div className="p-3 flex-1 flex flex-col justify-center space-y-3">
                  <div className="space-y-1 text-center mb-1">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Quick Actions</h4>
                  </div>

                  <button
                    type="button"
                    onClick={handleAiEnhance}
                    disabled={!value.trim() || aiEnhancing}
                    className={cn(
                      "w-full py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all text-xs font-bold border",
                      aiSuccess 
                        ? "bg-green-500/10 border-green-500/30 text-green-400"
                        : aiEnhancing
                        ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 animate-pulse"
                        : "bg-[#18181b] border-white/5 text-zinc-200 hover:text-cyan-400 hover:border-cyan-500/30 hover:bg-[#1a1a1c]"
                    )}
                  >
                    {aiSuccess ? (
                      <>
                        <Check className="w-4 h-4 text-green-400" />
                        Enhanced!
                      </>
                    ) : (
                      <>
                        <Sparkles className={cn("w-4 h-4 text-cyan-400", aiEnhancing && "animate-spin")} />
                        {aiEnhancing ? "Enhancing..." : "AI Enhance"}
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={!value}
                    className="w-full py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all text-xs font-bold border bg-[#18181b] border-white/5 text-zinc-200 hover:text-red-400 hover:border-red-500/35 hover:bg-red-500/5 disabled:opacity-30 disabled:hover:text-zinc-200 disabled:hover:border-white/5 disabled:hover:bg-[#18181b]"
                  >
                    <Eraser className="w-4 h-4 text-red-400" />
                    Clear Content
                  </button>
                  
                  <div className="pt-2 text-center">
                    <p className="text-[8px] text-zinc-600 uppercase tracking-widest leading-relaxed">
                      Instant formatting & clearing
                    </p>
                  </div>
                </div>
              )}

              {/* EMOJIS TAB */}
              {activeTab === 'emoji' && (
                <div className="p-2 flex-1 overflow-y-auto custom-scrollbar pb-3 space-y-3">
                  {filteredEmojis.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-zinc-600 text-xs italic">No emojis found</p>
                    </div>
                  ) : filteredEmojis.map((category, idx) => (
                      <div key={idx} className="space-y-1 text-left">
                        <h4 className="text-[8px] font-extrabold text-cyan-500/70 uppercase tracking-widest sticky top-0 bg-[#121212] py-0.5 z-[1]">{category.name}</h4>
                        <div className="grid grid-cols-7 gap-1">
                          {category.emojis.map((emoji, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => { handleSelect(emoji); playButtonSound(); }}
                              className="w-full aspect-square flex items-center justify-center text-sm hover:bg-cyan-500/10 hover:text-cyan-400 rounded transition-all"
                              title={EMOJI_NAMES[emoji] || ""}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                  ))}
                </div>
              )}

              {/* TIMESTAMPS TAB */}
              {activeTab === 'time' && (
                <div className="p-1 space-y-0.5">
                  {filteredTimestamps.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-zinc-600 text-xs italic">No timestamps found</p>
                    </div>
                  ) : (
                    <>
                      {filteredTimestamps.map(ts => (
                        <button
                          key={ts.format}
                          type="button"
                          onClick={() => { handleTimestampSelect(ts.format); playButtonSound(); }}
                          className="w-full text-left px-2 py-1.5 flex flex-col hover:bg-cyan-500/10 border border-transparent rounded-lg transition-all group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-200 text-xs font-semibold group-hover:text-white transition-colors">{ts.label}</span>
                            <code className="text-[9px] bg-[#0a0a0a] border border-[#222] px-1.5 py-0.2 rounded text-zinc-400 group-hover:text-cyan-400 transition-all font-mono">
                              {":" + ts.format}
                            </code>
                          </div>
                          <span className="text-[8px] text-zinc-500 mt-0.5 block font-bold uppercase tracking-wider">e.g. {ts.example}</span>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}

              {/* PINGS TAB */}
              {activeTab === 'pings' && (
                <div className="p-3 space-y-3 flex-1 flex flex-col justify-between h-full">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 bg-[#0a0a0a] border border-[#222] rounded-lg">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-white">Enable Pings</p>
                        <p className="text-[8px] text-zinc-500 uppercase tracking-wider font-bold">Announce to channel</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => { setPingsEnabled(!pingsEnabled); playButtonSound(); }}
                        className={cn(
                          "w-8 h-4 rounded-full relative transition-colors duration-200",
                          pingsEnabled ? "bg-cyan-500" : "bg-zinc-800"
                        )}
                      >
                        <motion.div 
                          animate={{ left: pingsEnabled ? 18 : 3 }}
                          className="absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-all" 
                        />
                      </button>
                    </div>

                    <div className={cn("grid grid-cols-1 gap-1.5 transition-opacity duration-300", !pingsEnabled && "opacity-40 pointer-events-none")}>
                      <button
                        type="button"
                        onClick={() => { if(pingsEnabled) { handleSelect('@everyone '); playButtonSound(); } }}
                        className="w-full p-2 bg-[#0a0a0a] hover:bg-cyan-500/5 border border-[#222] hover:border-cyan-500/30 rounded-lg text-left transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors">@everyone</span>
                          <div className={cn("w-3 h-3 rounded-full border-2 transition-colors", pingsEnabled ? "border-zinc-700 group-hover:border-cyan-400" : "border-zinc-800")} />
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => { if(pingsEnabled) { handleSelect('@here '); playButtonSound(); } }}
                        className="w-full p-2 bg-[#0a0a0a] hover:bg-cyan-500/5 border border-[#222] hover:border-cyan-500/30 rounded-lg text-left transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors">@here</span>
                          <div className={cn("w-3 h-3 rounded-full border-2 transition-colors", pingsEnabled ? "border-zinc-700 group-hover:border-cyan-400" : "border-zinc-800")} />
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="p-2 bg-cyan-950/20 border border-cyan-500/10 rounded-lg shrink-0 mt-2">
                    <p className="text-[8px] text-cyan-500 font-bold uppercase tracking-wider leading-relaxed">
                      * Inserts ping at cursor position
                    </p>
                  </div>
                </div>
              )}

              {/* ROLES TAB */}
              {activeTab === 'roles' && (
                <div className="p-2 space-y-4">
                  {filteredRolesByGuild.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-zinc-500 text-xs italic">No roles found matching query</p>
                    </div>
                  ) : (
                    filteredRolesByGuild.map(guild => (
                      <div key={guild.id} className="space-y-1 text-left">
                        <div className="flex items-center gap-1.5 sticky top-0 bg-[#121212] py-1 z-[1] border-b border-white/5 mb-1 text-[8px] font-extrabold text-cyan-400 uppercase tracking-widest select-none">
                          <Server className="w-2.5 h-2.5 text-zinc-500 shrink-0" />
                          <span>{guild.name}</span>
                        </div>
                        <div className="space-y-0.5">
                          {guild.roles.map((role: DiscordRole) => (
                            <button
                              key={role.id}
                              type="button"
                              onClick={() => { handleSelect(`<@&${role.id}>`); playButtonSound(); }}
                              className="w-full text-left px-2 py-1.5 flex items-center justify-between hover:bg-cyan-500/5 border border-transparent hover:border-cyan-500/10 rounded-lg transition-all group"
                            >
                              <div className="flex items-center gap-2">
                                <Shield className="w-3.5 h-3.5 shrink-0" style={{ color: role.color }} />
                                <span className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors" style={{ color: role.color }}>
                                  {role.name}
                                </span>
                              </div>
                              <code className="text-[8px] font-mono bg-[#09090b] text-zinc-500 group-hover:text-cyan-400 px-1 border border-[#222] rounded transition-all">
                                {role.id}
                              </code>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                  <div className="p-2 bg-[#09090b] border border-white/5 rounded-lg text-center select-none shrink-0 mt-3">
                    <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider leading-relaxed">
                      * Inserts raw role format &lt;@&amp;ID&gt; at cursor
                    </p>
                  </div>
                </div>
              )}

              {/* USERS TAB */}
              {activeTab === 'users' && (
                <div className="p-2 space-y-4">
                  {filteredUsersByGuild.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-zinc-500 text-xs italic">No users found matching query</p>
                    </div>
                  ) : (
                    filteredUsersByGuild.map(guild => (
                      <div key={guild.id} className="space-y-1 text-left">
                        <div className="flex items-center gap-1.5 sticky top-0 bg-[#121212] py-1 z-[1] border-b border-white/5 mb-1 text-[8px] font-extrabold text-cyan-400 uppercase tracking-widest select-none">
                          <Server className="w-2.5 h-2.5 text-zinc-500 shrink-0" />
                          <span>{guild.name}</span>
                        </div>
                        <div className="space-y-0.5">
                          {guild.members.map((member: DiscordMember) => (
                            <button
                              key={member.id}
                              type="button"
                              onClick={() => { handleSelect(`<@${member.id}>`); playButtonSound(); }}
                              className="w-full text-left px-2 py-1.5 flex items-center justify-between hover:bg-cyan-500/5 border border-transparent hover:border-cyan-500/10 rounded-lg transition-all group"
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                {member.avatar ? (
                                  <img src={member.avatar} alt="avatar" className="w-4 h-4 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center bg-[#222]" style={{ borderColor: member.color, borderWidth: 1 }}>
                                    <User className="w-2.5 h-2.5" style={{ color: member.color }} />
                                  </div>
                                )}
                                <div className="flex flex-col overflow-hidden leading-tight">
                                  <span className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors truncate" style={{ color: member.color }}>
                                    {member.displayName}
                                  </span>
                                  <span className="text-[8px] text-zinc-500 group-hover:text-zinc-400 truncate font-mono">
                                    @{member.username}
                                  </span>
                                </div>
                              </div>
                              <code className="text-[8px] font-mono bg-[#09090b] text-zinc-500 group-hover:text-cyan-400 px-1 border border-[#222] rounded transition-all shrink-0">
                                {member.id}
                              </code>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                  <div className="p-2 bg-[#09090b] border border-white/5 rounded-lg text-center select-none shrink-0 mt-3">
                    <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider leading-relaxed">
                      * Inserts raw user format &lt;@ID&gt; at cursor
                    </p>
                  </div>
                </div>
              )}

              {/* CHANNELS TAB */}
              {activeTab === 'channels' && (
                <div className="p-2 space-y-4">
                  {filteredChannelsByGuild.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-zinc-500 text-xs italic">No channels found matching query</p>
                    </div>
                  ) : (
                    filteredChannelsByGuild.map(guild => (
                      <div key={guild.id} className="space-y-1 text-left">
                        <div className="flex items-center gap-1.5 sticky top-0 bg-[#121212] py-1 z-[1] border-b border-white/5 mb-1 text-[8px] font-extrabold text-cyan-400 uppercase tracking-widest select-none">
                          <Server className="w-2.5 h-2.5 text-zinc-500 shrink-0" />
                          <span>{guild.name}</span>
                        </div>
                        <div className="space-y-0.5">
                          {guild.channels?.map((channel: DiscordChannel) => (
                            <button
                              key={channel.id}
                              type="button"
                              onClick={() => { handleSelect(`<#${channel.id}> `); playButtonSound(); }}
                              className="w-full text-left px-2 py-1.5 flex items-center justify-between hover:bg-cyan-500/5 border border-transparent hover:border-cyan-500/10 rounded-lg transition-all group"
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <Hash className="w-3.5 h-3.5 text-zinc-400 group-hover:text-cyan-400 transition-colors shrink-0" />
                                <span className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors truncate">
                                  {channel.name}
                                </span>
                              </div>
                              <code className="text-[8px] font-mono bg-[#09090b] text-zinc-500 group-hover:text-cyan-400 px-1 border border-[#222] rounded transition-all shrink-0">
                                {channel.id}
                              </code>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                  <div className="p-2 bg-[#09090b] border border-white/5 rounded-lg text-center select-none shrink-0 mt-3">
                    <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider leading-relaxed">
                      * Inserts raw channel format &lt;#ID&gt; at cursor
                    </p>
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
