"use client"

// This function can only be used in Client Components.
export function uuid(): string {
  if (typeof window !== "undefined" && window.crypto && typeof window.crypto.getRandomValues === 'function') {
    return `${1e7}-${1e3}-${4e3}-${8e3}-${1e11}`.replace(/[018]/g, (c) =>
      (Number(c) ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))).toString(16)
    )
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}