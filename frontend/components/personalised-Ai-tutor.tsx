"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Video, Loader2, AlertCircle, Home, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useComprehensiveAuth } from "@/contexts/ComprehensiveAuthContext";

interface PersonalisedAiTutorProps {
  question?: string;
  onBack?: () => void;
}

export default function PersonalisedAiTutor({ question, onBack }: PersonalisedAiTutorProps) {
  const router = useRouter();
  const { isAuthenticated } = useComprehensiveAuth();
  const [input, setInput] = useState<string>(question || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isPro, setIsPro] = useState<boolean>(false);
  const [checkingPro, setCheckingPro] = useState<boolean>(true);
  const [showGatingOverlay, setShowGatingOverlay] = useState<boolean>(true);
  const [supportsBackdrop, setSupportsBackdrop] = useState<boolean>(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{role: 'user' | 'ai', content: string}>>([]);

  // Live streaming state
  const [streamId, setStreamId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const videoRef = useRef<HTMLVideoElement>(null);

  // Detect backdrop-filter support for cross-environment consistency
  useEffect(() => {
    try {
      const hasSupport = typeof window !== 'undefined' && !!window.CSS && (
        window.CSS.supports?.('backdrop-filter: blur(8px)') ||
        window.CSS.supports?.('-webkit-backdrop-filter: blur(8px)')
      );
      setSupportsBackdrop(Boolean(hasSupport));
    } catch {
      setSupportsBackdrop(false);
    }
  }, []);

  // Stabilize viewport height across devices (fix 100vh issues on mobile)
  useEffect(() => {
    const setVh = () => {
      const height = (window.visualViewport?.height ?? window.innerHeight);
      document.documentElement.style.setProperty('--vh', `${height}px`);
    };
    setVh();
    window.addEventListener('resize', setVh);
    window.addEventListener('orientationchange', setVh);
    return () => {
      window.removeEventListener('resize', setVh);
      window.removeEventListener('orientationchange', setVh);
    };
  }, []);

  // Check pro status on component mount
  useEffect(() => {
    const checkProStatus = async () => {
      try {
        setCheckingPro(true);
        const response = await fetch('/api/subscription/status');
        
        if (response.ok) {
          const data = await response.json();
          setIsPro(Boolean(data.is_pro));
        } else {
          // Handle specific error cases
          if (response.status === 404) {
            console.error('Subscription status endpoint not found');
            setError('Subscription service not available');
          } else {
            // Treat any other status as non-pro without noisy logging
            setIsPro(false);
          }
        }
      } catch (e: unknown) {
        console.error('Error checking subscription status:', e);
        setError('Failed to check subscription status');
        setIsPro(false);
      } finally {
        setCheckingPro(false);
      }
    };

    checkProStatus();
  }, []);

  // Initialize D-ID WebRTC stream
  async function initAvatarStream() {
    try {
      setConnectionStatus('connecting');
      
      // Check if D-ID API is configured
      const healthCheck = await fetch('/api/avatar/streams/health').catch(() => null);
      if (!healthCheck || !healthCheck.ok) {
        // Fallback to demo mode when D-ID API is not available
        console.log('D-ID API not available, using demo mode');
        setConnectionStatus('connected');
        
        // Simulate a connected state for demo purposes
        setTimeout(() => {
          setConnectionStatus('connected');
        }, 1500);
        
        return { streamId: 'demo-stream', sessionId: 'demo-session' };
      }

      // Create stream on server to receive remote offer and ICE servers
      const createRes = await fetch('/api/avatar/streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      if (!createRes.ok) {
        // Handle specific error cases
        if (createRes.status === 404) {
          throw new Error('Avatar streaming service not found');
        }
        throw new Error('Failed to create stream');
      }

      const { id, offer, iceServers, sessionId: newSessionId } = await createRes.json();
      setStreamId(id);
      setSessionId(newSessionId);

      // Initialize RTCPeerConnection with D-ID ICE servers
      const pc = new RTCPeerConnection({
        iceServers: Array.isArray(iceServers) && iceServers.length > 0
          ? iceServers
          : [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      // Exchange ICE candidates with server
      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          try {
            await fetch(`/api/avatar/streams/${id}/ice`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId: newSessionId,
                candidate: event.candidate,
                sdpMid: event.candidate.sdpMid,
                sdpMLineIndex: event.candidate.sdpMLineIndex
              })
            });
          } catch (e: unknown) {
            console.error('ICE submit failed:', e instanceof Error ? e.message : e);
          }
        }
      };

      // Handle incoming remote track
      pc.ontrack = (event) => {
        if (videoRef.current && event.streams[0]) {
          (videoRef.current as HTMLVideoElement).srcObject = event.streams[0];
          setConnectionStatus('connected');
        }
      };

      // Set remote offer, create local answer, and submit
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      const sdpRes = await fetch(`/api/avatar/streams/${id}/sdp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer, sessionId: newSessionId })
      });
      
      if (!sdpRes.ok) {
        // Handle specific error cases
        if (sdpRes.status === 404) {
          throw new Error('Avatar streaming SDP service not found');
        }
        throw new Error('Failed to submit SDP answer');
      }

      setPeerConnection(pc);
      return { streamId: id, sessionId: newSessionId };
    } catch (error: unknown) {
      console.error('Stream initialization failed:', error);
      setConnectionStatus('error');
      setError(error instanceof Error ? error.message : 'Failed to connect to avatar');
      return null;
    }
  }

  // Send text to avatar to speak
  async function speakAvatar(text: string) {
    if (!streamId || !sessionId) return;
    
    // Handle demo mode
    if (streamId === 'demo-stream' || sessionId === 'demo-session') {
      console.log('Demo mode: Would speak text:', text);
      return;
    }

    try {
      const response = await fetch(`/api/avatar/streams/${streamId}/talk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          text
        })
      });
      
      // Handle specific error cases
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Avatar talking service not found');
        }
        throw new Error('Failed to speak');
      }
    } catch (error: unknown) {
      console.error('Failed to speak:', error);
      setError(error instanceof Error ? error.message : 'Failed to speak text');
    }
  }

  // Clean up stream
  useEffect(() => {
    return () => {
      if (peerConnection) {
        peerConnection.close();
      }
      if (streamId && sessionId) {
        fetch(`/api/avatar/streams/${streamId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        }).catch(console.error);
      }
    };
  }, [peerConnection, streamId, sessionId]);

  async function handleAsk() {
    if (!input.trim()) return;
    
    if (!isPro) {
      setError('Upgrade to Pro to use the avatar tutor');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Add user question to conversation history
      const userMessage = { role: 'user' as const, content: input };
      setConversationHistory(prev => [...prev, userMessage]);
      
      // Initialize stream if not connected
      if (connectionStatus !== 'connected') {
        const streamData = await initAvatarStream();
        if (!streamData) {
          setLoading(false);
          return;
        }
      }
      
      // Generate lesson content (you can enhance this with your AI backend)
      const aiResponse = `Let me explain: ${input}. Here's a detailed explanation of this concept...`;
      
      // Add AI response to conversation history
      const aiMessage = { role: 'ai' as const, content: aiResponse };
      setConversationHistory(prev => [...prev, aiMessage]);
      
      // Make avatar speak the lesson
      await speakAvatar(aiResponse);
      
      // Clear input after successful submission
      setInput('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }

  function handleGoHome() {
    router.push('/');
  }

  function handleClearConversation() {
    setConversationHistory([]);
    setInput('');
  }

  // Handle "Maybe later" button click
  function handleMaybeLater() {
    setShowGatingOverlay(false);
    // Navigate to homepage when user clicks "Maybe later"
    router.push('/');
  }

  // Handle navigation back to homepage from the overlay
  function handleGoToHomepage() {
    setShowGatingOverlay(false);
    router.push('/');
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden transition-all duration-500">
      {/* Background Effects */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/[0.02] rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gray-300/[0.03] rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700" />
      </div>
      
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6 border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (onBack) {
                onBack();
              } else {
                if (isAuthenticated) {
                  router.push('/homepage');
                } else {
                  router.back();
                }
              }
            }}
            className="text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="h-6 w-px bg-white/20" />
          <span className="font-bold text-xl bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">LANA AI</span>
        </div>
        <div className="flex items-center gap-4">
          {checkingPro ? (
            <div className="flex items-center gap-2 text-white/60">
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking access...
            </div>
          ) : !isPro ? (
            <Button
              onClick={() => { window.location.href = '/upgrade'; }}
              className="px-4 py-2 bg-gradient-to-r from-white to-gray-100 text-black font-semibold rounded-xl hover:from-gray-100 hover:to-white transition-all transform hover:scale-105 shadow-lg"
            >
              Upgrade to Pro
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-green-400 bg-green-500/10 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Pro User</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoHome}
            className="text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            <Home className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Non-pro access overlay with COMPLETE BLUR */}
      {(!checkingPro && !isPro && showGatingOverlay) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Complete background blur - using multiple layers for maximum effect */}
          <div className="absolute inset-0 bg-black/70" />
          <div 
            className={`absolute inset-0 ${
              supportsBackdrop ? 'backdrop-blur-3xl' : ''
            }`} 
            style={{
              backdropFilter: supportsBackdrop ? 'blur(40px) saturate(0.5)' : undefined,
              WebkitBackdropFilter: supportsBackdrop ? 'blur(40px) saturate(0.5)' : undefined,
            }}
          />
          
          {/* Content overlay */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 max-w-md mx-auto text-center px-8 py-10 rounded-3xl border border-white/20 bg-gradient-to-br from-gray-900/95 to-black/95 shadow-2xl"
          >
            <div className="mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">
                Upgrade your plan to access this feature
              </h2>
              <p className="text-white/70 text-base leading-relaxed">
                Unlock the avatar tutor with personalised explanations.
              </p>
            </div>
            
            <div className="space-y-3 mb-8">
              <div className="flex items-center justify-center gap-3 text-white/80">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Interactive avatar conversations</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-white/80">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Personalized explanations</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-white/80">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Advanced learning features</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => { window.location.href = '/upgrade'; }}
                className="px-8 py-4 bg-gradient-to-r from-white to-gray-100 text-black font-bold rounded-2xl hover:from-gray-100 hover:to-white transition-all transform hover:scale-105 shadow-xl text-base"
              >
                Upgrade to Pro
              </Button>
              <Button
                variant="ghost"
                onClick={handleMaybeLater}
                className="px-8 py-4 text-white/70 hover:text-white hover:bg-white/10 rounded-2xl border border-white/30 transition-all text-base"
              >
                Maybe later
              </Button>
            </div>
            
            {/* Add a clear way to go back to homepage */}
            <div className="mt-6">
              <Button
                variant="link"
                onClick={handleGoToHomepage}
                className="text-white/60 hover:text-white text-sm"
              >
                ← Back to Homepage
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Live Avatar Content */}
      <div className="relative z-10 flex flex-col min-h-[calc(var(--vh)-80px)]">
        {/* Background blur overlay for non-Pro users when overlay is dismissed */}
        {!checkingPro && !isPro && !showGatingOverlay && (
          <div
            className={`fixed inset-0 z-20 ${supportsBackdrop ? 'bg-black/60 backdrop-blur-xl' : 'bg-black/80'}`}
            style={supportsBackdrop ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' } : undefined}
          />
        )}
        
        <div className="flex-1 flex flex-col p-6">
          <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6 flex-1 flex flex-col"
            >
              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-3xl font-bold text-white text-center"
              >
                Personalised AI Tutor
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-xl text-white/60 text-center"
              >
                {isPro ? 'Ask your tutor anything.' : 'Upgrade your plan to access this feature. Unlock the avatar tutor with personalised explanations.'}
              </motion.p>

              {/* Conversation History */}
              {conversationHistory.length > 0 && (
                <div className="flex-1 overflow-y-auto max-h-60 mb-4 space-y-4 p-4 bg-black/20 rounded-2xl border border-white/10">
                  {conversationHistory.map((message, index) => (
                    <div 
                      key={index} 
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          message.role === 'user' 
                            ? 'bg-white/10 border border-white/20 rounded-br-none' 
                            : 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 rounded-bl-none'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold">
                            {message.role === 'user' ? 'You' : 'Lana AI'}
                          </span>
                        </div>
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Avatar Video Container */}
              <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-black rounded-3xl border border-white/20 overflow-hidden shadow-2xl flex-1">
                {/* Background glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 animate-pulse" />
                
                {/* Live Avatar Video */}
                {connectionStatus === 'connected' ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover relative z-10"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white/5 to-white/10 relative z-10">
                    <div className="text-center space-y-6">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all duration-500 ${
                        connectionStatus === 'connecting' ? 'bg-blue-500/20' : 
                        connectionStatus === 'error' ? 'bg-red-500/20' : 'bg-white/10'
                      }`}>
                        {connectionStatus === 'connecting' ? (
                          <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                        ) : connectionStatus === 'error' ? (
                          <AlertCircle className="w-10 h-10 text-red-400" />
                        ) : (
                          <Video className="w-10 h-10 text-white/60" />
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="text-white font-medium">
                          {connectionStatus === 'connecting' && 'Connecting to Lana...'}
                          {connectionStatus === 'error' && 'Connection failed'}
                          {connectionStatus === 'idle' && (isPro ? 'Ready to start' : 'Upgrade to Pro to start')}
                        </div>
                        {connectionStatus === 'idle' && !isPro && (
                          <div className="text-sm text-white/50">Upgrade to Pro to start learning</div>
                        )}
                        {error && (
                          <div className="text-sm text-red-400">{error}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Demo Mode Overlay */}
                {streamId === 'demo-stream' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 z-20">
                    <div className="text-center text-white">
                      <div className="w-16 h-16 mx-auto mb-4 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-sm opacity-80">Demo Mode</p>
                      <p className="text-xs opacity-60 mt-1">D-ID API not configured</p>
                    </div>
                  </div>
                )}
                
                {/* Connection Status Indicator */}
                {connectionStatus === 'connected' && (
                  <div className="absolute top-6 right-6 flex items-center gap-2 bg-green-500/20 backdrop-blur-sm rounded-full px-4 py-2 border border-green-500/30">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-300 font-medium">{streamId === 'demo-stream' ? 'Demo' : 'Live'}</span>
                  </div>
                )}
              </div>

              {/* Input + Ask */}
              <div className="space-y-4 pt-4">
                <div className="relative">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                    placeholder={isPro ? "Ask Lana anything..." : "Upgrade to Pro to ask Lana anything..."}
                    disabled={!isPro}
                    className={`w-full rounded-2xl border px-5 py-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 transition-all ${
                      isPro 
                        ? 'bg-white/10 border-white/20 focus:ring-white/30 focus:border-white/30' 
                        : 'bg-white/5 border-white/10 cursor-not-allowed opacity-60'
                    }`}
                  />
                  {!isPro && (
                    <div className="absolute inset-0 rounded-2xl border border-dashed border-white/20 pointer-events-none" />
                  )}
                </div>
                <div className="flex items-center justify-center gap-4">
                  <Button
                    onClick={handleAsk}
                    disabled={loading || !input.trim() || !isPro}
                    className={`px-8 py-4 font-semibold rounded-2xl transition-all transform ${
                      isPro 
                        ? 'bg-gradient-to-r from-white to-gray-100 text-black hover:from-gray-100 hover:to-white hover:scale-105 shadow-xl' 
                        : 'bg-white/20 text-white/60 cursor-not-allowed'
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Preparing avatar...
                      </span>
                    ) : (
                      isPro ? 'Ask Lana AI' : 'Upgrade to Pro'
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (onBack) {
                        onBack();
                      } else {
                        if (isAuthenticated) {
                          router.push('/homepage');
                        } else {
                          router.back();
                        }
                      }
                    }}
                    className="px-8 py-4 text-white/80 hover:text-white hover:bg-white/10 rounded-2xl border border-white/20 transition-all"
                  >
                    Back
                  </Button>
                  {conversationHistory.length > 0 && (
                    <Button
                      variant="ghost"
                      onClick={handleClearConversation}
                      className="px-8 py-4 text-white/80 hover:text-white hover:bg-white/10 rounded-2xl border border-white/20 transition-all"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
                  >
                    {error}
                  </motion.div>
                )}
              </div>

              {/* User Question Display (if provided) */}
              {question && !conversationHistory.length && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="relative backdrop-blur-2xl bg-white/[0.01] rounded-2xl border border-white/[0.05] shadow-xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-white/[0.15] flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-white/90">You</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white/80 text-sm">{question}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}