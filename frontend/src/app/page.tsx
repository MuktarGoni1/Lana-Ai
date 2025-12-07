// src/app/page.tsx
// Primary application orchestrator
// Responsibilities:
//  * Manage authentication state via useEnhancedAuth
//  * Conditionally render either Chat Interface or Lesson Card
//  * Handle top-level error boundaries

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { ChatInterface } from "@/components/home/chat-interface";
import { StructuredLessonCard } from "@/components/home/lesson-card";
import { useLessonStream } from "@/hooks/use-lesson-stream";
import { ActionGrid } from "@/components/home/action-grid";

export default function HomePage() {
  const { user, isAuthenticated, isLoading } = useEnhancedAuth();
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [userAge, setUserAge] = useState<number | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showSaveMessage, setShowSaveMessage] = useState(false);
  
  const {
    lessonJson,
    isTyping,
    error,
    retryCount,
    handleSendMessage: sendLessonMessage,
    setError,
    setRetryCount
  } = useLessonStream();

  // Handle navigation to video learning
  const handleNavigate = (text: string) => setQuestion(text.trim());

  // Handle sending message
  const handleSendMessage = async () => {
    const q = value.trim();
    if (!q) return;

    // Reset states for new request
    setSaveMessage(null);
    setShowSaveMessage(false);
    
    // Send message using lesson stream hook
    await sendLessonMessage(q, userAge);
  };

  // Handle attaching file
  const handleAttachFile = () =>
    setAttachments((prev) => [...prev, `file-${Math.random().toString(36).slice(2)}.pdf`]);

  // Remove attachment
  const removeAttachment = (idx: number) =>
    setAttachments((prev) => prev.filter((_, i) => i !== idx));

  // Retrieve user age on component mount - ONLY for authenticated users
  useEffect(() => {
    const loadAge = async () => {
      try {
        // Only proceed if user is properly authenticated
        if (user) {
          // First try to get age from user metadata
          const age = (user as any).user_metadata?.age;
          if (age) {
            setUserAge(age);
            return;
          }
          
          console.debug('User age not found in metadata, using null');
        }
      } catch (error) {
        console.error('Error retrieving user age:', error);
      }
    };
    
    loadAge();
  }, [user]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-white/10 border-t-white/30 rounded-full animate-spin mx-auto" />
          <p className="text-white/30 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated) {
    router.push("/login");
    return null;
  }

  // Render video learning page if question is set
  if (question) {
    // Import the video learning component dynamically
    // For now, we'll just show a placeholder
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">
          <h1>Video Learning Page</h1>
          <p>Question: {question}</p>
          <button 
            onClick={() => setQuestion("")}
            className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg"
          >
            Back to Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <ChatInterface
        value={value}
        setValue={setValue}
        isTyping={isTyping}
        attachments={attachments}
        showCommandPalette={showCommandPalette}
        setShowCommandPalette={setShowCommandPalette}
        activeSuggestion={activeSuggestion}
        setActiveSuggestion={setActiveSuggestion}
        lessonJson={lessonJson}
        error={error}
        saveMessage={saveMessage}
        showSaveMessage={showSaveMessage}
        handleSendMessage={handleSendMessage}
        handleAttachFile={handleAttachFile}
        removeAttachment={removeAttachment}
        onNavigateToVideoLearning={handleNavigate}
        setError={setError}
      />
      
      {lessonJson && (
        <div className="max-w-3xl mx-auto px-6 pb-6">
          <StructuredLessonCard 
            lesson={lessonJson} 
            isStreamingComplete={!isTyping} 
          />
        </div>
      )}
      
      <ActionGrid 
        value={value} 
        onNavigateToVideoLearning={handleNavigate} 
      />
    </div>
  );
}