import React from 'react';
import { motion } from 'framer-motion';

interface VoiceVisualizerProps {
  isActive: boolean;
}

const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ isActive }) => {
  const bars = Array.from({ length: 5 });

  return (
    <div className="flex items-center justify-center gap-2 h-24">
      {bars.map((_, i) => (
        <motion.div
          key={i}
          className="w-2 bg-gradient-to-t from-primary to-primary-glow rounded-full"
          animate={{
            height: isActive ? [20, 60, 20] : 20,
            opacity: isActive ? [0.5, 1, 0.5] : 0.3,
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

export default VoiceVisualizer;
