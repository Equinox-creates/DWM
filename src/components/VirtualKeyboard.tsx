import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { GoogleGenAI } from "@google/genai";
import { Delete, ArrowBigUp as Shift, Check, Smile, Search, ChevronDown, Type, Clipboard, History, CornerDownLeft, LayoutGrid, Mic, ArrowLeft, X, Bot, Globe, XCircle, Sparkles } from 'lucide-react';
import { useVirtualKeyboard } from '../contexts/VirtualKeyboardContext';
import { cn } from '../utils';

type Layout = 'letters' | 'symbols' | 'numbers' | 'clipboard' | 'emojis' | 'pings' | 'tools';

const TOOL_KEYS = [
  { id: 'auto-correct', label: 'Auto-Correct', icon: Bot },
  { id: 'ai-refine', label: 'AI Refine', icon: Bot },
  { id: 'cursor-left', label: 'Left', icon: ArrowLeft },
  { id: 'cursor-right', label: 'Right', icon: ArrowLeft }, // Mirror mapping below
  { id: 'copy', label: 'Copy All', icon: Clipboard },
  { id: 'clear', label: 'Clear All', icon: XCircle },
];

const EMOJIS = [
  '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '🥵', '🥶', '🥳', '🥴', '🥺', '🕵️', '👷', '👮', '💂', '🕵️‍♀️', '👷‍♀️', '👮‍♀️', '💂‍♀️', '👩‍⚕️', '👩‍🎓', '👩‍🏫', '👩‍⚖️', '👩‍🌾', '👩‍🍳', '👩‍🔧', '👩‍🏭', '👩‍💼', '👩‍🔬', '👩‍💻', '👩‍🎤', '👩‍🎨', '👩‍✈️', '👩‍🚀', '👩‍🚒'
];

const Key = React.memo(({ k, onKey, layout, isShift, isCaps, isSearch, isMultiline, languageCode, activeInputId }: { 
  k: string, 
  onKey: (key: string) => void, 
  layout: Layout, 
  isShift: boolean, 
  isCaps: boolean,
  isSearch: boolean,
  isMultiline: boolean,
  languageCode: string,
  activeInputId: string | null
}) => {
    const isSpecial = ['shift', 'backspace', '?123', 'ABC', 'enter', '=\\<', 'emojis', 'globe'].includes(k);
    const isSpace = k === 'space';
    const isShiftActive = k === 'shift' && (isShift || isCaps);
    
    return (
        <button
            onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onKey(k);
            }}
            className={cn(
                "relative flex items-center justify-center rounded-lg font-medium text-white transition-all active:scale-90 select-none shadow-sm touch-none",
                isSpace ? "flex-[5] bg-[#333]" : isSpecial ? "flex-1 bg-[#252525]" : "flex-1 bg-[#333]",
                k === 'enter' ? "bg-[#5865F2] text-white" : "text-zinc-100",
                isShiftActive && "bg-[#5865f2]/20 text-[#5865f2]",
                "h-full"
            )}
            style={{ 
                minWidth: isSpace ? '0' : '32px',
                fontSize: layout === 'letters' && !isSpecial ? '1.25rem' : '0.85rem'
            }}
        >
            {k === 'shift' ? <Shift className={cn("w-5 h-5", isShiftActive ? "text-[#5865F2] fill-[#5865F2]" : "text-white")} /> :
             k === 'backspace' ? <Delete className="w-5 h-5 text-white" /> :
             k === 'enter' ? (isSearch || activeInputId?.includes('webhook') ? <Bot className="w-5 h-5" /> : isSearch ? <Search className="w-5 h-5" /> : isMultiline ? <CornerDownLeft className="w-5 h-5" /> : <Check className="w-5 h-5" />) :
             k === 'globe' ? <Globe className="w-5 h-5 text-zinc-400" /> :
             k === 'emojis' ? <Smile className="w-5 h-5" /> :
             k === 'space' ? <span className="text-[9px] text-white/40 uppercase font-black tracking-widest">{languageCode === 'en-US' ? 'Space' : languageCode.split('-')[0].toUpperCase()}</span> :
             (layout === 'letters' && !isSpecial ? (isShift || isCaps ? k.toUpperCase() : k.toLowerCase()) : k)}
            
            {k === 'shift' && isCaps && (
                <div className="absolute bottom-1 w-1 h-1 bg-cyan-400 rounded-full" />
            )}
        </button>
    );
});

export const VirtualKeyboard: React.FC = () => {
  const { isOpen, activeInput, closeKeyboard, clipboard } = useVirtualKeyboard();
  const keyboardRef = React.useRef<HTMLDivElement>(null);

  // Close on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && keyboardRef.current && !keyboardRef.current.contains(event.target as Node)) {
        // Don't close if we clicked an input or button that might be part of the UI but outside the keyboard
        // OR if the target has specific data attributes
        const target = event.target as HTMLElement;
        if (target.closest('[data-virtual-keyboard-trigger]') || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
            return;
        }
        closeKeyboard();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, closeKeyboard]);

  const [layout, setLayout] = useState<Layout>('letters');
  const [isShift, setIsShift] = useState(false);
  const [isCaps, setIsCaps] = useState(false);
    const [toolbarMode, setToolbarMode] = useState<'main' | 'menu' | 'clipboard' | 'voice' | 'languages' | 'ai'>('main');
  const [voiceText, setVoiceText] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState({ code: 'en-US', name: 'English' });
  const [emojiSearch, setEmojiSearch] = useState('');
  const [aiPrompt] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [voiceVolume, setVoiceVolume] = useState<number>(0);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const analyzerRef = React.useRef<AnalyserNode | null>(null);
  const animationFrameRef = React.useRef<number | null>(null);
  const scrollRef = React.useRef({ startX: 0, startY: 0, isScrolling: false });

  const startVolumeAnalysis = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyzerRef.current = audioContextRef.current.createAnalyser();
      analyzerRef.current.fftSize = 64;
      source.connect(analyzerRef.current);

      const bufferLength = analyzerRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const update = () => {
        if (!analyzerRef.current || toolbarMode !== 'voice') {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            return;
        }
        analyzerRef.current.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const average = sum / bufferLength;
        setVoiceVolume(average);
        animationFrameRef.current = requestAnimationFrame(update);
      };
      update();
    } catch (err) {
      console.error("Volume Analysis Error:", err);
    }
  }, [toolbarMode]);

  const stopVolumeAnalysis = useCallback(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error);
    }
    audioContextRef.current = null;
    setVoiceVolume(0);
  }, []);
  const LANGUAGES = [
    { code: 'en-US', name: 'English' },
    { code: 'es-ES', name: 'Spanish' },
    { code: 'fr-FR', name: 'French' },
    { code: 'de-DE', name: 'German' },
    { code: 'hi-IN', name: 'Hindi' },
    { code: 'bn-IN', name: 'Bengali' },
    { code: 'ja-JP', name: 'Japanese' }
  ];

  const COMMON_WORDS = React.useMemo(() => [
    "the", "be", "to", "of", "and", "a", "in", "that", "have", "I", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at", 
    "this", "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what",
    "so", "up", "out", "if", "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time", "no", "just", "him", "know", "take",
    "people", "into", "year", "your", "good", "some", "could", "them", "see", "other", "than", "then", "now", "look", "only", "come", "its", "over", "think", "also",
    "back", "after", "use", "two", "how", "our", "work", "first", "well", "way", "even", "new", "want", "because", "any", "these", "give", "day", "most", "us",
    "discord", "webhook", "awesome", "hello", "thanks", "here", "cool", "send", "message", "embed"
  ], []);

    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const getAISuggestions = useCallback(async (word: string) => {
    if (!word || word.length < 2) return;
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ 
          role: 'user', 
          parts: [{ text: `Provide 5 word completions for the prefix "${word}". Only output the words separated by spaces.` }] 
        }]
      });
      
      const text = response.text || "";
      const suggested = text.trim().split(/\s+/).filter(Boolean).map(w => w.toLowerCase());
      if (suggested.length > 0) {
        setSuggestions(suggested);
      }
    } catch (err) {
      console.error("AI Suggestions Error:", err);
    }
  }, []);

  const updateSuggestions = useCallback((val: string, pos: number) => {
    if (!val) {
      setSuggestions([]);
      return;
    }

    const textBeforeCursor = val.substring(0, pos);
    const lastWordMatch = textBeforeCursor.match(/(\w+)$/);
    
    if (lastWordMatch) {
      const lastWord = lastWordMatch[1].toLowerCase();
      if (lastWord.length > 0) {
        const filtered = COMMON_WORDS.filter(w => w.startsWith(lastWord) && w !== lastWord).slice(0, 5);
        if (filtered.length > 0) {
          setSuggestions(filtered);
        } else if (lastWord.length >= 2) {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => {
            getAISuggestions(lastWord);
          }, 500);
        }
      } else {
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
  }, [COMMON_WORDS, getAISuggestions]);

  const insertText = useCallback((text: string) => {
    vibrate();
    if (!activeInput) return;
    
    if (!(activeInput instanceof HTMLInputElement || activeInput instanceof HTMLTextAreaElement)) return;

    const start = activeInput.selectionStart || 0;
    const end = activeInput.selectionEnd || 0;
    const value = activeInput.value;
    const newValue = value.substring(0, start) + text + value.substring(end);

    try {
      const proto = activeInput instanceof HTMLTextAreaElement 
        ? window.HTMLTextAreaElement.prototype 
        : window.HTMLInputElement.prototype;
      const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      
      if (nativeSetter) {
        nativeSetter.call(activeInput, newValue);
      } else {
        (activeInput as HTMLInputElement | HTMLTextAreaElement).value = newValue;
      }

      const newPos = start + text.length;
      activeInput.setSelectionRange(newPos, newPos);
      activeInput.dispatchEvent(new Event('input', { bubbles: true }));
      activeInput.dispatchEvent(new Event('change', { bubbles: true }));
      activeInput.focus();
      
      updateSuggestions(newValue, newPos);
    } catch (err) {
      console.warn('Failed to insert text via native setter, falling back:', err);
      (activeInput as HTMLInputElement | HTMLTextAreaElement).value = newValue;
      activeInput.setSelectionRange(start + text.length, start + text.length);
      activeInput.focus();
    }
  }, [activeInput, updateSuggestions]);

  // Vibrate helper - disabled for performance optimization
  const vibrate = (ms?: number) => {
    // Disabled to prevent lag on mobile devices
    if (ms) {
      // No-op
    }
  };

  const applySuggestion = useCallback((suggestion: string) => {
    if (!activeInput) return;
    const start = activeInput.selectionStart || 0;
    const value = activeInput.value;
    const textBeforeCursor = value.substring(0, start);
    const lastWordMatch = textBeforeCursor.match(/(\w+)$/);
    
    if (lastWordMatch) {
      const lastWord = lastWordMatch[1];
      const prefix = textBeforeCursor.substring(0, textBeforeCursor.length - lastWord.length);
      const suffix = value.substring(start);
      
      const newValue = prefix + suggestion + ' ' + suffix;
      const newPos = prefix.length + suggestion.length + 1;

      try {
        const proto = activeInput instanceof HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
        const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        if (nativeSetter) nativeSetter.call(activeInput, newValue);
        else (activeInput as HTMLInputElement | HTMLTextAreaElement).value = newValue;

        activeInput.setSelectionRange(newPos, newPos);
        activeInput.dispatchEvent(new Event('input', { bubbles: true }));
        activeInput.focus();
        setSuggestions([]);
      } catch {
        (activeInput as HTMLInputElement | HTMLTextAreaElement).value = newValue;
        activeInput.setSelectionRange(newPos, newPos);
        setSuggestions([]);
      }
    }
  }, [activeInput]);

  const handleKey = useCallback((key: string) => {
    if (!activeInput) return;
    if (!(activeInput instanceof HTMLInputElement || activeInput instanceof HTMLTextAreaElement)) return;

    if (key === 'shift') {
      if (isShift) {
        setIsCaps(!isCaps);
        setIsShift(false);
      } else {
        setIsShift(true);
      }
      return;
    }

    if (key === 'globe') {
      setToolbarMode('languages');
      return;
    }

    if (key === 'backspace') {
      const start = activeInput.selectionStart || 0;
      const end = activeInput.selectionEnd || 0;
      const value = activeInput.value;
      const newValue = (start === end && start > 0) 
        ? value.substring(0, Math.max(0, start - (value.charCodeAt(start - 1) >= 0xD800 && value.charCodeAt(start - 1) <= 0xDBFF ? 2 : 1))) + value.substring(end)
        : value.substring(0, start) + value.substring(end);
        
      const newPos = (start === end && start > 0)
        ? Math.max(0, start - (value.charCodeAt(start - 1) >= 0xD800 && value.charCodeAt(start - 1) <= 0xDBFF ? 2 : 1))
        : start;

      try {
        const proto = activeInput instanceof HTMLTextAreaElement 
          ? window.HTMLTextAreaElement.prototype 
          : window.HTMLInputElement.prototype;
        const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        
        if (nativeSetter) {
          nativeSetter.call(activeInput, newValue);
        } else {
          (activeInput as HTMLInputElement | HTMLTextAreaElement).value = newValue;
        }
        
        activeInput.setSelectionRange(newPos, newPos);
        activeInput.dispatchEvent(new Event('input', { bubbles: true }));
        activeInput.dispatchEvent(new Event('change', { bubbles: true }));
        
        updateSuggestions(newValue, newPos);
      } catch (err) {
        console.warn('Backspace failed via native setter:', err);
        (activeInput as HTMLInputElement | HTMLTextAreaElement).value = newValue;
        activeInput.setSelectionRange(newPos, newPos);
      }
      return;
    }

    if (key === 'space') {
      insertText(' ');
      return;
    }

    if (key === 'enter') {
      if (activeInput.tagName === 'TEXTAREA') {
        insertText('\n');
      } else {
        const form = activeInput.closest('form');
        if (form) form.requestSubmit();
        else closeKeyboard();
      }
      return;
    }

    if (key === '?123') {
      setLayout('numbers');
      return;
    }
    if (key === 'ABC') {
      setLayout('letters');
      return;
    }
    if (key === '=\\<') {
      setLayout('symbols');
      return;
    }
    if (key === 'emojis') {
      setLayout('emojis');
      return;
    }

    let char = key;
    if (layout === 'letters') {
      char = (isShift || isCaps) ? key.toUpperCase() : key.toLowerCase();
    }
    insertText(char);
    if (isShift) setIsShift(false);
  }, [activeInput, isShift, isCaps, layout, insertText, closeKeyboard, updateSuggestions]);

  const handleAiRefine = useCallback(async () => {
    if (!activeInput || !(activeInput instanceof HTMLInputElement || activeInput instanceof HTMLTextAreaElement)) {
        toast.error("Please focus an input first.");
        return;
    }
    const currentText = activeInput.value;
    if (!currentText.trim()) {
      toast.error("Input is empty.");
      return;
    }
    
    setIsAiLoading(true);
    vibrate(30);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ 
          role: 'user', 
          parts: [{ text: `Improve the grammar, spelling, tone, and flow of this English text to make it sound professional and natural, while keeping its core meaning: "${currentText}". Return ONLY the improved text without quotes, preamble, or any conversational fillers.` }] 
        }]
      });
      const refined = (response.text || "").trim().replace(/^"|"$/g, '');
      if (refined) {
        const proto = activeInput instanceof HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
        const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        if (nativeSetter) nativeSetter.call(activeInput, refined);
        else activeInput.value = refined;
        
        activeInput.dispatchEvent(new Event('input', { bubbles: true }));
        toast.success("English corrected & improved!");
        vibrate(50);
      }
    } catch (error) {
      console.error("AI Refine Error:", error);
      toast.error("Failed to refine text.");
    } finally {
      setIsAiLoading(false);
    }
  }, [activeInput]);

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    setAiResult('');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ 
          role: 'user', 
          parts: [{ text: `Write a short, professional paragraph or message based on this prompt: "${aiPrompt}". Use ${currentLanguage.name} language. Return ONLY the text, no conversational fillers or extra talk.` }] 
        }]
      });
      setAiResult((response.text || "").trim());
    } catch (error) {
      console.error("AI Generation Error:", error);
      toast.error("Failed to generate text.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const LETTER_ROWS = React.useMemo(() => [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace'],
    ['?123', 'emojis', ',', 'space', '.', 'enter']
  ], []);

  const SYMBOL_ROWS = React.useMemo(() => [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['@', '#', '$', '_', '&', '-', '+', '(', ')', '/'],
    ['=\\<', '*', '"', "'", ':', ';', '!', '?', 'backspace'],
    ['ABC', 'emojis', ',', 'space', '.', 'enter']
  ], []);

  const EXTRA_SYMBOL_ROWS = React.useMemo(() => [
    ['~', '`', '|', '•', '√', 'π', '÷', '×', '{', '}'],
    ['£', '€', '¥', '¢', '©', '®', '™', '℅', '[', ']'],
    ['?123', '<', '>', '±', '§', '«', '»', 'backspace'],
    ['ABC', 'emojis', ',', 'space', '.', 'enter']
  ], []);

  const getCurrentRows = useCallback(() => {
    if (layout === 'letters') return LETTER_ROWS;
    if (layout === 'numbers') return SYMBOL_ROWS;
    return EXTRA_SYMBOL_ROWS;
  }, [layout, LETTER_ROWS, SYMBOL_ROWS, EXTRA_SYMBOL_ROWS]);

  const [recognition, setRecognition] = useState<unknown>(null);

  React.useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = currentLanguage.code;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rec.onresult = (event: any) => {
        let interimTranscript = '';
        const currentResultIndex = event.resultIndex;

        for (let i = currentResultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            setVoiceText(prev => (prev ? prev + ' ' : '') + transcript);
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (interimTranscript) {
          setVoiceText(prev => {
            const base = prev || '';
            return base + ' ' + interimTranscript;
          });
        }
      };

      rec.onend = () => {
        setIsListening(false);
        stopVolumeAnalysis();
      };
      
      rec.onerror = () => {
        setIsListening(false);
        stopVolumeAnalysis();
      };

      setRecognition(rec);
    }
  }, [insertText, currentLanguage.code, stopVolumeAnalysis]);

  const handleMicPress = () => {
    vibrate(100);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec = recognition as any;
    if (isListening) {
      rec?.stop();
      setIsListening(false);
      stopVolumeAnalysis();
      return;
    }

    setIsListening(true);
    setToolbarMode('voice');
    setVoiceText(null);
    startVolumeAnalysis();
    if (rec) {
       try {
         rec.start();
       } catch {
         setIsListening(false);
       }
    } else {
      toast.error("Speech recognition not supported in this browser.");
      setIsListening(false);
    }
  };

  React.useEffect(() => {
    if (toolbarMode !== 'voice' && isListening) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (recognition as any)?.stop();
    }
  }, [toolbarMode, isListening, recognition]);

  const isMultiline = activeInput?.tagName === 'TEXTAREA';
  const isSearch = activeInput?.type === 'search' || activeInput?.placeholder?.toLowerCase().includes('search');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            ref={keyboardRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            data-virtual-keyboard
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.1 }}
            onDragEnd={(_, info) => {
                if (info.offset.y > 150) {
                    closeKeyboard();
                }
            }}
            className="fixed bottom-0 left-0 right-0 z-[1000] bg-[#1a1a1a]/95 backdrop-blur-2xl pb-safe shadow-[0_-15px_40px_rgba(0,0,0,0.9)] border-t border-white/10 flex flex-col select-none rounded-t-[2rem]"
          >
            {/* Gboard-style Toolbar */}
            <div className="h-12 flex items-center px-2 bg-transparent relative overflow-hidden cursor-grab active:cursor-grabbing">
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-white/20 rounded-full" />
                <AnimatePresence mode="wait">
                    {toolbarMode === 'main' && (
                        <motion.div 
                            key="main"
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 20, opacity: 0 }}
                            className="flex-1 flex items-center h-full"
                        >
                            <button 
                                onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); vibrate(); setToolbarMode('menu'); }}
                                className="w-12 h-full flex items-center justify-center text-zinc-400 active:text-white"
                            >
                                <LayoutGrid className="w-5 h-5" />
                            </button>

                             <div className="flex-1 flex items-center h-full px-2 gap-4 overflow-x-auto no-scrollbar scroll-smooth min-w-0 relative">
                                {suggestions.length > 0 ? (
                                    <div className="flex items-center gap-3 overflow-visible whitespace-nowrap">
                                        {suggestions.map(s => (
                                            <button 
                                                key={s}
                                                onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); applySuggestion(s); }}
                                                className="px-4 py-1.5 bg-[#333] border border-white/10 rounded-2xl text-[11px] font-bold text-white whitespace-nowrap hover:bg-white/10 active:scale-95 flex-shrink-0 transition-all shadow-sm"
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center">
                                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] animate-pulse">DWM Smart Board</span>
                                    </div>
                                )}
                            </div>

                            <button 
                                onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); handleMicPress(); }}
                                className="w-12 h-full flex items-center justify-center text-zinc-400 active:text-white"
                            >
                                <Mic className="w-5 h-5" />
                            </button>
                        </motion.div>
                    )}

                    {(toolbarMode === 'menu' || toolbarMode === 'languages' || toolbarMode === 'ai') && (
                        <motion.div 
                            key="menu-nav"
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 20, opacity: 0 }}
                            className="flex-1 flex items-center h-full px-1"
                        >
                            <button 
                                onPointerDown={(e) => { 
                                    e.preventDefault(); 
                                    e.stopPropagation(); 
                                    vibrate(); 
                                    if (toolbarMode === 'languages' || toolbarMode === 'ai') setToolbarMode('menu');
                                    else setToolbarMode('main'); 
                                }}
                                className="w-10 h-full flex items-center justify-center text-zinc-400 active:text-white"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="flex-1 flex items-center h-full px-2">
                                <span className="text-[10px] font-black p-1 text-zinc-500 uppercase tracking-[0.2em]">
                                    {toolbarMode === 'languages' ? 'Select Language' : toolbarMode === 'ai' ? 'DWM Auto TXT Generator' : 'DWM Options'}
                                </span>
                            </div>
                        </motion.div>
                    )}

                    {toolbarMode === 'clipboard' && (
                         <motion.div 
                            key="clipboard-toolbar"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            className="flex-1 flex items-center h-full px-1"
                        >
                            <button 
                                onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); vibrate(); setToolbarMode('main'); }}
                                className="w-10 h-full flex items-center justify-center text-zinc-400"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest ml-1">Clipboard</span>
                            <div className="flex-1 flex items-center gap-2 px-4 overflow-x-auto no-scrollbar">
                                {clipboard.map((text, i) => (
                                    <button 
                                        key={i}
                                        onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); insertText(text); }}
                                        className="h-7 bg-zinc-800 border border-white/5 rounded px-2.5 text-[10px] text-zinc-300 whitespace-nowrap max-w-[150px] truncate"
                                    >
                                        {text}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {toolbarMode === 'voice' && (
                        <motion.div 
                            key="voice"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex items-center h-full bg-[#1a1a1a]"
                        >
                            <button 
                                onPointerDown={(e) => { 
                                    e.preventDefault(); 
                                    e.stopPropagation(); 
                                    vibrate(); 
                                    setToolbarMode('main'); 
                                    stopVolumeAnalysis(); 
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    (recognition as any)?.stop(); 
                                    setIsListening(false); 
                                }}
                                className="w-12 h-full flex items-center justify-center text-zinc-500"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            
                            <div className="flex-1 flex items-center justify-center px-4 overflow-hidden">
                                {isListening ? (
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1">
                                            {[0,1,2,3,4,5].map(i => (
                                                <motion.div 
                                                    key={i}
                                                    animate={{ 
                                                        height: [8, Math.max(8, (voiceVolume / 255) * 40 * (1 - Math.abs(i-2.5)/3)), 8] 
                                                    }}
                                                    transition={{ repeat: Infinity, duration: 0.2 }}
                                                    className="w-1 bg-[#5865F2] rounded-full"
                                                />
                                            ))}
                                        </div>
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{voiceText ? (voiceText.split(' ').length > 11 ? voiceText.split(' ').slice(0, 11).join(' ') + '...' : voiceText) : 'Listening...'}</span>
                                    </div>
                                ) : (
                                    voiceText && (
                                        <button 
                                            onPointerDown={(e) => { 
                                                e.preventDefault(); 
                                                e.stopPropagation(); 
                                                insertText(voiceText); 
                                                setToolbarMode('main'); 
                                                setVoiceText(null);
                                            }}
                                            className="px-4 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white max-w-full truncate animate-in zoom-in-95"
                                        >
                                            {voiceText.split(' ').length > 11 ? voiceText.split(' ').slice(0, 11).join(' ') + '...' : voiceText}
                                        </button>
                                    )
                                )}
                            </div>
                            
                            <button 
                                onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); handleMicPress(); }}
                                className={cn("w-12 h-full flex items-center justify-center", isListening ? "text-red-500" : "text-zinc-500")}
                            >
                                <Mic className={cn("w-5 h-5", isListening && "animate-pulse")} />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
                
                <button 
                    onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); closeKeyboard(); }}
                    className="w-12 h-full flex items-center justify-center text-zinc-500 hover:text-white transition-colors active:scale-95"
                >
                    <ChevronDown className="w-6 h-6" />
                </button>
            </div>

            <div className="relative overflow-hidden">
                <AnimatePresence mode="wait">
                    {toolbarMode === 'menu' ? (
                        <motion.div
                            key="menu-grid"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="h-[210px] bg-[#1a1a1a] p-6"
                        >
                            <div className="grid grid-cols-4 gap-4 h-full">
                                <button
                                    onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); vibrate(); setToolbarMode('ai'); }}
                                    className="flex flex-col items-center justify-center gap-2 bg-transparent rounded-2xl hover:bg-white/5 transition-all active:scale-95 group"
                                >
                                    <div className="w-14 h-11 flex items-center justify-center bg-zinc-800 rounded-2xl text-cyan-400 shadow-sm group-hover:bg-cyan-400 group-hover:text-black transition-all">
                                        <Bot className="w-6 h-6" />
                                    </div>
                                    <span className="text-[10px] font-medium text-zinc-500 group-hover:text-white uppercase tracking-tight">Auto TXT</span>
                                </button>
                                <button
                                    onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); vibrate(); setLayout('pings'); setToolbarMode('main'); }}
                                    className="flex flex-col items-center justify-center gap-2 bg-transparent rounded-2xl hover:bg-white/5 transition-all active:scale-95 group"
                                >
                                    <div className="w-14 h-11 flex items-center justify-center bg-zinc-800 rounded-2xl text-amber-400 shadow-sm group-hover:bg-amber-400 group-hover:text-black transition-all">
                                        <Bot className="w-6 h-6" />
                                    </div>
                                    <span className="text-[10px] font-medium text-zinc-500 group-hover:text-white uppercase tracking-tight">Pings</span>
                                </button>
                                <button
                                    onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); vibrate(); setLayout('tools'); setToolbarMode('main'); }}
                                    className="flex flex-col items-center justify-center gap-2 bg-transparent rounded-2xl hover:bg-white/5 transition-all active:scale-95 group"
                                >
                                    <div className="w-14 h-11 flex items-center justify-center bg-zinc-800 rounded-2xl text-green-400 shadow-sm group-hover:bg-green-400 group-hover:text-black transition-all">
                                        <LayoutGrid className="w-6 h-6" />
                                    </div>
                                    <span className="text-[10px] font-medium text-zinc-500 group-hover:text-white uppercase tracking-tight">Tools</span>
                                </button>
                                <button
                                    onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); vibrate(); setToolbarMode('languages'); }}
                                    className="flex flex-col items-center justify-center gap-2 bg-transparent rounded-2xl hover:bg-white/5 transition-all active:scale-95 group"
                                >
                                    <div className="w-14 h-11 flex items-center justify-center bg-zinc-800 rounded-2xl text-blue-400 shadow-sm group-hover:bg-blue-400 group-hover:text-black transition-all">
                                        <Globe className="w-6 h-6" />
                                    </div>
                                    <span className="text-[10px] font-medium text-zinc-500 group-hover:text-white uppercase tracking-tight">Language</span>
                                </button>
                            </div>
                        </motion.div>
                    ) : layout === 'tools' ? (
                        <motion.div
                            key="tools-grid"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="h-[210px] bg-[#1a1a1a] p-6 flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <LayoutGrid className="w-4 h-4 text-[#4CBF56]" />
                                    Board Tools
                                </h3>
                                <button 
                                    onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); setToolbarMode('main'); setLayout('letters'); }}
                                    className="text-zinc-400"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="grid grid-cols-3 gap-3 flex-1">
                                {TOOL_KEYS.map(tool => (
                                    <button 
                                        key={tool.id}
                                        onPointerDown={(e) => { 
                                            e.preventDefault(); 
                                            e.stopPropagation(); 
                                            vibrate(); 
                                            if (tool.id === 'clear') {
                                                if (activeInput) {
                                                    activeInput.value = '';
                                                    const event = new Event('input', { bubbles: true });
                                                    activeInput.dispatchEvent(event);
                                                }
                                            } else if (tool.id === 'ai-refine') {
                                                handleAiRefine();
                                            } else if (tool.id === 'auto-correct') {
                                                setToolbarMode('ai');
                                            } else if (tool.id === 'cursor-left') {
                                                if (activeInput) {
                                                    const newPos = Math.max(0, (activeInput.selectionStart || 0) - 1);
                                                    activeInput.setSelectionRange(newPos, newPos);
                                                    activeInput.focus();
                                                }
                                            } else if (tool.id === 'cursor-right') {
                                                if (activeInput) {
                                                    const newPos = Math.min(activeInput.value.length, (activeInput.selectionEnd || 0) + 1);
                                                    activeInput.setSelectionRange(newPos, newPos);
                                                    activeInput.focus();
                                                }
                                            } else if (tool.id === 'copy') {
                                                if (activeInput) {
                                                    navigator.clipboard.writeText(activeInput.value);
                                                    toast.success("Copied!");
                                                }
                                            }
                                        }}
                                        className="relative bg-zinc-800 border border-white/5 rounded-2xl flex flex-col items-center justify-center p-2 active:scale-95 transition-all text-white font-bold gap-1 shadow-sm h-full"
                                    >
                                        <tool.icon className="w-5 h-5 text-zinc-400" />
                                        <span className="text-[9px] uppercase tracking-tighter">{tool.label}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    ) : layout === 'pings' ? (
                        <motion.div
                            key="ping-grid"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="h-[210px] bg-[#0c0c0c] p-6 flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Bot className="w-4 h-4 text-cyan-500" />
                                    Smart Pings
                                </h3>
                                <button 
                                    onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); setLayout('letters'); }}
                                    className="text-zinc-600 hover:text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="grid grid-cols-3 gap-2 flex-1 overflow-y-auto no-scrollbar pb-10">
                                {[
                                    '@everyone', '@here', '@user', '@role', '@channel', 'Help Needed!', 'On My Way', 'Check This', 'Wait a Sec', 
                                    'Ready?', 'Nice Work', 'Look Here', 'Danger'
                                ].map(ping => (
                                    <button 
                                        key={ping}
                                        onPointerDown={(e) => { 
                                            e.preventDefault(); 
                                            e.stopPropagation(); 
                                            vibrate(); 
                                            insertText(`${ping} `);
                                        }}
                                        className="bg-[#222] border border-white/5 rounded-xl flex flex-col items-center justify-center p-2 active:scale-95 transition-all text-white font-bold gap-1 shadow-sm h-full min-h-[60px]"
                                    >
                                        <div className="w-1 h-1 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                                        <span className="text-[10px] uppercase tracking-tighter text-center leading-tight">{ping}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    ) : toolbarMode === 'ai' ? (
                        <motion.div
                            key="ai-assistant"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="h-[210px] bg-[#1a1a1a] p-6 flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-2 shrink-0">
                                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-cyan-400" />
                                    DWM Assistant
                                </h3>
                                <button 
                                    onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); vibrate(); setToolbarMode('main'); setVoiceText(null); }}
                                    className="text-zinc-500"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex-1 flex flex-col items-center justify-center gap-4 min-h-0 overflow-hidden">
                                {isListening ? (
                                    <div className="flex flex-col items-center gap-4 py-2">
                                        <div className="flex items-center gap-1.5 h-12">
                                            {[0,1,2,3,4,5,6,7].map(i => (
                                                <motion.div 
                                                    key={i}
                                                    animate={{ 
                                                        height: [12, Math.max(12, (voiceVolume / 255) * 60 * (1 - Math.abs(i-3.5)/4)), 12] 
                                                    }}
                                                    transition={{ repeat: Infinity, duration: 0.2 }}
                                                    className="w-1.5 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                                                />
                                            ))}
                                        </div>
                                        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] animate-pulse">Listening...</span>
                                    </div>
                                ) : isAiLoading ? (
                                     <div className="flex flex-col items-center gap-3">
                                        <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Optimizing Idea...</span>
                                    </div>
                                ) : aiResult ? (
                                    <div className="w-full flex flex-col gap-3 max-h-full overflow-hidden">
                                        <div className="flex-1 p-4 bg-zinc-900 border border-white/5 rounded-2xl text-xs text-zinc-300 italic overflow-y-auto no-scrollbar">
                                            {aiResult}
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <button 
                                                onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); vibrate(); handleMicPress(); }}
                                                className="flex-1 py-3 bg-zinc-800 text-zinc-400 font-bold rounded-xl text-[10px] uppercase tracking-widest"
                                            >
                                                Retry
                                            </button>
                                            <button 
                                                onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); vibrate(); insertText(aiResult); setToolbarMode('main'); }}
                                                className="flex-[2] py-3 bg-cyan-500 text-black font-black rounded-xl text-[10px] uppercase tracking-widest shadow-lg shadow-cyan-500/20"
                                            >
                                                Inject Text
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-4">
                                        {voiceText ? (
                                            <div className="text-center space-y-4 px-4 overflow-hidden flex flex-col items-center">
                                                <p className="text-sm text-zinc-300 font-medium truncate max-w-full">
                                                    "{voiceText}"
                                                </p>
                                                <button 
                                                    onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); handleAiGenerate(); }}
                                                    className="px-8 py-3 bg-cyan-500 text-black font-black rounded-full text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-cyan-500/30 active:scale-95 transition-all"
                                                >
                                                    Process with AI
                                                </button>
                                            </div>
                                        ) : (
                                            <button 
                                                onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); vibrate(); handleMicPress(); }}
                                                className="w-16 h-16 rounded-full bg-cyan-500 flex items-center justify-center text-black shadow-lg shadow-cyan-500/20 active:scale-90 transition-all group"
                                            >
                                                <Mic className="w-7 h-7" />
                                            </button>
                                        )}
                                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">
                                            {voiceText ? 'Ready to Generate' : 'Describe your message'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ) : toolbarMode === 'languages' ? (
                        <motion.div
                            key="language-grid"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="h-[210px] bg-[#1a1a1a] p-4 flex flex-col no-scrollbar overflow-y-auto"
                            onPointerDown={e => {
                                scrollRef.current = { startX: e.clientX, startY: e.clientY, isScrolling: false };
                            }}
                            onPointerMove={e => {
                                if (Math.abs(e.clientX - scrollRef.current.startX) > 20 || Math.abs(e.clientY - scrollRef.current.startY) > 20) {
                                    scrollRef.current.isScrolling = true;
                                }
                            }}
                        >
                            <div className="grid grid-cols-2 gap-2 pb-4">
                                {LANGUAGES.map(lang => (
                                    <button
                                        key={lang.code}
                                        onPointerDown={(e) => { 
                                            e.preventDefault(); 
                                            e.stopPropagation();
                                        }}
                                        onPointerUp={() => {
                                            if (!scrollRef.current.isScrolling) {
                                                vibrate(); 
                                                setCurrentLanguage(lang);
                                                setToolbarMode('menu');
                                            }
                                        }}
                                        className={cn(
                                            "flex items-center justify-between p-4 rounded-2xl text-sm font-bold transition-all active:scale-95",
                                            currentLanguage.code === lang.code 
                                            ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]" 
                                            : "bg-zinc-800 text-zinc-300 border border-white/5"
                                        )}
                                    >
                                        <span>{lang.name}</span>
                                        {currentLanguage.code === lang.code && <Check className="w-4 h-4" />}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    ) : (toolbarMode === 'clipboard' || layout === 'clipboard') ? (
                        <motion.div
                            key="clipboard-grid"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="h-[210px] flex flex-col bg-[#111] p-2"
                        >
                            <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
                                {clipboard.length > 0 ? (
                                    <div className="flex flex-col gap-2">
                                        {clipboard.map((item, idx) => (
                                            <button 
                                                key={idx}
                                                onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); insertText(item); }}
                                                className="w-full text-left p-3 bg-zinc-800/50 hover:bg-zinc-800 border border-white/5 rounded-xl text-zinc-300 text-sm active:scale-[0.98] transition-all"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <History className="w-4 h-4 text-zinc-600" />
                                                    <span className="truncate">{item.length > 60 ? item.substring(0, 60) + '...' : item}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-2">
                                    <Clipboard className="w-10 h-10 opacity-20" />
                                    <p className="text-xs font-bold uppercase tracking-widest">Clipboard is empty</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); vibrate(); setToolbarMode('main'); setLayout('letters'); }}
                                    className="flex-1 py-3 bg-zinc-800 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span>Back</span>
                                </button>
                                <button 
                                    onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); handleKey('backspace'); }}
                                    className="w-16 py-3 bg-zinc-800 text-white rounded-xl flex items-center justify-center"
                                >
                                    <Delete className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    ) : layout === 'emojis' ? (
                        <motion.div
                            key="emojis"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="h-[260px] flex flex-col bg-[#171717]"
                        >
                            <div className="px-2 py-2 border-b border-white/5">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <input 
                                        type="text"
                                        placeholder="Search emojis..."
                                        value={emojiSearch}
                                        onChange={(e) => setEmojiSearch(e.target.value)}
                                        className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                                    />
                                </div>
                            </div>
                            <div 
                                className="flex-1 overflow-y-auto p-2 no-scrollbar"
                                onPointerDown={e => {
                                    scrollRef.current = { startX: e.clientX, startY: e.clientY, isScrolling: false };
                                }}
                                onPointerMove={e => {
                                    if (Math.abs(e.clientX - scrollRef.current.startX) > 20 || Math.abs(e.clientY - scrollRef.current.startY) > 20) {
                                        scrollRef.current.isScrolling = true;
                                    }
                                }}
                            >
                                <div className="grid grid-cols-8 gap-2 pb-4">
                                    {EMOJIS.filter(e => emojiSearch ? e.includes(emojiSearch) : true).map((emoji, idx) => (
                                        <button 
                                            key={idx} 
                                            onPointerDown={(e) => { 
                                                e.preventDefault(); 
                                                e.stopPropagation(); 
                                                vibrate();
                                                insertText(emoji);
                                            }}
                                            className="h-12 flex items-center justify-center text-2xl hover:bg-white/5 rounded-lg active:scale-90 transition-all font-['Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji']"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                                {EMOJIS.filter(e => emojiSearch ? e.includes(emojiSearch) : true).length === 0 && (
                                    <div className="h-full flex items-center justify-center text-zinc-600 text-xs uppercase font-bold tracking-widest">No emojis found</div>
                                )}
                            </div>
                            <div className="p-2 border-t border-white/5 flex gap-2">
                                <button 
                                    onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); vibrate(); setLayout('letters'); setEmojiSearch(''); }}
                                    className="flex-1 py-3 bg-[#333] hover:bg-[#444] text-white rounded-xl font-bold flex items-center justify-center gap-2"
                                >
                                    <Type className="w-4 h-4" />
                                    <span>ABC</span>
                                </button>
                                <button 
                                    onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); vibrate(); handleKey('backspace'); }}
                                    className="px-6 py-3 bg-[#333] hover:bg-[#444] text-white rounded-xl flex items-center justify-center"
                                >
                                    <Delete className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <div
                            className="p-1 pb-2 space-y-1.5 touch-none"
                            onPointerDown={e => {
                                e.stopPropagation();
                            }}
                        >
                            {getCurrentRows().map((row, rowIdx) => (
                                <div key={`${layout}-${rowIdx}`} className="flex justify-center gap-1.5 h-[52px]">
                                    {row.map((k) => (
                                        <Key 
                                            key={k === 'space' ? 'space-key' : k}
                                            k={k}
                                            onKey={handleKey}
                                            layout={layout}
                                            isShift={isShift}
                                            isCaps={isCaps}
                                            isSearch={isSearch}
                                            isMultiline={isMultiline}
                                            languageCode={currentLanguage.code}
                                            activeInputId={activeInput?.id || activeInput?.getAttribute('placeholder') || null}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </AnimatePresence>
            </div>
            <div className="h-2 bg-[#171717]" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
