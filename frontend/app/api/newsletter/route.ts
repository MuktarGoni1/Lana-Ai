import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, source = 'website', tags = [] } = body

    // Validation
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    // Store in Supabase
    const supabase = await createServerClient()

    const { error: dbError } = await supabase
      .from('newsletter_subscribers')
      .insert([
        {
          email,
          source,
          tags,
          status: 'active',
          subscribed_at: new Date().toISOString(),
        },
      ])

    if (dbError) {
      // Check if it's a duplicate email error
      if (dbError.code === '23505') {
        return NextResponse.json(
          { 
            success: true, 
            message: 'You\'re already subscribed! Thank you for your interest.' 
          },
          { status: 200 }
        )
      }
      console.error('Database error:', dbError)
    }

    // Log subscription
    console.log('Newsletter subscription:', {
      email,
      source,
      tags,
      timestamp: new Date().toISOString(),
    })

    // Send welcome email (optional - requires RESEND_API_KEY)
    if (process.env.RESEND_API_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'LanaMind <contact@lanamind.com>',
            to: email,
            subject: 'Welcome to LanaMind! 🎓',
            html: `
              <h2>Welcome to LanaMind!</h2>
              <p>Thank you for subscribing to our newsletter. You'll receive:</p>
              <ul>
                <li>AI education tips and insights</li>
                <li>Parenting strategies for learning</li>
                <li>Exclusive offers and updates</li>
              </ul>
              <p>Ready to transform your child's learning? <a href="https://lanamind.com/register">Start your free trial today!</a></p>
              <p>Best regards,<br>The LanaMind Team</p>
            `,
          }),
        })
      } catch (emailError) {
        console.log('Welcome email failed:', emailError)
      }
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Thank you for subscribing! Check your email for confirmation.' 
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again later.' },
      { status: 500 }
    )
  }
}
