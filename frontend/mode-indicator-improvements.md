# Mode Indicator Improvements

## Issue Identified
The mode indicator was implemented but may not have been clearly visible due to z-index layering issues with the focus ring element.

## Changes Made

### 1. Z-Index Layering Fix
- **Before**: Mode indicator had `z-10`, focus ring had no explicit z-index (defaulting to 0)
- **After**: Mode indicator now has `z-20`, focus ring explicitly set to `z-0`
- **Result**: Mode indicator always appears above the focus ring when both are present

### 2. Text Visibility Enhancement
- **Before**: Mode text had `text-white/60` (60% opacity)
- **After**: Mode text now has `text-white/80` (80% opacity)
- **Result**: Better visibility against various backgrounds

### 3. Element Ordering
- **Before**: Mode indicator div was rendered before the focus ring span
- **After**: Focus ring span is now rendered first, then mode indicator on top
- **Result**: Proper layering ensures mode indicator is never obscured

## Technical Implementation

### In `components/animated-ai-chat.tsx`:
```jsx
{showRing && focused && (
  <motion.span
    className="absolute inset-0 rounded-md pointer-events-none ring-2 ring-white/20 z-0"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
  />
)}
{mode && (
  <div className="absolute top-2 right-3 text-xs text-white/80 pointer-events-none z-20 font-medium">
    {mode.charAt(0).toUpperCase() + mode.slice(1)} Mode
  </div>
)}
```

### In `app/homepage/page.tsx`:
```jsx
{showRing && focused && (
  <motion.span
    className="absolute inset-0 rounded-md pointer-events-none ring-2 ring-white/20 z-0"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
  />
)}
{mode && (
  <div className="absolute top-2 right-3 text-xs text-white/80 pointer-events-none z-20 font-medium">
    {mode.charAt(0).toUpperCase() + mode.slice(1)} Mode
  </div>
)}
```

## Benefits
1. **Enhanced Visibility**: Mode indicator is now clearly visible above the focus ring
2. **Better Layering**: Proper z-index values ensure correct element stacking
3. **Improved Readability**: Higher opacity text makes mode names easier to read
4. **Consistent Behavior**: Both components now have identical implementation

## Verification
- Mode indicator appears when typing mode prefixes (e.g., "/chat", "/lesson")
- Indicator is clearly visible and not obscured by focus ring
- All 4 modes (chat, quick, lesson, maths) properly display their names
- Backend endpoints remain unchanged and functional