"use client";

import { LanaMindDashboard } from "@/components/dashboard";
import VideoLearningPage from "@/components/personalised-Ai-tutor";
import { useState } from "react";

export default function DashboardPage() {
  const [videoTopic, setVideoTopic] = useState<string | null>(null);

  if (videoTopic) {
    return (
      <VideoLearningPage
        question={videoTopic}
        onBack={() => setVideoTopic(null)}
      />
    );
  }

  return <LanaMindDashboard onWatchVideo={setVideoTopic} />;
}
