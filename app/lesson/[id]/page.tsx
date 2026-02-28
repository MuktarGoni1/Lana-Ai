"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/db";
import VideoLearningPage from "@/components/personalised-Ai-tutor";

export default function LessonPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [topicTitle, setTopicTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTopic = async () => {
      setLoading(true);
      try {
        const db = supabase as any;
        const { data } = await db
          .from("topics")
          .select("title")
          .eq("id", params.id)
          .maybeSingle();

        setTopicTitle(data?.title || "Lesson");
      } finally {
        setLoading(false);
      }
    };

    if (params?.id) {
      void loadTopic();
    } else {
      setLoading(false);
    }
  }, [params?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black grid place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/60" />
      </div>
    );
  }

  return (
    <VideoLearningPage
      question={topicTitle}
      onBack={() => router.push("/lessons")}
    />
  );
}
