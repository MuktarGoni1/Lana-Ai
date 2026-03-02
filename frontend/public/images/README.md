# Logo Optimization Guide

## For Best Search Engine Visibility

To ensure your logo appears correctly in Google search results, follow these guidelines:

### 1. Open Graph Image (OG Image)
Create an optimized image with dimensions 1200x630 pixels named `lana-logo-og.png` for optimal display on social media and in search results.

### 2. Recommended Image Sizes
- **Favicon**: 16x16, 32x32 pixels
- **Apple Touch Icon**: 180x180 pixels
- **Manifest Icons**: 192x192, 512x512 pixels

### 3. File Formats
- PNG for transparency
- WebP for modern browsers (better compression)
- JPEG for photographs (not recommended for logos)

### 4. File Size
- Keep under 100KB when possible
- Optimize with tools like TinyPNG or Squoosh

### 5. Alt Text
Always include descriptive alt text for accessibility and SEO.

## Steps to Implement

1. Create a 1200x630 pixel version of your logo specifically for Open Graph tags
2. Generate 16x16 and 32x32 pixel favicons from your main logo
3. Create an Apple touch icon (180x180 pixels)
4. Place all images in the `/public/icons/` directory
5. Update the manifest.json file to reference these new sizes