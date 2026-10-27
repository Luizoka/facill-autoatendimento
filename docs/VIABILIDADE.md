# Viabilidade da integração Equatorial

Data: 27/10/2026. Esta análise sustenta apenas o MVP mockado; não comprova nem habilita integração real.

## Evidência disponível

Em 27/10/2026, o BODEE foi inspecionado em uma cópia temporária de leitura autorizada. A extensão Manifest V3 opera no portal já autenticado: ela usa `chrome.scripting` para executar operações no contexto principal da página e consulta as faturas nos domínios Equatorial declarados em `host_permissions`. O JWT é usado somente em memória na operação necessária e não é persistido ou mostrado na interface.

O BODEE **não é um cliente de login**: sua documentação de privacidade diz que não solicita CPF, nascimento ou senha e que não realiza login. Há POCs Node/Playwright no repositório de referência, mas o próprio README as descreve como experimentais e fora do bundle principal. Elas não constituem uma API pública, estável ou autorizada para este produto.

Ainda precisam de teste manual com conta autorizada: política CORS e de origem no ambiente final, expiração da sessão, OTP/CAPTCHA/Transmit Security, respostas 403 e comportamento de cookies `SameSite`/`HttpOnly`. Nenhum segredo, token, CPF, OTP ou sessão pode ser registrado durante a avaliação.

## Matriz de alternativas

| Opção | Descrição | Situação | Riscos e decisão |
| --- | --- | --- | --- |
| A. Portal em sessão efêmera | Abrir o fluxo autorizado da Equatorial em um perfil dedicado de navegador e deixar o cliente concluir autenticação e desafios. | Necessário para autenticação interativa; teste presencial pendente. | A extensão pode detectar a sessão e retornar automaticamente ao painel, mas não pode transformar CAPTCHA/OTP em elementos da Fácill. Não usar iframe se o portal bloquear framing. |
| B. Integração local/extensão do quiosque | Dashboard Fácill como página da extensão, com service worker MV3 executando operações na aba Equatorial autenticada. | Viável como POC; validação real manual pendente. | É a única opção que reproduz o modelo do BODEE sem backend. Exige permissões explícitas, perfil de navegador efêmero e revisão a cada mudança do portal. |
| C. Integração formal | API, parceria ou canal documentado e autorizado pela distribuidora. | Não identificada. | Maior previsibilidade e governança. É a opção recomendada para integração programática, caso exista. |

## Arquitetura adotada no MVP

O painel React usa o contrato `EquatorialProvider` e só funciona dentro da extensão local do totem. A extensão abre o portal oficial para o login, aplica CSS local de acessibilidade/identidade Fácill e, depois de uma sessão legítima, realiza as operações de conta, fatura e segunda via no contexto autorizado do navegador.

Não existe backend Fácill. Credenciais, cookies, JWT e PDF não são persistidos, enviados à Fácill nem registrados em logs. O JWT é mantido apenas durante a chamada necessária pelo service worker e o PDF vive em memória da interface até impressão ou encerramento.

## Critérios antes de ativar integração real

1. Acesso legítimo ao portal e permissão expressa para o caso de uso.
2. Teste manual com conta autorizada, sem capturas ou logs de informações pessoais.
3. Confirmação de que não há bypass de CAPTCHA, OTP, anti-bot, origem ou 403.
4. Validação de isolamento: novo perfil/contexto de navegador para cada cliente e descarte também de cookies, cache, downloads e histórico acessível.
5. Teste presencial de impressão e recuperação de indisponibilidade, falta de papel e cancelamento.

Até esses critérios serem atendidos, comunicar ao operador que a extensão foi construída, mas a operação real ainda não foi homologada no equipamento final.

## Requisito de experiência contínua

Uma página React hospedada no domínio da Fácill não pode estilizar, ler ou usar a sessão de uma página Equatorial em iframe: a política de mesma origem impede isso, e o portal pode ainda bloquear framing por CSP ou `X-Frame-Options`. Uma sobreposição visual não muda essa limitação e não deve ocultar a origem da autenticação.

O melhor fluxo contínuo tecnicamente possível hoje é: painel Fácill (página da extensão) → abertura automática da autenticação oficial no mesmo navegador de quiosque → extensão detecta sessão válida → retorno automático ao painel Fácill. O cliente não alterna abas manualmente, mas verá a página oficial se o portal exigir CPF, data, OTP ou CAPTCHA. A alternativa de manter o login sempre com visual Fácill requer integração formal ou uma página de login explicitamente incorporável e autorizada pela Equatorial.
