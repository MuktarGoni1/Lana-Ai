import { ImageResponse } from 'next/og'
import { SEO_CONFIG } from '@/lib/seo-config'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const alt = 'LanaMind Pricing - Flexible Plans for Every Learning Need'
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
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          padding: '60px',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Background Pattern */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            background: 'radial-gradient(circle at 20% 50%, #facc15 0%, transparent 50%), radial-gradient(circle at 80% 80%, #3b82f6 0%, transparent 50%)',
          }}
        />

        {/* Logo Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '30px',
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: '100px',
              height: '100px',
              backgroundColor: SEO_CONFIG.branding.primaryColor,
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '50px',
              fontWeight: 'bold',
              color: '#0f172a',
              boxShadow: '0 10px 30px rgba(250, 204, 21, 0.3)',
            }}
          >
            L
          </div>
        </div>

        {/* Main Title */}
        <div
          style={{
            fontSize: '64px',
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'center',
            marginBottom: '16px',
            lineHeight: '1.2',
            zIndex: 1,
            textShadow: '0 2px 10px rgba(0,0,0,0.3)',
          }}
        >
          Simple, Transparent Pricing
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '28px',
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: '700px',
            lineHeight: '1.4',
            zIndex: 1,
          }}
        >
          Choose the perfect plan for your learning journey
        </div>

        {/* Price Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '40px',
            zIndex: 1,
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(250, 204, 21, 0.2)',
              border: '2px solid #facc15',
              borderRadius: '50px',
              padding: '16px 40px',
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
            }}
          >
            <div
              style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: '#facc15',
              }}
            >
              Starting at $9.99/mo
            </div>
            <div
              style={{
                fontSize: '18px',
                color: '#94a3b8',
              }}
            >
              Free trial included
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}