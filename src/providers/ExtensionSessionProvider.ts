import type { Account, EquatorialProvider, Invoice, InvoiceDocument } from '../domain/types'

type SessionStatus = { available: boolean; authenticated: boolean }

function message<T>(type: string, payload: Record<string, unknown> = {}): Promise<T> {
  return new Promise((resolve, reject) => {
    if (!window.chrome?.runtime) return reject(new Error('Abra o painel pela extensão Fácill no Chrome.'))
    window.chrome.runtime.sendMessage({ type, ...payload }, (response) => {
      if (!response?.ok) reject(new Error(response?.error || 'A extensão não respondeu.'))
      else resolve(response.value as T)
    })
  })
}

/** Ponte da interface para o service worker. Não recebe credenciais ou tokens. */
export class ExtensionSessionProvider implements EquatorialProvider {
  async authenticate() {
    const initial = await message<SessionStatus>('facill.extension.status')
    if (initial.authenticated) return
    await message('facill.extension.begin-auth')
    await new Promise<void>((resolve, reject) => {
      const deadline = Date.now() + 10 * 60_000
      const probe = async () => {
        try {
          if ((await message<SessionStatus>('facill.extension.status')).authenticated) return resolve()
          if (Date.now() >= deadline) return reject(new Error('A autenticação não foi concluída a tempo.'))
          window.setTimeout(probe, 1_000)
        } catch (error) { reject(error) }
      }
      void probe()
    })
  }
  async listAccounts(): Promise<readonly Account[]> { return message<readonly Account[]>('facill.extension.accounts') }
  async listInvoices(accountId: string): Promise<readonly Invoice[]> {
    return message<readonly Invoice[]>('facill.extension.invoices', { accountId })
  }
  async openInvoice(invoiceId: string): Promise<InvoiceDocument> {
    return message<InvoiceDocument>('facill.extension.invoice-pdf', { invoiceId })
  }
  dispose() { void message('facill.extension.end-session').catch(() => undefined) }
}
