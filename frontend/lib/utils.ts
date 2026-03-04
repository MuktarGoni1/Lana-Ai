// lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// This function can be used in both Server and Client Components.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// The uuid function has been moved to lib/client-utils.ts

// Simple sleep utility for backoff delays
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Shared fetch helper with timeout and basic exponential backoff retries.
// Intended for server-side use in Next.js route handlers.
export async function fetchWithTimeoutAndRetry(
  input: string | URL,
  init: RequestInit = {},
  options: {
    timeoutMs?: number
    retries?: number
    retryDelayMs?: number
    retryOnStatuses?: number[]
  } = {}
) {
  const {
    timeoutMs = 10_000,
    retries = 2,
    retryDelayMs = 300,
    retryOnStatuses = [429, 502, 503, 504],
  } = options

  let attempt = 0
  let lastError: unknown = null

  while (attempt <= retries) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    // Bridge external abort signal (if provided) to our controller
    const externalSignal = init.signal as AbortSignal | undefined
    const onExternalAbort = externalSignal ? () => controller.abort() : undefined
    if (externalSignal && onExternalAbort) {
      if (externalSignal.aborted) {
        clearTimeout(timer)
        controller.abort()
      } else {
        externalSignal.addEventListener('abort', onExternalAbort, { once: true })
      }
    }
    try {
      const res = await fetch(input, { ...init, signal: controller.signal })
      clearTimeout(timer)
      if (externalSignal && onExternalAbort) {
        try { externalSignal.removeEventListener('abort', onExternalAbort) } catch {}
      }

      // If status is not in retry list or we're out of retries, return immediately
      if (!retryOnStatuses.includes(res.status) || attempt === retries) {
        return res
      }

      // Retry on configured statuses with exponential backoff
      await sleep(retryDelayMs * Math.pow(2, attempt))
      attempt++
      continue
    } catch (err: any) {
      clearTimeout(timer)
      if (externalSignal && onExternalAbort) {
        try { externalSignal.removeEventListener('abort', onExternalAbort) } catch {}
      }
      lastError = err
      const isAbort = err && (err.name === 'AbortError' || /aborted/i.test(String(err.message)))
      const isNetwork = err && (/fetch/i.test(String(err.message)) || err.code === 'ECONNRESET')

      if (attempt === retries) {
        throw err
      }

      // Retry on timeout or transient network errors
      if (isAbort || isNetwork) {
        await sleep(retryDelayMs * Math.pow(2, attempt))
        attempt++
        continue
      }

      // Unknown error: do not aggressively retry unless configured statuses caught it
      throw err
    }
  }

  // Should not reach here; throw last error if any
  if (lastError) throw lastError
  throw new Error('fetchWithTimeoutAndRetry: exhausted retries without response')
}