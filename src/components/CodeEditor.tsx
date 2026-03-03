import React, { useState, useEffect } from 'react';
import { DiscordWebhookMessage } from '@/types';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/themes/prism-tomorrow.css';
import Editor from 'react-simple-code-editor';
import { AlertCircle, Check, Copy, Undo, Redo } from 'lucide-react';
import { toast } from 'sonner';

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
  const [lineCount, setLineCount] = useState(1);

  // Convert message to Python-dict style string
  const messageToPython = (msg: DiscordWebhookMessage) => {
    try {
      const json = JSON.stringify(msg, null, 4);
      return json
        .replace(/true/g, 'True')
        .replace(/false/g, 'False')
        .replace(/null/g, 'None');
    } catch (e) {
      return '';
    }
  };

  // Initialize code from message
  useEffect(() => {
    const newCode = messageToPython(message);
    if (newCode !== code) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCode(newCode);
        setLineCount(newCode.split('\n').length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    setLineCount(newCode.split('\n').length);
    try {
      const jsonString = newCode
        .replace(/True/g, 'true')
        .replace(/False/g, 'false')
        .replace(/None/g, 'null')
        .replace(/'/g, '"')
        .replace(/,(\s*[}\]])/g, '$1');

      const parsed = JSON.parse(jsonString);
      setError(null);
      onChange(parsed);
    } catch {
       // Ignore
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard");
  };

  return (
    <div className="h-full flex flex-col bg-zinc-50 dark:bg-[#1e1e1e] rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xl">
      {/* VS Code Header */}
      <div className="bg-white dark:bg-[#252526] px-4 py-2 border-b border-zinc-200 dark:border-[#1e1e1e] flex justify-between items-center select-none">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
          <span className="ml-2 text-zinc-600 dark:text-zinc-400 text-xs font-mono">webhook.py</span>
        </div>
        <div className="flex items-center gap-2">
           {onUndo && (
             <button onClick={onUndo} disabled={!canUndo} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-30">
               <Undo className="w-3 h-3" />
             </button>
           )}
           {onRedo && (
             <button onClick={onRedo} disabled={!canRedo} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-30">
               <Redo className="w-3 h-3" />
             </button>
           )}
           <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1" />
           {error ? (
             <span className="flex items-center gap-1 text-red-600 dark:text-red-400 text-xs bg-red-100 dark:bg-red-900/20 px-2 py-0.5 rounded">
               <AlertCircle className="w-3 h-3" /> Syntax Error
             </span>
           ) : (
             <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs bg-green-100 dark:bg-green-900/20 px-2 py-0.5 rounded">
               <Check className="w-3 h-3" /> Valid
             </span>
           )}
           <button onClick={copyCode} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
             <Copy className="w-3 h-3" />
           </button>
        </div>
      </div>

      {/* Editor Area with Line Numbers */}
      <div className="flex-1 overflow-hidden relative flex">
        {/* Line Numbers */}
        <div className="w-10 bg-[#1e1e1e] text-zinc-600 text-right pr-2 pt-4 font-mono text-sm select-none border-r border-zinc-800">
          {Array.from({ length: lineCount }).map((_, i) => (
            <div key={i} className="leading-[1.5]">{i + 1}</div>
          ))}
        </div>

        {/* Code Editor */}
        <div className="flex-1 overflow-auto custom-scrollbar relative">
          <Editor
            value={code}
            onValueChange={handleCodeChange}
            highlight={code => Prism.highlight(code, Prism.languages.python, 'python')}
            padding={16}
            className="font-mono text-sm min-h-full"
            style={{
              fontFamily: '"Fira Code", "Fira Mono", monospace',
              fontSize: 14,
              backgroundColor: '#1e1e1e',
              color: '#d4d4d4',
              lineHeight: '1.5',
            }}
            textareaClassName="focus:outline-none"
          />
        </div>
        
        {/* Minimap Simulation */}
        <div className="w-16 bg-[#1e1e1e] border-l border-zinc-800 hidden sm:block opacity-50 pointer-events-none overflow-hidden">
           <div className="transform scale-[0.15] origin-top-left w-[600%] p-2 font-mono text-xs text-zinc-400 whitespace-pre">
             {code}
           </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-[#007acc] text-white px-3 py-1 text-[10px] flex justify-between items-center font-sans select-none">
        <div className="flex gap-4">
          <span>main*</span>
          <span>Python</span>
        </div>
        <div className="flex gap-4">
          <span>Ln {lineCount}, Col 1</span>
          <span>UTF-8</span>
          <span>Spaces: 4</span>
        </div>
      </div>
    </div>
  );
};
