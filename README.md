# Louvores Cora

Site para organizar letras e cifras e gerar PDFs para impressão. Os visitantes não precisam de login. Uma única conta administrativa cuida das importações, revisões, rascunhos, publicações e exclusões.

## Funcionalidades

- Busca por título e artista, com seleção e ordenação de uma ou mais músicas.
- Letras: até quatro por folha A4 vertical, com até duas em cada coluna. A quinta inicia outra folha. Noto Sans, Noto Serif ou Noto Sans Mono; fonte de 9 a 16 pontos, manual ou automática, com bloqueio quando não cabe.
- Cifras: cada música começa em uma nova página, com espaços preservados e fonte monoespaçada. Uma cifra longa pode ocupar mais páginas.
- Prévia do próprio PDF e download no navegador.
- Upload múltiplo DOCX/PDF: até 20 arquivos de 10 MiB, com revisão editável e publicação explícita. PDFs de cifras são separados por página, com sugestão de continuação e opções para juntar ou separar antes de salvar; cada música guarda apenas as páginas de origem correspondentes.
- Consulta pública por Visualizar letra ou Visualizar cifra, sem precisar selecionar músicas ou gerar PDF.
- Cadastro manual de letras e cifras, com título em negrito na tela e no PDF. Após publicar, o formulário é limpo para a próxima música.
- Na revisão, remova músicas individuais do lote ou marque todos os itens completos como revisados antes de publicar. Os formulários pedem apenas título, tipo e conteúdo; a busca pública encontra títulos e trechos, sem distinguir maiúsculas ou acentos.
- Acervo público no Supabase com rascunhos e arquivos originais privados. As regras do banco autorizam apenas a conta administrativa.

## Executar localmente

Use Node 24 ou mais recente e npm. Execute npm ci e depois npm run dev. Sem configuração, o site abre uma demonstração identificada, com oito exemplos autorais e geração de PDFs. A demonstração não aceita uploads nem finge publicar arquivos locais.

Para usar seu próprio acervo, copie .env.example para .env.local e siga [a configuração do Supabase](docs/setup-supabase.md). São necessários apenas a URL e a chave pública no frontend. Reinicie o servidor após configurar.

## Verificações

- npm test -- --run: testes unitários e componentes.
- npm run typecheck: tipos TypeScript.
- npm run build: pacote de produção, exige Supabase configurado.
- VITE_DEMO=true npm run build: pacote explícito de demonstração.
- npm run backend:start: Supabase local para testes, exige Docker em execução.
- npm run test:integration: operações reais de API, autenticação e Storage no Supabase local. Recusa endereços externos.
- npm run test:e2e:setup: prepara dados fictícios e configuração isolada .env.e2e.local para os testes de navegador.
- npm run test:e2e: testes de navegador em /acervo-musical/ na porta 5174. Instale antes o Chromium com npx playwright install chromium, se necessário. O servidor de teste é separado da prévia normal na porta 5173.
- node_modules/.bin/supabase test db: testes SQL de privilégios e RLS.

O ambiente E2E cria apenas uma conta local fictícia, sem valor em produção. Não reutilize as credenciais de teste. Os serviços locais ficam em portas 55321/55322; para encerrar, use node_modules/.bin/supabase stop na pasta deste projeto. Docker não é necessário para visitantes nem para o site publicado.

## Publicar

Siga [as instruções do GitHub Pages](docs/publication.md). O workflow valida o projeto antes de publicar, inclui o caminho-base e recusa uma versão sem conexão ao acervo, exceto quando a demonstração é escolhida explicitamente.

## Limites da importação

Word é lido como texto a partir do XML, sem executar HTML. PDF é reconstruído a partir das posições dos textos selecionáveis. Fontes, imagens, tabelas e layouts complexos dos originais não são copiados fielmente; confira sempre a revisão, especialmente em cifras. Arquivos sem texto útil podem ser cadastrados por colagem manual, sem anexar o original que falhou. Não há OCR, transposição ou divisão automática de várias músicas no mesmo arquivo.

Os arquivos das fontes e a licença OFL acompanham o código em public/fonts/. Veja também a [especificação](docs/superpowers/specs/2026-10-20-acervo-musical-design.md), o [plano](docs/superpowers/plans/2026-10-20-acervo-musical-implementation.md) e o [registro de verificação](docs/verification.md).
