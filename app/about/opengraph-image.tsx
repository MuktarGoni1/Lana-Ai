import { ImageResponse } from 'next/og'
import { SEO_CONFIG } from '@/lib/seo-config'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const alt = 'About LanaMind - Our Mission to Transform Education'
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
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
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
            background: 'radial-gradient(circle at 30% 70%, #facc15 0%, transparent 50%), radial-gradient(circle at 70% 30%, #3b82f6 0%, transparent 50%)',
          }}
        />

        {/* Logo Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '40px',
            zIndex: 1,
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
              color: '#0f172a',
              border: '6px solid white',
              boxShadow: '0 10px 30px rgba(250, 204, 21, 0.3)',
            }}
          >
            L
          </div>
        </div>

        {/* Main Title */}
        <div
          style={{
            fontSize: '60px',
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'center',
            marginBottom: '24px',
            lineHeight: '1.2',
            zIndex: 1,
            textShadow: '0 2px 10px rgba(0,0,0,0.3)',
          }}
        >
          Our Mission: Transform Education
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '28px',
            color: '#c7c7e0',
            textAlign: 'center',
            maxWidth: '800px',
            lineHeight: '1.5',
            zIndex: 1,
          }}
        >
          Empowering every student with personalized AI tutoring that adapts to their unique learning journey
        </div>

        {/* Stats Row */}
        <div
          style={{
            display: 'flex',
            gap: '60px',
            marginTop: '50px',
            zIndex: 1,
          }}
        >
          {[
            { value: '10K+', label: 'Students Helped' },
            { value: '50+', label: 'Countries' },
            { value: '98%', label: 'Satisfaction' },
          ].map((stat, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  color: SEO_CONFIG.branding.primaryColor,
                  marginBottom: '8px',
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: '18px',
                  color: '#94a3b8',
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}