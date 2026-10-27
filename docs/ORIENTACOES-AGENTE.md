# Instruções de execução para o agente — Fácill Autoatendimento

Você vai iniciar o produto **Fácill Autoatendimento**, um totem touchscreen para um cliente presencial consultar e imprimir a própria fatura da Equatorial. Leia `AGENTS.md` na raiz antes de qualquer modificação.

## Referência
Repositório BODEE: https://github.com/Luizoka/fatura-sync (privado). Examine o README, `extension/`, `docs/chrome-extension.md`, testes e módulos ligados à autenticação, consulta e download. **Não altere o BODEE.** Não copie a aplicação inteira: o novo produto tem finalidade e público diferentes.

## Entrega solicitada
1. Criar a base do novo projeto, com React + Vite + TypeScript (salvo impossibilidade justificada), scripts `dev`, `build`, `lint` e `test`.
2. Implantar design Fácill simples, moderno, acessível e projetado para toque em tela 16:9; criar fluxo inicial, autenticação simulada, seleção de conta, faturas, PDF e impressão.
3. Usar dados fictícios e um `MockProvider` para permitir desenvolvimento sem integração real.
4. Projetar um `EquatorialProvider` com fronteiras claras e sem pressupor que o site Fácill poderá chamar endpoints do portal diretamente.
5. Avaliar e documentar viabilidade de conexão real (CORS, sessão, token, OTP, CAPTCHA, antifraude, cookies, dispositivos). Listar arquitetura recomendada e alternativas, sem contornar mecanismos de proteção.
6. Implementar limpeza de sessão completa com timeout e botão manual. Fazer testes que detectem vazamentos entre atendimentos.
7. Testar impressão e documentar as diferenças entre ambiente de desenvolvimento e computador da loja.
8. Escrever documentação técnica e operacional (viabilidade, segurança, instalação, manutenção e testes).

## Jornada esperada
Iniciar atendimento → autenticar pelo fluxo autorizado → escolher conta contrato, se disponível → escolher fatura → visualizar PDF → imprimir → encerrar → limpar sessão → tela inicial.

## Observações de produto
- Sem backend, sem banco de dados e sem credenciais armazenadas por padrão.
- O cliente precisa apenas da segunda via, não de uma ferramenta de gestão de faturas.
- Não exibir BODEE na interface; usar Fácill Autoatendimento.
- Mostrar aviso de serviço independente da Equatorial.
- Tela deve permanecer segura mesmo após abandono pelo cliente.
- Se impressão silenciosa não for viável, apresentar operação com diálogo padrão e explicar como configurar a máquina.

## Relatório inicial obrigatório
Antes de afirmar que integração real funciona, devolva:
- Comparação das opções técnicas A: portal direto em sessão efêmera, B: extensão local específica para totem, C: integração formal.
- Quais etapas foram verificadas por código e quais ainda exigem teste presencial.
- Riscos de autenticação e bloqueio, incluindo 403 e OTP.
- Arquivos criados, comandos para executar e pendências para colocar o totem em produção.

Implemente imediatamente o mock e a estrutura segura. Não fique bloqueado aguardando conta de teste. Integração real somente mediante comprovação de viabilidade técnica e uso autorizado.
