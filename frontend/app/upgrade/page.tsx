"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function UpgradePage() {
  const router = useRouter();
  
  useEffect(() => {
    // Add a small delay to show loading state and improve UX
    const timer = setTimeout(() => {
      router.push('/pricing');
    }, 800);
    
    return () => clearTimeout(timer);
  }, [router]);
  
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6 p-8"
      >
        <div className="w-16 h-16 bg-gradient-to-br from-white to-gray-200 rounded-2xl flex items-center justify-center mx-auto shadow-xl">
          <Loader2 className="w-8 h-8 text-black animate-spin" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Preparing Your Upgrade</h1>
          <p className="text-white/70">Finding the perfect plan for you...</p>
        </div>
      </motion.div>
    </div>
  );
}