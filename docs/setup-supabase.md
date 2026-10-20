# Configurar o Supabase

1. Crie um projeto em https://supabase.com/dashboard na sua própria conta.
2. No SQL Editor, execute supabase/migrations/202610200001_archive.sql.
3. Em Authentication, desative a opção de permitir novos cadastros. Não há cadastro no site.
4. Crie seu usuário em Authentication → Users, com e-mail e senha definidos privadamente no painel. Anote o UUID exibido.
5. No SQL Editor, cadastre esse UUID em private.app_admin nas colunas singleton=true e user_id. Essa tabela admite uma única conta. Nunca conceda acesso a essa tabela às funções anon ou authenticated.
6. Em Authentication → URL Configuration, configure a URL pública final do GitHub Pages como Site URL e endereço de retorno permitido. O site usa login por senha.
7. Copie a URL do projeto e a chave publishable (ou a chave anon pública compatível) para VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no .env.local para uso local ou nas variáveis do repositório para publicação.
8. Execute npm run dev e entre em Administração. Somente a conta cadastrada no banco pode alterar o acervo.

Nunca coloque senha, chave secret/service_role ou credencial do banco no frontend, em commits, nas variáveis VITE_ ou no chat. Somente a URL e a chave pública precisam entrar no pacote estático. As políticas do banco e do Storage controlam o acesso.

## Ambiente local de desenvolvimento

Requer Docker em execução. npm run backend:start inicia somente os serviços necessários em portas 55321/55322, com project_id acervo-musical-local. É uma cópia local de teste, sem conexão à produção. Aplique a migração com o Supabase CLI local antes de executar npm run test:integration. O runner recusa endereços externos e mantém as chaves locais em memória.

Não execute reset de banco em produção. Para conferir o esquema local, use supabase gen types typescript --local --schema public. O bucket originals é privado e aceita arquivos de até 10 MiB. O limite de 20 arquivos por lote é controlado pela aplicação.

