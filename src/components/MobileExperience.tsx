import React from 'react';
import { motion } from 'motion/react';
import { Monitor, ArrowRight } from 'lucide-react';

interface MobileExperienceProps {
  onAccept: () => void;
  onForcedDesktop: () => void;
}

export const MobileExperience: React.FC<MobileExperienceProps> = ({ onAccept, onForcedDesktop }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-[#09090b] flex items-center justify-center overflow-hidden"
    >
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#5865F2]/20 rounded-full blur-[120px] animate-pulse" />
      
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="relative w-full max-w-lg px-6 py-12 text-center z-10 mt-10"
      >
        <div className="space-y-8">
          <div className="space-y-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-zinc-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-4 shadow-sm"
            >
              Hardware Compatibility Checked
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-light text-white tracking-[0.1em] leading-tight uppercase">
              Device <span className="font-bold">Compatibility</span>
            </h1>
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-xl">
                <p className="text-zinc-400 text-sm md:text-base max-w-sm mx-auto leading-relaxed font-medium">
                    "Your device cannot handle Advanced Workspace components. To ensure stability and prevent crashes, we have enabled the Lite Experience."
                </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 pt-4">
            <button 
              onClick={onAccept}
              className="group relative flex items-center justify-center gap-4 w-full py-5 bg-zinc-800 text-white border border-white/10 rounded-3xl font-bold uppercase tracking-widest text-sm transition-all hover:bg-zinc-700 active:scale-[0.98] overflow-hidden"
            >
              Enter Lite Studio
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <button 
              onClick={onForcedDesktop}
              className="flex items-center justify-center gap-3 w-full py-4 text-zinc-500 hover:text-white rounded-3xl font-bold text-xs transition-all active:scale-[0.98] uppercase tracking-widest"
            >
              Force Full Desktop
              <Monitor className="w-4 h-4" />
            </button>
          </div>

          {/* Remove the redundant footer icons */}
          <div className="pt-8">
             <div className="flex flex-col items-center gap-1 opacity-20">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 italic">Security Layer Active</span>
             </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
