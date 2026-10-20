# Publicar no GitHub Pages

## Preparar o acervo

Conclua primeiro setup-supabase.md. Use um projeto Supabase da sua conta, crie seu usuário e registre seu UUID como único administrador. Desative o cadastro público e mantenha o provedor de e-mail habilitado para login.

## Preparar o repositório

1. Crie ou escolha o repositório GitHub que receberá o código. O workflow considera main como branch principal; ajuste se o repositório usar outro nome.
2. Em Settings → Pages, selecione GitHub Actions como fonte de publicação. A disponibilidade em repositórios privados depende do plano do GitHub.
3. Em Settings → Secrets and variables → Actions → Variables, configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY com os parâmetros públicos. Chaves secret/service_role não são aceitas pelo build.
4. Configure VITE_BASE_PATH como /nome-do-repositorio/. Para domínio próprio ou um repositório de site raiz, use /.
5. Mantenha VITE_DEMO ausente ou false para usar o acervo real. Para publicar uma demonstração sem upload, deixe os parâmetros Supabase vazios e configure VITE_DEMO=true explicitamente.
6. Envie o código ao branch principal. O workflow Publish GitHub Pages executa testes, cria o pacote dist e publica somente após a aprovação dessas verificações. Também pode ser acionado manualmente pela aba Actions.
7. Abra a URL fornecida pelo job Deploy. No Supabase, confira Site URL e endereços de retorno permitidos para essa URL.

O pacote contém somente arquivos estáticos. O banco, o login e os originais ficam no Supabase; geração e download de PDFs acontecem no navegador.

## Verificação após publicação

Abra a URL em uma janela sem sessão administrativa. Consulte o acervo, selecione quatro letras, altere fonte/tamanho e confira o PDF A4; repita com cifras. Confira que a rota #/admin abre após atualizar a página, que uma conta sem autorização não acessa a administração e que rascunhos não aparecem para visitantes. Teste o site no celular.

Os workflows usam Actions oficiais com versões fixadas por versão principal. Referência: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

Uma compilação local aprovada não comprova publicação. A publicação só está concluída após o workflow retornar sucesso e a URL real funcionar. Até lá, use a prévia local e consulte verification.md para os limites da validação.

