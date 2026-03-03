import React, { useState, useEffect, useCallback } from 'react';
import { DiscordWebhookMessage } from '@/types';
import { Download, Trash2, Globe, Share2, Search, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, orderBy } from 'firebase/firestore';

interface Template {
  id: string;
  name: string;
  description: string;
  author: string;
  authorId?: string;
  message: DiscordWebhookMessage;
  isPublic: boolean;
  downloads: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createdAt?: any;
}

interface TemplatesPanelProps {
  onApply: (message: DiscordWebhookMessage) => void;
  currentMessage: DiscordWebhookMessage;
}

// ... (MOCK_ONLINE_TEMPLATES remains same)

export const TemplatesPanel: React.FC<TemplatesPanelProps> = ({ onApply, currentMessage }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'online' | 'saved'>('online');
  const [savedTemplates, setSavedTemplates] = useState<Template[]>([]);
  const [publicTemplates, setPublicTemplates] = useState<Template[]>(MOCK_ONLINE_TEMPLATES);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchUserTemplates = useCallback(async () => {
      if (!user) return;
      if (!db) return;
      setIsLoading(true);
      try {
          const q = query(
              collection(db, 'templates'), 
              where('authorId', '==', user.uid),
              orderBy('createdAt', 'desc')
          );
          const querySnapshot = await getDocs(q);
          const templates: Template[] = [];
          querySnapshot.forEach((doc) => {
              templates.push({ id: doc.id, ...doc.data() } as Template);
          });
          setSavedTemplates(templates);
      } catch (error) {
          console.error("Error fetching templates:", error);
          toast.error("Failed to load your templates.");
      } finally {
          setIsLoading(false);
      }
  }, [user]);

  const fetchPublicTemplates = useCallback(async () => {
      setIsLoading(true);
      try {
          if (!db) {
              // Fallback to mocks if db is not initialized
              setPublicTemplates(MOCK_ONLINE_TEMPLATES);
              return;
          }
          const q = query(
              collection(db, 'templates'), 
              where('isPublic', '==', true),
              orderBy('createdAt', 'desc')
          );
          const querySnapshot = await getDocs(q);
          const templates: Template[] = [];
          querySnapshot.forEach((doc) => {
              templates.push({ id: doc.id, ...doc.data() } as Template);
          });
          // Combine with mock templates for demo purposes, or replace them
          // For now, let's just use the fetched ones + mocks if needed, but let's prioritize fetched
          // To avoid duplicates if we were mixing, we'd need logic. 
          // Let's just append fetched to mocks for now to show both.
          setPublicTemplates([...MOCK_ONLINE_TEMPLATES, ...templates]);
      } catch (error) {
          console.error("Error fetching public templates:", error);
          // Fallback to mocks if error (e.g. permission issues or offline)
          setPublicTemplates(MOCK_ONLINE_TEMPLATES);
      } finally {
          setIsLoading(false);
      }
  }, []);

  // Fetch templates from Firestore when user logs in or tab changes
  useEffect(() => {
    if (activeTab === 'saved' && user) {
        fetchUserTemplates();
    } else if (activeTab === 'saved' && !user) {
        setSavedTemplates([]); // Clear if logged out
    } else if (activeTab === 'online') {
        fetchPublicTemplates();
    }
  }, [user, activeTab, fetchUserTemplates, fetchPublicTemplates]);

  const handleSaveOrShare = async (isPublic: boolean) => {
    if (!user) {
        toast.error("Please sign in to save templates.");
        // We can't easily switch tabs from here without context, but the toast is clear.
        // Ideally, we'd have a global modal state or callback to open Account settings.
        // For this implementation, we'll rely on the user navigating to Account.
        // Or we could dispatch a custom event if we wanted to be fancy.
        document.dispatchEvent(new CustomEvent('OPEN_ACCOUNT_SETTINGS'));
        return;
    }

    const name = prompt("Enter a name for your template:");
    if (!name) return;

    setIsLoading(true);
    try {
        if (!db) {
            toast.error("Database connection not available.");
            return;
        }
        const newTemplate = {
            name,
            description: isPublic ? 'Shared Community Template' : 'My private template',
            author: user.displayName || 'Anonymous',
            authorId: user.uid,
            message: currentMessage,
            isPublic,
            downloads: 0,
            createdAt: new Date().toISOString()
        };

        await addDoc(collection(db, 'templates'), newTemplate);
        
        toast.success(isPublic ? "Template shared successfully!" : "Template saved to cloud!");
        
        if (activeTab === 'saved') {
            fetchUserTemplates();
        }
    } catch (error) {
        console.error("Error saving template:", error);
        toast.error("Failed to save template.");
    } finally {
        setIsLoading(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    
    try {
        if (!db) return;
        await deleteDoc(doc(db, 'templates', id));
        setSavedTemplates(prev => prev.filter(t => t.id !== id));
        toast.success("Template deleted.");
    } catch (error) {
        console.error("Error deleting template:", error);
        toast.error("Failed to delete template.");
    }
  };

  const filteredOnline = publicTemplates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSaved = savedTemplates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#1e1e1e] rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 relative">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg dark:text-white">Templates</h2>
        </div>
        
        <div className="flex gap-2 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('online')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'online' ? 'bg-white dark:bg-zinc-800 shadow text-cyan-600' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
          >
            Online / Community
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'saved' ? 'bg-white dark:bg-zinc-800 shadow text-cyan-600' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
          >
            My Saved
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search templates..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar pb-20">
        {isLoading ? (
            <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
        ) : activeTab === 'online' ? (
          filteredOnline.map(template => (
            <TemplateCard key={template.id} template={template} onApply={onApply} />
          ))
        ) : (
          user ? (
            filteredSaved.length > 0 ? (
                filteredSaved.map(template => (
                <TemplateCard 
                    key={template.id} 
                    template={template} 
                    onApply={onApply} 
                    onDelete={() => deleteTemplate(template.id)}
                    // onShare={() => handleSaveOrShare(true)} // Re-share?
                />
                ))
            ) : (
                <div className="text-center py-10 text-zinc-500">
                <p>No saved templates found.</p>
                <p className="text-xs mt-2">Use the + button to save your current message.</p>
                </div>
            )
          ) : (
            <div className="text-center py-10 text-zinc-500">
                <p>Please sign in to view your saved templates.</p>
                <button 
                    onClick={() => document.dispatchEvent(new CustomEvent('OPEN_ACCOUNT_SETTINGS'))}
                    className="mt-4 px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-bold hover:bg-cyan-700"
                >
                    Sign In
                </button>
            </div>
          )
        )}
      </div>

      {/* Floating Action Button */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-3 items-end">
        <div className="group relative flex items-center gap-2">
            <span className="absolute right-12 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Share to Community
            </span>
            <button 
                onClick={() => handleSaveOrShare(true)}
                className="w-10 h-10 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-full shadow-lg flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors border border-zinc-200 dark:border-zinc-700"
            >
                <Share2 className="w-5 h-5" />
            </button>
        </div>
        <div className="group relative flex items-center gap-2">
            <span className="absolute right-14 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Save Template
            </span>
            <button 
                onClick={() => handleSaveOrShare(false)}
                className="w-12 h-12 bg-cyan-600 text-white rounded-full shadow-lg shadow-cyan-600/30 flex items-center justify-center hover:bg-cyan-700 transition-transform hover:scale-105 active:scale-95"
            >
                <Plus className="w-6 h-6" />
            </button>
        </div>
      </div>
    </div>
  );
};

const TemplateCard: React.FC<{ template: Template, onApply: (msg: DiscordWebhookMessage) => void, onDelete?: () => void, onShare?: () => void }> = ({ template, onApply, onDelete, onShare }) => (
  <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 hover:border-cyan-500 transition-colors group">
    <div className="flex justify-between items-start mb-2">
      <div>
        <h3 className="font-bold text-zinc-900 dark:text-white">{template.name}</h3>
        <p className="text-xs text-zinc-500">by {template.author}</p>
      </div>
      <div className="flex gap-2">
        {onShare && (
            <button onClick={(e) => { e.stopPropagation(); onShare(); }} className="p-1.5 text-zinc-400 hover:text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded transition-colors" title="Share to Community">
                <Share2 className="w-4 h-4" />
            </button>
        )}
        {onDelete && (
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-2">{template.description}</p>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1"><Download className="w-3 h-3" /> {template.downloads}</span>
        {template.isPublic && <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> Public</span>}
      </div>
      <button 
        onClick={() => {
          onApply(template.message);
          toast.success(`Applied template: ${template.name}`);
        }}
        className="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-cyan-600 hover:text-white dark:hover:bg-cyan-600 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded transition-colors"
      >
        Apply
      </button>
    </div>
  </div>
);
