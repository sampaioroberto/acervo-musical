# Eventos do Louvores Cora

Pedido aprovado: criar visitas com nome, data, letras e cifras; escolher músicas publicadas ou importar novas para o acervo e evento. Navegação pública Eventos, destaque do evento publicado de data mais recente na página inicial, consulta individual e PDFs completos separados por tipo. Apenas o administrador organiza e publica.

Cada evento guarda os textos e a ordem usados no dia. Alterar ou excluir uma música no acervo não modifica o histórico. Editar o evento permite remover, adicionar e reordenar músicas, mantendo as versões já incluídas. Rascunhos não são públicos. Eventos podem conter qualquer quantidade de músicas e apenas um dos tipos enquanto o outro estiver indisponível; a publicação exige ao menos uma música.

Importação reutiliza validação, extração, revisão e gravação do acervo. PDFs de cifras separam por página com união/separação de continuações. PDFs com várias letras juntas podem ser divididos manualmente em título e conteúdo; não prometer reconhecimento perfeito de colunas nem OCR. Duplicatas por título/tipo oferecem usar a música existente. A música só é adicionada ao evento após confirmar sua publicação no acervo. Falhas mantêm texto e IDs para repetir; importações pendentes impedem salvar um evento incompleto por engano.

Supabase: tabela events com metadados e lista JSON de cópias de músicas. Leitura pública só de eventos publicados; toda escrita exclusiva do administrador atual. RPC transacional recebe IDs de músicas, copia apenas músicas publicadas e preserva cópias anteriores quando editar um evento. Sem referência pública a originais privados. Remover um evento não remove músicas do acervo.

PDFs usam o gerador existente: letras até quatro por folha A4, duas por coluna, fontes ajustáveis; cada cifra começa em nova página. Evento tem link próprio compartilhável. Most recent = event_date descendente, desempate created_at e id. Datas são civis, exibidas em pt-BR sem conversão de fuso.

Publicação direta em main, sem PR, revisão independente no final. Não criar eventos nem músicas fictícios no banco de produção. Preservar registros e permissões atuais.
