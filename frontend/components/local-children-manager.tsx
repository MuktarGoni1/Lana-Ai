"use client";

import React from "react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { AuthService } from "@/lib/services/authService";
import { supabase } from "@/lib/db";

export function LocalChildrenManager() {
  const [localChildren, setLocalChildren] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();
  const authService = new AuthService();

  // Load local children on component mount
  useEffect(() => {
    loadLocalChildren();
  }, []);

  const loadLocalChildren = () => {
    try {
      const children = authService.getLocalChildren();
      setLocalChildren(children);
    } catch (error) {
      console.error("Failed to load local children:", error);
    }
  };

  const syncLocalChildren = async () => {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to sync local children data.",
          variant: "destructive",
        });
        setSyncing(false);
        return;
      }

      const result = await authService.linkLocalChildrenToAccount(session.user.email!);
      
      if (result.success) {
        toast({
          title: "Sync Complete",
          description: result.message,
        });
        
        // Reload local children to show updated status
        loadLocalChildren();
      } else {
        toast({
          title: "Sync Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to sync local children:", error);
      toast({
        title: "Sync Error",
        description: error instanceof Error ? error.message : "Failed to sync local children data.",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const clearLocalChildren = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('lana_local_children');
        setLocalChildren([]);
        toast({
          title: "Local Data Cleared",
          description: "Local children data has been cleared.",
        });
      } catch (error) {
        console.error("Failed to clear local children:", error);
        toast({
          title: "Clear Failed",
          description: "Failed to clear local children data.",
          variant: "destructive",
        });
      }
    }
  };

  if (localChildren.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 shadow-lg max-w-md">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-white">Local Children Data</h3>
          <span className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-1 rounded-full">
            {localChildren.length} unsynced
          </span>
        </div>
        
        <p className="text-white/70 text-sm mb-4">
          {localChildren.length} child{localChildren.length !== 1 ? 'ren' : ''} saved locally. 
          Sync when you have a stable connection.
        </p>
        
        <div className="flex gap-2">
          <Button 
            onClick={syncLocalChildren} 
            disabled={syncing}
            className="flex-1 bg-white text-black hover:bg-white/90"
          >
            {syncing ? "Syncing..." : "Sync Now"}
          </Button>
          <Button 
            onClick={clearLocalChildren} 
            variant="outline" 
            className="border-white/30 text-white hover:bg-white/10"
          >
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}