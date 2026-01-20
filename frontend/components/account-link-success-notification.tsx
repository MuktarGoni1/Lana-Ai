"use client"

import { useState, useEffect } from 'react'
import { CheckCircle, User, Users, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'

interface AccountLinkSuccessNotificationProps {
  parentName: string
  childrenNames: string[]
  isVisible: boolean
  onDismiss: () => void
}

export default function AccountLinkSuccessNotification({
  parentName,
  childrenNames,
  isVisible,
  onDismiss
}: AccountLinkSuccessNotificationProps) {
  const [showNotification, setShowNotification] = useState(isVisible)

  useEffect(() => {
    setShowNotification(isVisible)
    
    // Auto-dismiss after 5 seconds
    if (isVisible) {
      const timer = setTimeout(() => {
        setShowNotification(false)
        onDismiss()
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [isVisible, onDismiss])

  if (!showNotification) return null

  return (
    <AnimatePresence>
      {showNotification && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowNotification(false)
              onDismiss()
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            transition={{ delay: 0.1 }}
            className="relative w-full max-w-md bg-gradient-to-br from-green-500/10 to-emerald-600/10 backdrop-blur-xl border border-green-500/30 rounded-2xl p-6 shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={() => {
                setShowNotification(false)
                onDismiss()
              }}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
              aria-label="Close notification"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Success icon */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
                <div className="relative w-16 h-16 bg-green-500/20 border border-green-400/50 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">
                Account Linked Successfully!
              </h2>
              <p className="text-white/70 text-sm">
                Your family account hierarchy has been established
              </p>
            </div>

            {/* Parent section */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-blue-500/20 border border-blue-400/50 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-white font-medium">Parent Account</span>
              </div>
              <div className="ml-11 pl-4 border-l border-white/20 py-2">
                <div className="bg-white/5 rounded-lg px-3 py-2">
                  <span className="text-white/90">{parentName}</span>
                </div>
              </div>
            </div>

            {/* Children section */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-purple-500/20 border border-purple-400/50 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-purple-400" />
                </div>
                <span className="text-white font-medium">
                  Connected Children ({childrenNames.length})
                </span>
              </div>
              <div className="ml-11 space-y-2">
                {childrenNames.map((childName, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2 border border-white/10"
                  >
                    <div className="w-2 h-2 bg-purple-400 rounded-full" />
                    <span className="text-white/90 flex-1">{childName}</span>
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="text-center">
              <Button
                onClick={() => {
                  setShowNotification(false)
                  onDismiss()
                }}
                className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm"
              >
                Continue to Dashboard
              </Button>
              <p className="text-white/50 text-xs mt-3">
                You can manage your family accounts anytime in settings
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}