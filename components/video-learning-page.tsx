"use client"

import { motion } from "framer-motion"
import { ArrowLeft, MessageCircle, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface VideoLearningPageProps {
  question?: string
  onBack?: () => void
}

function LANALogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <svg
        width="24"
        height="24"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-white"
      >
        <defs>
          <linearGradient id="lana-gradient-small" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        <circle
          cx="16"
          cy="16"
          r="15"
          fill="url(#lana-gradient-small)"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1"
        />

        <g fill="rgba(0,0,0,0.8)">
          <circle cx="16" cy="16" r="2" />
          <circle cx="8" cy="10" r="1.5" />
          <circle cx="24" cy="10" r="1.5" />
          <circle cx="8" cy="22" r="1.5" />
          <circle cx="24" cy="22" r="1.5" />
          <line x1="16" y1="16" x2="8" y2="10" stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" />
          <line x1="16" y1="16" x2="24" y2="10" stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" />
          <line x1="16" y1="16" x2="8" y2="22" stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" />
          <line x1="16" y1="16" x2="24" y2="22" stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" />
          <path d="M12 12 L20 20 M20 12 L12 20" stroke="rgba(0,0,0,0.8)" strokeWidth="2" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  )
}

export function VideoLearningPage({ question = "What's an API?", onBack }: VideoLearningPageProps) {
  const handleAskQuestion = () => {
    // Handle ask question functionality
    console.log("Ask question clicked")
  }

  const handleExtendExplanation = () => {
    // Handle extend explanation functionality
    console.log("Extend explanation clicked")
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/[0.02] rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gray-300/[0.03] rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Chat
          </Button>
          <div className="h-6 w-px bg-white/20" />
          <div className="flex items-center gap-2">
            <LANALogo />
            <span className="font-semibold">LANA AI</span>
          </div>
        </div>
        <div className="text-sm text-white/60">Learning Space</div>
      </header>

      {/* Main Content Area */}
      <div className="relative z-10 max-w-3xl mx-auto p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Video Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="relative w-full h-80 bg-black/30 rounded-xl border-2 border-white/20 overflow-hidden backdrop-blur-sm"
          >
            {/* Video Placeholder Content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto border border-white/20">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-white/70"
                  >
                    <path d="M8 5v14l11-7z" fill="currentColor" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <p className="text-white/70 font-medium">Video Content Area</p>
                </div>
              </div>
            </div>

            {/* Subtle grid pattern overlay */}
            <div className="absolute inset-0 opacity-[0.02]">
              <div
                className="w-full h-full"
                style={{
                  backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                `,
                  backgroundSize: "20px 20px",
                }}
              />
            </div>

            {/* Corner indicators */}
            <div className="absolute top-2 left-2 w-3 h-3 border-l-2 border-t-2 border-white/30 rounded-tl-sm" />
            <div className="absolute top-2 right-2 w-3 h-3 border-r-2 border-t-2 border-white/30 rounded-tr-sm" />
            <div className="absolute bottom-2 left-2 w-3 h-3 border-l-2 border-b-2 border-white/30 rounded-bl-sm" />
            <div className="absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 border-white/30 rounded-br-sm" />
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-4"
          >
            <Button
              onClick={handleAskQuestion}
              className="flex items-center gap-2 px-6 py-3 bg-white/[0.05] hover:bg-white/[0.10] text-white border border-white/20 hover:border-white/30 rounded-lg transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Ask Question</span>
            </Button>

            <Button
              onClick={handleExtendExplanation}
              className="flex items-center gap-2 px-6 py-3 bg-white/[0.05] hover:bg-white/[0.10] text-white border border-white/20 hover:border-white/30 rounded-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Extend Explanation</span>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
