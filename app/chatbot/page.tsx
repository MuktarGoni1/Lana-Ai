"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const ChatWithSidebar = dynamic(() => import("@/components/chat-with-sidebar"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-white/70" />
    </div>
  ),
});

export default function ChatbotPage() {
  return <ChatWithSidebar />;
}
