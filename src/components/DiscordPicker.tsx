import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MoreHorizontal, X, Search } from 'lucide-react';
import { cn } from '@/utils';
import { motion, AnimatePresence } from 'motion/react';

interface DiscordPickerProps {
  onSelect: (insertText: string) => void;
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
    emojis: ["🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶", "🌽", "🥕", "🧄", "🧅", "🥔", "🍠", "🥐", "🥯", "🍞", "🥖", "🥨", "🧀", "🥚", "🍳", "🧈", "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🌭", "🍔", "🍟", "🍕", "🥪", "🥙", "🧆", "🌮", "🌯", "🥗", "🥘", "🥫", "🍝", "🍜", "🍲", "🍛", "🍣", "🍱", "🥟", "🦪", "🍤", "🍙", "🍚", "🍘", "🍥", "🥠", "🥮", "🍢", "🍡", "🍧", "🍨", "🍦", "🥧", "🧁", "🍰", "🎂", "🍮", "🍭", "🍬", "🍫", "🍿", "🍩", "🍪", "🌰", "🥜", "🍯", "🥛", "🍼", "☕️", "🍵", "🧃", "🥤", "🍶", "🍺", "🍻", "🥂", "🍷", "🥃", "🍸", "🍹", "🧉", "🍾", "🧊", "🥄", "🍴", "🍽", "🥣", "🥡", "🥢", "🧂"]
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

export function DiscordPicker({ onSelect }: DiscordPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'emoji' | 'time' | 'pings'>('emoji');
  const [searchQuery, setSearchQuery] = useState('');
  const [pingsEnabled, setPingsEnabled] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTimestampSelect = (format: string) => {
    const unixTimestamp = Math.floor(new Date().getTime() / 1000);
    onSelect(`<t:${unixTimestamp}:${format}>`);
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

  return (
    <div className="relative" ref={containerRef}>
      <button 
        onClick={() => { setIsOpen(!isOpen); setSearchQuery(''); }}
        className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors flex items-center justify-center gap-1 group relative z-10"
        title="Select Emoji or Timestamp"
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 bottom-full mb-2 w-[320px] bg-[#121212] border border-[#222] rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] overflow-hidden z-20 flex flex-col h-[400px]"
          >
            {/* Header Tabs */}
            <div className="flex bg-[#161616] border-b border-[#222]">
              <button 
                onClick={() => { setActiveTab('emoji'); setSearchQuery(''); }}
                className={cn(
                  "flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors",
                  activeTab === 'emoji' ? "border-cyan-500 text-cyan-400" : "border-transparent text-zinc-500 hover:text-zinc-300"
                )}
              >
                Emojis
              </button>
              <button 
                onClick={() => { setActiveTab('time'); setSearchQuery(''); }}
                className={cn(
                  "flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors",
                  activeTab === 'time' ? "border-cyan-500 text-cyan-400" : "border-transparent text-zinc-500 hover:text-zinc-300"
                )}
              >
                Times
              </button>
              <button 
                onClick={() => { setActiveTab('pings'); setSearchQuery(''); }}
                className={cn(
                  "flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors",
                  activeTab === 'pings' ? "border-cyan-500 text-cyan-400" : "border-transparent text-zinc-500 hover:text-zinc-300"
                )}
              >
                Pings
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="px-3 text-zinc-500 border-b-2 border-transparent hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#121212] flex flex-col">
              <div className="p-3 sticky top-0 bg-[#121212] z-10 border-b border-[#222]">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input 
                    type="text"
                    placeholder={`Search ${activeTab === 'emoji' ? 'emoji' : 'style'}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#222] text-white text-sm rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 focus:border-cyan-500/50 placeholder-zinc-600 transition-all font-sans"
                    autoFocus={activeTab !== 'pings'}
                  />
                </div>
              </div>

              {activeTab === 'emoji' && (
                <div className="p-3 flex-1 overflow-y-auto custom-scrollbar pb-4 space-y-4">
                  {filteredEmojis.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-zinc-600 text-xs italic">No emojis found for "{searchQuery}"</p>
                    </div>
                  ) : filteredEmojis.map((category, idx) => (
                      <div key={idx} className="space-y-1.5 text-left">
                        <h4 className="text-[9px] font-bold text-cyan-500/70 uppercase tracking-widest px-1 sticky top-0 bg-[#121212] py-1 z-[1]">{category.name}</h4>
                        <div className="grid grid-cols-8 gap-1">
                          {category.emojis.map((emoji, i) => (
                            <button
                              key={i}
                              onClick={() => { onSelect(emoji); setIsOpen(false); }}
                              className="w-full aspect-square flex items-center justify-center text-lg hover:bg-cyan-500/10 hover:text-cyan-400 rounded-lg transition-all"
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

              {activeTab === 'time' && (
                <div className="p-2 space-y-1">
                  {filteredTimestamps.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-zinc-600 text-xs italic">No styles found for "{searchQuery}"</p>
                    </div>
                  ) : (
                    <>
                      {!searchQuery && <p className="text-[9px] text-zinc-500 mb-2 px-2 pt-1.5 font-bold uppercase tracking-widest">Discord local timezone tags</p>}
                      {filteredTimestamps.map(ts => (
                        <button
                          key={ts.format}
                          onClick={() => { handleTimestampSelect(ts.format); setIsOpen(false); }}
                          className="w-full text-left px-3 py-2 flex flex-col hover:bg-cyan-500/10 border border-transparent rounded-xl transition-all group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-200 text-sm font-medium group-hover:text-white transition-colors">{ts.label}</span>
                            <code className="text-[10px] bg-[#0a0a0a] border border-[#222] px-2 py-0.5 rounded-lg text-zinc-400 group-hover:text-cyan-400 group-hover:border-cyan-500/20 transition-all font-mono">
                              {":" + ts.format}
                            </code>
                          </div>
                          <span className="text-[9px] text-zinc-500 mt-1 block font-bold uppercase tracking-wider">e.g. {ts.example}</span>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}

              {activeTab === 'pings' && (
                <div className="p-4 space-y-5 flex-1 flex flex-col">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-[#0a0a0a] border border-[#222] rounded-xl">
                            <div className="space-y-0.5">
                                <p className="text-sm font-bold text-white">Enable Pings</p>
                                <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">Announce to channel</p>
                            </div>
                            <button 
                                onClick={() => setPingsEnabled(!pingsEnabled)}
                                className={cn(
                                    "w-10 h-5 rounded-full relative transition-colors duration-200",
                                    pingsEnabled ? "bg-cyan-500" : "bg-zinc-800"
                                )}
                            >
                                <motion.div 
                                    animate={{ left: pingsEnabled ? 24 : 4 }}
                                    className="absolute top-1 w-3 h-3 bg-white rounded-full transition-all" 
                                />
                            </button>
                        </div>

                        <div className={cn("grid grid-cols-1 gap-2 transition-opacity duration-300", !pingsEnabled && "opacity-40 pointer-events-none")}>
                            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mb-1 px-1">Select Ping Type</p>
                            <button
                                onClick={() => { if(pingsEnabled) { onSelect('@everyone '); setIsOpen(false); } }}
                                className="w-full p-3 bg-[#0a0a0a] hover:bg-cyan-500/5 border border-[#222] hover:border-cyan-500/30 rounded-xl text-left transition-all group"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">@everyone</span>
                                    <div className={cn("w-4 h-4 rounded-full border-2 transition-colors", pingsEnabled ? "border-zinc-700 group-hover:border-cyan-400" : "border-zinc-800")} />
                                </div>
                                <p className="text-[10px] text-zinc-500 mt-0.5">Notifies every single person</p>
                            </button>
                            <button
                                onClick={() => { if(pingsEnabled) { onSelect('@here '); setIsOpen(false); } }}
                                className="w-full p-3 bg-[#0a0a0a] hover:bg-cyan-500/5 border border-[#222] hover:border-cyan-500/30 rounded-xl text-left transition-all group"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">@here</span>
                                    <div className={cn("w-4 h-4 rounded-full border-2 transition-colors", pingsEnabled ? "border-zinc-700 group-hover:border-cyan-400" : "border-zinc-800")} />
                                </div>
                                <p className="text-[10px] text-zinc-500 mt-0.5">Notifies only active users</p>
                            </button>
                        </div>
                    </div>

                    <div className="mt-auto p-3 bg-cyan-950/20 border border-cyan-500/10 rounded-xl">
                        <p className="text-[9px] text-cyan-500 font-bold uppercase tracking-wider leading-relaxed">
                            * Selected ping will be inserted at the end of your content.
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
