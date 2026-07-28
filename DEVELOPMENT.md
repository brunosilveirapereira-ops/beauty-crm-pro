# Beauty CRM Pro — Regras de Desenvolvimento

## Filosofia
- Arquitetura primeiro.
- Funcionalidade depois.
- UX e melhorias visuais na fase apropriada.
- Evitar duplicação.
- Preferir uma única fonte de verdade.
- Refatorar cedo quando isso melhora claramente a manutenção futura.

## Fluxo de desenvolvimento
Cada tarefa deve seguir esta ordem:

1. Implementação.
2. Build.
3. Explicação clara das alterações.
4. Teste manual quando aplicável.
5. Aguardar aprovação.
6. Apenas após aprovação:
   - Commit.
   - Push.

Nunca fazer commit ou push automaticamente.

## Escopo
- Cada tarefa deve alterar apenas o módulo solicitado.
- Não alterar módulos relacionados sem autorização.
- Não aproveitar uma tarefa para fazer melhorias fora do escopo.
- Quando surgir uma melhoria útil fora do escopo, apenas registá-la e pedir autorização.

## Build
- O build deve passar sem erros antes da aprovação.
- Corrigir apenas erros relacionados com a tarefa atual.
- Não esconder erros nem ignorar verificações para fazer o build passar.

## Testes
Sempre que possível:
- executar build;
- realizar teste manual;
- confirmar que o comportamento anterior continua funcional;
- validar casos de erro importantes.

## Git
- Commits pequenos e focados.
- Uma alteração lógica por commit.
- Mensagens de commit claras e descritivas.
- Não versionar ficheiros temporários, caches ou artefactos de build.
- Nunca misturar duas tarefas diferentes no mesmo commit.

## Arquitetura
Preferir:
- Server Actions para operações sensíveis;
- isolamento multi-tenant por salon_id;
- resolução centralizada através de getCurrentContext();
- código reutilizável;
- funções pequenas e específicas;
- separação entre infraestrutura, dados e interface;
- compatibilidade com o modo local quando esse modo fizer parte do fluxo existente.

## Segurança multi-tenant
- Nunca confiar num salon_id enviado pelo browser.
- Resolver o salão no servidor através da sessão autenticada.
- Queries de leitura, atualização e eliminação devem ser filtradas por salon_id.
- Nunca operar apenas por id quando o registo pertence a um salão.
- Se não existir contexto válido, a operação deve ser interrompida com erro claro.

## Dependências entre módulos

Durante a migração multi-tenant:

- Não resolver dependências de módulos que ainda não estão a ser migrados.
- Registar essas dependências para serem tratadas quando o respetivo módulo entrar em migração.
- Evitar criar soluções temporárias entre módulos.
- Cada módulo deve ficar completo e consistente antes de iniciar alterações noutro módulo.

## Roadmap
- Novas ideias não interrompem a fase atual.
- Devem ser registadas para implementação futura.
- Primeiro concluir os módulos essenciais.
- Depois melhorar UX, automações, relatórios e funcionalidades avançadas.

## Arquitetura futura
Estas funcionalidades já estão decididas, mas serão implementadas na fase adequada:

- Dashboard Inteligente.
- Cartões clicáveis.
- Painéis laterais (drawer).
- Seletor de salão para empresas com múltiplos salões.
- Pesquisa global.
- Pesquisa de clientes por nome, telefone/WhatsApp e Instagram.
- Melhorias de UX após conclusão dos módulos principais.

## Definição de tarefa concluída
Uma tarefa só é considerada concluída quando:
- o escopo foi respeitado;
- o build passou;
- os testes aplicáveis passaram;
- as alterações foram explicadas;
- houve aprovação;
- foi feito commit;
- foi feito push.

## Objetivo do projeto
Construir um SaaS moderno, seguro, escalável, limpo e fácil de manter para empresas e salões de beleza.
