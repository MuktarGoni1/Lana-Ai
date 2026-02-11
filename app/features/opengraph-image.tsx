import { ImageResponse } from 'next/og'
import { SEO_CONFIG } from '@/lib/seo-config'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const alt = 'LanaMind Features - Advanced AI Tutoring Capabilities'
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
          background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 50%, #1e293b 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
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
            opacity: 0.15,
            background: 'radial-gradient(circle at 80% 20%, #facc15 0%, transparent 40%)',
          }}
        />

        {/* Left Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '650px',
            zIndex: 1,
          }}
        >
          {/* Logo Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '30px',
            }}
          >
            <div
              style={{
                width: '70px',
                height: '70px',
                backgroundColor: SEO_CONFIG.branding.primaryColor,
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '36px',
                fontWeight: 'bold',
                color: '#0f172a',
                marginRight: '16px',
                boxShadow: '0 8px 20px rgba(250, 204, 21, 0.3)',
              }}
            >
              L
            </div>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: 'white',
              }}
            >
              {SEO_CONFIG.site.name}
            </div>
          </div>

          {/* Main Title */}
          <div
            style={{
              fontSize: '56px',
              fontWeight: 'bold',
              color: 'white',
              lineHeight: '1.1',
              marginBottom: '20px',
              textShadow: '0 2px 10px rgba(0,0,0,0.3)',
            }}
          >
            Powerful AI Tutoring Features
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: '24px',
              color: '#94a3b8',
              lineHeight: '1.5',
              marginBottom: '30px',
            }}
          >
            Adaptive lessons • Real-time feedback • Progress tracking
          </div>

          {/* Feature Pills */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            {['Personalized Learning', 'AI-Powered', '24/7 Available'].map((feature, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.5)',
                  borderRadius: '50px',
                  padding: '10px 24px',
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#60a5fa',
                }}
              >
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Right Decorative */}
        <div
          style={{
            width: '350px',
            height: '350px',
            backgroundColor: 'rgba(250, 204, 21, 0.1)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(250, 204, 21, 0.3)',
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: '250px',
              height: '250px',
              backgroundColor: 'rgba(250, 204, 21, 0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '100px',
            }}
          >
            🤖
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}