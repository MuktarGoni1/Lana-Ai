# Elegant Loader Component

A beautiful, lightweight loading spinner component designed for the Lana AI application with smooth animations and multiple variants.

## Features

- **Smooth Animations**: Uses Framer Motion for fluid, performant animations
- **Multiple Sizes**: sm, md, lg, xl variants for different use cases
- **Color Themes**: Primary (white), Secondary (light white), Accent (purple)
- **Flexible Display**: Inline or fullscreen overlay options
- **Customizable Messages**: Optional loading text with fade-in animation
- **Performance Optimized**: Lightweight implementation with minimal re-renders

## Installation

The component is automatically available after creation. Import it in your components:

```typescript
import ElegantLoader from '@/components/elegant-loader'
```

## Usage Examples

### Basic Usage
```tsx
<ElegantLoader />
```

### Size Variants
```tsx
<ElegantLoader size="sm" />  // Small spinner
<ElegantLoader size="md" />  // Medium spinner (default)
<ElegantLoader size="lg" />  // Large spinner
<ElegantLoader size="xl" />  // Extra large spinner
```

### Color Variants
```tsx
<ElegantLoader variant="primary" />    // White (default)
<ElegantLoader variant="secondary" />  // Light white
<ElegantLoader variant="accent" />     // Purple accent
```

### With Loading Message
```tsx
<ElegantLoader 
  size="lg" 
  message="Loading your content..." 
/>
```

### Fullscreen Overlay
```tsx
<ElegantLoader 
  size="xl" 
  variant="accent"
  message="Preparing your experience..."
  fullscreen={true}
/>
```

### Complete Example in a Component
```tsx
'use client'

import { useState } from 'react'
import ElegantLoader from '@/components/elegant-loader'

export default function MyComponent() {
  const [isLoading, setIsLoading] = useState(false)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Your async operation here
      await new Promise(resolve => setTimeout(resolve, 2000))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      {isLoading ? (
        <ElegantLoader 
          size="lg" 
          message="Loading data..." 
        />
      ) : (
        <div>
          <p>Your content here</p>
          <button onClick={fetchData}>Load Data</button>
        </div>
      )}
    </div>
  )
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Size of the loader |
| `variant` | `'primary' \| 'secondary' \| 'accent'` | `'primary'` | Color theme variant |
| `className` | `string` | `''` | Additional CSS classes |
| `message` | `string` | `''` | Optional loading message |
| `fullscreen` | `boolean` | `false` | Whether to show as fullscreen overlay |

## Design System Integration

The loader follows the Lana AI design system:
- **Colors**: Matches the dark theme with white/purple accents
- **Typography**: Uses light font weights for messages
- **Spacing**: Consistent padding and margins
- **Animations**: Smooth, non-distracting motion
- **Glassmorphism**: Subtle backdrop blur effects

## Performance Notes

- Uses CSS transforms for animations (GPU accelerated)
- Minimal DOM nodes for fast rendering
- Efficient re-rendering with React.memo patterns
- Framer Motion optimizations for smooth performance

## Accessibility

- Proper ARIA labels (can be extended)
- Sufficient color contrast ratios
- Reduced motion support consideration
- Screen reader friendly messaging

## Common Use Cases

1. **Page Transitions**: Fullscreen loader during route changes
2. **Form Submissions**: Inline loader with contextual messages
3. **Data Fetching**: Component-level loading states
4. **Image Loading**: Placeholder while images load
5. **Search Operations**: Loading state during search queries

The component is designed to be versatile while maintaining the elegant aesthetic of the Lana AI application.