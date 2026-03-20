import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Palette, Calendar as CalendarIcon, Clock, X } from 'lucide-react';
import { cn } from '@/utils';
import { motion, AnimatePresence } from 'motion/react';
import { HexColorPicker } from 'react-colorful';
import { DayPicker } from 'react-day-picker';
import { format, parseISO, isValid } from 'date-fns';
import 'react-day-picker/dist/style.css';

// --- Custom Select ---

interface SelectOption {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  value: string | number;
  options: SelectOption[];
  onChange: (value: string | number) => void;
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
        className="w-full flex items-center justify-between bg-[#0a0a0a] border border-[#333] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.icon}
          {selectedOption ? selectedOption.label : <span className="text-zinc-500">{placeholder}</span>}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute z-50 w-full mt-1 bg-[#121212] border border-[#333] rounded-md shadow-lg max-h-60 overflow-y-auto custom-scrollbar"
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
                  "w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-[#222] transition-colors",
                  value === option.value ? "text-white font-bold bg-white/10" : "text-zinc-300"
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
  hideHexInput?: boolean;
}

const PRESET_COLORS = [
  "#5865F2", "#EB459E", "#ED4245", "#FEE75C", 
  "#57F287", "#FFFFFF", "#000000", "#2B2D31"
];

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

const rgbToHex = (r: number, g: number, b: number) => {
  return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase();
};

export const CustomColorPicker: React.FC<CustomColorPickerProps> = ({ color, onChange, className, hideHexInput }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localColor, setLocalColor] = useState(color);
  const modalRef = useRef<HTMLDivElement>(null);
  
  const rgb = hexToRgb(localColor);

  // Sync local color when prop changes (only if closed)
  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalColor(color);
    }
  }, [color, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onChange(localColor);
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, localColor, onChange]);

  const handleRgbChange = (channel: 'r' | 'g' | 'b', value: string) => {
    let num = parseInt(value, 10);
    if (isNaN(num)) num = 0;
    if (num > 255) num = 255;
    if (num < 0) num = 0;
    
    const newRgb = { ...rgb, [channel]: num };
    setLocalColor(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  };

  const handleApply = () => {
    onChange(localColor);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <div className="flex gap-2 items-center">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn("w-10 h-10 rounded-md border border-[#333] shadow-sm flex items-center justify-center overflow-hidden relative group transition-transform hover:scale-105", hideHexInput && "w-6 h-6 rounded")}
          style={{ backgroundColor: color }}
        >
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
            <Palette className={cn("w-4 h-4 text-white drop-shadow-md opacity-0 group-hover:opacity-100 transition-opacity", hideHexInput && "w-3 h-3")} />
        </button>
        {!hideHexInput && (
          <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">#</span>
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
                  className="w-full h-10 bg-[#0a0a0a] border border-[#333] rounded-md pl-6 pr-3 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-white/50 text-white transition-all"
              />
          </div>
        )}
      </div>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
              <motion.div
                ref={modalRef}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.15 }}
                className="bg-[#121212] border border-[#333] rounded-xl shadow-2xl w-full max-w-[450px] flex flex-col overflow-hidden"
              >
              <div className="flex items-center justify-between p-4 border-b border-[#333] bg-[#1a1a1a]">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Palette className="w-4 h-4 text-cyan-500" /> Color Studio
                </h3>
                <button 
                  onClick={handleApply}
                  className="p-1 hover:bg-[#222] text-zinc-400 hover:text-white rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex flex-col p-5 gap-5">
                {/* Main Color Picker */}
                <div className="flex justify-center bg-[#0a0a0a] p-3 rounded-xl border border-[#222] shadow-inner">
                  <HexColorPicker color={localColor} onChange={setLocalColor} style={{ width: '100%', height: '180px' }} />
                </div>

                {/* RGB Inputs & Hex */}
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1.5 tracking-wider">Hex</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">#</span>
                      <input 
                        type="text" 
                        value={localColor.replace('#', '')} 
                        onChange={(e) => {
                          const val = e.target.value;
                          if (/^[0-9A-Fa-f]{0,6}$/.test(val)) {
                            setLocalColor('#' + val);
                          }
                        }}
                        maxLength={6}
                        className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg text-sm text-white pl-7 pr-2 py-2 font-mono uppercase focus:outline-none focus:border-cyan-500/50 transition-colors"
                      />
                    </div>
                  </div>
                  <div className="w-[60px]">
                    <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1.5 tracking-wider text-center">R</label>
                    <input 
                      type="number" 
                      value={rgb.r} 
                      onChange={(e) => handleRgbChange('r', e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg text-sm text-white py-2 text-center focus:outline-none focus:border-cyan-500/50 transition-colors"
                    />
                  </div>
                  <div className="w-[60px]">
                    <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1.5 tracking-wider text-center">G</label>
                    <input 
                      type="number" 
                      value={rgb.g} 
                      onChange={(e) => handleRgbChange('g', e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg text-sm text-white py-2 text-center focus:outline-none focus:border-cyan-500/50 transition-colors"
                    />
                  </div>
                  <div className="w-[60px]">
                    <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1.5 tracking-wider text-center">B</label>
                    <input 
                      type="number" 
                      value={rgb.b} 
                      onChange={(e) => handleRgbChange('b', e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg text-sm text-white py-2 text-center focus:outline-none focus:border-cyan-500/50 transition-colors"
                    />
                  </div>
                </div>

                {/* Presets */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Presets</label>
                    <div 
                      className="w-6 h-6 rounded-md border border-[#333] shadow-sm"
                      style={{ backgroundColor: localColor }}
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setLocalColor(c)}
                        className={cn(
                          "flex-shrink-0 w-8 h-8 rounded-full border border-[#333] shadow-sm transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500/50 focus:ring-offset-[#121212]",
                          localColor.toLowerCase() === c.toLowerCase() && "ring-2 ring-offset-2 ring-cyan-500 ring-offset-[#121212]"
                        )}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end pt-4 border-t border-[#333]">
                  <button
                    onClick={handleApply}
                    className="w-full py-2.5 bg-white text-black rounded-lg text-sm font-bold hover:bg-zinc-200 transition-colors shadow-md"
                  >
                    Apply Color
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    )}
    </div>
  );
};

// --- Custom Date Picker ---

interface CustomDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ value, onChange, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  
  const parsedDate = value ? parseISO(value) : undefined;
  const isValidDate = parsedDate && isValid(parsedDate);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(isValidDate ? parsedDate : undefined);
  const [timeString, setTimeString] = useState(isValidDate ? format(parsedDate, 'HH:mm') : '12:00');

  const hoursList = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutesList = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      updateValue(date, timeString);
    }
  };

  const handleTimeChange = (type: 'hour' | 'minute', val: string) => {
    const [h, m] = timeString.split(':');
    const newTime = type === 'hour' ? `${val}:${m}` : `${h}:${val}`;
    setTimeString(newTime);
    if (selectedDate) {
      updateValue(selectedDate, newTime);
    }
  };

  const updateValue = (date: Date, time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours || 0, minutes || 0, 0, 0);
    onChange(newDate.toISOString());
  };

  const [h, m] = timeString.split(':');

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-[#0a0a0a] border border-[#333] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
      >
        <span className="flex items-center gap-2 truncate text-zinc-300">
          <CalendarIcon className="w-4 h-4 text-zinc-500" />
          {isValidDate ? format(parsedDate, 'PPp') : <span className="text-zinc-500">Select Date & Time</span>}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform", isOpen && "rotate-180")} />
      </button>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
              <motion.div
                ref={modalRef}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.15 }}
                className="bg-[#121212] border border-[#333] rounded-xl shadow-2xl w-full max-w-[600px] flex flex-col overflow-hidden"
              >
              <div className="flex items-center justify-between p-4 border-b border-[#333] bg-[#1a1a1a]">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-cyan-500" /> Date & Time Studio
                </h3>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-[#222] text-zinc-400 hover:text-white rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-5 p-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
                <div className="flex flex-col">
                  {/* Presets */}
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => {
                        const now = new Date();
                        const h = now.getHours().toString().padStart(2, '0');
                        const m = now.getMinutes().toString().padStart(2, '0');
                        setSelectedDate(now);
                        setTimeString(`${h}:${m}`);
                        updateValue(now, `${h}:${m}`);
                      }}
                      className="flex-1 py-1.5 bg-[#222] hover:bg-[#333] text-xs font-bold text-white rounded transition-colors"
                    >
                      Now
                    </button>
                    <button
                      onClick={() => {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        setSelectedDate(tomorrow);
                        updateValue(tomorrow, timeString);
                      }}
                      className="flex-1 py-1.5 bg-[#222] hover:bg-[#333] text-xs font-bold text-white rounded transition-colors"
                    >
                      Tomorrow
                    </button>
                    <button
                      onClick={() => {
                        const nextWeek = new Date();
                        nextWeek.setDate(nextWeek.getDate() + 7);
                        setSelectedDate(nextWeek);
                        updateValue(nextWeek, timeString);
                      }}
                      className="flex-1 py-1.5 bg-[#222] hover:bg-[#333] text-xs font-bold text-white rounded transition-colors"
                    >
                      Next Week
                    </button>
                  </div>
                  <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  className="border-b sm:border-b-0 sm:border-r border-[#333] pb-4 sm:pb-0 sm:pr-5 mb-4 sm:mb-0"
                    classNames={{
                      day_selected: "!bg-white !text-black hover:!bg-zinc-200",
                      day_today: "font-bold text-white",
                      button: "hover:bg-[#222] rounded-md transition-colors text-white focus:outline-none focus:ring-2 focus:ring-white/50",
                      head_cell: "text-zinc-400 font-medium",
                      nav_button: "hover:bg-[#222] !text-white",
                      caption: "!text-white font-medium",
                    }}
                />
                {isValidDate && (
                  <button
                    onClick={() => {
                      onChange('');
                      setSelectedDate(undefined);
                      setIsOpen(false);
                    }}
                    className="w-full mt-2 text-xs text-red-500 hover:text-red-400 font-medium py-2 bg-red-500/10 rounded-md transition-colors"
                  >
                    Clear Timestamp
                  </button>
                )}
              </div>
              
              <div className="flex flex-col">
                <h3 className="text-white text-sm font-bold mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Select Time
                </h3>
                <div className="flex gap-2 h-[260px] bg-[#0a0a0a] p-2 rounded-lg border border-[#222]">
                  <div className="flex flex-col overflow-y-auto w-14 gap-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {hoursList.map(hour => (
                      <button
                        key={`h-${hour}`}
                        onClick={() => handleTimeChange('hour', hour)}
                        className={cn(
                          "py-2 text-sm rounded transition-colors",
                          h === hour ? "bg-white text-black font-bold" : "text-zinc-400 hover:bg-[#222] hover:text-white"
                        )}
                      >
                        {hour}
                      </button>
                    ))}
                  </div>
                  <div className="text-zinc-500 font-bold py-2">:</div>
                  <div className="flex flex-col overflow-y-auto w-14 gap-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {minutesList.map(minute => (
                      <button
                        key={`m-${minute}`}
                        onClick={() => handleTimeChange('minute', minute)}
                        className={cn(
                          "py-2 text-sm rounded transition-colors",
                          m === minute ? "bg-white text-black font-bold" : "text-zinc-400 hover:bg-[#222] hover:text-white"
                        )}
                      >
                        {minute}
                      </button>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full mt-4 py-2 bg-white text-black rounded-md text-sm font-bold hover:bg-zinc-200 transition-colors"
                >
                  Apply
                </button>
              </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    )}
    </div>
  );
};
