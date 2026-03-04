import { ImageResponse } from 'next/og'
import { SEO_CONFIG } from '@/lib/seo-config'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const alt = SEO_CONFIG.site.title
export const size = {
  width: 1200,
  height: 600,
}

export const contentType = 'image/png'

// Twitter Card Image generation
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '60px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Left Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '700px',
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
                width: '80px',
                height: '80px',
                backgroundColor: 'white',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '40px',
                fontWeight: 'bold',
                color: '#0ea5e9',
                marginRight: '20px',
                boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
              }}
            >
              L
            </div>
            <div
              style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: 'white',
              }}
            >
              @{SEO_CONFIG.social.twitter.replace('@', '')}
            </div>
          </div>

          {/* Main Title */}
          <div
            style={{
              fontSize: '60px',
              fontWeight: 'black',
              color: 'white',
              lineHeight: '1.1',
              marginBottom: '20px',
              textShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            Transform Learning with AI
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: '28px',
              color: 'rgba(255,255,255,0.9)',
              lineHeight: '1.4',
            }}
          >
            Personalized tutoring that adapts to every student's unique learning style
          </div>
        </div>

        {/* Right Decorative Element */}
        <div
          style={{
            width: '300px',
            height: '300px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '200px',
              height: '200px',
              backgroundColor: SEO_CONFIG.branding.primaryColor,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '80px',
              fontWeight: 'bold',
              color: '#1e293b',
            }}
          >
            AI
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}