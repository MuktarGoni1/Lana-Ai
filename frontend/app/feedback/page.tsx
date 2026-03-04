"use client";

import { useState } from "react";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

export default function FeedbackPage() {
  const { user } = useUnifiedAuth();
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.full_name || "",
    email: user?.email || "",
    feedback: "",
    rating: 5
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // In a real implementation, you would send this to your backend
      console.log("Feedback submitted:", formData);
      
      // Show success message
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback! We appreciate your input.",
      });
      
      // Reset form
      setFormData({
        name: user?.user_metadata?.full_name || "",
        email: user?.email || "",
        feedback: "",
        rating: 5
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Feedback</CardTitle>
          <CardDescription>
            We value your opinion! Please share your thoughts to help us improve Lana AI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rating">Rating</Label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`text-2xl ${star <= formData.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                    onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback</Label>
              <Textarea
                id="feedback"
                name="feedback"
                value={formData.feedback}
                onChange={handleChange}
                placeholder="Please share your thoughts, suggestions, or concerns..."
                rows={6}
              />
            </div>
            
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}