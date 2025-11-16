"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const Quiz = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-4", className)} {...props} />
));
Quiz.displayName = "Quiz";

const QuizQuestion = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-lg font-semibold", className)}
    {...props}
  />
));
QuizQuestion.displayName = "QuizQuestion";

const QuizOptions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("space-y-2", className)}
    {...props}
  />
));
QuizOptions.displayName = "QuizOptions";

const QuizOption = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "flex items-center space-x-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2",
      className
    )}
    {...props}
  />
));
QuizOption.displayName = "QuizOption";

const QuizSubmit = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2",
      className
    )}
    {...props}
  />
));
QuizSubmit.displayName = "QuizSubmit";

export { Quiz, QuizQuestion, QuizOptions, QuizOption, QuizSubmit };