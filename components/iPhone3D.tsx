'use client';

import { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { motion } from 'framer-motion';

// Placeholder for 3D content
function Scene() {
  return null;
}

// Loading placeholder
function LoadingPlaceholder() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <motion.div
        className="w-36 h-72 rounded-[2.5rem] bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10"
        animate={{
          opacity: [0.5, 1, 0.5],
          scale: [0.95, 1, 0.95],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}

// Main component
export default function IPhone3D() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <LoadingPlaceholder />;
  }

  return (
    <div className="relative w-80 h-[550px] md:w-[420px] md:h-[650px]">
      {/* Glow effect behind phone */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          className="w-72 h-[500px] bg-gradient-to-br from-blue-600/20 via-purple-600/25 to-cyan-600/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* 3D Canvas for iPhone body */}
      <div className="absolute inset-0">
        <Suspense fallback={<LoadingPlaceholder />}>
          <Canvas
            camera={{ position: [0, 0, 6], fov: 50 }}
            style={{ background: 'transparent' }}
            gl={{ antialias: true, alpha: true }}
          >
            <ambientLight intensity={0.4} />
            <spotLight
              position={[5, 5, 5]}
              angle={0.4}
              penumbra={1}
              intensity={1.5}
              color="#ffffff"
            />
            <spotLight
              position={[-5, 3, 5]}
              angle={0.4}
              penumbra={1}
              intensity={0.8}
              color="#a78bfa"
            />
            <pointLight position={[0, -5, 3]} intensity={0.4} color="#3b82f6" />

            <Scene />

            <Environment preset="city" />
          </Canvas>
        </Suspense>
      </div>

      {/* Screen content overlay - Removed as it is now inside the 3D model */}

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              left: `${15 + (i * 10)}%`,
              top: `${20 + (i % 3) * 25}%`,
              background: i % 2 === 0 ? 'rgba(59, 130, 246, 0.5)' : 'rgba(139, 92, 246, 0.5)',
            }}
            animate={{
              y: [0, -40, 0],
              x: [0, (i % 2 === 0 ? 10 : -10), 0],
              opacity: [0.3, 0.7, 0.3],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </div>
  );
}
