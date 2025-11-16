import { sanitizeContent, sanitizeRichContent, sanitizeLessonContent } from '../lib/sanitization';

describe('Sanitization Utilities', () => {
  describe('sanitizeContent', () => {
    it('should remove dangerous HTML tags', () => {
      const dangerousContent = '<script>alert("xss")</script><p>Safe content</p>';
      const sanitized = sanitizeContent(dangerousContent);
      
      expect(sanitized).not.toContain('script');
      expect(sanitized).toContain('Safe content');
    });

    it('should allow safe HTML tags', () => {
      const safeContent = '<p>Paragraph</p><strong>Bold text</strong><em>Italic text</em>';
      const sanitized = sanitizeContent(safeContent);
      
      expect(sanitized).toEqual(safeContent);
    });
  });

  describe('sanitizeRichContent', () => {
    it('should allow more HTML tags for rich content', () => {
      const richContent = '<h1>Heading</h1><p>Paragraph</p><ul><li>List item</li></ul>';
      const sanitized = sanitizeRichContent(richContent);
      
      expect(sanitized).toEqual(richContent);
    });
  });

  describe('sanitizeLessonContent', () => {
    it('should remove markdown formatting', () => {
      const markdownContent = '**Bold** *Italic* __Underline__ ~~Strikethrough~~';
      const sanitized = sanitizeLessonContent(markdownContent);
      
      expect(sanitized).toEqual('Bold Italic Underline Strikethrough');
    });

    it('should sanitize HTML and remove markdown', () => {
      const content = '<script>alert("xss")</script>**Bold** <p>Paragraph</p>';
      const sanitized = sanitizeLessonContent(content);
      
      expect(sanitized).not.toContain('script');
      expect(sanitized).not.toContain('**');
      expect(sanitized).toContain('Bold');
    });
  });
});