import React, { useEffect, useRef } from 'react';
import { Terminal, XCircle, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/utils';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

interface LogPanelProps {
  logs: LogEntry[];
  onClear: () => void;
}

export const LogPanel: React.FC<LogPanelProps> = ({ logs, onClear }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] text-zinc-300 font-mono text-xs rounded-xl overflow-hidden border border-zinc-800">
      <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-zinc-400" />
          <span className="font-bold text-zinc-400 uppercase tracking-wider">Output / Logs</span>
        </div>
        <button 
          onClick={onClear}
          className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-colors"
          title="Clear Logs"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {logs.length === 0 && (
          <div className="text-zinc-600 italic p-2 text-center">No logs yet...</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2 hover:bg-zinc-800/50 p-1 rounded">
            <span className="text-zinc-500 select-none w-[70px] flex-shrink-0">
              {log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="flex-shrink-0 mt-0.5">
              {log.level === 'info' && <Info className="w-3 h-3 text-blue-400" />}
              {log.level === 'warn' && <AlertTriangle className="w-3 h-3 text-yellow-400" />}
              {log.level === 'error' && <XCircle className="w-3 h-3 text-red-400" />}
              {log.level === 'success' && <CheckCircle className="w-3 h-3 text-green-400" />}
            </span>
            <span className={cn(
              "break-all",
              log.level === 'error' && "text-red-300",
              log.level === 'warn' && "text-yellow-300",
              log.level === 'success' && "text-green-300"
            )}>
              {log.message}
            </span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
};
