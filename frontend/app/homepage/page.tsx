"use client";

import React, { useEffect } from "react";
import ChatWithSidebar from "@/components/chat-with-sidebar";
import { ensureGuestSession } from "@/lib/guest";

// Lana AI - Homepage
// Minimal page component that renders the main chat interface
export default function HomePage() {
  useEffect(() => {
    // Automatically assign a guest id for unauthenticated visitors
    ensureGuestSession().catch(() => { /* noop */ })
  }, [])
  return <ChatWithSidebar />;
}