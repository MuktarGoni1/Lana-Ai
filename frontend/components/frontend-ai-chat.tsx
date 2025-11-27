"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  PersonStandingIcon, 
  BookOpen, 
  Play, 
  Sparkles 
} from "lucide-react";

// Simple cn function since we can't import from "@/lib/utils"
const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(" ");
};

interface CommandSuggestion {
  icon: React.ReactNode;
  label: string;
  description: string;
  prefix: string;
  placeholder?: string;
  action?: () => void;
}

export default function FrontendAIChat() {
  // Add the missing state variable
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [value, setValue] = useState("");
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // Mock function for setValue - in a real implementation this would be passed as a prop or handled differently
  const mockSetValue = (val: string) => {
    setValue(val);
  };

  // Mock function for setShowCommandPalette
  const mockSetShowCommandPalette = (show: boolean) => {
    setShowCommandPalette(show);
  };

  const commandSuggestions: CommandSuggestion[] = [
    { 
      icon: <PersonStandingIcon className="w-4 h-4" />, 
      label: "Structured Lesson", 
      description: "Detailed and structured breakdown of your topic.", 
      prefix: "/default", 
      placeholder: "Please input a topic for structured learning" 
    },
    { 
      icon: <BookOpen className="w-4 h-4" />, 
      label: "Maths Tutor", 
      description: "Add maths equations for simple solutions with explainer", 
      prefix: "/Maths", 
      placeholder: "Please input a maths question" 
    },
    { 
      icon: <Play className="w-4 h-4" />, 
      label: "Chat", 
      description: "Chat and ask your friendly AI", 
      prefix: "/Chat", 
      placeholder: "Please input your question" 
    },
    { 
      icon: <Sparkles className="w-4 h-4" />, 
      label: "Quick Answer", 
      description: "Concise explanation", 
      prefix: "/quick", 
      placeholder: "Please input your question for a quick answer" 
    },
  ];

  return (
    <div>
      {commandSuggestions.map((s, idx) => (
        <motion.div
          key={s.prefix}
          className={cn(
            "flex items-center gap-2 px-3 py-2 text-xs transition-colors cursor-pointer",
            activeSuggestion === idx
              ? "bg-white/10 text-white"
              : "text-white/70 hover:bg-white/5"
          )}
          onClick={() => {
            if (s.action) {
              s.action();
            } else {
              mockSetValue(s.prefix + " ");
              mockSetShowCommandPalette(false);
            }
          }}
        >
          <div className="w-5 h-5 flex-center text-white/60">{s.icon}</div>
          <div className="font-medium">{s.label}</div>
          <div className="text-white/40 ml-1">{s.prefix}</div>
        </motion.div>
      ))}
    </div>
  );
}