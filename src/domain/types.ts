export type Account = { id: string; nickname: string; location: string }
export type Invoice = { id: string; competence: string; dueDate: string; amount: string; status: 'Em aberto' | 'Paga' }
export type InvoiceDocument = { title: string; pdfBase64: string }

export interface EquatorialProvider {
  authenticate(): Promise<void>
  listAccounts(): Promise<readonly Account[]>
  listInvoices(accountId: string): Promise<readonly Invoice[]>
  openInvoice(invoiceId: string): Promise<InvoiceDocument>
  dispose(): void
}
