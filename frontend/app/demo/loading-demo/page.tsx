"use client"

import { useState } from 'react'
import ElegantLoader from '@/components/elegant-loader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function LoadingDemoPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [fullscreenLoading, setFullscreenLoading] = useState(false)

  const simulateLoading = (duration: number) => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), duration)
  }

  const simulateFullscreenLoading = (duration: number) => {
    setFullscreenLoading(true)
    setTimeout(() => setFullscreenLoading(false), duration)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-light mb-8 text-center">Elegant Loader Demo</h1>
        
        {/* Size Variants */}
        <Card className="p-6 mb-8 bg-white/5 border-white/10">
          <h2 className="text-xl font-light mb-6 text-white/80">Size Variants</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center gap-2">
              <div className="p-4 bg-black/20 rounded-lg">
                <ElegantLoader size="sm" />
              </div>
              <span className="text-xs text-white/60">Small</span>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="p-4 bg-black/20 rounded-lg">
                <ElegantLoader size="md" />
              </div>
              <span className="text-xs text-white/60">Medium</span>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="p-4 bg-black/20 rounded-lg">
                <ElegantLoader size="lg" />
              </div>
              <span className="text-xs text-white/60">Large</span>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="p-4 bg-black/20 rounded-lg">
                <ElegantLoader size="xl" />
              </div>
              <span className="text-xs text-white/60">Extra Large</span>
            </div>
          </div>
        </Card>

        {/* Color Variants */}
        <Card className="p-6 mb-8 bg-white/5 border-white/10">
          <h2 className="text-xl font-light mb-6 text-white/80">Color Variants</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center gap-2">
              <div className="p-6 bg-black/20 rounded-lg w-full flex justify-center">
                <ElegantLoader size="lg" variant="primary" />
              </div>
              <span className="text-sm text-white/60">Primary (White)</span>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="p-6 bg-black/20 rounded-lg w-full flex justify-center">
                <ElegantLoader size="lg" variant="secondary" />
              </div>
              <span className="text-sm text-white/60">Secondary (Light White)</span>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="p-6 bg-black/20 rounded-lg w-full flex justify-center">
                <ElegantLoader size="lg" variant="accent" />
              </div>
              <span className="text-sm text-white/60">Accent (Purple)</span>
            </div>
          </div>
        </Card>

        {/* With Messages */}
        <Card className="p-6 mb-8 bg-white/5 border-white/10">
          <h2 className="text-xl font-light mb-6 text-white/80">With Loading Messages</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-black/20 rounded-lg flex flex-col items-center gap-4">
              <ElegantLoader 
                size="lg" 
                message="Loading your content..." 
              />
            </div>
            
            <div className="p-6 bg-black/20 rounded-lg flex flex-col items-center gap-4">
              <ElegantLoader 
                size="md" 
                variant="accent"
                message="Processing request" 
              />
            </div>
          </div>
        </Card>

        {/* Interactive Demos */}
        <Card className="p-6 mb-8 bg-white/5 border-white/10">
          <h2 className="text-xl font-light mb-6 text-white/80">Interactive Demos</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Inline Loading */}
            <div className="space-y-4">
              <h3 className="text-lg font-light text-white/70">Inline Loading</h3>
              <div className="p-6 bg-black/20 rounded-lg min-h-[120px] flex items-center justify-center">
                {isLoading ? (
                  <ElegantLoader size="lg" message="Loading..." />
                ) : (
                  <div className="text-center text-white/50">
                    <p>Content will appear here</p>
                    <Button 
                      onClick={() => simulateLoading(3000)}
                      className="mt-3 bg-white/10 hover:bg-white/20 text-white border border-white/20"
                    >
                      Load Content
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Fullscreen Loading */}
            <div className="space-y-4">
              <h3 className="text-lg font-light text-white/70">Fullscreen Loading</h3>
              <div className="p-6 bg-black/20 rounded-lg min-h-[120px] flex items-center justify-center">
                <div className="text-center">
                  <p className="text-white/50 mb-3">Click to see fullscreen loader</p>
                  <Button 
                    onClick={() => simulateFullscreenLoading(4000)}
                    className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30"
                  >
                    Show Fullscreen Loader
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Integration Examples */}
        <Card className="p-6 bg-white/5 border-white/10">
          <h2 className="text-xl font-light mb-6 text-white/80">Integration Examples</h2>
          <div className="space-y-6">
            <div className="p-4 bg-black/20 rounded-lg">
              <h3 className="text-white/70 mb-2">Page Transition</h3>
              <p className="text-white/50 text-sm">
                Use the fullscreen variant during page navigation for smooth transitions
              </p>
            </div>
            
            <div className="p-4 bg-black/20 rounded-lg">
              <h3 className="text-white/70 mb-2">Form Submission</h3>
              <p className="text-white/50 text-sm">
                Display inline loader while processing form data with contextual messages
              </p>
            </div>
            
            <div className="p-4 bg-black/20 rounded-lg">
              <h3 className="text-white/70 mb-2">Data Fetching</h3>
              <p className="text-white/50 text-sm">
                Show loader during API calls with descriptive loading states
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Fullscreen loader overlay */}
      {fullscreenLoading && (
        <ElegantLoader 
          size="xl" 
          variant="accent"
          message="Preparing your experience..."
          fullscreen={true}
        />
      )}
    </div>
  )
}