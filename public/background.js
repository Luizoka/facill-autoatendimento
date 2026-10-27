/* global chrome */

// In-memory bridge only: credentials, cookies, tokens and PDFs are never
// persisted or logged by the extension.
const portalOrigin = 'https://pa.equatorialenergia.com.br'
const portalUrl = `${portalOrigin}/siteantigo/`
const invoicePageUrl = `${portalOrigin}/siteantigo/sua-conta/emitir-segunda-via/`
const apiOrigin = 'https://api-pa-cliente.equatorialenergia.com.br'
const sessionKey = 'facill.kiosk.session'

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  void handle(message, sender).then(
    (value) => sendResponse({ ok: true, value }),
    (error) => sendResponse({ ok: false, error: safeError(error) }),
  )
  return true
})

chrome.tabs.onUpdated.addListener((tabId, change) => {
  if (change.status === 'complete') void returnToDashboardWhenAuthenticated(tabId)
})

async function handle(message, sender) {
  if (!message || typeof message.type !== 'string') throw new Error('Mensagem inválida.')
  switch (message.type) {
    case 'facill.extension.status': return status()
    case 'facill.extension.begin-auth': return beginAuthentication(sender.tab?.id)
    case 'facill.extension.accounts': return listAccounts()
    case 'facill.extension.invoices': return listInvoices(requireText(message.accountId))
    case 'facill.extension.invoice-pdf': return openInvoice(requireText(message.invoiceId))
    case 'facill.extension.end-session': return endSession()
    default: throw new Error('Operação não reconhecida.')
  }
}

async function beginAuthentication(dashboardTabId) {
  const tab = await chrome.tabs.create({ url: portalUrl, active: true })
  await chrome.storage.session.set({ [sessionKey]: { portalTabId: tab.id, dashboardTabId } })
  return { started: true }
}

async function currentPortalTab() {
  const stored = await chrome.storage.session.get(sessionKey)
  const session = stored[sessionKey]
  if (!session?.portalTabId) throw new Error('Abra e conclua a autenticação da Equatorial.')
  const tab = await chrome.tabs.get(session.portalTabId)
  if (!tab.url?.startsWith(portalOrigin)) throw new Error('A sessão da Equatorial não está disponível.')
  return { tab, session }
}

async function status() {
  try {
    const { tab } = await currentPortalTab()
    const [{ result }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, world: 'MAIN', func: hasPortalSession })
    return { available: true, authenticated: result === true }
  } catch { return { available: true, authenticated: false } }
}

async function returnToDashboardWhenAuthenticated(tabId) {
  try {
    const { tab, session } = await currentPortalTab()
    if (session.portalTabId !== tabId || !(await status()).authenticated) return
    // The kiosk exposes only second copies. After the official login, continue
    // in the same authenticated Equatorial tab at its own invoice page.
    if (!tab.url?.startsWith(invoicePageUrl)) await chrome.tabs.update(tabId, { url: invoicePageUrl, active: true })
  } catch { /* the dashboard handles an unavailable session safely */ }
}

async function listAccounts() {
  const { tab } = await currentPortalTab()
  const [{ result }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, world: 'MAIN', func: readAccountsFromPortal })
  if (!result?.token || !Array.isArray(result.accounts) || result.accounts.length === 0) throw new Error('Não foi possível identificar contas nesta sessão.')
  return result.accounts.map((account) => ({
    id: String(account.id), nickname: 'Unidade consumidora',
    location: account.city ? String(account.city) : 'Conta disponível para consulta',
  }))
}

async function listInvoices(accountId) {
  const token = await accessToken()
  const url = new URL(`/api/v1/debitos/${encodeURIComponent(accountId)}`, apiOrigin)
  url.searchParams.set('listarEmAberto', 'false')
  const response = await requestFromApiContext(token, url.toString())
  if (response.status === 404) return []
  assertSuccess(response.status)
  const invoices = response.body?.data?.faturas
  if (!Array.isArray(invoices)) throw new Error('A resposta de faturas é inválida.')
  return invoices.filter((invoice) => invoice && invoice.numeroFatura != null && typeof invoice.competencia === 'string').map((invoice) => ({
    id: `${accountId}:${String(invoice.numeroFatura)}`,
    competence: invoice.competencia, dueDate: stringOrFallback(invoice.dataVencimento, 'não informado'),
    amount: stringOrFallback(invoice.valor, 'valor não informado'), status: invoice.dataPagamento ? 'Paga' : 'Em aberto',
  }))
}

async function openInvoice(invoiceId) {
  const separator = invoiceId.indexOf(':')
  const accountId = invoiceId.slice(0, separator)
  const invoiceNumber = invoiceId.slice(separator + 1)
  if (separator < 1 || !invoiceNumber) throw new Error('Fatura inválida.')
  const token = await accessToken()
  const url = new URL(`/api/v1/faturas/segunda-via/${encodeURIComponent(invoiceNumber)}`, apiOrigin)
  url.searchParams.set('contaContrato', accountId)
  const response = await requestFromApiContext(token, url.toString())
  assertSuccess(response.status)
  const pdfBase64 = response.body?.data?.base64
  if (typeof pdfBase64 !== 'string' || !pdfBase64) throw new Error('A Equatorial não retornou um PDF válido.')
  return { title: 'Segunda via da fatura', pdfBase64 }
}

async function accessToken() {
  const { tab } = await currentPortalTab()
  const [{ result }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, world: 'MAIN', func: readAccessToken })
  if (typeof result !== 'string') throw new Error('A sessão expirou. Faça login novamente.')
  return result
}

async function requestFromApiContext(token, requestUrl) {
  let apiTabId
  try {
    const apiTab = await chrome.tabs.create({ url: apiOrigin, active: false })
    if (!apiTab.id) throw new Error('Não foi possível preparar a consulta.')
    apiTabId = apiTab.id
    await waitForTab(apiTabId)
    const [{ result }] = await chrome.scripting.executeScript({ target: { tabId: apiTabId }, world: 'MAIN', func: fetchApiJson, args: [token, requestUrl] })
    return result
  } finally { if (apiTabId) await chrome.tabs.remove(apiTabId).catch(() => undefined) }
}

async function endSession() {
  const stored = await chrome.storage.session.get(sessionKey)
  const session = stored[sessionKey]
  await chrome.storage.session.clear()
  if (session?.portalTabId) await chrome.tabs.remove(session.portalTabId).catch(() => undefined)
  return { ended: true, requiresProfileReset: true }
}

function hasPortalSession() { return Boolean(readAccessToken()) }
function readAccessToken() {
  for (const storage of [window.localStorage, window.sessionStorage]) for (const key of ['access_token', 'accessToken', 'jwt']) {
    const value = storage.getItem(key); if (value && value.split('.').length === 3) return value
  }
  return undefined
}
async function readAccountsFromPortal() {
  const token = readAccessToken(); if (!token) return { accounts: [] }
  try { const cached = JSON.parse(window.localStorage.getItem('contasContrato') || ''); if (Array.isArray(cached) && cached.length) return { token, accounts: normalizeAccounts(cached) } } catch { /* cache optional */ }
  const response = await fetch('/siteantigo/ajax-requests/ajax-uc-contas-contrato/', { headers: { accept: 'application/json', authorization: `Bearer ${token}` }, credentials: 'include' })
  return { token, accounts: response.ok ? normalizeAccounts(await response.json()) : [] }
}
function normalizeAccounts(value) {
  if (!Array.isArray(value)) return []
  return value.map((item) => ({ id: item?.numero ?? item?.Numero ?? item?.contaContrato ?? item?.ContaContrato, city: item?.cidade ?? item?.Cidade })).filter((item) => typeof item.id === 'string' || typeof item.id === 'number')
}
async function fetchApiJson(token, requestUrl) {
  const response = await fetch(requestUrl, { headers: { accept: 'application/json', authorization: `Bearer ${token}` }, credentials: 'include' })
  return { status: response.status, body: await response.json().catch(() => undefined) }
}
function waitForTab(tabId) {
  return new Promise((resolve, reject) => {
    const listener = (updatedId, change) => { if (updatedId === tabId && change.status === 'complete') { clearTimeout(timeout); chrome.tabs.onUpdated.removeListener(listener); resolve() } }
    const timeout = setTimeout(() => { chrome.tabs.onUpdated.removeListener(listener); reject(new Error('A consulta demorou demais.')) }, 15_000)
    chrome.tabs.onUpdated.addListener(listener)
  })
}
function assertSuccess(status) {
  if (status === 401) throw new Error('A sessão expirou. Faça login novamente.')
  if (status === 403) throw new Error('A Equatorial recusou esta sessão. Chame um atendente.')
  if (status === 429) throw new Error('A Equatorial limitou temporariamente as consultas.')
  if (status < 200 || status >= 300) throw new Error('Não foi possível concluir a consulta.')
}
function stringOrFallback(value, fallback) { return typeof value === 'string' || typeof value === 'number' ? String(value) : fallback }
function requireText(value) { if (typeof value !== 'string' || !value.trim()) throw new Error('Identificador inválido.'); return value }
function safeError(error) { return error instanceof Error ? error.message : 'Não foi possível concluir a operação.' }
