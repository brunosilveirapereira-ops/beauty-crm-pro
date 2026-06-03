# Configuracao Supabase - Beauty CRM Pro

Este guia liga o Beauty CRM Pro ao Supabase para gravar e ler clientes, servicos e clientes em risco a partir do banco de dados.

## 1. Criar projeto Supabase

1. Aceda a https://supabase.com.
2. Crie um novo projeto.
3. Abra `Project Settings > API`.
4. Copie:
   * `Project URL`
   * `anon public key`

## 2. Configurar variaveis de ambiente

Crie um ficheiro `.env.local` na raiz do projeto:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Use `.env.example` como modelo.

## 3. Criar tabelas

No Supabase:

1. Abra `SQL Editor`.
2. Copie todo o conteudo de `supabase/schema.sql`.
3. Execute o SQL.

O script cria:

* `customers`
* `service_history`
* indices
* triggers de `updated_at`
* trigger para atualizar `customers.last_visit` quando um servico e registado
* politicas RLS para utilizadores autenticados
* dados demo iniciais

O script pode ser executado mais de uma vez.

## 4. Criar utilizador de login

Como as tabelas usam RLS para utilizadores autenticados:

Opcao A, pela app:

1. Abra `/setup-admin`.
2. Crie a password para `brunosilveirapereira@gmail.com`.
3. Se o projeto exigir confirmacao de email, confirme o utilizador manualmente em `Authentication > Users` ou pela caixa de entrada.

Opcao B, pelo Supabase:

1. Abra `Authentication > Users`.
2. Crie um utilizador com email e password.
3. Se o projeto exigir confirmacao de email, confirme o utilizador manualmente ou desative a confirmacao durante testes.

Depois, entre na app pela pagina `/login`.

## 5. Como a app usa Supabase

Quando `.env.local` esta configurado:

* Login usa Supabase Auth.
* Clientes sao lidos de `customers`.
* Cadastro de clientes grava em `customers`.
* Servicos sao lidos de `service_history`.
* Historico de servicos grava em `service_history`.
* Clientes em risco sao calculados a partir de `customers.last_visit`.
* Dashboard calcula os indicadores com dados do Supabase.
* `localStorage` nao e usado como fonte principal.

Quando `.env.local` nao esta configurado:

* A app usa dados demo.
* Novos clientes e servicos podem ser testados com `localStorage`.
* Este modo e apenas fallback de desenvolvimento.

## 6. Teste rapido

1. Configure `.env.local`.
2. Execute o SQL em `supabase/schema.sql`.
3. Crie um utilizador em `Authentication > Users`.
4. Inicie a app.
5. Entre em `/login`.
6. Crie uma cliente em `/clientes`.
7. Verifique no Supabase se apareceu em `Table Editor > customers`.
8. Crie um servico em `/servicos`.
9. Verifique se apareceu em `service_history`.
10. Confirme que `last_visit` da cliente foi atualizado.

## 7. Regras de clientes em risco

A app considera cliente em risco quando `last_visit` tem mais de 60 dias.

Indicadores:

* 60 a 89 dias: Medio Risco
* 90 a 119 dias: Alto Risco
* 120+ dias: Critico

Os dados exibidos em `Clientes em Risco` sao calculados a partir de:

* `customers`
* `service_history`

## 8. Desenvolvimento sem login

Quando `DEV_MODE=true`, a app ignora o login no middleware. Nesse modo, as chamadas ao Supabase chegam com a role `anon`.

As policies principais de `supabase/schema.sql` permitem escrita apenas para `authenticated`. Portanto, durante desenvolvimento sem login, execute tambem:

```sql
-- conteudo de supabase/dev-policies.sql
```

Antes de producao, remova essas policies executando:

```sql
-- conteudo de supabase/remove-dev-policies.sql
```
