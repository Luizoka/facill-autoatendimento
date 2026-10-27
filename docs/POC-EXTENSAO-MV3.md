# POC — painel Fácill + extensão Chrome MV3

Data: 27/10/2026. Objetivo: avaliar o painel Fácill como uma página de extensão, mantendo o navegador do totem sob uma jornada controlada e sem persistir dados do atendimento.

## Resultado da inspeção

| Item | Resultado | Evidência / limite |
| --- | --- | --- |
| Painel Fácill comunica com extensão | Viável | Se o build React for carregado como `chrome-extension://…`, ele usa `chrome.runtime.sendMessage` diretamente com o service worker MV3; não requer ponte por página pública. |
| Detectar sessão autenticada | Viável, com teste manual pendente | O modelo BODEE executa uma função no contexto da aba Equatorial e retorna somente o estado autenticado; token não deve ser exposto ao React. |
| Consultar contas e faturas | Viável somente após autenticação oficial, com teste manual pendente | A extensão possui permissões explícitas para as origens Equatorial e executa a consulta dentro do contexto de sessão. Uma página Fácill comum não teria essas permissões. |
| Login CPF/nascimento dentro de UI Fácill | Não validado e não implementável pela POC | O BODEE não faz login. Quando houver OTP/CAPTCHA/antifraude, o cliente deve interagir com a página oficial; não haverá bypass ou formulário Fácill que capture as credenciais. |
| Experiência visual contínua | Parcialmente viável | A troca para a página oficial pode ser automática e o retorno ao painel também. Não é possível garantir visual Fácill durante uma etapa oficial interativa sem suporte explícito de iframe/integração. |
| Limpeza completa | Requer launcher/perfil efêmero | `chrome.storage.session.clear()` limpa somente estado da extensão; não apaga cookies, cache e storage do portal. Cada atendimento precisa de contexto/perfil de navegador descartável ou logout oficial confirmado. |

## Arquitetura proposta

```text
React/Vite compilado como página da extensão
        │ chrome.runtime.sendMessage
service worker MV3 ── chrome.scripting ── aba Equatorial autenticada
        │                                      │
        ├── estado transitório (session)        └── sessão oficial do portal
        └── impressão local
```

O React nunca recebe CPF, nascimento, OTP, cookie ou JWT. O service worker deve expor apenas operações de alto nível: `sessionStatus`, `listAccounts`, `listInvoices`, `openPdfForPrint` e `endSession`.

## Fluxo de quiosque proposto

1. O painel Fácill cria uma sessão local vazia e mostra as instruções.
2. A extensão abre a URL oficial da Equatorial em modo quiosque; a troca é automática.
3. O cliente conclui somente as etapas exigidas pelo portal oficial.
4. O service worker detecta a sessão válida e abre automaticamente o painel Fácill.
5. O painel consulta contas/faturas através de mensagens para a extensão e apresenta apenas os resultados da sessão atual.
6. A impressão é solicitada localmente; o app não afirma que o papel saiu.
7. O encerramento fecha o contexto efêmero pelo launcher e recria o ambiente para o próximo cliente.

## POC executável antes da integração real

O próximo incremento deve criar uma extensão sem credenciais e sem automação de login, com duas modalidades:

- `mock`: valida React ↔ service worker, estados, timeout, limpeza e impressão com dados fictícios.
- `manual-authorized`: habilita apenas `sessionStatus` e consulta para uma conta de teste autorizada, executada presencialmente. O cliente autentica-se no portal e qualquer OTP/CAPTCHA é resolvido por ele.

Critérios de aprovação manual: não há token/CPF/OTP em DevTools, logs, `chrome.storage`, URL ou downloads; a extensão não consulta antes de uma sessão válida; expiração/encerramento não mostra dados da sessão anterior; perfil descartado não preserva cookies nem cache da Equatorial.

## Bloqueios e alternativas

- Se a Equatorial bloquear a consulta mesmo no contexto do navegador autenticado, não há fallback de `fetch` a partir da Fácill; encaminhar para o portal oficial ou atendimento humano.
- Se um CAPTCHA/OTP aparecer, o fluxo pausa no portal oficial, com uma mensagem Fácill de orientação. Não automatizar, copiar ou ocultar esse desafio.
- Se o Chrome/Windows não permitir perfil descartável por atendimento, não liberar o totem para produção: limpar apenas React ou `chrome.storage` é insuficiente.
- Uma API/parceria formal permitiria UI Fácill integral; sem ela, o portal oficial é inevitável na etapa interativa de autenticação.
