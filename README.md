# Portal do Franqueado PHIQ

Aplicação Next.js com uma prévia local e uma experiência conectada ao projeto Supabase exclusivo do Portal.

## Rodar

```bash
npm install
npm run dev
```

Sem `.env.local`, a interface mostra a prévia visual V5. Ela contém dados demonstrativos; não registra chamados. Para usar dados reais, crie primeiro o projeto Supabase dedicado, aplique as migrations após revisão e preencha `.env.local` a partir de `.env.example` com a URL e a chave **publicável** desse projeto.

```bash
npm run lint
npm run typecheck
npm run build
```

## Estrutura

- `app/page.jsx`: prévia visual sem backend.
- `app/PortalAuth.jsx`, `app/ConnectedPortal.jsx`, `app/SupportWorkspace.jsx`: login e interface conectada.
- `services/`: clientes e repositórios de Auth, conteúdo, jornada, rede, gamificação, suporte, notificações e administração.
- `types/portal.ts`: tipos de domínio para os dados do Portal.
- `supabase/migrations/`: schema, RLS, views, triggers e Storage.
- `supabase/functions/invite-portal-user/`: convite administrativo protegido.
- `scripts/import-notion.mjs`: importação offline e idempotente por `slug`, começando em rascunho.
- `docs/SUPABASE_ARCHITECTURE.md`: modelo, relações, políticas, buckets, variáveis, autenticação, migração e pendências.

Nenhuma migration ou Function foi aplicada a projeto remoto nesta etapa. O Portal não deve usar o projeto Supabase do CRM.
