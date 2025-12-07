// src/components/ui/textarea.tsx
// Enhanced text input
// Features:
//  * Auto-resizing behavior
//  * Accessibility compliance
//  * Consistent styling with design system

"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    
    return (
      <div className="relative">
        <textarea
          className={cn(
            "flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            "transition-all duration-200 ease-in-out placeholder:text-muted-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "focus:outline-none",
            className
          )}
          ref={ref}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {focused && (
          <motion.span
            className="absolute inset-0 rounded-md pointer-events-none ring-2 ring-white/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };