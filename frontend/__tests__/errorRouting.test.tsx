import React from 'react'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import ErrorComponent from '@/app/error'

describe('global error page routing', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('auto-redirects to homepage after brief delay', () => {
    render(<ErrorComponent error={new Error('boom')} reset={() => {}} />)
    // Advance timers beyond the redirect delay (1200ms)
    jest.advanceTimersByTime(1500)
    expect(console.warn).toHaveBeenCalledWith('Redirecting to homepage due to error')
  })
})