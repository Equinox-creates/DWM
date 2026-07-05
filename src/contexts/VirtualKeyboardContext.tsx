import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface VirtualKeyboardContextType {
  isOpen: boolean;
  activeInput: HTMLInputElement | HTMLTextAreaElement | null;
  clipboard: string[];
  addToClipboard: (text: string) => void;
  openKeyboard: (input: HTMLInputElement | HTMLTextAreaElement) => void;
  closeKeyboard: () => void;
}

const VirtualKeyboardContext = createContext<VirtualKeyboardContextType | undefined>(undefined);

export const VirtualKeyboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeInput, setActiveInput] = useState<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const [clipboard, setClipboard] = useState<string[]>([]);

  const addToClipboard = useCallback((text: string) => {
    if (!text || clipboard.includes(text)) return;
    setClipboard(prev => [text, ...prev].slice(0, 50)); // Keep last 50
  }, [clipboard]);

  // Listen for system clipboard copy
  useEffect(() => {
    const handleCopy = () => {
      setTimeout(async () => {
        try {
          const text = await navigator.clipboard.readText();
          if (text) addToClipboard(text);
        } catch {
          // Navigator clipboard might not be available or permitted
        }
      }, 100);
    };
    window.addEventListener('copy', handleCopy);
    return () => window.removeEventListener('copy', handleCopy);
  }, [addToClipboard]);

  const openKeyboard = useCallback((input: HTMLInputElement | HTMLTextAreaElement) => {
    // Basic mobile/tablet detection - be slightly more inclusive for testing
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 1024;
    if (!isMobile) return;

    setActiveInput(input);
    setIsOpen(true);
    
    // Prevent standard keyboard but allow focus
    // We use a slight delay to ensure it stays focused but without the system keyboard
    input.setAttribute('inputmode', 'none');
    
    // Scroll into view
    setTimeout(() => {
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  }, []);

  const closeKeyboard = useCallback(() => {
    setIsOpen(false);
    if (activeInput) {
      activeInput.blur();
      // Remove inputmode none so standard keyboard can work if needed later
      activeInput.removeAttribute('inputmode');
      setActiveInput(null);
    }
  }, [activeInput]);

  // Global listener for focus events
  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        const input = target as HTMLInputElement | HTMLTextAreaElement;
        if (input.type === 'file' || input.type === 'checkbox' || input.type === 'radio') return;
        
        // Prevent default mobile keyboard
        input.setAttribute('inputmode', 'none');
        openKeyboard(input);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (isOpen && activeInput) {
        const target = e.target as HTMLElement;
        const keyboard = document.querySelector('[data-virtual-keyboard]');
        
        // If clicking the keyboard or the input itself, or a child of either, don't close
        if (keyboard?.contains(target) || activeInput.contains(target)) return;
        
        // If clicking something that looks like an interactive element, we might be switching focus
        // The focusin listener will handle opening/switching, let's just close if it's whitespace
        if (target === document.body || target.classList.contains('overflow-y-auto')) {
           closeKeyboard();
        }
      }
    };

    window.addEventListener('focusin', handleFocus);
    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('focusin', handleFocus);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, activeInput, openKeyboard, closeKeyboard]);

  return (
    <VirtualKeyboardContext.Provider value={{ isOpen, activeInput, clipboard, addToClipboard, openKeyboard, closeKeyboard }}>
      {children}
    </VirtualKeyboardContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useVirtualKeyboard = () => {
  const context = useContext(VirtualKeyboardContext);
  if (context === undefined) {
    throw new Error('useVirtualKeyboard must be used within a VirtualKeyboardProvider');
  }
  return context;
};
