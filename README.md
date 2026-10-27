# Fácill Autoatendimento

Totem touch-first para uma pessoa consultar e imprimir a própria fatura da Equatorial Pará. Este é um produto independente e não é um canal oficial da Equatorial.

## Estado atual

O produto é uma extensão local Chrome/Edge para o computador do totem. A jornada é: painel Fácill → autenticação legítima no portal Equatorial → conta → fatura → visualização do PDF → impressão → descarte da sessão. Não há backend, analytics, armazenamento de PDF ou contas Fácill.

A extensão aplica um tema local Fácill à página Equatorial, mas não altera CAPTCHA, OTP, valores, mensagens de segurança ou requisições do portal. O cliente resolve qualquer desafio de autenticação diretamente no portal legítimo.

## Executar

Requer Node.js 18+ e npm. As versões de ferramentas estão fixadas para manter compatibilidade com Node 22.1.

```bash
npm install
npm run build
```

Verificações previstas:

```bash
npm run lint
npm run test
npm run build
npm run build
```

Para instalar no totem, execute `npm run build`, abra `chrome://extensions` (ou `edge://extensions`), ative o modo de desenvolvedor e carregue a pasta `dist/` sem compactação. Clique no ícone Fácill para abrir o painel.

## Limites importantes

- A consulta depende da sessão legítima do portal Equatorial no mesmo perfil do navegador. Ela ainda requer validação manual com conta autorizada no equipamento final.
- O botão de impressão solicita o diálogo nativo do PDF; ele não confirma que o papel foi impresso.
- A extensão usa rotas observadas no fluxo do portal. Mudanças no portal, CORS, sessão, CAPTCHA ou proteção antifraude podem impedir a operação. Consulte [VIABILIDADE.md](docs/VIABILIDADE.md).
- A implantação depende de configurar Chrome/Edge e o sistema operacional para modo quiosque. Consulte [OPERACAO-TOTEM.md](docs/OPERACAO-TOTEM.md).

## Estrutura

- `src/providers/`: contrato da consulta e ponte entre painel e extensão.
- `src/session/`: descarte e temporizador da sessão.
- `src/App.tsx`: fluxo de atendimento touch-first.
- `docs/`: decisões, segurança, operação e plano de testes.
