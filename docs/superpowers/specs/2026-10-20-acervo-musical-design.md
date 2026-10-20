# Acervo Musical — especificação da primeira versão

Data: 20/10/2026

## Objetivo e público

Criar um site público para consultar letras e cifras e gerar PDFs de quatro músicas. Somente Roberto administra o acervo; visitantes não precisam de conta. O projeto prioriza a preparação de material para impressão, a leitura e a simplicidade de manutenção.

## Requisitos confirmados

- Site público hospedado no GitHub Pages.
- Supabase como serviço de dados, arquivos e autenticação.
- Importação de um ou vários arquivos DOCX ou PDF pelo administrador.
- Os PDFs de origem têm texto selecionável e foram exportados de documentos Word.
- Seleção de quatro letras para um PDF de uma única folha A4, com duas letras em cada coluna.
- Seleção de quatro cifras para um PDF com uma quebra de página entre as músicas.
- Somente o administrador pode adicionar, editar e excluir conteúdo.

## Decisões propostas para fechar a primeira versão

Estas são escolhas de implementação do desenho, além dos requisitos expressos pelo usuário:

- Nome inicial do projeto: Acervo Musical.
- Uma música e um tipo de conteúdo por arquivo importado. Não dividir automaticamente arquivos com várias músicas nem retirar automaticamente acordes para criar letras.
- Uma mesma música pode ter registros separados de letra e cifra. Não é necessário criar os dois tipos para publicar.
- Cada registro contém título obrigatório, artista opcional, tipo, conteúdo textual, datas e estado de publicação. A ordem de exibição inicial é alfabética por título.
- Prévia e edição antes de publicar, pois a extração não garante reprodução idêntica do documento de origem.
- Folha A4 vertical para letras e cifras.
- Interface em português, utilizável no computador e no celular.

## Fluxo público

1. Abrir o acervo e filtrar letras ou cifras, com busca por título e artista.
2. Abrir a prévia de uma música ou adicioná-la à seleção.
3. Selecionar exatamente quatro registros do mesmo tipo, sem repetição, e alterar sua ordem por controles acessíveis no computador e no celular.
4. Abrir a prévia do PDF e baixar o resultado. A geração ocorre no navegador do visitante.

Trocar o tipo com uma seleção ativa pede confirmação de descarte. O contador mostra quantas músicas faltam; uma quinta seleção é impedida com uma mensagem clara. Somente registros publicados aparecem para visitantes. Acervo vazio, busca sem resultados e falha ao carregar têm mensagens próprias; falhas de rede oferecem nova tentativa.

## PDF de letras

- Uma página A4 vertical, 210 × 297 mm, com margens de 12 mm e espaço de 8 mm entre colunas.
- Ordem: letras 1 e 2 na coluna esquerda, letras 3 e 4 na direita. Cada música ocupa um bloco contínuo, sem passar para a outra coluna.
- Título, artista quando informado e conteúdo; preservar estrofes e quebras de linha explícitas. Linhas longas podem quebrar dentro da coluna.
- As duas músicas de cada coluna seguem de cima para baixo, com separação visual; não precisam ter alturas iguais.
- Escolher o maior tamanho comum de fonte do corpo entre 9 e 12 pontos que acomode as quatro músicas, incluindo títulos e espaçamentos. Incorporar uma fonte com os caracteres usados em português.
- Se não couber a 9 pontos, impedir o download dessa composição e identificar a coluna e as músicas que excedem o espaço. Oferecer acesso à revisão da seleção; o administrador pode editar o conteúdo pelo acervo. Nunca cortar texto, remover versos ou gerar outra página silenciosamente.
- A prévia usa o próprio PDF gerado para corresponder ao download.

## PDF de cifras

- A4 vertical, com margens de 12 mm e corpo monoespaçado de 11 pontos.
- Preservar espaços, linhas e estrofes do conteúdo revisado. Normalizar tabulações em posições de tabulação consistentes na importação e no editor.
- Cada música começa em uma nova página; músicas longas podem continuar nas páginas seguintes. A próxima música sempre começa em outra página, sem adicionar páginas vazias entre elas.
- Identificar título e artista na primeira página da música; páginas de continuação identificam o título.
- Quebrar páginas entre linhas. Não quebrar uma linha de cifra automaticamente, pois isso pode separar acordes e versos.
- Se uma linha exceder a largura disponível, avisar e impedir o download até ajustar o conteúdo ou a seleção. A prévia administrativa ajuda a corrigir o alinhamento.
- O resultado tem pelo menos quatro páginas, podendo ter mais conforme o comprimento das cifras.

## Administração e importação

Uma rota de administração oferece login e gestão dos registros. O acesso público não oferece cadastro de contas; a conta administrativa é provisionada na configuração do serviço.

O administrador escolhe letra ou cifra para o lote e seleciona vários arquivos. Pode alterar o tipo individual na revisão. Limite inicial: 20 arquivos por lote e 10 MiB por arquivo, configurado tanto na aplicação quanto no armazenamento.

Cada arquivo é processado separadamente no navegador:

1. Validar extensão, tamanho e estrutura; aceitar apenas DOCX e PDF válidos, sem executar conteúdo dos arquivos.
2. Extrair texto de parágrafos e quebras no DOCX; no PDF, usar posições dos elementos de texto para reconstruir linhas e espaços. Não realizar OCR.
3. Sugerir o título pelo nome do arquivo e deixar artista opcional para preenchimento.
4. Mostrar texto editável e prévia do PDF correspondente ao tipo. Cifras usam editor monoespaçado com espaços preservados.
5. Salvar como rascunho ou publicar após revisão explícita do administrador. A publicação de um lote exige que cada item esteja válido e revisado.

A fidelidade de tabelas, colunas, fontes, cores e imagens do original não faz parte da primeira versão. Se a importação não recuperar texto útil, informar o problema e permitir colar o texto manualmente. Arquivos protegidos por senha ou inválidos recebem erro individual, sem interromper os demais. Falhas de extração não publicam registros automaticamente.

Mostrar possíveis duplicatas por título, artista e tipo antes de salvar; não substituir registros existentes automaticamente. Se uma gravação falhar, manter o conteúdo no formulário e indicar quais itens precisam de nova tentativa. Retentativas reutilizam o identificador do item para evitar duplicação.

## Arquitetura e dados

- Aplicação estática em TypeScript com React e Vite, publicada no GitHub Pages. Rotas por fragmento de URL permitem abrir a administração e atualizar a página sem depender de configuração de servidor.
- Supabase Database mantém registros e metadados. Supabase Auth autentica a conta administrativa. Supabase Storage guarda os arquivos originais em um bucket privado acessível apenas ao administrador.
- Visitantes consultam somente texto e metadados publicados. Não recebem acesso aos arquivos originais nem aos rascunhos.
- Cada registro tem identificador estável, título, artista, tipo, texto, estado, referência opcional ao original e datas de criação e atualização.
- Separar interface, consultas ao acervo, importadores de DOCX/PDF e geração dos dois formatos de PDF em módulos independentes.
- Bibliotecas propostas: Mammoth para DOCX, PDF.js para extrair texto de PDFs e pdf-lib para compor os PDFs, sujeitas à verificação de compatibilidade durante o planejamento.
- Os arquivos originais são uma referência administrativa; a geração pública usa o texto revisado salvo no banco.
- Salvar primeiro o original, depois o registro. Se a gravação do registro falhar, tentar remover o arquivo órfão e preservar os dados do formulário para nova tentativa. Ao excluir um registro, confirmar a exclusão e tratar eventuais falhas de remoção do original com mensagem administrativa e opção de repetir.

## Controle de acesso

- Regras no banco e no armazenamento restringem gravações ao UUID da conta administrativa configurada. Esconder botões na interface não é o mecanismo de autorização.
- Habilitar Row Level Security e conceder somente leitura de registros publicados ao acesso público. Rascunhos, criação, alterações e exclusões ficam restritos ao administrador.
- Bloquear cadastro público. Apenas estar autenticado não concede permissão de administração.
- Usar somente a URL e a chave pública/publicável do Supabase no site. Chaves privilegiadas nunca entram no código, no repositório, nos logs ou no pacote publicado.
- Exibir textos importados como texto, sem interpretar HTML de documentos como código da página.

## Configuração e publicação

O repositório inclui instruções para criar o projeto Supabase, provisionar a conta administrativa, aplicar as regras do banco e do bucket e configurar os parâmetros públicos do site. Configurar a URL do GitHub Pages nos endereços permitidos da autenticação.

Um fluxo do GitHub Actions executa as verificações e publica o pacote estático. Ajustar o caminho-base para funcionar em um endereço de projeto do GitHub Pages.

A criação de contas externas, a configuração do Supabase e a publicação dependem de acesso às contas do usuário. O desenvolvimento local deve permitir avaliar a interface e os PDFs com dados de demonstração sem fingir que uploads locais foram publicados no acervo compartilhado.

## Validação

- Conferir visualmente PDFs gerados: quatro letras em exatamente uma página A4, com duas por coluna, e quatro cifras com cada início em uma nova página.
- Cobrir letras acentuadas, estrofes, linhas longas, textos no limite de tamanho, cifras com espaços e cifras com mais de uma página.
- Validar importadores com documentos de exemplo criados para os testes e, quando disponibilizados, arquivos reais do usuário. Não preencher o acervo com letras de terceiros.
- Verificar erros de arquivo, falhas parciais de lote e retentativas sem duplicação.
- Testar políticas reais do Supabase: visitante e outra conta autenticada não podem alterar dados nem acessar rascunhos ou originais; a conta administrativa pode realizar as operações autorizadas.
- Conferir fluxo público e administrativo no computador e no celular, navegação por teclado, geração do pacote e funcionamento sob o caminho-base do GitHub Pages.
- Se o Supabase ainda não estiver configurado, relatar explicitamente quais verificações de integração e acesso dependem dele.

## Fora da primeira versão

Transposição de tom, OCR, edição colaborativa, contas de visitantes, sugestões públicas de conteúdo, separação automática de várias músicas por arquivo, cópia fiel do estilo dos documentos Word e sincronização automática com outras bibliotecas.
