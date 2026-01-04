// src/hooks/index.ts
// Barrel export for hooks

export { useLessonStream } from './use-lesson-stream';
export { useTTS } from './use-tts';
// useEnhancedAuth is located in the root hooks directory, not src/hooks
// It will be imported directly from '@/hooks/useEnhancedAuth'