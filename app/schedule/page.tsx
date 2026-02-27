"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { supabase } from "@/lib/db";
import { Calendar, Clock, ArrowRight, Loader2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ScheduleSlot {
  day: string;
  time: string;
  enabled: boolean;
}

export default function SchedulePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useUnifiedAuth();
  const { toast } = useToast();
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([
    { day: "Monday", time: "16:00", enabled: false },
    { day: "Tuesday", time: "16:00", enabled: false },
    { day: "Wednesday", time: "16:00", enabled: false },
    { day: "Thursday", time: "16:00", enabled: false },
    { day: "Friday", time: "16:00", enabled: false },
    { day: "Saturday", time: "10:00", enabled: false },
    { day: "Sunday", time: "10:00", enabled: false }
  ]);
  const [loading, setLoading] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  const toggleDay = (index: number) => {
    const updated = [...schedule];
    updated[index].enabled = !updated[index].enabled;
    setSchedule(updated);
  };

  const updateTime = (index: number, time: string) => {
    const updated = [...schedule];
    updated[index].time = time;
    setSchedule(updated);
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const payload = {
        revision_schedule: schedule.filter(s => s.enabled),
        schedule_set: true,
        onboarding_step: 3,
        savedAt: Date.now(),
      };

      if (!isAuthenticated || !user) {
        localStorage.setItem("lana_onboarding_schedule", JSON.stringify(payload));
        localStorage.setItem("lana_onboarding_pending_sync", JSON.stringify({ schedule: payload, savedAt: Date.now() }));
        toast({
          title: "Saved Locally",
          description: "We'll sync your schedule once you're signed in.",
        });
        router.push("/term-plan?onboarding=1");
        return;
      }

      // Save schedule to user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          revision_schedule: payload.revision_schedule,
          schedule_set: true,
          onboarding_step: 3
        }
      });
      
      if (error) throw error;
      localStorage.removeItem("lana_onboarding_schedule");
      
      toast({
        title: "Schedule Saved",
        description: "Successfully saved revision schedule."
      });
      
      router.push("/term-plan?onboarding=1");
    } catch (error: any) {
      console.error("Schedule save error:", error);
      try {
        const payload = {
          revision_schedule: schedule.filter(s => s.enabled),
          schedule_set: true,
          onboarding_step: 3,
          savedAt: Date.now(),
        };
        localStorage.setItem("lana_onboarding_schedule", JSON.stringify(payload));
        localStorage.setItem("lana_onboarding_pending_sync", JSON.stringify({ schedule: payload, savedAt: Date.now() }));
      } catch {}
      toast({
        title: "Saved Locally",
        description: "We'll sync your schedule once you're signed in.",
      });
      router.push("/term-plan?onboarding=1");
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Progress indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white/20 rounded-full"></div>
            <div className="w-2 h-2 bg-white/20 rounded-full"></div>
            <div className="w-2 h-2 bg-white/20 rounded-full"></div>
            <div className="w-2 h-2 bg-white/80 rounded-full"></div>
            <div className="w-2 h-2 bg-white/20 rounded-full"></div>
          </div>
        </div>
        
        <div className="bg-white/[0.02] backdrop-blur-sm rounded-2xl border border-white/[0.05] p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-xl bg-white/[0.05] flex items-center justify-center mx-auto">
              <Calendar className="w-7 h-7 text-white/70" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-white">Revision Schedule</h1>
              <p className="text-white/40 text-sm">Select days for automated reminders</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {schedule.map((slot, index) => (
              <div 
                key={index} 
                className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]"
              >
                <button
                  type="button"
                  onClick={() => toggleDay(index)}
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    slot.enabled 
                      ? "bg-white border-white" 
                      : "border-white/30 hover:border-white/50"
                  }`}
                >
                  {slot.enabled && <Check className="w-3 h-3 text-black" />}
                </button>
                <div className="flex-1">
                  <div className="font-medium text-sm">{slot.day}</div>
                  <input
                    type="time"
                    value={slot.time}
                    onChange={(e) => updateTime(index, e.target.value)}
                    disabled={!slot.enabled}
                    className={`text-xs bg-transparent border-none focus:outline-none ${
                      slot.enabled ? "text-white" : "text-white/30"
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="pt-4">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full px-6 py-3 rounded-xl bg-white text-black font-medium text-sm
                       hover:bg-white/90 transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>Continue to Term Plan</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
