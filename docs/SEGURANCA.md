# Segurança e privacidade

## O que o MVP faz

- Mantém somente em memória React as seleções e o PDF da sessão ativa.
- Descarta provider, seleções, PDF e temporizador ao encerrar, concluir ou expirar a sessão (90 s de inatividade).
- Não usa `localStorage`, `sessionStorage`, URLs com dados, analytics, download próprio ou backend.
- Oferece “Encerrar atendimento” durante toda a jornada ativa.

## Limite do frontend

Essa limpeza não substitui o isolamento do navegador em uma integração futura. Cookies `HttpOnly`, cache, histórico, downloads e spool de impressão são controlados pelo navegador/sistema. A máquina final deve usar perfil efêmero/dedicado, modo quiosque e procedimentos de limpeza validados pelo administrador.

## Regras para a integração futura

Não registrar CPF/CNPJ, nascimento, OTP, conta completa, cookies, JWT, PDF ou erros que contenham esses dados. Não embutir segredos no bundle. Não colocar login em iframe quando bloqueado por CSP/X-Frame-Options. Ao existir CAPTCHA, OTP, bloqueio ou 403, o cliente deve concluir o fluxo legítimo ou ser encaminhado ao atendente.

## Política visível ao cliente

O rodapé informa que o serviço é independente e que os dados são usados somente durante o atendimento. Antes de produção, publicar política LGPD que descreva o fluxo realmente aprovado e os contatos da Fácill.
