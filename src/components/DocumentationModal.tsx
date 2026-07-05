import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Book, Code, Box, GitGraph } from 'lucide-react';
import { playButtonSound } from '@/utils/sounds';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  editorType: 'node' | 'block' | 'code';
}

export const DocumentationModal: React.FC<DocumentationModalProps> = ({ isOpen, onClose, editorType }) => {
  const getEditorDetails = () => {
    switch (editorType) {
      case 'node':
        return {
          title: 'Node Editor Documentation',
          icon: <GitGraph className="w-5 h-5 text-cyan-400" />,
          color: 'text-cyan-400',
          content: (
            <div className="space-y-4 text-sm text-zinc-300">
              <p>
                The <strong>Node Editor</strong> provides a visual, graph-based way to construct your Discord Webhook Messages. It's perfect for users who want to see how different parts of their message connect and flow together.
              </p>
              
              <h3 className="text-white font-bold text-base mt-6">Core Features</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Visual Connections:</strong> Drag and drop nodes onto the canvas and connect them using "noodles" (edges).</li>
                <li><strong>Node Types:</strong>
                  <ul className="list-circle pl-5 mt-1 space-y-1 text-zinc-400">
                    <li><em>Content Node:</em> For the main message text.</li>
                    <li><em>Embed Node:</em> Acts as a container for rich embeds.</li>
                    <li><em>Title/Description/URL Nodes:</em> Connect these to Embed Nodes to populate their fields.</li>
                  </ul>
                </li>
                <li><strong>Snap to Grid:</strong> Use the magnet icon in the toolbar to toggle grid snapping for neat alignment.</li>
                <li><strong>Edge Styling:</strong> Change the style of the connection lines (Bezier, Straight, Step, Smooth) via the dropdown in the toolbar.</li>
              </ul>

              <h3 className="text-white font-bold text-base mt-6">How to Use</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Click <strong>Add Node</strong> to place a new building block onto the canvas.</li>
                <li>Click and drag from the handle (colored dot) of one node to the handle of another to connect them.</li>
                <li>To delete a node or connection, select it and press the <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-xs">Delete</kbd> or <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-xs">Backspace</kbd> key.</li>
                <li>You can also use the <strong>Scissors</strong> tool in the toolbar to click and cut connections easily.</li>
              </ol>
            </div>
          )
        };
      case 'block':
        return {
          title: 'Block Editor Documentation',
          icon: <Box className="w-5 h-5 text-indigo-400" />,
          color: 'text-indigo-400',
          content: (
            <div className="space-y-4 text-sm text-zinc-300">
              <p>
                The <strong>Block Editor</strong> offers a Scratch-like, drag-and-drop interface for building your messages. It's highly intuitive and great for rapidly assembling complex embed structures without writing any code.
              </p>

              <h3 className="text-white font-bold text-base mt-6">Core Features</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Categorized Palette:</strong> On the left side, blocks are organized into categories like Embeds, Author, Images, and Fields.</li>
                <li><strong>Drag and Drop:</strong> Simply drag a block from the palette and drop it into the central workspace.</li>
                <li><strong>Visual Hierarchy:</strong> Blocks are visually nested, making it clear which elements belong to which embeds.</li>
              </ul>

              <h3 className="text-white font-bold text-base mt-6">How to Use</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Select a category from the left sidebar or use the search bar to find a specific block type.</li>
                <li>Drag the desired block (e.g., "Set Title", "Add Field Block") into your workspace.</li>
                <li>Fill in the text inputs, select colors using the color picker, or pick dates for timestamps directly within the blocks.</li>
                <li>To reorder items within an embed (like fields), click and drag the handle grip (<span className="text-zinc-500">⋮⋮</span>) on the block.</li>
                <li>Click the Trash icon on any block to remove it from your structure.</li>
              </ol>
            </div>
          )
        };
      case 'code':
        return {
          title: 'Code Editor Documentation',
          icon: <Code className="w-5 h-5 text-emerald-400" />,
          color: 'text-emerald-400',
          content: (
            <div className="space-y-4 text-sm text-zinc-300">
              <p>
                The <strong>Code Editor</strong> provides a raw, JSON-based interface for advanced users. It allows for complete, precise control over the webhook payload structure.
              </p>

              <h3 className="text-white font-bold text-base mt-6">Core Features</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Monaco Editor:</strong> Powered by the same technology behind VS Code, offering syntax highlighting, autocompletion, and folding.</li>
                <li><strong>Real-time Validation:</strong> The editor constantly checks your JSON for syntax errors and displays the status in the top bar.</li>
                <li><strong>Search & Replace:</strong> A built-in panel allows you to quickly find and replace text within your payload.</li>
              </ul>

              <h3 className="text-white font-bold text-base mt-6">How to Use</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Write or paste your raw Discord Webhook JSON payload directly into the editor.</li>
                <li>Use the <strong>Copy</strong> button in the toolbar to copy the entire payload to your clipboard.</li>
                <li>Click the <strong>Search</strong> icon in the toolbar (or use standard keyboard shortcuts) to open the Search & Replace panel.</li>
                <li>Ensure the status indicator shows <span className="text-green-400">Valid</span> before sending, otherwise your webhook execution might fail.</li>
              </ol>
            </div>
          )
        };
      default:
        return {
          title: 'Documentation',
          icon: <Book className="w-5 h-5 text-white" />,
          color: 'text-white',
          content: null
        };
    }
  };

  const details = getEditorDetails();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 sm:p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="w-full max-w-2xl bg-[#121212] rounded-2xl sm:rounded-3xl border border-[#333] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#333] bg-[#1a1c1f]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-lg border border-white/10 shadow-inner">
                  {details.icon}
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">{details.title}</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Learn how to make the most of this editor.</p>
                </div>
              </div>
              <button 
                onClick={() => { playButtonSound(); onClose(); }}
                className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-gradient-to-b from-[#121212] to-[#0a0a0a]">
              {details.content}
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-[#333] bg-[#1a1c1f] flex justify-end">
              <button
                onClick={() => { playButtonSound(); onClose(); }}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-xl transition-colors active:scale-95"
              >
                Got it
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
