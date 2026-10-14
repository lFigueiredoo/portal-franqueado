# Backend do Portal do Franqueado PHIQ

## Isolamento e estado atual

O Portal deve receber **um projeto Supabase próprio**, preferencialmente na organização PHIQ. O CRM existente não é fonte de conexão nem alvo destas migrations. Nenhum projeto remoto foi criado ou modificado nesta preparação.

As migrations estão em `supabase/migrations/` e devem ser aplicadas apenas após revisão e aprovação do projeto dedicado. A primeira cria o modelo; a segunda configura autorização, views, triggers, buckets e políticas. O código não contém credenciais. A sintaxe SQL foi analisada localmente, mas as migrations ainda precisam ser executadas e testadas em uma instância Supabase local ou no novo projeto. Neste ambiente o Docker não iniciou, então não houve teste transacional/RLS em banco real.

## Modelo de dados e relações

| Domínio | Tabelas | Relações principais |
| --- | --- | --- |
| Identidade | `profiles`, `franchise_units`, `franchise_members`, `naf_assignments` | `profiles.id → auth.users.id`; membros e NAF vinculam usuários a unidades. |
| Conteúdo | `knowledge_categories`, `knowledge_articles`, `knowledge_attachments`, `products`, `product_documents` | Artigos pertencem a categorias; anexos pertencem a artigos; documentos pertencem a produtos. |
| Jornada | `journey_stages`, `journey_requirements`, `franchise_progress`, `progress_history`, `training_modules`, `training_progress` | Requisitos pertencem a etapas; progresso é único por unidade e requisito; histórico registra mudanças. |
| Gamificação | `achievements`, `franchise_achievements`, `coin_transactions` | Conquista atribuída uma vez por unidade; transação ligada à atribuição é única. |
| Comunicação | `announcements`, `events`, `notifications` | Notificação pertence a um usuário; comunicados e eventos têm estado de publicação. |
| Suporte | `support_tickets`, `support_ticket_messages`, `support_ticket_attachments` | Chamado pertence à unidade e solicitante; mensagens e arquivos pertencem ao chamado. |
| Auditoria | `audit_logs` | Triggers registram alterações críticas com ator e dados antes/depois. |

As cinco etapas são semeadas pela migration: Alistamento, Formação, Operação, Autonomia e Excelência. `franchise_journey_summary` calcula o percentual por peso dos requisitos concluídos. `franchise_coin_balances` soma transações persistidas. Ambas as views usam `security_invoker = true` para respeitar RLS.

## Papéis e RLS

O papel fica em `profiles.role`, não em `user_metadata`. Todas as tabelas `public` têm RLS ativada. As funções de autorização ficam no schema não exposto `private`, conferem `auth.uid()` e os vínculos no banco. O cliente usa somente a chave publicável.

| Recurso | Franqueado | NAF | Admin |
| --- | --- | --- | --- |
| Unidade, membros e progresso | Unidades às quais pertence | Unidades atribuídas | Todas |
| Conteúdo da rede | Publicado | Publicado | Leitura e gestão |
| Chamados | Unidade própria; cria e responde | Unidades atribuídas; atualiza status e responde | Todos; atualiza status e responde |
| Mensagens internas | Sem acesso | Unidades atribuídas | Todas |
| Conquistas e moedas | Lê a própria unidade | Lê/atribui nas unidades atribuídas | Gestão e consulta |
| Auditoria | Sem acesso | Sem acesso | Leitura, sem edição |

Políticas de `INSERT` conferem solicitante/autor com `auth.uid()`. Os campos de identidade do chamado são imutáveis após criação. O NAF só pode atribuir chamado a alguém vinculado à unidade. Validações de requisitos exigem o usuário que realiza a ação como validador. Histórico, moedas e mensagens foram modelados como registros append-only para o cliente. Conquistas automáticas simples usam `criteria.requirement_code`; critérios compostos ficam para validação manual até haver motor de regras revisado.

Ao aplicar em banco real, testar pelo menos: franqueado A não consegue ler ou escrever unidade B; NAF A não vê unidade fora de `naf_assignments`; usuário sem perfil ativo é bloqueado pela interface e pelas funções de escopo; anexo privado não é baixado fora do chamado; mensagem interna não aparece ao franqueado; duplicar uma conquista não gera moedas extras. Rodar os advisors de segurança do Supabase depois da aplicação.

## Storage

Todos os buckets são privados:

| Bucket | Caminho | Leitura | Escrita |
| --- | --- | --- | --- |
| `portal-content` | `articles/{article_id}/...`, `products/{product_id}/...` | Conteúdo publicado ou admin | Admin |
| `portal-support` | `{ticket_id}/{uuid}-{file}` | Participantes autorizados do chamado; notas internas só NAF/admin | Participantes autorizados |
| `portal-evidence` | `{unit_id}/...` | Usuários autorizados da unidade | Usuários autorizados da unidade |

Uploads de suporte têm limite de 10 MB no bucket e no serviço. O objeto só fica disponível para download após existir o registro em `support_ticket_attachments`. Em falha entre upload e inserção de metadados, pode haver objeto órfão; uma rotina de limpeza poderá ser adicionada na operação. Não usar URLs públicas para esses arquivos.

## Variáveis e autenticação

Copiar `.env.example` para `.env.local` **somente depois de criar o projeto dedicado**:

- `NEXT_PUBLIC_SUPABASE_URL`: URL do novo projeto do Portal.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: chave publicável do novo projeto.

Para a Edge Function `invite-portal-user`, configurar `PORTAL_ORIGIN` como a origem do frontend. A função usa `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` fornecidas como secrets no ambiente da Function. A chave secreta nunca entra em variáveis `NEXT_PUBLIC_`, no navegador ou no repositório. Para o importador offline, fornecer `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` apenas ao processo de execução.

Fluxo: administrador cria contas por convite via Edge Function; ela valida o token do chamador e `profiles.role = admin`, cria usuário, perfil e vínculos. O usuário aceita convite e entra com e-mail/senha pelo Supabase Auth. A interface consulta o usuário e o perfil ativo; as consultas subsequentes são filtradas por RLS. O primeiro administrador deve ser provisionado manualmente no projeto novo após criar a conta Auth, por operador autorizado, inserindo seu perfil `admin` no SQL Editor. Desativar ou alterar papéis exige operação administrativa auditada.

## Migração do Notion

O Notion permanece a fonte oficial durante a migração, sem chamadas em runtime pelo Portal. Exportar as páginas aprovadas, normalizar para o formato de `scripts/notion-export.example.json` e validar com `node scripts/import-notion.mjs arquivo.json`. Esse comando faz apenas uma prévia. Após revisão e autorização, executar com `--apply` no projeto dedicado; os itens entram como **rascunho**. Revisar formatação, links, arquivos e permissões antes de publicar. Documentos devem ser enviados ao bucket privado e relacionados por metadados de anexos. Repetir a importação por `slug` durante a transição, sem editar o conteúdo no Notion e no Portal ao mesmo tempo.

## Mocks e próximas conexões

Sem variáveis Supabase, a V5 antiga continua disponível como prévia demonstrativa. O formulário de suporte da prévia não salva chamados. Com o projeto dedicado configurado, `ConnectedPortal` usa os repositórios para unidades, artigos, produtos, jornada, moedas, comunicados, eventos, notificações e chamados; dados não cadastrados aparecem vazios, sem inventar registros. O console de gestão de conteúdo e usuários ainda precisa de interface; os serviços e a Function privilegiada estão preparados. Dados históricos do Notion, contas, vínculos, requisitos, recompensas e anexos ainda aguardam migração para o novo projeto. Realtime não foi ativado porque os fluxos atuais funcionam com atualização sob demanda.
