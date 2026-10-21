# Eventos — verificação em 20/10/2026

Base: e910fa9. Publicação direta em main, sem PR, conforme autorização do usuário.

- 88 testes unitários/componentes aprovados em 30 arquivos; TypeScript e build com `/louvores-cora/` aprovados.
- Supabase local: 8 verificações SQL/pgTAP e 3 testes de integração aprovados. A integração comprova rascunhos privados, recusa de escrita por visitante/outra conta, atualização atômica e preservação dos textos após edição/exclusão da fonte.
- CUA no banco local: seleção de letra e cifra existentes, publicação de música manual no acervo e associação ao evento, publicação do evento e geração das prévias completas de letras/cifras. Destaque da visita publicado na página inicial confirmado.
- Revisão independente com contexto novo examinou persistência, RLS, importação, edição, rotas e PDF. Dois achados P2 foram reproduzidos/corrigidos: resposta atrasada do catálogo substituía publicações locais; saídas do editor descartavam alterações ou associação de gravações pendentes. Os testes novos cobrem ambos. A segunda revisão não encontrou novos problemas bloqueantes.
- Navegação protege alterações não salvas e bloqueia saídas durante operações; fechamento/recarregamento usa o aviso nativo. O cenário automatizado de navegador cobre cancelar a troca de aba administrativa.
- O cenário E2E de Eventos também cobre importação DOCX, leitura individual, PDFs completos por tipo, largura de 390px e histórico após edição no acervo. Execução automatizada reservada ao CI; testes locais de interface usam CUA.

Os PDFs enviados são fontes para extrair/revisar músicas. Os PDFs públicos são gerados dos textos revisados, com as regras existentes; originais continuam privados. A divisão de várias letras é manual. Eventos preservam cópias de texto e ordem; para trocar uma versão em um evento já salvo, retire a música, salve e depois adicione novamente a versão atual do acervo.

A migração de Eventos foi aplicada pelo SQL Editor ao projeto real, sem inserir músicas/eventos de teste. O acervo real continha 14 músicas na conferência posterior. O primeiro evento deve ser organizado e publicado pelo administrador para aparecer na página inicial.
