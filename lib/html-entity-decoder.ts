// lib/html-entity-decoder.ts
// Utility functions for decoding HTML entities in text content

/**
 * Decodes HTML entities in a given string
 * Handles named entities like &amp;, &lt;, &gt;, &quot;, &#39;, &#x27; etc.
 * @param text The text containing HTML entities to decode
 * @returns The decoded text with HTML entities converted to their original characters
 */
export function decodeHTMLEntities(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  // First handle numeric HTML entities manually since browsers don't always decode them
  let decodedText = text
    // Hexadecimal numeric entities (like &#x27;)
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    // Decimal numeric entities (like &#39;)
    .replace(/&#([0-9]+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));

  // Then use browser's built-in decoding for named entities
  const textArea = document.createElement('textarea');
  textArea.innerHTML = decodedText;
  return textArea.textContent || textArea.innerText || decodedText;
}

/**
 * Decodes HTML entities in a lesson object recursively
 * @param obj The lesson object to decode
 * @returns The lesson object with all string values having HTML entities decoded
 */
export function decodeLessonHTMLEntities(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  // Create a copy of the object to avoid mutation
  const decodedObj: any = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        // Decode HTML entities in string values
        decodedObj[key] = decodeHTMLEntities(value);
      } else if (typeof value === 'object' && value !== null) {
        // Recursively decode nested objects/arrays
        decodedObj[key] = decodeLessonHTMLEntities(value);
      } else {
        // Keep primitive values as they are
        decodedObj[key] = value;
      }
    }
  }

  return decodedObj;
}

/**
 * Alternative implementation using DOMParser for environments where textarea isn't available
 * @param text The text containing HTML entities to decode
 * @returns The decoded text with HTML entities converted to their original characters
 */
export function decodeHTMLEntitiesAlt(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  // First handle numeric HTML entities manually since browsers don't always decode them
  let decodedText = text
    // Hexadecimal numeric entities (like &#x27;)
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    // Decimal numeric entities (like &#39;)
    .replace(/&#([0-9]+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));

  // Use DOMParser as an alternative to textarea
  const parser = new DOMParser();
  const doc = parser.parseFromString(decodedText, 'text/html');
  return doc.documentElement.textContent || decodedText;
}