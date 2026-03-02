import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, role, company, message, source = 'website' } = body

    // Validation
    if (!email || !name) {
      return NextResponse.json(
        { error: 'Name and email are required' },
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
      .from('demo_requests')
      .insert([
        {
          name,
          email,
          role: role || null,
          company: company || null,
          message: message || null,
          source,
          status: 'pending',
          created_at: new Date().toISOString(),
        },
      ])

    if (dbError) {
      console.error('Database error:', dbError)
    }

    // Log demo request
    console.log('Demo request:', {
      name,
      email,
      role,
      company,
      timestamp: new Date().toISOString(),
    })

    // Send notification email to team (optional)
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
            subject: `New Demo Request from ${name}`,
            html: `
              <h2>New Demo Request</h2>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Role:</strong> ${role || 'Not provided'}</p>
              <p><strong>Company:</strong> ${company || 'Not provided'}</p>
              <p><strong>Message:</strong></p>
              <p>${message || 'No message provided'}</p>
              <p><strong>Source:</strong> ${source}</p>
              <p><strong>Time:</strong> ${new Date().toISOString()}</p>
              <p><a href="mailto:${email}">Reply to request</a></p>
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
        message: 'Thank you for your interest! Our team will contact you within 24 hours to schedule your demo.' 
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Demo request error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again later.' },
      { status: 500 }
    )
  }
}
