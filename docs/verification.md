# Verificação da implementação

Data: 20/10/2026. Projeto implementado e verificado localmente e no GitHub Actions. Site publicado e conectado ao Supabase real; conta única de administração provisionada.

## Conexão do acervo real

A migração foi aplicada ao projeto Supabase do usuário pelo SQL Editor, após sua autorização. A consulta de metadados confirmou songs e song_originals com RLS ativo; a tabela privada de configuração administrativa permanece sem privilégios para os clientes, conforme a migração testada. Foi registrada uma única conta administrativa, criada pelo próprio usuário sem compartilhar a senha.

Cadastro público e login anônimo desativados; provedor Email mantido habilitado. Site URL e Redirect URL configurados para https://sampaioroberto.github.io/acervo-musical/. A URL e a chave Publishable foram configuradas nas variáveis do GitHub; VITE_DEMO foi desativado. Nenhuma chave secret/service_role ou senha foi usada no frontend.

O cliente público real consultou songs com sucesso (0 músicas), recebeu false de is_admin e teve acesso a song_originals recusado com código 42501. O workflow https://github.com/sampaioroberto/acervo-musical/actions/runs/39490509317 aprovou novamente todas as verificações e publicou o pacote conectado ao projeto real. A página pública carregou o acervo vazio sem o aviso de demonstração. O usuário concluiu o login administrativo privadamente e confirmou o sucesso. A conferência por CUA no endereço publicado mostrou a tela Administrar acervo, o seletor Letras/Cifras e o upload de arquivos disponíveis, com o acervo inicialmente vazio.

## Publicação da demonstração

Código enviado diretamente ao branch main em https://github.com/sampaioroberto/acervo-musical, sem Pull Request, conforme solicitado. Demonstração disponível em https://sampaioroberto.github.io/acervo-musical/ com VITE_DEMO=true.

O workflow https://github.com/sampaioroberto/acervo-musical/actions/runs/39488487101 concluiu verificação, build e deploy com sucesso sobre 83d88fc. No GitHub passaram 49 testes unitários/componentes, 2 de integração real, 4 verificações SQL e os 6 cenários Playwright. A primeira execução identificou um pixel de rolagem horizontal em telas pequenas: a margem negativa da ilustração foi removida; a regressão passou sem relaxar o limite de largura.

O endereço público foi aberto por CUA e a geração das quatro letras em uma página foi conferida, com fontes e worker carregados sob /acervo-musical/. A demonstração continua claramente identificada e não recebe uploads compartilhados.

## Verificações executadas

- 49 testes unitários e de componentes aprovados, cobrindo seleção, busca, paginação de consultas, fontes, ajuste ao A4, limites, importação, revisão, idempotência e expiração/troca de sessão.
- 2 testes de integração aprovados contra Supabase real em containers locais: autenticação, CRUD, Storage, RPCs, rascunhos privados, cadastro bloqueado e outra conta sem permissão de administração.
- 4 verificações SQL/pgTAP aprovadas para RLS e privilégios.
- TypeScript aprovado e pacote de produção compilado com o caminho /acervo-musical/, usando somente os parâmetros públicos do serviço local.
- Build sem configuração recusado como esperado; pacote de demonstração exige VITE_DEMO=true explicitamente. Chaves privilegiadas são recusadas antes da compilação.
- Auditoria das dependências de produção sem vulnerabilidades conhecidas no momento da verificação.

## Conferência visual e funcional

Os testes locais de navegador foram realizados pelo harness CUA disponibilizado pelo aplicativo. Foram conferidos a interface, seleção/reordenação, prévias e downloads reais; os PDFs baixados foram reabertos com PDF.js/pdfinfo. Os três estilos de fonte foram renderizados e inspecionados em imagens usando Poppler.

Confirmado: quatro letras em exatamente uma folha A4; duas letras por coluna; mudança de família mantendo tamanho manual; download correspondente à última escolha; quatro cifras curtas em quatro páginas; cifra longa com identificação de continuação. O pacote compilado também carregou fontes e worker PDF.js sob /acervo-musical/ sem erros de console.

Na administração local, uma conta fictícia importou DOCX e PDF no mesmo lote, revisou o texto e visualizou a cifra. Somente o Word revisado foi publicado; o PDF foi salvo como rascunho. Após logout, os formulários administrativos desapareceram e a consulta pública encontrou somente o publicado. Os estados foram confirmados no banco local.

## Limites da validação

- Os 6 cenários Playwright foram executados e aprovados no GitHub Actions. Localmente, os fluxos foram exercitados por CUA, sem iniciar outro controlador de navegador.
- Os exemplos são autorais. Os arquivos reais do usuário ainda não foram fornecidos; a fidelidade de extração deles precisa ser conferida durante a revisão de importação.
- O primeiro CI remoto exigiu a correção de largura descrita acima; a execução posterior aprovou as verificações e publicou a demonstração.
- O build informa um chunk grande relacionado às bibliotecas de PDF/fontes, carregado somente quando se abre a geração ou a administração. Não é uma falha de compilação.
- A revisão independente examinou o código em 9df6ad9 e encontrou quatro problemas importantes. Foram reproduzidos por testes que falharam antes das correções e passaram depois; a suíte completa passou novamente. Nenhum achado crítico ou menor foi registrado. O revisor não refez a conferência visual nem recertificou as suítes; esses testes foram executados pelo implementador. Veja review.md.

## Publicação

O usuário criou seu projeto Supabase na nuvem e entrou no painel pelo navegador do aplicativo. Foram aplicadas a migração e a configuração descritas acima. A demonstração inicial foi substituída pelo acervo real. A senha da conta administrativa foi definida pelo usuário; o painel do serviço e a administração do site usam logins distintos.

## Decisões de execução

- O criador nativo de worktree não reconheceu o repositório dentro da pasta workspace; o checkout isolado foi criado com Git em .worktrees/implementation. Isso muda apenas a gestão local do checkout.
- Os títulos das etapas do plano foram normalizados de Tarefa para Task para permitir o extrator de tarefas da habilidade. Nenhum requisito do produto mudou.
- Mammoth foi substituído por fflate e leitura inerte de WordprocessingML após a auditoria identificar uma dependência transitiva sem correção adequada. A extração de parágrafos, quebras e tabulações foi coberta por DOCX real de teste; layouts complexos continuam fora do escopo aprovado.
- A conferência de importação no navegador foi feita na etapa 7, quando a interface de upload ficou disponível, após os testes dos importadores na etapa 6.
- A validação local de interface usou CUA; Playwright permanece preparado para execução automatizada no CI. O custo dessa escolha é a ausência de uma rodada automatizada local de Playwright.
- Uma falha de transporte ao gravar pode esconder uma transação ainda pendente. O original é preservado e o mesmo identificador é reutilizado na retentativa; somente uma rejeição comprovada permite limpar o upload. Se a revisão for abandonada sem resolver a retentativa, pode restar um objeto privado sem associação, que exige conferência manual antes de remover.
