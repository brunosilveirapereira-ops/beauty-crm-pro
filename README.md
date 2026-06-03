# Beauty CRM Pro

MVP em Next.js, Supabase e Tailwind CSS para donos de salao acompanharem clientes, historico de servicos e recuperacao por WhatsApp.

## Funcionalidades

- Login com Supabase Auth.
- Dashboard com total de clientes, clientes em risco, aniversarios do mes e faturacao mensal.
- Cadastro de clientes com contacto, Instagram, nascimento, ultima visita e observacoes.
- CRUD completo de clientes: criar, listar, editar e apagar.
- Historico de servicos com cliente, data, servico, profissional, valor, formula/produtos e observacoes.
- Pagina de clientes em risco, considerando quem nao visita ha mais de 60 dias.
- Botao de WhatsApp com mensagem pronta para recuperar cliente.

## Configuracao

1. Instale dependencias:

```bash
npm install
```

2. Crie `.env.local` com as chaves do Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

3. No Supabase, execute o SQL em `supabase/schema.sql`.

4. Rode o app:

```bash
npm run dev
```

O app usa dados de demonstracao quando as chaves Supabase ainda nao estao configuradas.

Depois de criar ou alterar `.env.local`, reinicie o servidor de desenvolvimento para o Next.js carregar as variaveis.

No Dashboard, o indicador deve mostrar `Supabase conectado`. Se mostrar `Modo local`, a app nao esta a ler as variaveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Supabase

Para configurar o banco, autenticação e teste ponta a ponta, siga [SUPABASE_SETUP.md](./SUPABASE_SETUP.md).
