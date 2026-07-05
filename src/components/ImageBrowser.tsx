import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Search, RotateCw, Loader2, Copy, Check, Sparkles, Filter 
} from 'lucide-react';
import { toast } from '../utils/toast';

interface ImageItem {
  id: string;
  name: string;
  url: string;
  creator?: string;
  creatorAvatar?: string;
}

interface ImageBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, creator?: string) => void;
  initialValue?: string;
}

const PRESET_TOPICS = [
  { label: 'All Presets', query: 'all' },
  { label: 'Discord 16:9', query: 'discord 16:9' },
  { label: 'Magic Neon', query: 'neon gradient aesthetic' },
  { label: 'Cyberpunk', query: 'cyberpunk anime discord' },
  { label: 'Dreamy Space', query: 'cosmic nebula stars' },
  { label: 'Chill Wave', query: 'vaporwave lofi digital art' },
  { label: 'Low-Poly Gaming', query: 'retro neon synthwave gaming' },
  { label: 'Zen Minimal', query: 'japanese organic minimal texture' }
];

interface BrowserImageItemProps {
  item: ImageItem;
  isSelected: boolean;
  onConfirm: () => void;
}

const BrowserImageItem: React.FC<BrowserImageItemProps> = ({ item, isSelected, onConfirm }) => {
  const [loadError, setLoadError] = useState(false);
  const [isImgLoading, setIsImgLoading] = useState(true);

  return (
    <div 
      onClick={() => {
        if (!loadError) {
          onConfirm();
        }
      }}
      className={`group bg-[#151618] border rounded-2xl overflow-hidden cursor-pointer transition-all duration-350 flex flex-col relative h-[250px] shadow-lg ${
        isSelected 
          ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-purple-500/10' 
          : 'border-zinc-800/80 hover:border-zinc-700 hover:shadow-xl hover:scale-[1.01]'
      }`}
    >
      {/* Visual Card body */}
      <div className="relative flex-1 bg-zinc-950 overflow-hidden flex items-center justify-center">
        {loadError ? (
          <div className="flex flex-col items-center justify-center p-4 text-center w-full h-full bg-zinc-900/60 transition-transform duration-300">
            <svg className="w-10 h-10 text-rose-500/80 mb-2.5 animate-pulse" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-zinc-200 font-bold text-xs uppercase tracking-wider">Failed to load</span>
            <span className="text-[10px] text-zinc-500 font-medium mt-1">Resource failure or restricted host</span>
          </div>
        ) : (
          <>
            {isImgLoading && (
              <div className="absolute inset-0 bg-zinc-900/85 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                <span className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest animate-pulse">Loading image...</span>
              </div>
            )}
            <img 
              src={item.url} 
              alt={item.name} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              referrerPolicy="no-referrer"
              onLoad={() => setIsImgLoading(false)}
              onError={() => {
                setLoadError(true);
                setIsImgLoading(false);
              }}
            />
            
            {/* Dark overlay for beautiful contrast on names */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/10 pointer-events-none" />

            {/* Stack Icon top right */}
            <div className="absolute top-3.5 right-3.5 w-8.5 h-8.5 bg-[#121315]/80 backdrop-blur-md rounded-xl flex items-center justify-center border border-zinc-800 shadow-md">
              <Copy className="w-3.5 h-3.5 text-zinc-400 group-hover:text-purple-400 transition-colors" />
            </div>

            {/* Selected visual highlight badge */}
            {isSelected && (
              <div className="absolute top-3.5 right-[50px] w-8.5 h-8.5 bg-purple-600 text-white rounded-xl flex items-center justify-center border border-purple-500 shadow-lg animate-scale-in">
                <Check className="w-4.5 h-4.5 text-white stroke-[3px]" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Image Name underneath the picture frame */}
      <div className="bg-[#1e1f22] px-4 py-3 border-t border-zinc-900/40 font-semibold font-sans text-center transition-all shrink-0">
        <p className="text-zinc-200 text-sm truncate leading-snug group-hover:text-purple-400 transition-colors">
          {item.name}
        </p>
        {item.creator && (
          <p className="text-zinc-400 text-xs mt-1.5 font-medium font-sans flex items-center justify-center gap-1.5">
            {item.creatorAvatar ? (
              <img 
                src={item.creatorAvatar} 
                referrerPolicy="no-referrer" 
                className="w-5 h-5 rounded-full border border-zinc-700/60 object-cover shrink-0 select-none shadow-sm" 
                alt={item.creator} 
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <span className="w-5 h-5 rounded-full bg-[#5865f2]/10 border border-[#5865f2]/20 text-[#5865f2] flex items-center justify-center text-[8px] font-bold uppercase shrink-0">
                {item.creator.slice(0, 2)}
              </span>
            )}
            <span className="text-[#5865f2] font-semibold truncate max-w-[120px]">@{item.creator}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export const ImageBrowser: React.FC<ImageBrowserProps> = ({
  isOpen,
  onClose,
  onSelect,
  initialValue = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTopic, setActiveTopic] = useState<string | null>('All Presets');
  
  // Custom interactive click-confirmation state
  const [confirmingImage, setConfirmingImage] = useState<ImageItem | null>(null);

  // Gesture Scroll-to-Refresh Hook state
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  
  const startYRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchImages = async (queryToSearch: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/images/search?q=${encodeURIComponent(queryToSearch)}`);
      if (!response.ok) {
        throw new Error('Search request failed');
      }
      const data = await response.json();
      setImages(data.results || []);
    } catch (err) {
      console.error('Image Search Error:', err);
      toast.error('Could not connect to online image portal. Using high-quality offline alternatives.');
      // Offline-fallback completely populated with all 23 presets
      setImages([
        { id: 'offline-1', name: 'Synthwave Cosmic Neon Grid', url: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?auto=format&fit=crop&w=600&q=80', creator: 'Stock' },
        { id: 'offline-2', name: 'Fluid Geometric Gradient Shapes', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80', creator: 'Stock' },
        { id: 'offline-3', name: 'Ethereal Purple Sunset Light Trails', url: 'https://images.unsplash.com/photo-1618005198143-e5283b519a7f?auto=format&fit=crop&w=600&q=80', creator: 'Stock' },
        { id: 'offline-4', name: 'Minimalist Charcoal Ripple Sand', url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80', creator: 'Stock' },
        { id: 'offline-5', name: 'Hyper Realistic Deep Ocean Swirl', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80', creator: 'Stock' },
        { id: 'offline-6', name: 'Rain-Slicked Retro Tokyo Streets', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80', creator: 'Stock' },
        { id: 'offline-7', name: 'Mechanical RGB Gaming Keycaps', url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80', creator: 'Stock' },
        { id: 'offline-8', name: 'Cosmos Stars Nebula Clouds', url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=600&q=80', creator: 'Stock' },
        { id: 'offline-9', name: 'Iridescent Holographic Prism Wave', url: 'https://images.unsplash.com/photo-1618005124978-c19ac3829be7?auto=format&fit=crop&w=600&q=80', creator: 'Stock' },
        { id: 'offline-10', name: 'Pastel Aurora Colorful Sky', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=600&q=80', creator: 'Stock' },
        { id: 'offline-11', name: 'Charcoal Dark Curved Flow Lines', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=600&q=80', creator: 'Stock' },
        { id: 'offline-12', name: 'Velvet Magenta Wave Backdrop', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=600&q=80', creator: 'Stock' },
        { id: 'offline-13', name: 'Dev Code Editor Terminal Console', url: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=600&q=80', creator: 'Stock' },
        { id: 'offline-14', name: 'Shibuya Tokyo Neon Skyline Night', url: 'https://images.unsplash.com/photo-1515238152791-8216bfdf89a7?auto=format&fit=crop&w=600&q=80', creator: 'Stock' },
        { id: 'offline-15', name: 'Digital Scifi Cyber HUD Graphics', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80', creator: 'Stock' },
        { id: 'offline-16', name: 'Glow Motherboard Microconductions', url: 'https://images.unsplash.com/photo-1517059224940-d4af9eec41b7?auto=format&fit=crop&w=600&q=80', creator: 'Stock' },
        { id: 'offline-17', name: 'Green Coding Matrix Letter Grid', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80', creator: 'Stock' },
        { id: 'offline-18', name: 'Green Aurora Northern Lights Forest', url: 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?auto=format&fit=crop&w=600&q=80', creator: 'Stock' },
        { id: 'offline-19', name: 'Stellar Orion Nebula Outer Space', url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=600&q=80', creator: 'Stock' },
        { id: 'offline-20', name: 'Cozy Pixel Laptop Workspace Desk', url: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&w=600&q=80', creator: 'Stock' },
        { id: 'offline-21', name: 'Warm Bistro Espresso Counter Glow', url: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=600&q=80', creator: 'Stock' },
        { id: 'offline-22', name: 'Kyoto Zen Sliding Doors Room', url: 'https://images.unsplash.com/photo-1504198453319-5ce911bafcde?auto=format&fit=crop&w=600&q=80', creator: 'Stock' },
        { id: 'offline-23', name: 'Green Forest Mist Bamboo Woods', url: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=600&q=80', creator: 'Stock' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Perform search on mount or query action
  useEffect(() => {
    if (isOpen) {
      setSelectedUrl(initialValue || null);
      fetchImages(searchQuery || 'all');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setActiveTopic(null);
    fetchImages(searchQuery);
  };

  const handleTopicClick = (topicLabel: string, topicQuery: string) => {
    setActiveTopic(topicLabel);
    setSearchQuery(topicQuery);
    fetchImages(topicQuery);
  };

  const handleRefresh = () => {
    const noises = ['landscape', 'background', 'cool', 'hd', 'banner', 'desktop', 'aesthetic', 'texture'];
    const randomNoise = noises[Math.floor(Math.random() * noises.length)];
    const baseQuery = searchQuery.split(' [')[0]; // strip old noises
    const extendedQuery = `${baseQuery} [${randomNoise}]`;
    setIsLoading(true);
    fetchImages(extendedQuery);
    toast.success('Presets refreshed with new live results!');
  };

  // --- Handlers for Pull/Scroll-to-Refresh Gesture ---
  const handleTouchStart = (e: React.TouchEvent) => {
    const scrollTop = containerRef.current ? containerRef.current.scrollTop : 0;
    if (scrollTop <= 2) {
      setIsPulling(true);
      startYRef.current = e.touches[0].pageY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling) return;
    const currentY = e.touches[0].pageY;
    const diff = currentY - startYRef.current;
    if (diff > 0) {
      // Prevent browser default bounce and apply tactile rubberbanding offset
      const capped = Math.min(110, Math.pow(diff, 0.8) * 1.6);
      setPullDistance(capped);
    } else {
      setPullDistance(0);
    }
  };

  const handleTouchEnd = () => {
    if (!isPulling) return;
    setIsPulling(false);
    if (pullDistance >= 55) {
      handleRefresh();
    }
    setPullDistance(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const scrollTop = containerRef.current ? containerRef.current.scrollTop : 0;
    if (scrollTop <= 2) {
      setIsPulling(true);
      startYRef.current = e.pageY;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPulling) return;
    const currentY = e.pageY;
    const diff = currentY - startYRef.current;
    if (diff > 0) {
      const capped = Math.min(110, Math.pow(diff, 0.8) * 1.6);
      setPullDistance(capped);
    } else {
      setPullDistance(0);
    }
  };

  const handleMouseUp = () => {
    if (!isPulling) return;
    setIsPulling(false);
    if (pullDistance >= 55) {
      handleRefresh();
    }
    setPullDistance(0);
  };

  const handleMouseLeave = () => {
    if (isPulling) {
      setIsPulling(false);
      setPullDistance(0);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[300] bg-[#0e0f11]/98 text-white flex flex-col w-screen h-screen overflow-hidden animate-fade-in font-sans selection:bg-purple-600 selection:text-white">
      
      {/* 1. TOP HEADER WITH INTEGRATED CONTROLS */}
      <div className="px-5 py-4 border-b border-zinc-900 bg-[#1e1f22]/90 backdrop-blur-md flex flex-row items-center justify-between gap-4 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/15">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-white font-black text-lg leading-tight tracking-tight">Image Presets Browser</h2>
            <p className="text-[10px] text-zinc-400 font-medium">Browse beautiful curated backgrounds and preset design covers</p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 border border-zinc-850 hover:border-zinc-700 hover:bg-zinc-800/80 rounded-xl text-xs font-bold font-sans transition-all active:scale-95 text-zinc-300 disabled:opacity-40 cursor-pointer"
            title="Refresh current results"
          >
            <RotateCw className={`w-3.5 h-3.5 text-purple-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh Presets</span>
          </button>
          
          <button 
            type="button"
            onClick={onClose}
            className="p-2.5 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 rounded-xl transition-all cursor-pointer"
            title="Close Search Engine"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. SEARCH BAR & QUICK CATEGORY CHIPS */}
      <div className="px-6 py-4 bg-[#111214] border-b border-zinc-900/60 shrink-0 space-y-3.5 select-none">
        <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
            <input 
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search images (e.g., vaporwave, minimalist gradient, cyberpunk...)"
              className="w-full bg-[#1e1f22] border border-zinc-850 focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/30 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-semibold text-white placeholder-zinc-500 focus:outline-none transition-all shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 bg-[#5865f2] hover:bg-[#4752c4] active:bg-[#3c45ab] text-white font-extrabold text-sm rounded-2xl transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span className="hidden sm:inline">Search</span>
          </button>
        </form>

        {/* Suggestion Chips */}
        <div className="flex items-center gap-2 max-w-4xl mx-auto overflow-x-auto py-1 no-scrollbar shrink-0 select-none">
          <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest flex items-center gap-1 shrink-0 bg-zinc-900 px-2 py-1.5 rounded-lg border border-zinc-850">
            <Filter className="w-3 h-3 text-purple-400" />
            <span>Topics</span>
          </span>
          {PRESET_TOPICS.map(topic => {
            const isSel = activeTopic === topic.label;
            return (
              <button
                key={topic.label}
                type="button"
                onClick={() => handleTopicClick(topic.label, topic.query)}
                className={`flex-shrink-0 px-3.5 py-1.5 text-xs font-bold rounded-full transition-all border cursor-pointer ${
                  isSel 
                    ? 'bg-purple-600 border-purple-500 text-white shadow-sm shadow-purple-500/10'
                    : 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 hover:border-zinc-700'
                }`}
              >
                {topic.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Elastic Pull-to-Refresh Interactive Indicator zone */}
      {pullDistance > 0 && (
        <div 
          style={{ height: `${pullDistance}px`, opacity: Math.min(1, pullDistance / 45) }} 
          className="w-full bg-purple-500/5 border-b border-purple-500/10 overflow-hidden flex items-center justify-center gap-2 transition-all duration-75 select-none shrink-0"
        >
          <RotateCw className={`w-4 h-4 text-purple-400 ${pullDistance >= 55 ? 'animate-spin text-purple-300' : ''}`} style={{ transform: `rotate(${pullDistance * 4.5}deg)` }} />
          <span className="text-xs font-black tracking-tight text-purple-400/90">
            {pullDistance >= 55 ? 'Release to Refresh Gallery!' : 'Pull down to refresh presets...'}
          </span>
        </div>
      )}

      {/* 3. DYNAMIC PICTURE DISPLAY GRID */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex-1 overflow-y-auto p-5 sm:p-8 custom-scrollbar bg-[#0b0c0e] relative select-none"
      >
        {isLoading && images.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-12 text-center pointer-events-none">
            <Loader2 className="w-12 h-12 animate-spin text-purple-400 mb-4" />
            <h3 className="font-extrabold text-white text-base">Querying image catalog...</h3>
            <p className="text-sm text-zinc-400 mt-1 max-w-xs leading-relaxed">Assembling high-resolution custom photography matching your request</p>
          </div>
        ) : images.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-12 text-center max-w-sm mx-auto pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-850 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-rose-500/70" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <h3 className="font-extrabold text-white text-base">No search results found</h3>
            <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
              We couldn't locate anything for &ldquo;{searchQuery}&rdquo;. Try selecting a topic chip from above or search simple tags.
            </p>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {images.map((item) => (
                <BrowserImageItem
                  key={item.id}
                  item={item}
                  isSelected={selectedUrl === item.url}
                  onConfirm={() => setConfirmingImage(item)}
                />
              ))}
            </div>

            {/* Elegant "No More Results" block at the end of the image list with an SVG */}
            <div className="mt-14 mb-6 py-6 px-4 flex flex-col items-center justify-center text-center max-w-sm mx-auto select-none border-t border-zinc-900/60">
              <div className="w-11 h-11 rounded-full bg-zinc-900 border border-zinc-850 flex items-center justify-center mb-3 text-zinc-450 shadow-inner">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h4 className="font-extrabold text-white text-xs uppercase tracking-widest">No More Results</h4>
              <p className="text-[11px] text-zinc-500 mt-1 max-w-xs leading-relaxed">
                You've browsed through all active templates. Change your tag query or pull to refresh.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 4. ULTIMATE CLICK CONFIRMATION DIALOG POPUP */}
      {confirmingImage && (
        <div className="fixed inset-0 z-[400] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="bg-[#1a1b1e] border border-purple-500/20 rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-scale-in text-center relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button 
              type="button"
              onClick={() => setConfirmingImage(null)}
              className="absolute top-4.5 right-4.5 text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 p-2 rounded-xl transition-all border border-zinc-850 cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-500/15">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>

            <h3 className="text-white text-lg font-black tracking-tight leading-snug">Apply Cover Image?</h3>
            <p className="text-xs text-zinc-400 mt-1 mb-5">Set this high-quality wallpaper background as your active cover mockup instantly</p>

            {/* Premium Thumbnail card preview with details */}
            <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden mb-6 border border-purple-500/10 shadow-inner bg-zinc-950">
              <img 
                src={confirmingImage.url} 
                alt={confirmingImage.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-3 left-3 right-3 text-left">
                <p className="text-xs text-white font-extrabold truncate">
                  {confirmingImage.name}
                </p>
                {confirmingImage.creator && (
                  <p className="text-[10px] text-zinc-300 font-medium font-sans flex items-center gap-1.5 mt-1">
                    {confirmingImage.creatorAvatar ? (
                      <img 
                        src={confirmingImage.creatorAvatar} 
                        referrerPolicy="no-referrer" 
                        className="w-4 h-4 rounded-full border border-zinc-700 object-cover" 
                        alt="" 
                      />
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-[#5865f2]/10 text-[#5865f2] flex items-center justify-center text-[7px] font-extrabold uppercase shrink-0">
                        {confirmingImage.creator.slice(0, 2)}
                      </span>
                    )}
                    <span className="text-[#5865f2] font-semibold">@{confirmingImage.creator}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Decisive Actions */}
            <div className="grid grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={() => setConfirmingImage(null)}
                className="py-3 px-4 bg-zinc-900 text-zinc-400 hover:bg-zinc-850 hover:text-white border border-zinc-850 hover:border-zinc-700 font-bold text-xs rounded-xl transition-all cursor-pointer active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelect(confirmingImage.url, confirmingImage.creator);
                  setConfirmingImage(null);
                  onClose();
                  toast.success('Main template background updated successfully!');
                }}
                className="py-3 px-4 bg-purple-600 hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-500/20 text-white font-bold text-xs rounded-xl transition-all cursor-pointer active:scale-95"
              >
                Yes, Apply Theme
              </button>
            </div>
          </div>
        </div>
      )}

    </div>,
    document.body
  );
};
