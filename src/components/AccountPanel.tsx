import React, { useState, useEffect } from 'react';
import { User, LogOut, Settings, Shield, Star, Lock, Mail, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';

export const AccountPanel: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [stats, setStats] = useState({ templates: 0, downloads: 0 });

  useEffect(() => {
    const storedUser = localStorage.getItem('username');
    if (storedUser) {
      setUsername(storedUser);
      setIsLoggedIn(true);
      // Mock stats
      setStats({
        templates: Math.floor(Math.random() * 10),
        downloads: Math.floor(Math.random() * 100)
      });
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'forgot') {
        if (!email) {
            toast.error("Please enter your email address.");
            return;
        }
        setIsLoading(true);
        try {
            if (auth) {
                await sendPasswordResetEmail(auth, email);
                toast.success("Password reset email sent! Check your inbox.");
                setMode('login');
            } else {
                // Simulation
                await new Promise(resolve => setTimeout(resolve, 1500));
                toast.success("Simulation: Password reset email sent!");
                setMode('login');
            }
        } catch (error: any) {
            console.error("Reset password error:", error);
            toast.error("Failed to send reset email: " + error.message);
        } finally {
            setIsLoading(false);
        }
        return;
    }

    if (!email || !password || (mode === 'signup' && !username)) {
        toast.error("Please fill in all fields");
        return;
    }

    setIsLoading(true);
    
    // Simulate network delay for "security" feel
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (mode === 'signup') {
        localStorage.setItem('username', username);
        localStorage.setItem('email', email);
        toast.success("Account created successfully!");
    } else {
        // Mock login
        const storedName = localStorage.getItem('username') || email.split('@')[0];
        setUsername(storedName);
        toast.success("Welcome back!");
    }

    setIsLoggedIn(true);
    setIsLoading(false);
    setStats({ templates: 0, downloads: 0 });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setEmail('');
    setPassword('');
    toast.success("Logged out successfully.");
  };

  if (!isLoggedIn) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-[#1e1e1e] rounded-xl border border-zinc-200 dark:border-zinc-800 text-center overflow-y-auto">
        <div className="w-full max-w-sm bg-white dark:bg-[#2b2d31] p-8 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-700">
            <div className="flex justify-center mb-6">
                <div className="w-12 h-12 bg-cyan-600 rounded-full flex items-center justify-center shadow-lg shadow-cyan-600/20">
                    <Shield className="w-6 h-6 text-white" />
                </div>
            </div>
            
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                {mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
            </h2>
            <p className="text-sm text-zinc-500 mb-8">
                {mode === 'forgot' ? 'Enter your email to receive instructions' : 'to continue to Webhook Manager'}
            </p>
            
            <form onSubmit={handleAuth} className="space-y-4 text-left">
                {mode === 'signup' && (
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 ml-1">Username</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                                type="text"
                                placeholder="johndoe"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white transition-all"
                            />
                        </div>
                    </div>
                )}
                
                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 ml-1">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white transition-all"
                        />
                    </div>
                </div>

                {mode !== 'forgot' && (
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white transition-all"
                            />
                        </div>
                        {mode === 'login' && (
                            <div className="flex justify-end mt-1">
                                <button 
                                    type="button"
                                    onClick={() => setMode('forgot')}
                                    className="text-xs text-cyan-600 hover:text-cyan-500 hover:underline"
                                >
                                    Forgot password?
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 mt-6"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link')}
                </button>
            </form>

            <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-700">
                {mode === 'forgot' ? (
                    <button 
                        onClick={() => setMode('login')}
                        className="flex items-center justify-center gap-2 w-full text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Login
                    </button>
                ) : (
                    <p className="text-xs text-zinc-500">
                        {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
                        <button 
                            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                            className="ml-1 text-cyan-600 hover:underline font-bold"
                        >
                            {mode === 'login' ? 'Sign up' : 'Log in'}
                        </button>
                    </p>
                )}
            </div>
        </div>
        
        <div className="mt-8 flex gap-4 text-zinc-400 text-xs">
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Secure</span>
            <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Encrypted</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Verified</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#1e1e1e] rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-transparent pointer-events-none" />
        <div className="w-24 h-24 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4 shadow-xl border-4 border-white dark:border-zinc-700 relative z-10">
          <span className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{username.charAt(0).toUpperCase()}</span>
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-zinc-800" title="Online" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white relative z-10">{username}</h2>
        <span className="text-xs px-3 py-1 bg-cyan-500 text-white rounded-full font-bold mt-2 shadow-lg shadow-cyan-500/20 relative z-10">PRO MEMBER</span>
      </div>

      <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center hover:border-cyan-500/50 transition-colors">
            <div className="text-3xl font-bold text-zinc-900 dark:text-white">{stats.templates}</div>
            <div className="text-xs text-zinc-500 uppercase font-bold mt-1">Templates</div>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center hover:border-cyan-500/50 transition-colors">
            <div className="text-3xl font-bold text-zinc-900 dark:text-white">{stats.downloads}</div>
            <div className="text-xs text-zinc-500 uppercase font-bold mt-1">Downloads</div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-bold text-zinc-400 uppercase mb-2 tracking-wider">Account Settings</h3>
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-left border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><Settings className="w-5 h-5" /></div>
            <div className="flex-1">
                <div className="text-sm font-bold dark:text-zinc-200">Preferences</div>
                <div className="text-xs text-zinc-500">Theme, Language, Notifications</div>
            </div>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-left border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700">
            <div className="p-2 bg-green-500/10 rounded-lg text-green-500"><Shield className="w-5 h-5" /></div>
            <div className="flex-1">
                <div className="text-sm font-bold dark:text-zinc-200">Security</div>
                <div className="text-xs text-zinc-500">Password, 2FA, Sessions</div>
            </div>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-left border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500"><Star className="w-5 h-5" /></div>
            <div className="flex-1">
                <div className="text-sm font-bold dark:text-zinc-200">Pro Features</div>
                <div className="text-xs text-zinc-500">Manage subscription</div>
            </div>
          </button>
        </div>

        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors text-sm font-bold border border-transparent hover:border-red-200 dark:hover:border-red-900/30"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
