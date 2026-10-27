import type { EquatorialProvider } from '../domain/types'

export type SessionReason = 'manual' | 'timeout' | 'completed'
export class SessionManager {
  private timeoutId?: ReturnType<typeof setTimeout>
  constructor(private readonly onExpire: () => void, private readonly inactivityMs = 90_000) {}
  touch() { this.stop(); this.timeoutId = setTimeout(this.onExpire, this.inactivityMs) }
  stop() { if (this.timeoutId) clearTimeout(this.timeoutId); this.timeoutId = undefined }
  reset(provider?: EquatorialProvider) { this.stop(); provider?.dispose() }
}
