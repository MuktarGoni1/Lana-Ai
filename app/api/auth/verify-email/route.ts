import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '../../../../lib/supabase-admin'
import * as crypto from 'node:crypto'

// Simple in-memory rate limiter (IP + email), suitable for single-instance deployments
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 20
const hits: Map<string, number[]> = new Map()

function rateLimited(key: string): boolean {
  const now = Date.now()
  const arr = hits.get(key) ?? []
  const recent = arr.filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  recent.push(now)
  hits.set(key, recent)
  return recent.length > RATE_LIMIT_MAX
}

const BodySchema = z.object({
  email: z.string().email(),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  const started = performance.now()
  const requestId = crypto.randomUUID()
  try {
    const json = await req.json()
    const parsed = BodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({
        ok: false,
        error: 'invalid_email',
        message: 'Please provide a valid email address.',
      }, { status: 400, headers: { 'x-request-id': requestId } })
    }

    const email = parsed.data.email.toLowerCase().trim()
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const key = `${ip}:${email}`
    if (rateLimited(key)) {
      return NextResponse.json({
        ok: false,
        error: 'rate_limited',
        message: 'Too many verification attempts. Please wait and try again.',
      }, { status: 429, headers: { 'x-request-id': requestId } })
    }

    // Communicate with Supabase Auth Admin securely using service role
    const t0 = performance.now()
    let admin
    try {
      admin = getSupabaseAdmin()
    } catch (envErr) {
      console.error('[verify-email] missing env vars', { requestId, envErr })
      return NextResponse.json({
        ok: false,
        error: 'service_unavailable',
        message: 'Verification service temporarily unavailable. Please try again later.',
      }, { status: 503, headers: { 'x-request-id': requestId } })
    }
    const { data, error } = await admin.auth.admin.listUsers({ 
      page: 1,
      perPage: 100 
    });
    const t1 = performance.now()

    if (error) {
      console.warn('[verify-email] admin.getUserByEmail error', { requestId, email, error })
      return NextResponse.json({
        ok: false,
        error: 'auth_admin_error',
        message: 'Unable to verify email at this time.',
      }, { status: 502, headers: { 'x-request-id': requestId } })
    }

    // Add debugging to see the structure of the data
    console.log('[verify-email] listUsers response structure', { 
      requestId, 
      email, 
      dataKeys: Object.keys(data),
      usersType: typeof data.users,
      usersLength: Array.isArray(data.users) ? data.users.length : 'not an array'
    });

    // Find the user with the matching email (case-insensitive)
    const user = Array.isArray(data.users) ? data.users.find(u => u.email?.toLowerCase() === email.toLowerCase()) : null;

    const exists = Boolean(user)
    const confirmed = Boolean(user?.email_confirmed_at)

    const payload = {
      ok: true,
      exists,
      confirmed,
      userId: user?.id ?? null,
      requestId,
      timings_ms: {
        admin_lookup: Math.round(t1 - t0),
        total: Math.round(performance.now() - started),
      },
    }

    console.info('[verify-email] result', { requestId, email, exists, confirmed, timings_ms: payload.timings_ms })

    return NextResponse.json(payload, { status: 200, headers: { 'x-request-id': requestId } })
  } catch (err) {
    console.error('[verify-email] unexpected', { requestId, err })
    return NextResponse.json({
      ok: false,
      error: 'network_or_server_error',
      message: 'A network or server error occurred during verification.',
    }, { status: 500, headers: { 'x-request-id': requestId } })
  }
}

export async function GET() {
  return NextResponse.json({ ok: false, error: 'method_not_allowed' }, { status: 405 })
}
