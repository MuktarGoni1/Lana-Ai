"use client";

/**
 * app/page.tsx — Home
 *
 * Renders the dashboard by default.
 * Lifts video state here so VideoLearningPage can be launched
 * from within the dashboard without a route change.
 */

import { useState } from "react";
import { LanaMindDashboard } from "@/components/dashboard";
import VideoLearningPage from "@/components/personalised-Ai-tutor";

export default function HomePage() {
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


