import { ImageResponse } from 'next/og'
import { SEO_CONFIG } from '@/lib/seo-config'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const alt = SEO_CONFIG.site.title
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          padding: '60px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Logo Area */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '120px',
              height: '120px',
              backgroundColor: SEO_CONFIG.branding.primaryColor,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '60px',
              fontWeight: 'bold',
              color: '#1e293b',
              border: '6px solid white',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            }}
          >
            L
          </div>
        </div>

        {/* Main Title */}
        <div
          style={{
            fontSize: '72px',
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'center',
            marginBottom: '20px',
            lineHeight: '1.2',
            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
          }}
        >
          {SEO_CONFIG.site.name}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '32px',
            color: '#cbd5e1',
            textAlign: 'center',
            maxWidth: '800px',
            lineHeight: '1.4',
          }}
        >
          {SEO_CONFIG.site.description.substring(0, 120)}...
        </div>

        {/* Decorative Elements */}
        <div
          style={{
            position: 'absolute',
            top: '40px',
            left: '40px',
            width: '60px',
            height: '60px',
            backgroundColor: 'rgba(250, 204, 21, 0.2)',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            right: '40px',
            width: '80px',
            height: '80px',
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderRadius: '50%',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  )
}