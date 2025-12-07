// src/components/home/action-grid.tsx
// Primary action controls
// Features:
//  * "Explanation Mode" button with state management
//  * "Add Term Plan" button with associated logic
//  * Consistent styling and hover effects

"use client";

import React from "react";
import { motion } from "framer-motion";
import { Video, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface ActionGridProps {
  value: string;
  onNavigateToVideoLearning: (title: string) => void;
}

export function ActionGrid({ value, onNavigateToVideoLearning }: ActionGridProps) {
  const router = useRouter();
  
  const modeSuggestions = [
    {
      icon: <Video className="w-4 h-4" />,
      label: "Explanation Mode",
      description: "Comprehensive AI explanations",
      action: () =>
        onNavigateToVideoLearning?.(
          value.trim() || "What would you like to learn?"
        ),
    },
    {
      icon: <Plus className="w-4 h-4" />, 
      label: "Add Term Plan",
      description: "Build a long-term study schedule",
      action: () => router.push("/term-plan"),
    },
  ];

  return (
    <div className="w-full mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
      {modeSuggestions.map((mode, idx) => (
        <motion.button
          key={mode.label}
          onClick={mode.action}
          className="group flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm text-white/80 hover:text-white transition-all border border-white/10 hover:border-white/20 min-w-[180px]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="text-white/70 group-hover:text-white transition-colors">
            {mode.icon}
          </div>
          <div className="flex flex-col items-start">
            <span className="font-medium">{mode.label}</span>
            <span className="text-xs text-white/50 group-hover:text-white/80 transition-colors">
              {mode.description}
            </span>
          </div>
        </motion.button>
      ))}
    </div>
  );
}