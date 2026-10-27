interface ChromeResponse<T> { ok: boolean; value?: T; error?: string }
interface ChromeRuntime { sendMessage(message: unknown, callback: (response: ChromeResponse<unknown>) => void): void }
interface Window { chrome?: { runtime: ChromeRuntime } }
