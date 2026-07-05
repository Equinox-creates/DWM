import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Palette, Calendar as CalendarIcon, Clock, X, Copy, Trash2 } from 'lucide-react';
import { cn } from '@/utils';
import { motion, AnimatePresence } from 'motion/react';
import { HexColorPicker } from 'react-colorful';
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
  "#5865F2", "#3BA55D", "#FAA81A", "#ED4245", 
  "#EB459E", "#FEE75C", "#9900FF", "#00B0F4", 
  "#FFFFFF", "#2B2D31", "#1E1F22", "#000000"
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
  const [copied, setCopied] = useState(false);
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

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(localColor);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={cn("relative", className)}>
      <div className="flex gap-2 items-center">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn("w-10 h-10 rounded-xl border border-zinc-700/80 shadow-md flex items-center justify-center overflow-hidden relative group transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-500/50", hideHexInput && "w-6 h-6 rounded-md")}
          style={{ backgroundColor: color }}
        >
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
            <Palette className={cn("w-4 h-4 text-white drop-shadow-md opacity-0 group-hover:opacity-100 transition-opacity", hideHexInput && "w-3 h-3")} />
        </button>
        {!hideHexInput && (
          <div className="flex-1 relative group">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold font-mono text-xs">#</span>
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
                  className="w-full h-10 bg-[#0d0d0d] border border-zinc-800 rounded-xl pl-7 pr-10 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white transition-all hover:border-zinc-700 font-semibold"
              />
              <button 
                type="button"
                onClick={handleCopyCode}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                title="Copy color hex"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
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
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
            >
              <motion.div
                ref={modalRef}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: "spring", duration: 0.3, bounce: 0.15 }}
                className="bg-[#121212]/95 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-[380px] flex flex-col overflow-hidden backdrop-blur-md"
              >
              <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-[#18181b]/50">
                <h3 className="font-bold text-sm text-zinc-100 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-cyan-400 animate-pulse" /> Custom Color Studio
                </h3>
                <button 
                  onClick={handleApply}
                  className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors focus:outline-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex flex-col p-5 gap-5">
                {/* Main Color Picker */}
                <div className="flex justify-center bg-[#070708] p-4 rounded-2xl border border-zinc-800/80 shadow-inner overflow-hidden">
                  <HexColorPicker color={localColor} onChange={setLocalColor} style={{ width: '100%', height: '170px' }} />
                </div>

                {/* RGB Inputs & Hex */}
                <div className="grid grid-cols-4 gap-2 items-end">
                  <div className="col-span-2">
                    <label className="block text-[10px] text-zinc-400 uppercase font-bold mb-1.5 tracking-wider">Hex</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-xs">#</span>
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
                        className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl text-xs text-white pl-6 pr-6 py-2.5 font-mono uppercase focus:outline-none focus:border-cyan-500/80 transition-colors font-semibold"
                      />
                      <button 
                        type="button" 
                        onClick={handleCopyCode} 
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase font-bold mb-1.5 tracking-wider text-center">R</label>
                    <input 
                      type="number" 
                      value={rgb.r} 
                      onChange={(e) => handleRgbChange('r', e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl text-xs text-zinc-100 py-2.5 text-center focus:outline-none focus:border-cyan-500/80 transition-colors font-semibold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase font-bold mb-1.5 tracking-wider text-center">G</label>
                    <input 
                      type="number" 
                      value={rgb.g} 
                      onChange={(e) => handleRgbChange('g', e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl text-xs text-zinc-100 py-2.5 text-center focus:outline-none focus:border-cyan-500/80 transition-colors font-semibold font-mono"
                    />
                  </div>
                </div>

                {/* Presets */}
                <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800/80">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Vibrant Palettes</label>
                    <div 
                      className="w-4 h-4 rounded-full border border-zinc-700 shadow-sm"
                      style={{ backgroundColor: localColor }}
                    />
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setLocalColor(c)}
                        className={cn(
                          "w-9 h-9 rounded-xl border border-zinc-800/50 shadow-sm transition-all hover:scale-110 active:scale-95 focus:outline-none relative group",
                          localColor.toLowerCase() === c.toLowerCase() && "ring-2 ring-cyan-500 ring-offset-2 ring-offset-[#121212]"
                        )}
                        style={{ backgroundColor: c }}
                        title={c}
                      >
                        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-xl transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end pt-3 border-t border-zinc-800/85">
                  <button
                    onClick={handleApply}
                    className="w-full py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white rounded-xl text-xs font-bold transition-all shadow-[0_4px_15px_rgba(6,182,212,0.3)] hover:shadow-[0_4px_20px_rgba(6,182,212,0.55)] focus:outline-none focus:ring-2 focus:ring-cyan-500 active:scale-[0.98]"
                  >
                    Apply Color Selection
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

// --- Custom Checkbox ---

interface CustomCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export const CustomCheckbox: React.FC<CustomCheckboxProps> = ({ checked, onChange, label, className }) => {
  return (
    <label className={cn("flex items-center gap-3 cursor-pointer group select-none", className)}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <motion.div 
          animate={{
            backgroundColor: checked ? "#083344" : "rgba(0,0,0,0.4)",
            borderColor: checked ? "#06b6d4" : "rgba(255,255,255,0.1)",
            scale: checked ? [1, 1.05, 1] : 1,
          }}
          transition={{ duration: 0.2 }}
          className={cn(
            "w-5 h-5 rounded-[6px] border-2 flex items-center justify-center transition-all relative overflow-hidden",
            checked ? "shadow-[0_0_12px_rgba(6,182,212,0.5)]" : "group-hover:border-zinc-500 shadow-inner"
          )}
        >
          <AnimatePresence>
            {checked && (
              <>
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className="absolute inset-0 bg-cyan-500/20 animate-pulse"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
                  transition={{ type: "spring", stiffness: 600, damping: 20 }}
                  className="z-10"
                >
                  <Check className="w-3.5 h-3.5 text-cyan-400 font-bold stroke-[4px]" />
                </motion.div>
              </>
            )}
          </AnimatePresence>
          
          {/* Subtle glow effect when unchecked */}
          {!checked && (
             <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
          )}
        </motion.div>
      </div>
      {label && <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest group-hover:text-zinc-200 transition-colors">{label}</span>}
    </label>
  );
};

// --- Custom Date Picker ---

interface CustomDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

// Custom function to generate calendar dates for an accurate custom grid
const getDaysInMonthCells = (currentMonth: Date) => {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const cells = [];
  // Add padding days from the previous month
  const firstDayDayOfWeek = firstDay.getDay(); // 0 is Sunday, 6 is Saturday
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = firstDayDayOfWeek - 1; i >= 0; i--) {
    cells.push({
      date: new Date(year, month - 1, prevMonthLastDay - i),
      isCurrentMonth: false
    });
  }

  // Add current month days
  const numDays = lastDay.getDate();
  for (let i = 1; i <= numDays; i++) {
    cells.push({
      date: new Date(year, month, i),
      isCurrentMonth: true
    });
  }

  // Complete grid containing 42 cells (6 rows x 7 cols)
  const remainingCount = 42 - cells.length;
  for (let i = 1; i <= remainingCount; i++) {
    cells.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false
    });
  }

  return cells;
};

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ value, onChange, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isTimeOpen, setIsTimeOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  const parsedDate = value ? parseISO(value) : undefined;
  const isValidDate = parsedDate && isValid(parsedDate) ? true : false;
  const selectedDate = isValidDate && parsedDate ? parsedDate : undefined;
  const timeString = isValidDate && parsedDate ? format(parsedDate, 'HH:mm') : '12:00';

  // Month navigation state matching the user image
  const [currentMonth, setCurrentMonth] = useState<Date>(selectedDate || new Date());

  // Keep viewed month in sync when external selected date shifts using safe state tracking
  const [prevValue, setPrevValue] = useState<string>(value);
  if (value !== prevValue) {
    setPrevValue(value);
    if (selectedDate) {
      setCurrentMonth(selectedDate);
    }
  }

  const [activeTab, setActiveTab] = useState<'hour' | 'minute'>('hour');
  const [isDragging, setIsDragging] = useState(false);
  const clockRef = useRef<HTMLDivElement>(null);

  // Mini custom dropdown open states for hours, minutes, and period
  const [isHourOpen, setIsHourOpen] = useState(false);
  const [isMinuteOpen, setIsMinuteOpen] = useState(false);
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);

  // Lists for Hour, Minute, and Period items
  const hourOptions = ["12", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11"];
  const minutesOptions = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
  const periodOptions = ["AM", "PM"];

  // Click outside handling for main popover with dynamic portal context
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Close main modal/popover if clicking outside of it and outside the trigger button
      if (isOpen) {
        const clickedInsideModal = modalContentRef.current && modalContentRef.current.contains(target);
        const clickedInsideTrigger = containerRef.current && containerRef.current.contains(target);
        if (!clickedInsideModal && !clickedInsideTrigger) {
          setIsOpen(false);
          setIsDateOpen(false);
          setIsTimeOpen(false);
          setIsHourOpen(false);
          setIsMinuteOpen(false);
          setIsPeriodOpen(false);
          setShowClearConfirm(false);
          return;
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Convert 24-hour HH:mm timeString to 12-hour components
  const [h24Str, mStr] = timeString.split(':');
  const h24Num = parseInt(h24Str, 10) || 0;
  const mNum = parseInt(mStr, 10) || 0;

  let currentPeriod: 'AM' | 'PM' = 'AM';
  let h12Num = h24Num;
  if (h24Num >= 12) {
    currentPeriod = 'PM';
    if (h24Num > 12) {
      h12Num = h24Num - 12;
    }
  } else if (h24Num === 0) {
    h12Num = 12;
  }
  const currentH12Str = h12Num.toString().padStart(2, '0');
  const currentMStr = mNum.toString().padStart(2, '0');

  // Trigger values consolidation back to parent via ISO
  const updateValue = (date: Date, h24: string, minutes: string) => {
    const newDate = new Date(date);
    newDate.setHours(parseInt(h24, 10) || 0, parseInt(minutes, 10) || 0, 0, 0);
    onChange(newDate.toISOString());
  };

  const handleDateSelect = (date: Date) => {
    updateValue(date, h24Str, mStr);
  };

  const handlePrevMonth = () => {
    const prev = new Date(currentMonth);
    prev.setMonth(prev.getMonth() - 1);
    setCurrentMonth(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(currentMonth);
    next.setMonth(next.getMonth() + 1);
    setCurrentMonth(next);
  };

  // Changing clock values updates parent instantly
  const handleHourSelect = (val: string) => {
    let finalH24 = parseInt(val, 10);
    if (currentPeriod === 'PM') {
      if (finalH24 !== 12) {
        finalH24 += 12;
      }
    } else {
      if (finalH24 === 12) {
        finalH24 = 0;
      }
    }
    const targetDate = selectedDate || new Date();
    updateValue(targetDate, finalH24.toString().padStart(2, '0'), currentMStr);
    setIsHourOpen(false);
  };

  const handleMinuteSelect = (val: string) => {
    const targetDate = selectedDate || new Date();
    updateValue(targetDate, h24Str, val);
    setIsMinuteOpen(false);
  };

  const handlePeriodSelect = (val: string) => {
    let finalH24 = h12Num;
    if (val === 'PM') {
      if (finalH24 !== 12) {
        finalH24 += 12;
      }
    } else {
      if (finalH24 === 12) {
        finalH24 = 0;
      }
    }
    const targetDate = selectedDate || new Date();
    updateValue(targetDate, finalH24.toString().padStart(2, '0'), currentMStr);
    setIsPeriodOpen(false);
  };

  // Interactive dial coordinate logic defined safely after core select functions
  const handleDialInteraction = (clientX: number, clientY: number) => {
    const rect = clockRef.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;

    const angleRads = Math.atan2(dy, dx);
    let angleDegs = angleRads * (180 / Math.PI) + 90;
    if (angleDegs < 0) angleDegs += 360;

    if (activeTab === 'hour') {
      let hourNum = Math.round(angleDegs / 30);
      if (hourNum === 0 || hourNum > 12) hourNum = 12;
      const targetStr = hourNum.toString().padStart(2, '0');
      handleHourSelect(targetStr);
    } else {
      let minNum = Math.round(angleDegs / 6);
      if (minNum >= 60) minNum = 0;
      const targetStr = minNum.toString().padStart(2, '0');
      handleMinuteSelect(targetStr);
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleDialInteraction(e.clientX, e.clientY);
      }
    };

    if (isDragging) {
      window.addEventListener('mouseup', handleGlobalMouseUp);
      window.addEventListener('mousemove', handleGlobalMouseMove);
    }

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, activeTab]);

  useEffect(() => {
    const handleGlobalTouchEnd = () => {
      setIsDragging(false);
    };
    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches[0]) {
        e.preventDefault();
        handleDialInteraction(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    if (isDragging) {
      window.addEventListener('touchend', handleGlobalTouchEnd);
      window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    }

    return () => {
      window.removeEventListener('touchend', handleGlobalTouchEnd);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, activeTab]);

  // Dynamic coordinates for SVG pointer hand line
  const activeHandAngle = activeTab === 'hour' ? (h12Num % 12) * 30 : mNum * 6;
  const activeAngleRads = ((activeHandAngle - 90) * Math.PI) / 180;
  const selectedX = Math.round(Math.cos(activeAngleRads) * 70);
  const selectedY = Math.round(Math.sin(activeAngleRads) * 70);

  const calendarCells = getDaysInMonthCells(currentMonth);
  const weekDaysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={cn("relative inline-block w-full", className)} ref={containerRef}>
      {/* Outer Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          setIsDateOpen(false);
          setIsTimeOpen(false);
          setShowClearConfirm(false);
        }}
        className="w-full flex items-center justify-between bg-[#0a0a0a] border border-cyan-500/20 hover:border-cyan-400/40 rounded-xl px-4 py-2.5 text-sm text-cyan-400 hover:text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all font-semibold shadow-[0_2px_10px_rgba(6,182,212,0.05)] active:scale-[0.99]"
      >
        <span className="flex items-center gap-2 truncate text-cyan-400">
          <CalendarIcon className="w-4 h-4 text-cyan-400 shrink-0" />
          {isValidDate ? (
            <span className="font-bold tracking-tight">{format(parsedDate, 'PPp')}</span>
          ) : (
            <span className="text-zinc-500 font-medium">Add Timestamp</span>
          )}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-cyan-500 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {/* Centered Modal Portal */}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[12000] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
              {/* Backdrop click outside */}
              <div className="absolute inset-0 cursor-default" onClick={() => setIsOpen(false)} />
              
              <motion.div
                ref={modalContentRef}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="bg-[#0c0c0c] rounded-3xl border border-white/5 shadow-2xl w-full max-w-sm flex flex-col relative p-6 z-10"
              >
                {/* Header matching Message Stack Screen */}
                <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/20 shrink-0">
                      {showClearConfirm ? (
                        <Trash2 className="w-5 h-5 text-red-500" />
                      ) : isDateOpen ? (
                        <CalendarIcon className="w-5 h-5 text-cyan-500" />
                      ) : isTimeOpen ? (
                        <Clock className="w-5 h-5 text-cyan-500" />
                      ) : (
                        <CalendarIcon className="w-5 h-5 text-cyan-500" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <h3 className="font-black text-sm text-white uppercase tracking-tighter">
                        {showClearConfirm ? "Clear Timestamp" : isDateOpen ? "Select Date" : isTimeOpen ? "Set Message Time" : "Edit Timestamp"}
                      </h3>
                      <p className="text-[9px] text-zinc-500 uppercase tracking-widest leading-none mt-1">
                        {showClearConfirm ? "Confirmation requested" : isDateOpen ? "Select calendar date" : isTimeOpen ? "Configure clock time" : "Configure date & time"}
                      </p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setIsDateOpen(false);
                      setIsTimeOpen(false);
                      setShowClearConfirm(false);
                    }} 
                    className="w-8 h-8 flex items-center justify-center hover:bg-white/5 text-zinc-400 hover:text-white rounded-lg transition-all active:scale-90"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Main Render Area with nice slide transitions */}
                <AnimatePresence mode="wait">
                  {showClearConfirm && (
                    <motion.div
                      key="confirm-clear"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="flex flex-col gap-4 text-center py-2"
                    >
                      <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 mx-auto mt-2">
                        <Trash2 className="w-6 h-6 text-red-500" />
                      </div>
                      <div className="space-y-1 px-2">
                        <span className="text-sm font-black text-white uppercase tracking-tight">Clear Timestamp?</span>
                        <p className="text-xs text-zinc-500 leading-normal">
                          Are you sure you want to remove the timestamp from this message?
                        </p>
                      </div>
                      <div className="flex gap-3 mt-4 border-t border-white/5 pt-4">
                        <button
                          type="button"
                          onClick={() => setShowClearConfirm(false)}
                          className="flex-1 py-3 bg-zinc-900 border border-white/5 hover:bg-zinc-850 hover:text-white text-zinc-400 rounded-xl text-xs font-bold transition-all uppercase tracking-wider active:scale-[0.98] cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onChange("");
                            setShowClearConfirm(false);
                            setIsOpen(false);
                          }}
                          className="flex-1 py-3 bg-red-500 hover:bg-red-400 text-black font-black rounded-xl text-xs transition-all uppercase tracking-wider active:scale-[0.98] cursor-pointer"
                        >
                          Yes, Clear
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {!showClearConfirm && !isDateOpen && !isTimeOpen && (
                    <motion.div
                      key="main-view"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.15 }}
                      className="flex flex-col gap-4"
                    >
                      {/* Glowing preview bar */}
                      <div className="bg-[#121212]/80 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-inner">
                        <span className="text-[9px] text-cyan-500 uppercase tracking-widest font-black mb-1.5 leading-none">Active Selection Preview</span>
                        {isValidDate ? (
                          <span className="text-sm text-white font-black tracking-tight">{format(parsedDate, 'PPPP p')}</span>
                        ) : (
                          <span className="text-sm text-zinc-500 font-bold">No Date Selected</span>
                        )}
                      </div>

                      {/* Stack navigation grid */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Date Navigation Trigger */}
                        <div>
                          <span className="block text-[8px] text-zinc-500 uppercase tracking-widest font-black mb-1.5 px-0.5">Message Date</span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsDateOpen(true);
                              setIsTimeOpen(false);
                            }}
                            className="w-full h-11 flex items-center justify-between border border-white/5 hover:border-cyan-500/25 bg-[#141414] rounded-xl px-3 text-white hover:text-cyan-400 transition-all font-extrabold text-[11px] select-none active:scale-[0.98]"
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <CalendarIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                              {isValidDate ? format(parsedDate, 'MMM d, yyyy') : "Select Date"}
                            </span>
                            <ChevronDown className="w-3.5 h-3.5 text-cyan-500 shrink-0 -rotate-90" />
                          </button>
                        </div>

                        {/* Time Navigation Trigger */}
                        <div>
                          <span className="block text-[8px] text-zinc-500 uppercase tracking-widest font-black mb-1.5 px-0.5">Message Time</span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsTimeOpen(true);
                              setIsDateOpen(false);
                            }}
                            className="w-full h-11 flex items-center justify-between border border-white/5 hover:border-cyan-500/25 bg-[#141414] rounded-xl px-3 text-white hover:text-cyan-400 transition-all font-extrabold text-[11px] select-none active:scale-[0.98]"
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                              {isValidDate ? format(parsedDate, 'hh:mm a') : "Select Time"}
                            </span>
                            <ChevronDown className="w-3.5 h-3.5 text-cyan-500 shrink-0 -rotate-90" />
                          </button>
                        </div>
                      </div>

                      {/* Footer Apply action */}
                      <div className="flex gap-2.5 pt-4 border-t border-white/5 mt-3">
                        {isValidDate && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowClearConfirm(true);
                            }}
                            className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-xs font-black text-red-500 hover:text-red-400 rounded-xl text-center transition-all uppercase tracking-widest active:scale-[0.98] cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setIsOpen(false);
                          }}
                          className={cn(
                            "py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-xs font-black text-black rounded-xl shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/25 text-center transition-all uppercase tracking-widest active:scale-[0.98] cursor-pointer",
                            isValidDate ? "flex-[2]" : "flex-1"
                          )}
                        >
                          Save Timestamp
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {!showClearConfirm && isDateOpen && (
                    <motion.div
                      key="date-view"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                      className="flex flex-col"
                    >
                      <div className="flex flex-col bg-[#141414] border border-white/5 rounded-xl p-3 w-full shrink-0">
                        {/* Sub Header for Calendar Date Selector */}
                        <div className="flex items-center justify-between pb-2 border-b border-white/5">
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                            Select Calendar Date
                          </span>
                          <div className="flex flex-col w-5.5 h-5.5 bg-zinc-850 border border-zinc-700 rounded overflow-hidden text-[7px] text-center font-bold shadow-md relative shrink-0">
                            <div className="bg-cyan-500 h-1.5 w-full" />
                            <div className="flex-1 flex items-center justify-center text-white text-[8px] font-black leading-none pt-0.5">
                              {selectedDate ? selectedDate.getDate() : 31}
                            </div>
                          </div>
                        </div>

                        {/* Month Navigation Control Bar */}
                        <div className="flex items-center justify-between bg-zinc-900 border border-white/5 rounded-lg px-2 py-1.5 mt-2.5 mb-2">
                          <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="w-6 h-6 flex items-center justify-center bg-zinc-850 hover:bg-zinc-800 text-zinc-350 hover:text-white border border-white/5 rounded-md transition-colors text-xs font-bold font-mono"
                          >
                            &lt;
                          </button>
                          <span className="text-[10px] font-black text-white uppercase tracking-tight">
                            {format(currentMonth, 'MMMM yyyy')}
                          </span>
                          <button
                            type="button"
                            onClick={handleNextMonth}
                            className="w-6 h-6 flex items-center justify-center bg-zinc-850 hover:bg-zinc-800 text-zinc-350 hover:text-white border border-white/5 rounded-md transition-colors text-xs font-bold font-mono"
                          >
                            &gt;
                          </button>
                        </div>

                        {/* Grid Days Calendar Header Label */}
                        <div className="grid grid-cols-7 gap-1 text-center mb-1">
                          {weekDaysShort.map((day) => (
                            <div key={`lbl-${day}`} className="text-[8px] font-black text-zinc-500 uppercase tracking-wider py-0.5 text-center select-none">
                              {day}
                            </div>
                          ))}
                        </div>

                        {/* Grid Days Cells */}
                        <div className="grid grid-cols-7 gap-1 justify-items-center">
                          {calendarCells.map((cell, index) => {
                            const isCellSelected = selectedDate &&
                              cell.date.getDate() === selectedDate.getDate() &&
                              cell.date.getMonth() === selectedDate.getMonth() &&
                              cell.date.getFullYear() === selectedDate.getFullYear();

                            const todayDate = new Date();
                            const isToday = !isCellSelected &&
                              cell.date.getDate() === todayDate.getDate() &&
                              cell.date.getMonth() === todayDate.getMonth() &&
                              cell.date.getFullYear() === todayDate.getFullYear();

                            return (
                              <button
                                key={`day-${index}`}
                                type="button"
                                onClick={() => handleDateSelect(cell.date)}
                                className={cn(
                                  "w-6.5 h-6.5 text-[10px] font-bold rounded-lg flex items-center justify-center transition-all duration-150 shrink-0",
                                  !cell.isCurrentMonth
                                    ? "text-zinc-700 hover:text-zinc-650"
                                    : "text-zinc-300 hover:bg-white/5 hover:text-white",
                                  isCellSelected && "bg-cyan-500 text-black font-extrabold shadow-[0_0_8px_rgba(6,182,212,0.4)] rounded-lg hover:bg-cyan-400",
                                  isToday && "border border-cyan-500/30 text-cyan-400 font-bold"
                                )}
                              >
                                {cell.date.getDate()}
                              </button>
                            );
                          })}
                        </div>

                        {/* Confirm calendar apply changes */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsDateOpen(false);
                          }}
                          className="w-full mt-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-[10px] font-black text-black rounded-lg transition-all uppercase tracking-widest active:scale-[0.98]"
                        >
                          Confirm Date Selection
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {!showClearConfirm && isTimeOpen && (
                    <motion.div
                      key="time-view"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                      className="flex flex-col"
                    >
                      <div className="flex flex-col bg-[#141414] border border-white/5 rounded-xl p-3 w-full shrink-0">
                        {/* Sub Header for clock view */}
                        <div className="flex items-center gap-2 pb-2 border-b border-white/5 mb-2">
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Configure Clock Time</span>
                        </div>

                        {/* Large active selection display */}
                        <div className="flex items-center justify-center gap-1.5 bg-[#0a0a0a] border border-white/5 py-2 rounded-lg mb-2 select-none">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('hour');
                              setIsHourOpen(false);
                              setIsMinuteOpen(false);
                              setIsPeriodOpen(false);
                            }}
                            className={cn(
                              "text-2xl font-black transition-all outline-none",
                              activeTab === 'hour' ? "text-cyan-400 animate-pulse" : "text-zinc-500 hover:text-zinc-300"
                            )}
                          >
                            {currentH12Str}
                          </button>
                          <span className="text-xl font-bold text-zinc-650">:</span>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('minute');
                              setIsHourOpen(false);
                              setIsMinuteOpen(false);
                              setIsPeriodOpen(false);
                            }}
                            className={cn(
                              "text-2xl font-black transition-all outline-none",
                              activeTab === 'minute' ? "text-cyan-400 animate-pulse" : "text-zinc-500 hover:text-zinc-300"
                            )}
                          >
                            {currentMStr}
                          </button>

                          <div className="flex flex-col gap-0.5 ml-2.5 border-l border-white/5 pl-2">
                            <button
                              type="button"
                              onClick={() => handlePeriodSelect('AM')}
                              className={cn(
                                "px-1.5 py-0.5 text-[8px] font-black rounded uppercase tracking-widest transition-all",
                                currentPeriod === 'AM'
                                  ? "bg-cyan-500 text-black font-extrabold"
                                  : "text-zinc-500 hover:text-zinc-300"
                              )}
                            >
                              AM
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePeriodSelect('PM')}
                              className={cn(
                                "px-1.5 py-0.5 text-[8px] font-black rounded uppercase tracking-widest transition-all",
                                currentPeriod === 'PM'
                                  ? "bg-cyan-500 text-black font-extrabold"
                                  : "text-zinc-500 hover:text-zinc-300"
                              )}
                            >
                              PM
                            </button>
                          </div>
                        </div>

                        {/* Analog clock dial face interactable */}
                        <div
                          ref={clockRef}
                          onMouseDown={(e) => {
                            setIsDragging(true);
                            handleDialInteraction(e.clientX, e.clientY);
                          }}
                          onTouchStart={(e) => {
                            if (e.touches[0]) {
                              setIsDragging(true);
                              handleDialInteraction(e.touches[0].clientX, e.touches[0].clientY);
                            }
                          }}
                          className="w-36 h-36 rounded-full border border-white/5 bg-[#090909] relative mx-auto my-1.5 shadow-inner flex items-center justify-center select-none shrink-0 cursor-pointer touch-none"
                        >
                          <svg className="absolute inset-0 pointer-events-none w-full h-full z-0">
                            <line
                              x1={72}
                              y1={72}
                              x2={72 + (selectedX * 0.7)}
                              y2={72 + (selectedY * 0.7)}
                              stroke="#06b6d4"
                              strokeWidth={2}
                              strokeLinecap="round"
                            />
                            <circle
                              cx={72}
                              cy={72}
                              r={3}
                              fill="#06b6d4"
                            />
                            <circle
                              cx={72 + (selectedX * 0.7)}
                              cy={72 + (selectedY * 0.7)}
                              r={9}
                              fill="rgba(6,182,212,0.15)"
                              stroke="#06b6d4"
                              strokeWidth={1}
                            />
                          </svg>

                          {(activeTab === 'hour'
                            ? ["12", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"]
                            : ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"]
                          ).map((label, i) => {
                            const angleRads = (((i * 30) - 90) * Math.PI) / 180;
                            const x = Math.round(Math.cos(angleRads) * 52);
                            const y = Math.round(Math.sin(angleRads) * 52);

                            const isSelected = activeTab === 'hour'
                              ? h12Num === (i === 0 ? 12 : i)
                              : mNum === (i * 5);

                            return (
                              <div
                                key={`dial-${label}`}
                                style={{
                                  left: `${72 + x - 10}px`,
                                  top: `${72 + y - 10}px`
                                }}
                                className={cn(
                                  "absolute w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold transition-all z-10 pointer-events-none",
                                  isSelected
                                    ? "text-white font-extrabold"
                                    : "text-zinc-550"
                                )}
                              >
                                {label}
                              </div>
                            );
                          })}
                        </div>

                        {/* Dropdown selects list drawers */}
                        <div className="flex gap-1.5 mt-2.5 relative">
                          <div className="relative flex-1">
                            <button
                              type="button"
                              onClick={() => {
                                setIsHourOpen(!isHourOpen);
                                setIsMinuteOpen(false);
                                setIsPeriodOpen(false);
                              }}
                              className="w-full h-8 flex items-center justify-between px-2 py-1 bg-zinc-900 hover:bg-zinc-850 border border-white/5 rounded-lg text-xs font-bold text-zinc-200 transition-all focus:outline-none"
                            >
                              <span>{currentH12Str}</span>
                              <ChevronDown className="w-3 h-3 text-zinc-500 shrink-0" />
                            </button>
                            <AnimatePresence>
                              {isHourOpen && (
                                <motion.div
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 5 }}
                                  className="absolute bottom-full mb-1 left-0 w-full bg-[#121212] border border-white/10 rounded-lg shadow-xl z-[12015] max-h-32 overflow-y-auto custom-scrollbar p-1 flex flex-col gap-0.5"
                                >
                                  {hourOptions.map((hour) => (
                                    <button
                                      key={`hsel-${hour}`}
                                      type="button"
                                      onClick={() => handleHourSelect(hour)}
                                      className={cn(
                                        "w-full text-left px-1.5 py-1 text-[10px] rounded transition-colors hover:bg-white/5 text-zinc-400 hover:text-white",
                                        currentH12Str === hour && "bg-cyan-500 text-black font-extrabold hover:bg-cyan-400 hover:text-black"
                                      )}
                                    >
                                      {hour}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          <div className="relative flex-1">
                            <button
                              type="button"
                              onClick={() => {
                                setIsMinuteOpen(!isMinuteOpen);
                                setIsHourOpen(false);
                                setIsPeriodOpen(false);
                              }}
                              className="w-full h-8 flex items-center justify-between px-2 py-1 bg-zinc-900 hover:bg-zinc-850 border border-white/5 rounded-lg text-xs font-bold text-zinc-200 transition-all focus:outline-none"
                            >
                              <span>{currentMStr}</span>
                              <ChevronDown className="w-3 h-3 text-zinc-500 shrink-0" />
                            </button>
                            <AnimatePresence>
                              {isMinuteOpen && (
                                <motion.div
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 5 }}
                                  className="absolute bottom-full mb-1 left-0 w-full bg-[#121212] border border-white/10 rounded-lg shadow-xl z-[12015] max-h-32 overflow-y-auto custom-scrollbar p-1 flex flex-col gap-0.5"
                                >
                                  {minutesOptions.map((minute) => (
                                    <button
                                      key={`msel-${minute}`}
                                      type="button"
                                      onClick={() => handleMinuteSelect(minute)}
                                      className={cn(
                                        "w-full text-left px-1.5 py-1 text-[10px] rounded transition-colors hover:bg-white/5 text-zinc-400 hover:text-white",
                                        currentMStr === minute && "bg-cyan-500 text-black font-extrabold hover:bg-cyan-400 hover:text-black"
                                      )}
                                    >
                                      {minute} m
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          <div className="relative flex-1">
                            <button
                              type="button"
                              onClick={() => {
                                setIsPeriodOpen(!isPeriodOpen);
                                setIsHourOpen(false);
                                setIsMinuteOpen(false);
                              }}
                              className="w-full h-8 flex items-center justify-between px-2 py-1 bg-zinc-900 hover:bg-zinc-850 border border-white/5 rounded-lg text-xs font-bold text-zinc-200 transition-all focus:outline-none"
                            >
                              <span>{currentPeriod}</span>
                              <ChevronDown className="w-3 h-3 text-zinc-500 shrink-0" />
                            </button>
                            <AnimatePresence>
                              {isPeriodOpen && (
                                <motion.div
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 5 }}
                                  className="absolute bottom-full mb-1 left-0 w-full bg-[#121212] border border-white/10 rounded-lg shadow-xl z-[12015] p-1 flex flex-col gap-0.5"
                                >
                                  {periodOptions.map((period) => (
                                    <button
                                      key={`psel-${period}`}
                                      type="button"
                                      onClick={() => handlePeriodSelect(period)}
                                      className={cn(
                                        "w-full text-left px-1.5 py-1 text-[10px] rounded transition-colors hover:bg-white/5 text-zinc-400 hover:text-white",
                                        currentPeriod === period && "bg-cyan-500 text-black font-extrabold hover:bg-cyan-400 hover:text-black"
                                      )}
                                    >
                                      {period}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        {/* Confirm time selection */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsTimeOpen(false);
                          }}
                          className="w-full mt-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-[10px] font-black text-black rounded-lg transition-all uppercase tracking-widest active:scale-[0.98]"
                        >
                          Confirm Time Selection
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
