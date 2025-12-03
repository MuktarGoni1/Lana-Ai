"use client"

import { supabase } from '@/lib/db'

const COOKIE_NAME = 'lana_guest_id'

function parseCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.$?*|{}()\[\]\\/+^]/g, '\\$&') + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

function setSessionCookie(name: string, value: string) {
  if (typeof document === 'undefined') return
  const isSecure = typeof location !== 'undefined' && location.protocol === 'https:'
  const secureAttr = isSecure ? '; Secure' : ''
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax${secureAttr}`
}

function genGuestId(): string {
  try {
    // Prefer Web Crypto where available
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return `guest-${crypto.randomUUID()}`
    }
  } catch {}
  const rand = Math.random().toString(36).slice(2)
  const ts = Date.now().toString(36)
  return `guest-${ts}-${rand}`
}

/**
 * Ensure a session-scoped guest id exists and is stored in both cookie and sessionStorage.
 * Returns the guest id if present/created; null when an authenticated Supabase session exists.
 */
export async function ensureGuestSession(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      // Registered user — do not assign guest id
      return null
    }

    // Check sessionStorage first (fast path)
    const existingSession = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(COOKIE_NAME) : null
    if (existingSession) return existingSession

    // Else check cookie, then create
    let gid = parseCookie(COOKIE_NAME)
    if (!gid) {
      gid = genGuestId()
      setSessionCookie(COOKIE_NAME, gid)
    }
    if (typeof sessionStorage !== 'undefined') {
      try { sessionStorage.setItem(COOKIE_NAME, gid) } catch {}
    }
    return gid
  } catch (e) {
    // In case Supabase errors, still assign a guest id to keep UX flowing
    const existingSession = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(COOKIE_NAME) : null
    if (existingSession) return existingSession
    const gid = genGuestId()
    setSessionCookie(COOKIE_NAME, gid)
    if (typeof sessionStorage !== 'undefined') {
      try { sessionStorage.setItem(COOKIE_NAME, gid) } catch {}
    }
    return gid
  }
}

/**
 * Get the current guest id from cookie/sessionStorage without touching Supabase.
 */
export function getGuestId(): string | null {
  const fromSession = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(COOKIE_NAME) : null
  if (fromSession) return fromSession
  return parseCookie(COOKIE_NAME)
}

/**
 * Quick check to determine if the current client is in guest mode.
 */
export function isGuestClient(): boolean {
  return !!getGuestId()
}