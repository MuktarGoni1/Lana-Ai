import DOMPurify from 'isomorphic-dompurify';

// Sanitize user-generated content to prevent XSS attacks
export function sanitizeContent(content: string): string {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'blockquote'],
    ALLOWED_ATTR: ['class'],
  });
}

// Sanitize HTML content with more permissive settings for rich text
export function sanitizeRichContent(content: string): string {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'strike', 'ul', 'ol', 'li', 
      'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
    ],
    ALLOWED_ATTR: ['class'],
  });
}

// Sanitize content for display in lesson cards
export function sanitizeLessonContent(content: string): string {
  // First sanitize with DOMPurify
  const sanitized = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'blockquote'],
    ALLOWED_ATTR: [],
  });
  
  // Then remove any remaining markdown-like formatting
  return sanitized
    .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove bold markdown
    .replace(/\*(.*?)\*/g, '$1')      // Remove italic markdown
    .replace(/__(.*?)__/g, '$1')      // Remove underline markdown
    .replace(/~~(.*?)~~/g, '$1')      // Remove strikethrough markdown
    .trim();
}