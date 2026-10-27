import { useEffect, useMemo, useRef, useState } from 'react'
import type { Account, EquatorialProvider, Invoice, InvoiceDocument } from './domain/types'
import { ExtensionSessionProvider } from './providers/ExtensionSessionProvider'
import { SessionManager } from './session/SessionManager'

type Screen = 'welcome' | 'authentication' | 'accounts' | 'invoices' | 'document' | 'ended'
const labels: Record<Screen, string> = {
  welcome: 'Início', authentication: 'Confirmação', accounts: 'Conta', invoices: 'Faturas', document: 'Visualização', ended: 'Encerramento',
}

export function App() {
  const [screen, setScreen] = useState<Screen>('welcome')
  const [accounts, setAccounts] = useState<readonly Account[]>([])
  const [invoices, setInvoices] = useState<readonly Invoice[]>([])
  const [selectedAccount, setSelectedAccount] = useState<Account>()
  const [document, setDocument] = useState<InvoiceDocument>()
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<string>()
  const provider = useRef<EquatorialProvider | undefined>(undefined)
  const extensionMode = Boolean(window.chrome?.runtime)
  const session = useMemo(() => new SessionManager(() => end('timeout')), [])

  useEffect(() => {
    const activity = () => session.touch()
    window.addEventListener('pointerdown', activity)
    activity()
    return () => { window.removeEventListener('pointerdown', activity); session.reset(provider.current) }
  }, [session])

  function clearSensitiveState() {
    session.reset(provider.current); provider.current = undefined
    setAccounts([]); setInvoices([]); setSelectedAccount(undefined); setDocument(undefined); setNotice(undefined)
  }
  function end(reason: 'manual' | 'timeout' | 'completed') {
    clearSensitiveState(); setScreen('ended')
    setNotice(reason === 'timeout' ? 'O atendimento foi encerrado por inatividade. Os dados desta sessão foram descartados.' : 'O atendimento foi encerrado. Os dados desta sessão foram descartados.')
  }
  async function start() {
    clearSensitiveState()
    if (!extensionMode) {
      setNotice('Este totem requer a extensão local Fácill instalada no Chrome ou Edge.')
      return
    }
    provider.current = new ExtensionSessionProvider()
    session.touch(); setScreen('authentication'); setNotice(undefined)
  }
  async function authenticate() {
    if (!provider.current) return
    setLoading(true); setNotice(undefined)
    try { await provider.current.authenticate(); setAccounts(await provider.current.listAccounts()); setScreen('accounts') }
    catch { setNotice('Não foi possível continuar. Chame um atendente.') }
    finally { setLoading(false) }
  }
  async function chooseAccount(account: Account) {
    if (!provider.current) return
    setLoading(true); setSelectedAccount(account); setNotice(undefined)
    try { setInvoices(await provider.current.listInvoices(account.id)); setScreen('invoices') }
    catch { setNotice('Não foi possível consultar as faturas. Chame um atendente.') }
    finally { setLoading(false) }
  }
  async function openInvoice(invoice: Invoice) {
    if (!provider.current) return
    setLoading(true); setNotice(undefined)
    try { setDocument(await provider.current.openInvoice(invoice.id)); setScreen('document') }
    catch { setNotice('Não foi possível abrir a fatura. Chame um atendente.') }
    finally { setLoading(false) }
  }
  function printDocument() {
    const preview = window.document.getElementById('invoice-pdf') as HTMLIFrameElement | null
    preview?.contentWindow?.focus()
    preview?.contentWindow?.print()
    setNotice('O diálogo de impressão foi solicitado. Confirme a impressora e retire o papel.')
  }
  const active = !['welcome', 'ended'].includes(screen)

  return <main className="kiosk" aria-busy={loading}>
    <header className="topbar">
      <div className="brand"><span className="brand-mark" aria-hidden="true">F</span><span>Fácill <small>autoatendimento</small></span></div>
      {active && <button className="end-button" onClick={() => end('manual')}>Encerrar atendimento</button>}
    </header>
    <section className="content" aria-live="polite">
      {active && <p className="progress">{labels[screen]}</p>}
      {notice && <div className="notice" role="status">{notice}</div>}
      {loading && <div className="loading">Aguarde um momento…</div>}
      {screen === 'welcome' && <Welcome onStart={start} />}
      {screen === 'authentication' && <Authentication extensionMode={extensionMode} onContinue={authenticate} />}
      {screen === 'accounts' && <Accounts accounts={accounts} onSelect={chooseAccount} />}
      {screen === 'invoices' && <Invoices invoices={invoices} account={selectedAccount} onSelect={openInvoice} onBack={() => setScreen('accounts')} />}
      {screen === 'document' && document && <Document document={document} onPrint={printDocument} onBack={() => setScreen('invoices')} onEnd={() => end('completed')} />}
      {screen === 'ended' && <Ended onHome={() => { setScreen('welcome'); setNotice(undefined) }} />}
    </section>
    <footer>Serviço independente da Equatorial Energia. Seus dados são usados somente durante este atendimento.</footer>
  </main>
}

function Welcome({ onStart }: { onStart(): void }) { return <div className="hero"><p className="eyebrow">Equatorial Pará</p><h1>Consulte e imprima sua fatura</h1><p className="lead">Um atendimento simples, com privacidade e apoio da equipe Fácill.</p><button className="primary" onClick={onStart}>Consultar minha fatura <span>→</span></button><p className="privacy">Ao finalizar ou ficar inativo, este totem descarta os dados do atendimento.</p></div> }
function Authentication({ extensionMode, onContinue }: { extensionMode: boolean; onContinue(): void }) {
  if (!extensionMode) return <div className="panel"><p className="eyebrow">Extensão necessária</p><h1>Prepare o totem</h1><p className="lead">Instale a extensão local Fácill neste navegador para iniciar um atendimento real.</p></div>
  return <div className="panel"><p className="eyebrow">Autenticação oficial</p><h1>Confirme sua identidade</h1><p className="lead">Vamos abrir a página oficial da Equatorial. Após a autenticação, o painel Fácill retornará automaticamente.</p><div className="callout">Digite seus dados somente no portal oficial da Equatorial. Se houver código ou CAPTCHA, conclua-o diretamente lá.</div><button className="primary" onClick={onContinue}>Ir para autenticação oficial <span>→</span></button></div>
}
function Accounts({ accounts, onSelect }: { accounts: readonly Account[]; onSelect(account: Account): void }) { return <div><h1>Escolha uma conta</h1><p className="lead">Selecione a unidade para consultar as faturas disponíveis.</p><div className="choices">{accounts.map((account) => <button className="choice" key={account.id} onClick={() => onSelect(account)}><span><strong>{account.nickname}</strong><small>{account.location}</small></span><b>→</b></button>)}</div></div> }
function Invoices({ invoices, account, onSelect, onBack }: { invoices: readonly Invoice[]; account?: Account; onSelect(invoice: Invoice): void; onBack(): void }) { return <div><button className="back" onClick={onBack}>← Voltar</button><h1>Faturas disponíveis</h1><p className="lead">{account?.nickname}</p>{invoices.length === 0 ? <div className="callout">Não há faturas disponíveis para esta conta.</div> : <div className="choices">{invoices.map((invoice) => <button className="choice invoice" key={invoice.id} onClick={() => onSelect(invoice)}><span><strong>{invoice.competence}</strong><small>Vencimento {invoice.dueDate} · {invoice.status}</small></span><b>{invoice.amount} →</b></button>)}</div>}</div> }
function Document({ document, onPrint, onBack, onEnd }: { document: InvoiceDocument; onPrint(): void; onBack(): void; onEnd(): void }) { return <div><button className="back" onClick={onBack}>← Voltar para faturas</button><h1>Visualização da fatura</h1><article className="document"><div className="document-head">Fácill — segunda via</div><h2>{document.title}</h2><PdfPreview base64={document.pdfBase64} /></article><div className="actions"><button className="primary" onClick={onPrint}>Imprimir fatura</button><button className="secondary" onClick={onEnd}>Concluir atendimento</button></div></div> }
function PdfPreview({ base64 }: { base64: string }) {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    const bytes = Uint8Array.from(atob(base64.replace(/^data:.*?base64,/, '')), (character) => character.charCodeAt(0))
    const nextUrl = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
    setUrl(nextUrl)
    return () => URL.revokeObjectURL(nextUrl)
  }, [base64])
  return url ? <iframe id="invoice-pdf" className="pdf-preview" title="Segunda via da fatura" src={url} /> : <div className="loading">Preparando fatura…</div>
}
function Ended({ onHome }: { onHome(): void }) { return <div className="hero"><p className="eyebrow">Atendimento finalizado</p><h1>Obrigado.</h1><p className="lead">Esta sessão foi descartada. O próximo atendimento começará do zero.</p><button className="primary" onClick={onHome}>Voltar ao início</button></div> }
