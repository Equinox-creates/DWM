import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Palette } from 'lucide-react';
import { cn } from '@/utils';
import { motion, AnimatePresence } from 'motion/react';

// --- Custom Select ---

interface SelectOption {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  value: string | number;
  options: SelectOption[];
  onChange: (value: any) => void;
  placeholder?: string;
  className?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({ value, options, onChange, placeholder = "Select...", className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.icon}
          {selectedOption ? selectedOption.label : <span className="text-zinc-400">{placeholder}</span>}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-zinc-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-lg max-h-60 overflow-y-auto custom-scrollbar"
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors",
                  value === option.value ? "text-cyan-600 dark:text-cyan-400 font-medium bg-cyan-50 dark:bg-cyan-900/10" : "text-zinc-700 dark:text-zinc-300"
                )}
              >
                {option.icon}
                <span className="flex-1 truncate">{option.label}</span>
                {value === option.value && <Check className="w-4 h-4" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Custom Color Picker ---

interface CustomColorPickerProps {
  color: string; // Hex string (e.g., "#FF0000")
  onChange: (color: string) => void;
  className?: string;
}

const PRESET_COLORS = [
  "#5865F2", "#EB459E", "#ED4245", "#FEE75C", 
  "#57F287", "#FFFFFF", "#000000", "#2B2D31"
];

export const CustomColorPicker: React.FC<CustomColorPickerProps> = ({ color, onChange, className }) => {
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <div className="flex gap-2 items-center">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded-md border border-zinc-300 dark:border-zinc-700 shadow-sm flex items-center justify-center overflow-hidden relative group"
          style={{ backgroundColor: color }}
        >
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
            <Palette className="w-4 h-4 text-white drop-shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
        <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">#</span>
            <input
                type="text"
                value={color.replace('#', '')}
                onChange={(e) => {
                    const val = e.target.value;
                    if (/^[0-9A-Fa-f]{0,6}$/.test(val)) {
                        onChange('#' + val);
                    }
                }}
                maxLength={6}
                className="w-full h-10 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md pl-6 pr-3 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white"
            />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute z-50 left-0 mt-2 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl p-3"
          >
            <div className="grid grid-cols-4 gap-2 mb-3">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onChange(c)}
                  className={cn(
                    "w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700 shadow-sm transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 dark:focus:ring-offset-zinc-900",
                    color.toLowerCase() === c.toLowerCase() && "ring-2 ring-offset-2 ring-cyan-500 dark:ring-offset-zinc-900"
                  )}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
            
            <div className="relative w-full h-8 rounded-md overflow-hidden border border-zinc-300 dark:border-zinc-700">
                <input
                    type="color"
                    value={color}
                    onChange={(e) => onChange(e.target.value)}
                    className="absolute -top-2 -left-2 w-[120%] h-[200%] cursor-pointer p-0 border-0"
                />
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs font-bold text-white mix-blend-difference">
                    Custom Picker
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
