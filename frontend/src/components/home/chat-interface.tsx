// src/components/home/chat-interface.tsx
// Main chat interaction surface with input box, command palette, and file attachment UI

"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { 
  Paperclip, 
  Command, 
  SendIcon, 
  XIcon, 
  LoaderIcon,
  Video,
  Plus,
  PersonStandingIcon,
  BookOpen,
  Play,
  Sparkles
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import Logo from '@/components/logo';

interface CommandSuggestion {
  icon: React.ReactNode;
  label: string;
  description: string;
  prefix: string;
  placeholder?: string;
  action?: () => void;
}

interface UseAutoResizeTextareaProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({ minHeight, maxHeight }: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.style.height = `${minHeight}px`;
      if (!reset) {
        const newHeight = Math.max(
          minHeight,
          Math.min(textarea.scrollHeight, maxHeight ?? Infinity)
        );
        textarea.style.height = `${newHeight}px`;
      }
    },
    [minHeight, maxHeight]
  );
  useEffect(() => adjustHeight(true), [adjustHeight]);
  return { textareaRef, adjustHeight };
}

interface ChatInterfaceProps {
  value: string;
  setValue: (value: string) => void;
  isTyping: boolean;
  attachments: string[];
  showCommandPalette: boolean;
  setShowCommandPalette: (show: boolean) => void;
  activeSuggestion: number;
  setActiveSuggestion: (index: number) => void;
  lessonJson: any;
  error: string | null;
  saveMessage: string | null;
  showSaveMessage: boolean;
  handleSendMessage: () => void;
  handleAttachFile: () => void;
  removeAttachment: (idx: number) => void;
  onNavigateToVideoLearning: (title: string) => void;
  setError: (error: string | null) => void;
}

export function ChatInterface({
  value,
  setValue,
  isTyping,
  attachments,
  showCommandPalette,
  setShowCommandPalette,
  activeSuggestion,
  setActiveSuggestion,
  lessonJson,
  error,
  saveMessage,
  showSaveMessage,
  handleSendMessage,
  handleAttachFile,
  removeAttachment,
  onNavigateToVideoLearning,
  setError
}: ChatInterfaceProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [inputFocused, setInputFocused] = useState(false);
  const [showVideoButton, setShowVideoButton] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  
  const { textareaRef: autoRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60,
    maxHeight: 200,
  });

  /* --- command palette data ---------------------------------------- */
  const commandSuggestions: CommandSuggestion[] = [
    { icon: <PersonStandingIcon className="w-4 h-4" />, label: "Structured Lesson", description: "Detailed and structured breakdown of your topic.", prefix: "/lesson", placeholder: "Please input a topic for structured learning", action: () => handleModeClick("lesson") },
    { icon: <BookOpen className="w-4 h-4" />, label: "Maths Tutor", description: "Add maths equations for simple solutions with explainer", prefix: "/Maths", placeholder: "Please input a maths question", action: () => handleModeClick("maths") },
    { icon: <Play className="w-4 h-4" />, label: "Chat", description: "Chat and ask your friendly AI", prefix: "/Chat", placeholder: "Please input your question", action: () => handleModeClick("chat") },
    { icon: <Sparkles className="w-4 h-4" />, label: "Quick Answer", description: "Concise explanation", prefix: "/quick", placeholder: "Please input your question for a quick answer", action: () => handleModeClick("quick") },
  ];

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

  // Function to handle mode button clicks and activate command palette with placeholder text
  const handleModeClick = (mode: string) => {
    // Set the initial value based on the stored mode
    switch (mode) {
      case "lesson":
        setValue("/lesson ");
        break;
      case "maths":
        setValue("/Maths ");
        break;
      case "chat":
        setValue("/Chat ");
        break;
      case "quick":
        setValue("/quick ");
        break;
      default:
        // For any other mode or default, we don't set a specific value
        break;
    }
    setShowCommandPalette(true);
    // Focus the textarea after setting the value
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 0);
  };

  useEffect(() => {
    if (value.startsWith("/") && !value.includes(" ")) {
      setShowCommandPalette(true);
      const idx = commandSuggestions.findIndex((cmd) => cmd.prefix.startsWith(value));
      setActiveSuggestion(idx);
    } else {
      setShowCommandPalette(false);
    }
  }, [value, commandSuggestions, setShowCommandPalette, setActiveSuggestion]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove); 
    };
  }, [mouseX, mouseY]);

  // Function to get the appropriate placeholder based on the current mode
  const getModePlaceholder = (): string => {
    if (value.startsWith("/lesson")) {
      return "/lesson - Please input a topic for structured learning";
    } else if (value.startsWith("/Maths")) {
      return "/Maths - Please input a maths question";
    } else if (value.startsWith("/Chat")) {
      return "/Chat - Please input your question";
    } else if (value.startsWith("/quick")) {
      return "/quick - Please input your question for a quick answer";
    }
    return "What would you like to learn today?";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showCommandPalette) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestion((activeSuggestion + 1) % commandSuggestions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestion((activeSuggestion - 1 + commandSuggestions.length) % commandSuggestions.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (activeSuggestion >= 0) {
          const cmd = commandSuggestions[activeSuggestion];
          if (cmd.action) {
            cmd.action();
          } else {
            setValue(cmd.prefix);
            setShowCommandPalette(false);
            // Focus the textarea after selection
            setTimeout(() => {
              if (textareaRef.current) {
                textareaRef.current.focus();
              }
            }, 0);
          }
        }
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col w-full items-center justify-center bg-transparent text-white p-6 relative overflow-hidden min-h-[calc(100vh-3rem)]">
      {/* animated blobs */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gray-300/5 rounded-full blur-[128px] animate-pulse delay-700" />
        <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-white/2 rounded-full blur-[96px] animate-pulse delay-1000" />
      </div>

      <div className="w-full max-w-2xl mx-auto relative">
        <motion.div
          className="relative z-10 space-y-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
        {/* Save message notification */}
        <AnimatePresence>
          {saveMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: showSaveMessage ? 1 : 0, y: showSaveMessage ? 0 : -10 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <div className={cn(
                "border rounded-xl p-3 text-sm max-w-md mx-auto",
                saveMessage.includes('saved') || saveMessage.includes('history') 
                  ? "bg-green-500/10 border-green-500/20 text-green-200" 
                  : "bg-blue-500/10 border-blue-500/20 text-blue-200"
              )}>
                {saveMessage}
                {saveMessage.includes('consider registering') && (
                  <button 
                    onClick={() => router.push('/register')} 
                    className="ml-2 text-blue-300 hover:text-blue-100 underline"
                  >
                    Register
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero section */}
        <div className="text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="space-y-4"
          >
            {/* centred, bigger logo */}
            <div className="flex justify-center">
              <Logo
                width={160}
                height={100}
                className="object-contain"
              />
            </div>

            <motion.div
              className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent max-w-md mx-auto"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "100%", opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            />

            <motion.p
              className="text-lg text-white/70 max-w-lg mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              Get simple and clear breakdowns—any time.
            </motion.p>
          </motion.div>
        </div>

        {/* chat card */}
        <motion.div
          className="relative backdrop-blur-2xl bg-white/5 rounded-2xl border border-white/10 shadow-2xl"
          initial={{ scale: 0.98 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          {/* command palette */}
          <AnimatePresence>
            {showCommandPalette && (
              <motion.div
                className="absolute left-4 right-4 bottom-full mb-2 backdrop-blur-xl bg-black/90 rounded-lg z-50 shadow-lg border border-white/10 overflow-hidden"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.15 }}
              >
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
                        setValue(s.prefix);
                        setShowCommandPalette(false);
                      }
                      // Focus the textarea after selection
                      setTimeout(() => {
                        if (textareaRef.current) {
                          textareaRef.current.focus();
                        }
                      }, 0);
                    }}
                  >
                    <div className="w-5 h-5 flex-center text-white/60">{s.icon}</div>
                    <div className="font-medium">{s.label}</div>
                    <div className="text-white/40 ml-1">{s.prefix}</div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* input area */}
          <div className="p-4">
            <div className="relative w-full">
              <Textarea
                ref={(node) => {
                  (autoRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
                  if (textareaRef.current !== node) (textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
                }}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  adjustHeight();
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder={getModePlaceholder()}
                className="w-full px-4 py-3 resize-none bg-transparent border-none text-white/90 text-sm placeholder:text-white/30 min-h-[60px]"
              />
            </div>
          </div>

          {/* Response area */}
          {error && (
            <div className="px-4 pb-4">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-200 text-sm"
              >
                {error}
                <button 
                  onClick={() => setError(null)} 
                  className="ml-2 text-red-300 hover:text-red-100"
                >
                  ✕
                </button>
              </motion.div>
            </div>
          )}

          {lessonJson && (
            <div className="px-4 pb-4">
              {/* We'll render the lesson card here when we create it */}
              <div className="lesson-card-placeholder">
                Lesson content will be displayed here
              </div>
            </div>
          )}

          {/* attachments */}
          <AnimatePresence>
            {attachments.length > 0 && (
              <motion.div
                className="px-4 pb-3 flex gap-2 flex-wrap"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                {attachments.map((file, idx) => (
                  <motion.div
                    key={idx}
                    className="flex items-center gap-2 text-xs bg-white/5 py-1.5 px-3 rounded-lg text-white/80 border border-white/10"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <span>{file}</span>
                    <button
                      onClick={() => removeAttachment(idx)}
                      className="text-white/50 hover:text-white"
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* bottom bar */}
          <div className="p-4 border-t border-white/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.button
                type="button"
                onClick={handleAttachFile}
                whileTap={{ scale: 0.94 }}
                className="p-2 text-white/50 hover:text-white rounded-lg"
              >
                <Paperclip className="w-4 h-4" />
              </motion.button>
              <motion.button
                onClick={() => setShowCommandPalette(!showCommandPalette)}
                whileTap={{ scale: 0.94 }}
                className="p-2 text-white/50 hover:text-white rounded-lg"
              >
                <Command className="w-4 h-4" />
              </motion.button>
            </div>

            <motion.button
              onClick={handleSendMessage}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              disabled={!value.trim() || isTyping}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2",
                value.trim() && !isTyping
                  ? "bg-white text-black shadow-lg shadow-white/20"
                  : "bg-white/10 text-white/50"
              )}
            >
              {isTyping ? (
                <LoaderIcon className="w-4 h-4 animate-spin" />
              ) : (
                <SendIcon className="w-4 h-4" />
              )}
              <span>Search</span>
            </motion.button>
          </div>

          {/* "Create video lesson" button */}
          {showVideoButton && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 border-t border-white/10"
            >
              <button
                onClick={() => onNavigateToVideoLearning?.(
                  lessonJson?.introduction?.split('\n')[0] || value.trim() || "Generated Lesson"
                )}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white"
              >
                <Video className="w-4 h-4" />
                <span>Create lesson</span>
              </button>
            </motion.div>
          )}
        </motion.div>

        {/* mode buttons */}
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
      </motion.div>
    </div>

    {/* mouse glow — optimized, no re-renders */}
    {inputFocused && !lessonJson && (
      <motion.div
        className="fixed w-[50rem] h-[50rem] rounded-full pointer-events-none z-0 opacity-5 bg-gradient-to-r from-white via-gray-200 to-white blur-2xl"
        style={{
          x: mouseX,
          y: mouseY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        transition={{ type: "spring", damping: 25, stiffness: 150, mass: 0.5 }}
      />
    )}
  </div>
  );
}