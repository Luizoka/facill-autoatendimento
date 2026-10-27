# Testes do MVP

## Automatizados

`npm run test` executa os testes do `SessionManager`, cobrindo expiração por inatividade e descarte do provider anterior. Os testes não acessam portal, impressora ou dados reais. A cópia de referência `fatura-sync/` é ignorada pelo Git e excluída da execução deste projeto.

## Checklist manual local

- Instalar `dist/` como extensão local e abrir o painel Fácill.
- Conferir o tema Fácill na página de autenticação sem ocultar identidade, CAPTCHA, OTP ou avisos da Equatorial.
- Com conta explicitamente autorizada e execução manual, autenticar, consultar uma conta, abrir uma segunda via e imprimir em A4.
- Navegação por toque/clique, inclusive volta e encerramento em todas as telas.
- Encerrar e iniciar outro atendimento: nenhuma conta, fatura ou documento anterior aparece.
- Esperar 90 segundos: sessão retorna ao encerramento e descarta o estado.
- Acionar impressão: diálogo do navegador abre o PDF autorizado e o layout A4 é legível.

## Obrigatório antes da produção

Registrar, fora de dados de clientes: versão do Windows, navegador, driver/modelo da impressora, resolução da tela e políticas de modo quiosque. Validar papel ausente, impressora offline, cancelamento, clique repetido e fila/spool sem exposição ao cliente seguinte.

Testes com contas reais exigem autorização explícita e execução manual; nunca devem ir para CI.
