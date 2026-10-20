# Configurar o Supabase

## Primeiro acesso

Abra https://supabase.com/dashboard/sign-up e conclua o cadastro pessoalmente. Você pode usar a opção Continue with GitHub ou cadastrar e-mail e senha. Confirme o e-mail se o serviço solicitar. Senhas e aceite dos termos ficam com você, fora do chat.

Se o painel pedir uma organização, crie uma organização pessoal no plano Free. Em seguida crie um projeto chamado Acervo Musical nessa organização, também no plano Free. Prefira a região South America (São Paulo), se estiver disponível. Defina e guarde a senha do banco privadamente; ela não é a senha de entrada do seu site. Aguarde o projeto ficar pronto.

O plano Free atende à primeira configuração. Ele tem limites de uso e pode pausar projetos após uma semana de inatividade. Referências oficiais: https://supabase.com/pricing e https://supabase.com/docs/guides/platform/regions.

## Banco e conta de administração

1. Crie um projeto em https://supabase.com/dashboard na sua própria conta.
2. No SQL Editor, execute supabase/migrations/202610200001_archive.sql.
3. Em Authentication, desative a opção de permitir novos cadastros. Não há cadastro no site.
4. Crie seu usuário em Authentication → Users, com e-mail e senha definidos privadamente no painel. Anote o UUID exibido.
5. No SQL Editor, cadastre esse UUID em private.app_admin nas colunas singleton=true e user_id. Essa tabela admite uma única conta. Nunca conceda acesso a essa tabela às funções anon ou authenticated.
6. Em Authentication → URL Configuration, configure a URL pública final do GitHub Pages como Site URL e endereço de retorno permitido. O site usa login por senha.
7. Copie a URL do projeto e a chave publishable (ou a chave anon pública compatível) para VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no .env.local para uso local ou nas variáveis do repositório para publicação.
8. Execute npm run dev e entre em Administração. Somente a conta cadastrada no banco pode alterar o acervo.

Para registrar a conta do passo 5, substitua o UUID abaixo pelo identificador da sua conta em Authentication → Users e execute no SQL Editor:

```sql
insert into private.app_admin (singleton, user_id)
values (true, 'COLE_AQUI_O_UUID_DO_USUARIO'::uuid)
on conflict (singleton) do update set user_id = excluded.user_id;
```

O UUID precisa ser da conta que você criou para entrar na administração do site. O login no painel Supabase e o login do site são contas distintas.

Neste repositório, a URL do site é https://sampaioroberto.github.io/acervo-musical/. Use esse endereço em Site URL e Redirect URLs. A rota administrativa é https://sampaioroberto.github.io/acervo-musical/#/admin.

## Conectar ao GitHub Pages

Na página do projeto, abra Connect e copie Project URL e a chave Publishable. Também podem aparecer em Project Settings → API Keys. Somente esses dois parâmetros públicos precisam ser transferidos para as variáveis do repositório:

- VITE_SUPABASE_URL: Project URL.
- VITE_SUPABASE_PUBLISHABLE_KEY: chave Publishable.
- VITE_BASE_PATH: /acervo-musical/.
- VITE_DEMO: false, depois que os dois parâmetros anteriores estiverem configurados.

Acione Publish GitHub Pages pela aba Actions após alterar as variáveis. Enquanto a demonstração estiver ativa, ela mostra exemplos autorais e não publica uploads no acervo compartilhado.

Nunca coloque senha, chave secret/service_role ou credencial do banco no frontend, em commits, nas variáveis VITE_ ou no chat. Somente a URL e a chave pública precisam entrar no pacote estático. As políticas do banco e do Storage controlam o acesso.

## Ambiente local de desenvolvimento

Requer Docker em execução. npm run backend:start inicia somente os serviços necessários em portas 55321/55322, com project_id acervo-musical-local. É uma cópia local de teste, sem conexão à produção. Aplique a migração com o Supabase CLI local antes de executar npm run test:integration. O runner recusa endereços externos e mantém as chaves locais em memória.

Não execute reset de banco em produção. Para conferir o esquema local, use supabase gen types typescript --local --schema public. O bucket originals é privado e aceita arquivos de até 10 MiB. O limite de 20 arquivos por lote é controlado pela aplicação.
