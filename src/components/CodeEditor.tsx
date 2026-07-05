import React, { useState, useEffect, useRef } from 'react';
import { DiscordWebhookMessage } from '@/types';
import Editor, { OnMount } from '@monaco-editor/react';
import * as monaco from '@monaco-editor/react';
import { AlertCircle, Check, Copy, Undo, Redo, Search, X, ChevronUp, ChevronDown, Replace, ChevronRight, ChevronLeft, HelpCircle } from 'lucide-react';
import { toast } from '../utils/toast';
import { playButtonSound } from '@/utils/sounds';
import { DocumentationModal } from './DocumentationModal';

interface CodeEditorProps {
  message: DiscordWebhookMessage;
  onChange: (message: DiscordWebhookMessage) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ message, onChange, onUndo, onRedo, canUndo, canRedo }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const isTyping = useRef(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Search/Replace State
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [panelWidth, setPanelWidth] = useState(256);
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const decorationsRef = useRef<any>(null);

  useEffect(() => {
    if (!isDragging) return;
    
    const onMouseMove = (e: MouseEvent) => {
      setPanelWidth(prev => Math.max(150, Math.min(800, prev + e.movementX)));
    };
    
    const onMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging]);

  const messageToJson = (msg: DiscordWebhookMessage) => {
    try {
      return JSON.stringify(msg, null, 2);
    } catch {
      return '';
    }
  };

  useEffect(() => {
    if (!isTyping.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCode(messageToJson(message));
    }
  }, [message]);

  const handleCodeChange = (newCode: string | undefined) => {
    if (newCode === undefined) return;
    setCode(newCode);
    isTyping.current = true;
    try {
      const parsed = JSON.parse(newCode);
      setError(null);
      onChange(parsed);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    }
    
    setTimeout(() => {
      isTyping.current = false;
    }, 1000);
  };

  const copyCode = () => {
    playButtonSound();
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard");
  };

  const handleEditorDidMount: OnMount = (editor, monacoInstance) => {
    setEditorInstance(editor);
    decorationsRef.current = editor.createDecorationsCollection([]);
    
    // Add custom shortcut to open search panel
    editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyF, () => {
      setShowSearchPanel(true);
    });
  };

  useEffect(() => {
    if (!editorInstance) return;

    if (!searchQuery || !showSearchPanel) {
      setSearchResults([]);
      decorationsRef.current?.set([]);
      return;
    }

    const model = editorInstance.getModel();
    if (!model) return;

    const matches = model.findMatches(searchQuery, false, false, false, null, true);
    setSearchResults(matches);
    
    // Bounds check index
    const validIndex = Math.min(currentMatchIndex, Math.max(0, matches.length - 1));
    if (validIndex !== currentMatchIndex) {
      setCurrentMatchIndex(validIndex);
      return; // Will re-run with new index
    }
    
    const newDecorations = matches.map((match: any, i: number) => ({
      range: match.range,
      options: {
        inlineClassName: i === validIndex ? 'bg-yellow-500/60 dark:bg-yellow-500/50' : 'bg-yellow-500/30 dark:bg-yellow-500/20',
      }
    }));
    
    decorationsRef.current?.set(newDecorations);
    
    if (matches.length > 0) {
      editorInstance.revealRangeInCenterIfOutsideViewport(matches[validIndex].range);
    }
  }, [searchQuery, currentMatchIndex, code, editorInstance, showSearchPanel]);

  const nextMatch = () => {
    if (searchResults.length === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % searchResults.length);
  };

  const prevMatch = () => {
    if (searchResults.length === 0) return;
    setCurrentMatchIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
  };

  const handleReplace = () => {
    if (!editorInstance || searchResults.length === 0) return;
    const currentMatch = searchResults[currentMatchIndex];
    
    editorInstance.executeEdits('replace', [{
      range: currentMatch.range,
      text: replaceQuery,
      forceMoveMarkers: true
    }]);
  };

  const handleReplaceAll = () => {
    if (!editorInstance || searchResults.length === 0) return;
    
    const edits = searchResults.map((match: any) => ({
      range: match.range,
      text: replaceQuery,
      forceMoveMarkers: true
    }));
    
    editorInstance.executeEdits('replaceAll', edits);
  };

  return (
    <div className="h-full flex flex-col bg-zinc-50 dark:bg-[#1e1e1e] rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xl">
      {/* VS Code Header */}
      <div className="bg-white dark:bg-[#252526] px-4 py-2 border-b border-zinc-200 dark:border-[#1e1e1e] flex justify-between items-center select-none">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
          <span className="ml-2 text-zinc-600 dark:text-zinc-400 text-xs font-mono">message.json</span>
        </div>
        <div className="flex items-center gap-2">
           {onUndo && (
             <button onClick={() => { playButtonSound(); onUndo(); }} disabled={!canUndo} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
               <Undo className="w-3 h-3" />
             </button>
           )}
           {onRedo && (
             <button onClick={() => { playButtonSound(); onRedo(); }} disabled={!canRedo} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
               <Redo className="w-3 h-3" />
             </button>
           )}
           <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1" />
           {error ? (
             <span className="flex items-center gap-1 text-red-600 dark:text-red-400 text-xs bg-red-100 dark:bg-red-900/20 px-2 py-0.5 rounded" title={error}>
               <AlertCircle className="w-3 h-3" /> Syntax Error
             </span>
           ) : (
             <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs bg-green-100 dark:bg-green-900/20 px-2 py-0.5 rounded">
               <Check className="w-3 h-3" /> Valid
             </span>
           )}
           <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1" />
           <button 
             onClick={() => { playButtonSound(); setShowSearchPanel(!showSearchPanel); }}
             className={`flex items-center gap-1 p-1 rounded transition-colors ${showSearchPanel ? 'text-zinc-900 dark:text-white bg-zinc-200 dark:bg-zinc-700' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
             title="Search & Replace"
           >
             <Search className="w-3 h-3" />
           </button>
           <button 
             onClick={copyCode}
             className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
             title="Copy Code"
           >
             <Copy className="w-3 h-3" />
           </button>
           <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1" />
           <button 
             onClick={() => { playButtonSound(); setIsHelpOpen(true); }}
             className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
             title="Documentation"
           >
             <HelpCircle className="w-3.5 h-3.5 text-cyan-500" />
           </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden flex flex-row relative">
        {!showSearchPanel && (
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 cursor-pointer bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded-r border border-l-0 border-zinc-300 dark:border-zinc-700"
            onClick={() => setShowSearchPanel(true)}
            title="Open Search Panel"
          >
            <ChevronRight className="w-3 h-3 text-zinc-600 dark:text-zinc-300" />
          </div>
        )}
        {showSearchPanel && (
          <div 
            className="relative border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#252526] flex flex-col z-10 shrink-0 transition-all duration-75"
            style={{ width: `${panelWidth}px` }}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-200 dark:border-zinc-800">
              <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">Search & Replace</span>
              <button 
                onClick={() => setShowSearchPanel(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="p-3 space-y-3">
              <div className="space-y-1">
                <div className="flex items-center bg-white dark:bg-[#3c3c3c] border border-zinc-300 dark:border-transparent rounded overflow-hidden focus-within:border-cyan-500 dark:focus-within:border-cyan-500">
                  <div className="pl-2 pr-1 text-zinc-400">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Search" 
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent border-none text-sm px-1 py-1 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none min-w-0"
                  />
                  {searchQuery && searchResults.length > 0 && (
                    <span className="text-xs text-zinc-400 pr-2 select-none shrink-0">
                      {currentMatchIndex + 1} of {searchResults.length}
                    </span>
                  )}
                  {searchQuery && searchResults.length === 0 && (
                    <span className="text-xs text-red-400 pr-2 select-none shrink-0">0</span>
                  )}
                </div>
                {searchQuery && searchResults.length > 0 && (
                  <div className="flex gap-1 justify-end px-1">
                    <button onClick={prevMatch} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-zinc-500 dark:text-zinc-400">
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={nextMatch} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-zinc-500 dark:text-zinc-400">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center bg-white dark:bg-[#3c3c3c] border border-zinc-300 dark:border-transparent rounded overflow-hidden focus-within:border-cyan-500 dark:focus-within:border-cyan-500">
                  <div className="pl-2 pr-1 text-zinc-400">
                    <Replace className="w-3.5 h-3.5" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Replace" 
                    value={replaceQuery}
                    onChange={(e) => setReplaceQuery(e.target.value)}
                    className="flex-1 bg-transparent border-none text-sm px-1 py-1 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none min-w-0"
                  />
                  {searchQuery && searchResults.length > 0 && (
                    <button 
                      onClick={handleReplace}
                      className="px-2 text-zinc-500 hover:text-cyan-500 transition-colors"
                      title="Replace"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {searchQuery && searchResults.length > 0 && (
                  <div className="flex gap-2 justify-end px-1 pt-1">
                    <button 
                      onClick={handleReplaceAll}
                      className="text-xs bg-zinc-200 dark:bg-[#3c3c3c] hover:bg-zinc-300 dark:hover:bg-[#4d4d4d] text-zinc-700 dark:text-zinc-300 px-2 py-1 rounded w-full flex items-center justify-center gap-1"
                    >
                      <Replace className="w-3 h-3" /> Replace All
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Drag Handle */}
            <div 
              className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-cyan-500/50 active:bg-cyan-500 z-20 group"
              onMouseDown={(e) => {
                setIsDragging(true);
                e.preventDefault();
              }}
            >
              <div 
                className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-8 bg-zinc-300 dark:bg-zinc-600 rounded opacity-0 group-hover:opacity-100 flex items-center justify-center"
                onClick={(e) => { e.stopPropagation(); setShowSearchPanel(false); }}
                title="Close Panel"
                style={{ cursor: 'pointer' }}
              >
                <ChevronLeft className="w-2.5 h-2.5 text-zinc-700 dark:text-zinc-200" />
              </div>
            </div>
          </div>
        )}
        <div className="flex-1 min-w-0 h-full relative">
          <Editor
            height="100%"
            defaultLanguage="json"
            theme="vs-dark"
            value={code}
            onChange={handleCodeChange}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              formatOnPaste: true,
            }}
          />
        </div>
      </div>

      <DocumentationModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        editorType="code"
      />
    </div>
  );
};
