import { describe, expect, it, vi } from 'vitest'
import { SessionManager } from './SessionManager'

describe('SessionManager', () => {
  it('expires after inactivity', () => {
    vi.useFakeTimers(); const expire = vi.fn(); const session = new SessionManager(expire, 90)
    session.touch(); vi.advanceTimersByTime(90)
    expect(expire).toHaveBeenCalledOnce(); vi.useRealTimers()
  })
  it('disposes the previous provider on reset', () => {
    const dispose = vi.fn(); new SessionManager(vi.fn()).reset({ dispose, authenticate: vi.fn(), listAccounts: vi.fn(), listInvoices: vi.fn(), openInvoice: vi.fn() })
    expect(dispose).toHaveBeenCalledOnce()
  })
})
