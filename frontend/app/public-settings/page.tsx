"use client";

import { useState, useTransition } from "react";
import { useTheme } from "next-themes";
import { Moon, Palette, Globe, Save, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// Define types for our settings
interface PublicSettings {
  // Appearance settings
  theme: "light" | "dark" | "system";
  fontSize: "small" | "medium" | "large";
  accentColor: string;
  
  // General preferences
  language: string;
  notifications: boolean;
  autoSave: boolean;
  
  // Privacy settings
  analytics: boolean;
  crashReports: boolean;
}

export default function PublicSettingsPage() {
  const { theme, setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Initialize settings with default values
  const [settings, setSettings] = useState<PublicSettings>({
    theme: (theme as "light" | "dark" | "system") || "system",
    fontSize: "medium",
    accentColor: "#3b82f6",
    language: "en",
    notifications: true,
    autoSave: true,
    analytics: true,
    crashReports: true
  });
  
  // Handle input changes
  const handleInputChange = (field: keyof PublicSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle theme change
  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    handleInputChange("theme", newTheme);
    startTransition(() => {
      setTheme(newTheme);
    });
  };
  
  // Validate settings before saving
  const validateSettings = (): boolean => {
    // Add validation logic here if needed
    // For now, we'll assume all settings are valid
    return true;
  };
  
  // Save settings
  const saveSettings = async () => {
    if (!validateSettings()) {
      toast({
        title: "Validation Error",
        description: "Please check your settings and try again.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, you would save to localStorage or send to a server
      if (typeof window !== "undefined") {
        localStorage.setItem("publicSettings", JSON.stringify(settings));
      }
      
      setSaveSuccess(true);
      toast({
        title: "Settings Saved",
        description: "Your preferences have been saved successfully."
      });
      
      // Reset success indicator after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "There was an error saving your settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Load settings from localStorage on mount
  useState(() => {
    if (typeof window !== "undefined") {
      const savedSettings = localStorage.getItem("publicSettings");
      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings);
          setSettings(prev => ({ ...prev, ...parsedSettings }));
          
          // Apply theme if it was saved
          if (parsedSettings.theme) {
            startTransition(() => {
              setTheme(parsedSettings.theme);
            });
          }
        } catch (error) {
          console.error("Failed to parse saved settings:", error);
        }
      }
    }
  });
  
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center px-4 sm:px-6 py-10">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Public Settings</h1>
          <p className="text-muted-foreground">
            Configure your application preferences
          </p>
        </div>
        
        {/* Appearance Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Palette className="w-5 h-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize how the app looks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex-1">
                <Label className="text-sm font-medium">Theme</Label>
                <p className="text-xs text-muted-foreground mt-1">Select your preferred color scheme</p>
              </div>
              <Select 
                value={settings.theme} 
                onValueChange={handleThemeChange}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex-1">
                <Label className="text-sm font-medium">Font Size</Label>
                <p className="text-xs text-muted-foreground mt-1">Adjust the text size</p>
              </div>
              <Select 
                value={settings.fontSize} 
                onValueChange={(value: "small" | "medium" | "large") => handleInputChange("fontSize", value)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex-1">
                <Label className="text-sm font-medium">Accent Color</Label>
                <p className="text-xs text-muted-foreground mt-1">Choose your primary color</p>
              </div>
              <Input
                type="color"
                value={settings.accentColor}
                onChange={(e) => handleInputChange("accentColor", e.target.value)}
                className="w-16 h-10 p-1 cursor-pointer"
              />
            </div>
          </CardContent>
        </Card>
        
        {/* General Preferences Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="w-5 h-5" />
              General Preferences
            </CardTitle>
            <CardDescription>
              Configure general application behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex-1">
                <Label className="text-sm font-medium">Language</Label>
                <p className="text-xs text-muted-foreground mt-1">Select your preferred language</p>
              </div>
              <Select 
                value={settings.language} 
                onValueChange={(value: string) => handleInputChange("language", value)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex-1">
                <Label className="text-sm font-medium">Notifications</Label>
                <p className="text-xs text-muted-foreground mt-1">Enable or disable notifications</p>
              </div>
              <Switch
                checked={settings.notifications}
                onCheckedChange={(checked) => handleInputChange("notifications", checked)}
              />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex-1">
                <Label className="text-sm font-medium">Auto-save</Label>
                <p className="text-xs text-muted-foreground mt-1">Automatically save your work</p>
              </div>
              <Switch
                checked={settings.autoSave}
                onCheckedChange={(checked) => handleInputChange("autoSave", checked)}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Privacy Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Moon className="w-5 h-5" />
              Privacy
            </CardTitle>
            <CardDescription>
              Control your privacy settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex-1">
                <Label className="text-sm font-medium">Analytics</Label>
                <p className="text-xs text-muted-foreground mt-1">Help us improve by sharing usage data</p>
              </div>
              <Switch
                checked={settings.analytics}
                onCheckedChange={(checked) => handleInputChange("analytics", checked)}
              />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex-1">
                <Label className="text-sm font-medium">Crash Reports</Label>
                <p className="text-xs text-muted-foreground mt-1">Send crash reports to help fix bugs</p>
              </div>
              <Switch
                checked={settings.crashReports}
                onCheckedChange={(checked) => handleInputChange("crashReports", checked)}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button 
            onClick={saveSettings} 
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
        
        {/* Success Message */}
        {saveSuccess && (
          <div className="fixed bottom-4 right-4 flex items-center gap-2 p-3 bg-green-100 text-green-800 rounded-lg shadow-lg animate-in slide-in-from-bottom-4 duration-300">
            <CheckCircle className="w-5 h-5" />
            <span>Settings saved successfully!</span>
          </div>
        )}
        
        {/* Version Info */}
        <p className="text-center text-xs text-muted-foreground">
          Version 1.0.0
        </p>
      </div>
    </div>
  );
}