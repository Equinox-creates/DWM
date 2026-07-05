import React from 'react';
import { motion } from 'motion/react';
import { Webhook } from 'lucide-react';

interface CinematicIntroProps {
  onComplete: () => void;
}

const STARS_DATA = Array.from({ length: 50 }).map((_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2 + 1,
  duration: Math.random() * 3 + 2,
  offsetX: (Math.random() - 0.5) * 5,
  offsetY: (Math.random() - 0.5) * 5,
  delay: Math.random() * 5,
}));

const StarField = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {STARS_DATA.map((star) => (
        <motion.div
          key={star.id}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
            x: [`${star.x}%`, `${star.x + star.offsetX}%`],
            y: [`${star.y}%`, `${star.y + star.offsetY}%`],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: star.delay,
          }}
          className="absolute bg-white rounded-full blur-[1px]"
          style={{
            width: star.size,
            height: star.size,
            left: `${star.x}%`,
            top: `${star.y}%`,
          }}
        />
      ))}
    </div>
  );
};

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onComplete }) => {
  React.useEffect(() => {
    // Intro duration + hold duration
    const timer = setTimeout(() => {
      onComplete();
    }, 6000); // 3s animation + 3s hold

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
      className="fixed inset-0 z-[5000] bg-black flex items-center justify-center overflow-hidden"
    >
      <StarField />
      
      <div className="relative flex flex-col items-center">
        {/* Logo Zoom Section */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.2, 1], opacity: 1 }}
          transition={{ duration: 1.5, ease: [0.34, 1.56, 0.64, 1] }}
          className="relative mb-8"
        >
          <div className="relative">
            <motion.div
              animate={{ 
                boxShadow: ["0 0 20px rgba(255,255,255,0.1)", "0 0 60px rgba(255,255,255,0.3)", "0 0 20px rgba(255,255,255,0.1)"] 
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="p-6 rounded-3xl border-2 border-white/20 backdrop-blur-sm"
            >
              <Webhook className="w-16 h-16 text-white" strokeWidth={1.5} />
            </motion.div>
            
            {/* Outline Glow */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              className="absolute inset-0 border-2 border-white/30 rounded-3xl"
            />
          </div>
        </motion.div>

        {/* Text Content */}
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: 0.8, duration: 1 }}
            className="text-white text-4xl sm:text-6xl font-light tracking-[0.1em] uppercase font-sans"
          >
            DWM <span className="font-bold">TOOL</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 1.8, duration: 1.2 }}
            className="text-white/80 text-[10px] sm:text-xs mt-6 font-bold tracking-[0.5em] uppercase"
          >
            The professional editor for Discord webhooks
          </motion.p>
        </div>

        {/* Action Button Removed - Replaced with Branding */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          transition={{ delay: 3.5, duration: 1 }}
          className="absolute bottom-[-100px] left-1/2 -translate-x-1/2 whitespace-nowrap"
        >
          <span className="text-white text-[10px] uppercase tracking-[0.4em] font-medium">
            By Equinox studio
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
};
