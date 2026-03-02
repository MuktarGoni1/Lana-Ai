import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, subject, message, source = 'website' } = body

    // Validation
    if (!email || !message) {
      return NextResponse.json(
        { error: 'Email and message are required' },
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
      .from('contact_submissions')
      .insert([
        {
          name: name || null,
          email,
          subject: subject || 'General Inquiry',
          message,
          source,
          status: 'new',
          created_at: new Date().toISOString(),
        },
      ])

    if (dbError) {
      console.error('Database error:', dbError)
      // Continue even if DB fails - we'll still try to send email
    }

    // Log submission
    console.log('Contact form submission:', {
      name,
      email,
      subject,
      message: message.substring(0, 100) + '...',
      timestamp: new Date().toISOString(),
    })

    // Send notification email (optional - requires RESEND_API_KEY)
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
            to: 'contact@lanamind.com',
            subject: `New Contact Form: ${subject || 'General Inquiry'}`,
            html: `
              <h2>New Contact Form Submission</h2>
              <p><strong>Name:</strong> ${name || 'Not provided'}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Subject:</strong> ${subject || 'General Inquiry'}</p>
              <p><strong>Message:</strong></p>
              <p>${message}</p>
              <p><strong>Source:</strong> ${source}</p>
              <p><strong>Time:</strong> ${new Date().toISOString()}</p>
            `,
          }),
        })
      } catch (emailError) {
        console.log('Email notification failed:', emailError)
      }
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Thank you for your message! We\'ll get back to you soon.' 
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again later.' },
      { status: 500 }
    )
  }
}
