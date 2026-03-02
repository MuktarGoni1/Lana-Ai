"use client"

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ElegantLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'primary' | 'secondary' | 'accent'
  className?: string
  message?: string
  fullscreen?: boolean
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8', 
  lg: 'w-12 h-12',
  xl: 'w-16 h-16'
}

const variantColors = {
  primary: 'text-white',
  secondary: 'text-white/70',
  accent: 'text-purple-400'
}

export default function ElegantLoader({
  size = 'md',
  variant = 'primary',
  className,
  message,
  fullscreen = false
}: ElegantLoaderProps) {
  const containerClasses = cn(
    'flex items-center justify-center',
    fullscreen ? 'fixed inset-0 z-50 bg-black/20 backdrop-blur-sm' : '',
    className
  )

  const loaderClasses = cn(
    sizeClasses[size],
    variantColors[variant],
    'relative'
  )

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center gap-4">
        {/* Main loading spinner */}
        <div className={loaderClasses}>
          {/* Outer ring with gradient */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-transparent"
            style={{
              background: `conic-gradient(from 0deg, ${variant === 'accent' ? '#a855f7' : '#ffffff'}00, ${variant === 'accent' ? '#a855f7' : '#ffffff'}FF)`,
              mask: 'radial-gradient(black 55%, transparent 56%)'
            }}
            animate={{ rotate: 360 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          
          {/* Inner pulsing circle */}
          <motion.div
            className="absolute inset-2 rounded-full bg-current"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Center glow dot */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="w-1/3 h-1/3 rounded-full bg-current/80" />
          </motion.div>
        </div>

        {/* Loading message */}
        {message && (
          <motion.p
            className={cn(
              'text-center font-light',
              size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base',
              variantColors[variant]
            )}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {message}
          </motion.p>
        )}

        {/* Secondary animation elements for larger sizes */}
        {size === 'lg' || size === 'xl' ? (
          <div className="flex gap-1 mt-2">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-1 h-1 rounded-full bg-current/40"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.4, 0.8, 0.4]
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.2
                }}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}