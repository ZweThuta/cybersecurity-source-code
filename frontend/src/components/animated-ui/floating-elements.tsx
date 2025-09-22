import React from 'react';
import { motion } from 'framer-motion';

export const FloatingElements: React.FC = () => {
  const floatingShapes = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    size: Math.random() * 35 + 25,
    initialX: Math.random() * window.innerWidth,
    initialY: Math.random() * window.innerHeight,
    duration: Math.random() * 25 + 15,
    delay: Math.random() * 6,
    shape: Math.random() > 0.5 ? '50%' : '8%',
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {floatingShapes.map((shape) => (
        <motion.div
          key={shape.id}
          className="absolute opacity-10"
          style={{
            width: shape.size,
            height: shape.size,
            borderRadius: shape.shape,
            background: `linear-gradient(135deg, #6C63FF, #4A47A3)`,
            boxShadow: '0 0 15px rgba(108, 99, 255, 0.4)',
          }}
          initial={{
            x: shape.initialX,
            y: shape.initialY,
          }}
          animate={{
            x: [shape.initialX, shape.initialX + 80, shape.initialX - 60, shape.initialX],
            y: [shape.initialY, shape.initialY - 80, shape.initialY + 60, shape.initialY],
            rotate: [0, 180, 360],
            scale: [1, 1.15, 0.9, 1],
          }}
          transition={{
            duration: shape.duration,
            repeat: Infinity,
            delay: shape.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

export const ParticleEffect: React.FC = () => {
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 2,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-primary/30"
          style={{
            width: particle.size,
            height: particle.size,
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%',
          }}
          animate={{
            y: [-20, -100],
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
};
