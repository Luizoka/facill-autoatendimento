# AGENTS.md — Fácill Autoatendimento

## Missão
Desenvolver um aplicativo de autoatendimento para um computador com tela touchscreen na loja da Fácill, permitindo que o próprio cliente consulte e imprima sua fatura da Equatorial Energia.

**Produto separado do BODEE**: este projeto NÃO é a extensão BODEE, não é um fork a ser publicado como BODEE e não deve alterar o repositório original. O repositório de referência é https://github.com/Luizoka/fatura-sync (privado; requer autorização de acesso). Reaproveite conceitos comprovados, não código indiscriminadamente.

## Contexto e princípios
- Operação assistida por interface simples e sensível ao toque, sem teclado obrigatório se houver teclado virtual.
- MVP sem banco de dados, contas próprias, painel de clientes, processamento em lote, scheduler ou armazenamento histórico.
- Uma sessão temporária de atendimento por vez; um cliente jamais deve enxergar dados ou artefatos do anterior.
- Saída principal: visualização de PDF e impressão na impressora local. Download não é prioridade e deve ficar desabilitado no quiosque, salvo necessidade comprovada.
- Marca da Fácill em primeiro plano, com texto claro: serviço independente, não é canal oficial da Equatorial.
- Primeira distribuidora: Equatorial Pará, com outras unidades federativas apenas após validação técnica e autorização.
- Não presumir que endpoints internos sejam uma API pública estável ou licenciada para integração.

## BODEE como referência técnica
Leia antes de implementar:
1. README.md do repositório de referência.
2. docs/chrome-extension.md e código em extension/.
3. Contratos e testes de autenticação, sessão e consulta de faturas.
4. docs/privacy-policy.md e comportamento de limpeza de dados.

Fatos conhecidos na inspeção de 27/10/2026:
- BODEE é extensão Chrome Manifest V3, versão 1.0.11 no manifest consultado.
- Usa permissões de scripting, downloads, storage e alarms, além de domínios Equatorial configurados em host_permissions.
- O repositório contém POCs Node/Playwright e API experimental, mas elas não compõem o fluxo principal da extensão.
- Portal pode exigir OTP/reCAPTCHA/Transmit Security e impor HTTP 403 conforme o ambiente.
- A arquitetura da extensão opera junto à sessão do navegador; isso NÃO comprova viabilidade de fetch de um domínio Fácill para domínios Equatorial.

## Estratégia obrigatória de viabilidade
Antes de implementar a integração:
- Investigue CORS, cookies SameSite/HttpOnly, CSRF, token JWT, origem, sessão, expiracão e requisitos do próprio portal, sem registrar credenciais ou tokens.
- Faça uma matriz de possibilidades: (A) navegação normal ao portal em navegador controlado; (B) interface Fácill com extensão/integração local própria para quiosque, caso permissões e manutenção permitam; (C) integração formal/autorizada, quando existir.
- Um site estático simples hospedado em outro domínio não deve ser apresentado como capaz de acessar endpoints autenticados só porque o BODEE consegue operar como extensão.
- Priorize uso do próprio fluxo autorizado do portal. Não contorne CAPTCHA, OTP, anti-bot, proteções de origem, 403 ou mecanismos antifraude; exiba instruções e alternativa de atendimento humano quando houver bloqueio.
- Se integração direta não for viável, documente a limitação e implemente a melhor alternativa viável, separando UI demonstrável de integração real.

## Arquitetura sugerida (ajustável com evidências)
- Frontend React + Vite + TypeScript, componentes acessíveis e interface touch-first.
- Adapter `EquatorialProvider` para isolar login/consulta/PDF/impressão da interface.
- `MockProvider` com faturas fictícias para desenvolver/testar sem consultar clientes reais.
- Um serviço local opcional para intermediar recursos estritamente locais (ex.: impressão ou reset do quiosque), somente se a impressão nativa e o navegador forem insuficientes.
- Chromium/Chrome em modo quiosque sob perfil dedicado, sujeito a testes de políticas corporativas e limites de API do navegador.
- Nenhum backend de cloud ou banco por padrão; exigir justificativa técnica escrita para qualquer componente extra.
- Não utilizar service worker de PWA para cachear páginas autenticadas ou PDFs.

## Telas do MVP
1. Boas-vindas: marca Fácill, ação grande "Consultar minha fatura", instrução de privacidade e aviso de independência.
2. Início de atendimento: região/distribuidora se necessário; mostrar a forma de autenticação real suportada pelo portal.
3. Autenticação: requisitos definidos após inspeção, OTP/CAPTCHA sempre resolvidos diretamente pelo usuário no fluxo legítimo.
4. Seleção da unidade consumidora/conta contrato quando aplicável.
5. Lista de faturas disponíveis e seleção por competência, com estados de carregamento e erro amigáveis.
6. Visualização do PDF, botão "Imprimir", opção de voltar e encerrar.
7. Encerramento: confirmação de descarte dos dados da sessão e retorno à tela inicial.
8. Telas de contingência: indisponibilidade do portal, bloqueio, ausência de fatura e falha da impressora.

## Segurança e privacidade — inegociável
- Nunca gravar CPF/CNPJ, data de nascimento, código OTP, cookies, JWT, PDF ou número completo de conta em analytics, localStorage, sessionStorage, logs, URLs ou erros.
- Se o portal usar cookies de sessão, isolar e descartar contexto/perfil; limpar também memória da UI, blobs, object URLs, cache de PDF, downloads, clipboard quando sob controle do aplicativo, formulários e histórico de navegação acessível.
- Preferir criar contexto/sessão efêmera por atendimento e reiniciá-la após encerramento/inatividade. Limpeza apenas de estado React NÃO é suficiente para garantir isolamento.
- Nunca registrar dados de cliente em capturas de tela automatizadas ou relatórios de testes.
- Não incorporar páginas de login em iframes se bloqueadas por X-Frame-Options/CSP; não tentar contornar.
- Exibir aviso de tratamento de dados e disponibilizar política de privacidade compatível com a operação real e LGPD.
- Acesso físico à máquina: restringir barra de endereço, atalhos, gerenciador de downloads, impressão para PDF, configurações e saída do modo quiosque; validar a política no SO/navegador e limitar acesso administrativo.
- Garantir que arquivos enviados para fila/spool de impressão não fiquem expostos ao usuário seguinte; testar configurações e limpeza da fila local. O aplicativo não deve alegar poder apagar cópias já impressas ou registros fora de seu controle.
- HTTPS se houver hospedagem remota; proibir segredos incorporados no bundle frontend.

## UX touch-first
- Alvos de toque generosos, tipografia legível, contraste adequado, feedback explícito após toque, navegação linear.
- Não pedir ao cliente para digitar dados desnecessários.
- Temporizador de inatividade configurável (proposta inicial: 90 s), com aviso e possibilidade de continuar antes de limpar a sessão; confirmar tempo em testes de uso.
- Botão "Encerrar atendimento" sempre acessível.
- Nunca mostrar dados reais em modo demonstração.
- Mensagens de erro sem códigos internos sensíveis; contato com atendente quando necessário.

## Impressão
- Testar `window.print()` no ambiente final com uma impressora real, tamanho A4, orientação/redução corretas e preview controlado.
- Impressão silenciosa/kiosk printing depende de versão, SO, políticas e configuração; não presumir suporte universal.
- Não enviar PDFs a serviço de impressão de terceiros sem necessidade e consentimento.
- Tratar papel ausente, impressora offline, impressão cancelada, clique duplo e reimpressões.
- Documentar os limites de confirmação: o navegador pode informar que o diálogo foi acionado, não necessariamente que o papel saiu.

## Qualidade
- TypeScript strict, módulos pequenos, validação de entradas, separação UI/provider/impressão/sessão.
- Testes unitários do estado de atendimento, timeout, limpeza, falha e proteção contra sessão anterior.
- Testes E2E com mocks de autenticação, lista de faturas, PDF e impressão.
- Testes reais só com contas autorizadas e execução manual explícita; nunca em CI.
- Não usar scraping invasivo, bypass de segurança, endpoints não autorizados ou repetição agressiva.
- Documentar decisões técnicas, riscos e critérios de aceitação.

## Fluxo de trabalho do agente
1. Inspecionar o repositório local e o BODEE de referência com acesso legítimo.
2. Produzir `docs/VIABILIDADE.md`: mapa do fluxo e decisão fundamentada da arquitetura.
3. Criar aplicação com `MockProvider`, interface touch-first, simulação do PDF e impressão.
4. Implementar `SessionManager` e reset completo, testados.
5. Implementar integração real somente se houver caminho viável e autorizado.
6. Testar em Windows 10/11 + Chrome/Edge, PC touchscreen e impressora alvo, registrando versão/configuração.
7. Atualizar `README.md`, `docs/OPERACAO-TOTEM.md`, `docs/SEGURANCA.md`, `docs/TESTES.md` e `docs/VIABILIDADE.md`.
8. Relatar claramente o que é mock, funcional em teste local, funcional em equipamento real e ainda pendente.

## Definição de pronto do MVP
- Consegue executar jornada completa com dados fictícios sem internet Equatorial.
- Interface navegável só por toque.
- Fluxo de sessão expira e reinicia sem reapresentar dados anteriores.
- Tela de PDF pode imprimir em teste controlado.
- Integração real não é divulgada como pronta antes de teste e validação do portal.
- Operação física protege sessão, dados, navegador e impressora para próximo cliente.
- Documentação permite a um operador reiniciar, atualizar e solucionar falhas básicas.

## Limites de escopo
Não criar neste MVP: cadastro/login da Fácill, CRM, banco de clientes, armazenamento de PDFs, busca em lote, cobrança, WhatsApp, app mobile, dashboard ou sincronização periódica. Qualquer proposta de expansão deve ser registrada à parte.
