# Acervo Musical Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar um acervo público de letras e cifras, administrado por Roberto, com importação DOCX/PDF e geração dos dois formatos de PDF aprovados.

**Architecture:** Aplicação estática React/TypeScript/Vite no GitHub Pages; Supabase mantém autenticação, registros e originais privados. Importação, medição de texto e geração de PDF acontecem no navegador em módulos separados. Um modo de demonstração, explicitamente identificado e sem gravação, permite avaliar acervo e PDFs antes da configuração externa.

**Tech Stack:** React, TypeScript, Vite, Supabase JS, Mammoth, PDF.js (`pdfjs-dist`), pdf-lib, `@pdf-lib/fontkit`; Vitest/Testing Library e Playwright para os testes. Usar Node 24 na integração contínua, versões compatíveis das dependências e `package-lock.json` versionado.

**Spec:** [Especificação aprovada](/Users/betow/workspace/acervo-musical/docs/superpowers/specs/2026-10-20-acervo-musical-design.md).

## Global Constraints

- Interface em português, utilizável no computador e no celular.
- Somente Roberto administra o acervo; visitantes não precisam de conta.
- Rotas por fragmento de URL; publicação no GitHub Pages com caminho-base de projeto.
- Uma música e um tipo de conteúdo por arquivo importado.
- Limite inicial: 20 arquivos por lote e 10 MiB por arquivo.
- Letras: uma página A4 vertical, 210 × 297 mm, com margens de 12 mm e espaço de 8 mm entre colunas.
- Ordem: letras 1 e 2 na coluna esquerda, letras 3 e 4 na direita.
- Letras: Noto Sans, Noto Serif e Noto Sans Mono; corpo de 9 a 16 pontos, em passos de 1 ponto; escolha comum às quatro músicas.
- Modo inicial automático; alteração manual desativa o automático; nunca reduzir a escolha manual silenciosamente.
- Cifras: A4 vertical, margens de 12 mm e corpo monoespaçado de 11 pontos; cada música começa em uma nova página.
- Não cortar texto, publicar falhas de extração, executar HTML importado ou incluir chaves privilegiadas no site.
- Usar conteúdo de teste autoral; não preencher o acervo com letras de terceiros.
- Prefixar todos os comandos de terminal com `rtk`, conforme `/Users/betow/.codex/RTK.md`.

## Review Focus

1. Geração assíncrona encerrada fora de ordem: o PDF baixado deve corresponder às opções mais recentes (tarefa 4).
2. Uma gravação pode ter sido concluída mesmo após erro de rede: repetir não duplica o registro nem remove um original já associado (tarefa 7).
3. Palavras sem espaços e caracteres sem glifo não podem desaparecer ou ultrapassar margens silenciosamente (tarefas 2 e 3).
4. Sessão expirada ou outra conta autenticada não pode editar nem reaproveitar a tela administrativa anterior (tarefas 5 e 7).
5. Espaços em nomes de arquivos e instalação em subdiretório não podem quebrar fontes, worker PDF.js, download ou acesso direto à administração (tarefas 6 e 8).

## Organização e contratos

Diretório de trabalho: `/Users/betow/workspace/acervo-musical`. O repositório já contém a especificação; preservar seus commits. Esta é uma entrega integrada, executada na ordem abaixo, sem projetos externos adicionais de hospedagem.

| Arquivos planejados | Responsabilidade |
|---|---|
| `src/app/{App.tsx,config.ts,styles.css}`, `src/main.tsx` | Rotas, composição, configuração e estilos globais |
| `src/catalog/{types.ts,repository.ts,demoRepository.ts,selection.ts,CatalogPage.tsx}` | Contratos de dados, consulta, demonstração e seleção |
| `src/pdf/{types.ts,fonts.ts,text.ts,lyrics.ts,chords.ts,previewSong.ts}` | Fontes incorporadas, métricas e composição dos PDFs |
| `src/pdf/{PdfComposer.tsx,PdfPreview.tsx,usePdfPreview.ts}` | Opções, prévia e download do mesmo documento |
| `src/backend/{client.ts,database.types.ts,supabaseRepository.ts,auth.ts}` | Acesso ao Supabase e autorização da sessão |
| `src/import/{types.ts,validate.ts,normalize.ts,docx.ts,pdf.ts,importFile.ts}` | Validação e extração do texto sem interpretar HTML |
| `src/admin/{batch.ts,saveImport.ts,AdminPage.tsx,LoginForm.tsx,ImportReview.tsx,SongEditor.tsx}` | Administração, revisão de lotes e retentativas |
| `supabase/{config.toml,migrations/202610200001_archive.sql,tests/archive.test.sql}` | Banco, bucket privado e políticas de acesso |
| `tests/{catalog,pdf,backend,import,admin}/*`, `e2e/*`, `tests/fixtures/*` | Verificações de comportamento e documentos autorais |
| `scripts/{create-fixtures.mjs,test-backend.mjs}`, `.github/workflows/{ci.yml,pages.yml}` | Fixtures, testes locais de acesso e publicação |
| `public/fonts/*`, `README.md`, `docs/{setup-supabase.md,publication.md,verification.md}` | Fontes/licenças e instruções de operação |

Contratos a estabelecer na tarefa 1, em `src/catalog/types.ts` e `repository.ts`:

```ts
type SongKind = 'lyrics' | 'chords';
type SongStatus = 'draft' | 'published';
type SongDraft = { title: string; artist: string; kind: SongKind; content: string };
type Song = SongDraft & {
  id: string; status: SongStatus; createdAt: string; updatedAt: string;
};
type CatalogQuery = { kind: SongKind; search: string };
type OriginalRef = { id: string; path: string; name: string; mime: string; size: number };
type AdminSong = Song & { original: OriginalRef | null };
interface CatalogRepository {
  listPublished(query: CatalogQuery): Promise<Song[]>;
}
interface AdminRepository extends CatalogRepository {
  listAdmin(): Promise<AdminSong[]>;
  getAdmin(id: string): Promise<AdminSong | null>;
  save(song: Song, original: OriginalRef | null): Promise<AdminSong>;
  deleteSong(id: string): Promise<OriginalRef | null>;
  uploadOriginal(ref: OriginalRef, file: File): Promise<void>;
  removeOriginal(ref: OriginalRef): Promise<void>;
  listPendingCleanup(): Promise<OriginalRef[]>;
}
```

Exportar esses tipos explicitamente. As consultas públicas nunca retornam referência a original. `save` grava registro e associação em uma transação; `deleteSong` exclui o registro e mantém eventual original marcado para limpeza até a remoção confirmada. `removeOriginal` é idempotente e remove também a referência pendente. Busca sem distinção de caixa/acentos, com normalização Unicode e ordenação `pt-BR`, tem a mesma semântica nos adaptadores público e de demonstração.

## Tarefa 1: Acervo público e seleção de quatro músicas

**Files:** criar os módulos `src/app/*`, `src/main.tsx` e `src/catalog/*` do mapa; `index.html`, `package.json`, `package-lock.json`, `.gitignore`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `tests/setup.ts`, `tests/catalog/selection.test.ts` e `tests/catalog/catalog.test.tsx`.

**Interfaces:** consome os contratos acima; produz `CatalogPage({repository, onCompose})`, com `onCompose(songs: Song[]): void`, e `changeSelection(state: SelectionState, action: SelectionAction): SelectionState`. `SelectionState` contém `kind`, `ids` e `notice`; ações são `add`, `remove`, `move`, `switch-kind` e `clear`, com IDs e índices quando necessários. `switch-kind` recebe `confirmed: boolean`.

As ações usam `type` como discriminante; `add`/`remove` recebem `id`, `move` recebe `id` e `toIndex`, e `switch-kind` recebe `kind` e `confirmed`. `notice` é `string | null`; `ids` é `string[]`.

- [ ] **1. Preparar somente o necessário para executar o primeiro teste:** configuração React/TS/Vite, scripts `dev`, `build`, `typecheck`, `test`, `test:e2e` e dependências de teste; preservar os documentos existentes. `build` executa verificação TypeScript antes do Vite. Registrar versões resolvidas no lockfile, sem ignorar erros de compatibilidade de engines.
- [ ] **2. Escrever testes de comportamento:** `selection.test.ts` verifica que IDs repetidos e a quinta música não entram, `move` altera a ordem e trocar tipo só limpa a seleção após confirmação; `catalog.test.tsx` verifica busca por `Cancao` encontrando `Canção`, artista opcional, ordenação, contador, botão de gerar habilitado apenas com quatro, vazio e falha com nova tentativa.

```ts
it('recusa uma quinta música sem perder a seleção', () => {
  const state = {kind: 'lyrics' as const, ids: ['1', '2', '3', '4'], notice: null};
  expect(changeSelection(state, {type: 'add', id: '5'}).ids).toEqual(state.ids);
  expect(changeSelection(state, {type: 'move', id: '4', toIndex: 0}).ids).toEqual(['4', '1', '2', '3']);
});
```

- [ ] **3. Executar `rtk npm test -- --run tests/catalog`:** esperar falhas pelas funções/telas ainda não implementadas, sem falha de configuração do runner.
- [ ] **4. Implementar os contratos e o fluxo:** `createDemoRepository(): CatalogRepository` usa oito registros autorais, quatro por tipo; sem persistência nem login fictício. `readConfig(env: Record<string, string | undefined>): AppConfig` retorna `{mode: 'demo'}` ou `{mode: 'supabase', url, publishableKey}`; só uma variável Supabase presente produz erro de configuração, sem cair silenciosamente na demonstração. Usar rotas `#/` e `#/admin`, título “Acervo Musical”, busca, abas Letras/Cifras, lista e seleção reordenável por botões. Identificar claramente a demonstração.
- [ ] **5. Executar `rtk npm test -- --run tests/catalog` e `rtk npm run typecheck`:** esperar aprovação; revisar no navegador o fluxo público responsivo antes do commit, usando o procedimento local de prévia aplicável.
- [ ] **6. Commit:** adicionar apenas arquivos desta tarefa com `rtk git add` e executar `rtk git commit -m 'feat: add public catalog and song selection'`.

## Tarefa 2: PDF de letras, fontes e ajuste ao A4

**Files:** criar `src/pdf/{types.ts,fonts.ts,text.ts,lyrics.ts}`, `public/fonts/{NotoSans-Regular.ttf,NotoSerif-Regular.ttf,NotoSansMono-Regular.ttf}`, respectivas licenças, `tests/pdf/{lyrics.test.ts,text.test.ts,fontFixtures.ts,fixtures.ts}`.

**Interfaces:** consome `SongDraft`; produz `PrintSong = SongDraft & {id: string}`, `FontFamily = 'sans' | 'serif' | 'mono'`, `LyricOptions = {family: FontFamily; sizing: {mode: 'auto'} | {mode: 'manual'; size: number}}`, `FontSource = (family: FontFamily) => Promise<Uint8Array>` e `generateLyricsPdf(songs: readonly PrintSong[], options: LyricOptions, fonts: FontSource): Promise<PdfResult>`. `PdfResult` é `{ok: true; bytes: Uint8Array; pageCount: number; fontSize: number}` ou `{ok: false; issues: PdfIssue[]}`; `PdfIssue` contém `code`, `songIds`, `message` e `column?: 0 | 1`. Códigos: `selection`, `font-size`, `overflow`, `unsupported-character`, `font-load`.

Nos testes, definir `makePrintSongs(kind: SongKind, content: string): PrintSong[]` em `fixtures.ts`, retornando quatro IDs/títulos distintos com o mesmo corpo, e `fixtureFonts: FontSource` em `fontFixtures.ts`, lendo os três TTF locais. Reutilizar esses helpers nas tarefas seguintes.

- [ ] **1. Escrever testes `lyrics.test.ts` e `text.test.ts`:** quatro textos com acentos geram uma página com dimensões `210 * 72 / 25.4` e `297 * 72 / 25.4` pontos; extração do PDF confirma IDs/textos nas colunas e ordem; executar para as três famílias. Manual 16 permanece 16 se couber, e retorna `overflow` quando não cabe. Auto encontra o maior inteiro entre 9 e 16; 8, 17, NaN e 9.5 são inválidos. Texto ainda longo a 9 não gera bytes. Palavra longa deve quebrar em caracteres no PDF de letras; glifo ausente retorna erro identificado.

```ts
it('preserva o tamanho manual quando as quatro letras cabem', async () => {
  const result = await generateLyricsPdf(makePrintSongs('lyrics', 'Canção\nVoz e coração'),
    {family: 'sans', sizing: {mode: 'manual', size: 16}}, fixtureFonts);
  expect(result).toMatchObject({ok: true, pageCount: 1, fontSize: 16});
});
```

- [ ] **2. Executar `rtk npm test -- --run tests/pdf/lyrics.test.ts tests/pdf/text.test.ts`:** esperar falha pela ausência dos módulos.
- [ ] **3. Implementar fontes e medição:** obter TTF regulares das famílias Noto em suas fontes oficiais, registrar origem e licença; servir pelo caminho-base, sem depender de CDN no uso. Registrar fontkit, incorporar a fonte escolhida e usar suas métricas para medir e desenhar. Normalizar texto para NFC; preservar estrofes. Constantes: entrelinha `1.2 × corpo`, título `1.2 × corpo`, artista `0.9 × corpo`, separação entre músicas 6 mm. Medir título/artista com quebra dentro da coluna, assim como o corpo; considerar altura real da fonte.
- [ ] **4. Implementar `generateLyricsPdf`:** validar quatro letras distintas; usar duas colunas com margens e espaço aprovados, sem altura fixa por música. Medir a composição completa para cada inteiro de 16 até 9 no automático. Desenhar somente após validar todos os blocos; erro de largura/altura identifica coluna e músicas. Não produzir PDF parcial.
- [ ] **5. Executar os testes da tarefa e `rtk npm run typecheck`:** esperar aprovação. Renderizar PDFs de cada família e um caso limite em imagens e inspecionar margens, acentos, ordem e ausência de corte; seguir a habilidade PDF ao executar essa verificação.
- [ ] **6. Commit:** `rtk git commit -m 'feat: generate configurable A4 lyric sheets'`, após adicionar os arquivos desta tarefa.

## Tarefa 3: PDF de cifras com alinhamento e paginação

**Files:** criar `src/pdf/chords.ts`, `src/import/normalize.ts` e `tests/pdf/chords.test.ts`.

**Interfaces:** consome `PrintSong`, `FontSource`, `PdfResult` e as métricas compartilhadas da tarefa 2; produz `generateChordsPdf(songs: readonly PrintSong[], fonts: FontSource): Promise<PdfResult>` e `normalizeText(text: string): string`.

- [ ] **1. Escrever `chords.test.ts`:** quatro cifras curtas geram quatro páginas; uma cifra longa continua em outra página e a seguinte começa na página posterior, sem folhas vazias extras. Acentos, estrofes e espaços entre acordes são preservados. Linha acima da largura retorna `overflow`, sem quebra automática; testar título muito longo e último verso exatamente no limite inferior. `normalizeText('C\tG\r\nvoz')` retorna `'C   G\nvoz'`, com tabulações na próxima posição múltipla de quatro.

```ts
it('inicia cada cifra em uma página própria', async () => {
  const result = await generateChordsPdf(makePrintSongs('chords', 'C   G\nVoz e coração'), fixtureFonts);
  expect(result).toMatchObject({ok: true, pageCount: 4, fontSize: 11});
  expect(normalizeText('C\tG\r\nvoz')).toBe('C   G\nvoz');
});
```

- [ ] **2. Executar `rtk npm test -- --run tests/pdf/chords.test.ts`:** esperar falhas específicas da funcionalidade ausente.
- [ ] **3. Implementar `normalizeText` e `generateChordsPdf`:** converter CRLF/CR em LF, expandir tabulações por linha, normalizar NFC e preservar espaços/linhas restantes. Validar quatro cifras distintas e glifos. Usar Noto Sans Mono a 11 pontos, entrelinha de 13.2 pontos; título 13.2 e artista 9.9. Quebrar títulos e artista quando necessário; nunca quebrar linhas do corpo. Verificar todas as larguras antes de criar o documento; reservar título de continuação a cada nova página.
- [ ] **4. Executar os testes da tarefa e `rtk npm run typecheck`:** esperar aprovação; renderizar e inspecionar uma cifra curta e outra com continuação, conferindo alinhamento e início de cada música.
- [ ] **5. Commit:** `rtk git commit -m 'feat: generate paginated chord PDFs'`, após adicionar os arquivos da tarefa.

## Tarefa 4: Prévia, opções de fonte e download

**Files:** criar `src/pdf/{PdfComposer.tsx,PdfPreview.tsx,usePdfPreview.ts}`, `tests/pdf/composer.test.tsx`, `tests/pdf/preview.test.tsx` e `e2e/pdf.spec.ts`; conectar em `src/app/App.tsx` e configurar `playwright.config.ts`.

**Interfaces:** consome os dois geradores; produz `PdfComposer({songs, onClose})`, `PdfPreview({bytes: Uint8Array})` e `usePdfPreview(songs: readonly PrintSong[], options: LyricOptions): {status: 'loading' | 'ready' | 'invalid' | 'error'; result: PdfResult | null; download(): void}`.

- [ ] **1. Escrever os testes:** inicialização em Noto Sans/automático; tamanho manual e botão de retorno ao automático; troca de família preserva tamanho manual; overflow mostra identificação e bloqueia download. Usar duas Promises controladas para confirmar que uma geração antiga, resolvida por último, não substitui a atual. Confirmar que mudar opções invalida imediatamente o download anterior.

```ts
it('bloqueia download enquanto recalcula as opções', async () => {
  // Fixture do gerador devolve uma Promise controlada, ainda pendente.
  render(<PdfComposer songs={makePrintSongs('lyrics', 'Canção')} onClose={() => {}} />);
  expect(screen.getByRole('button', {name: 'Baixar PDF'})).toBeDisabled();
  expect(screen.getByRole('combobox', {name: 'Fonte das letras'})).toHaveValue('sans');
});
```

- [ ] **2. Executar `rtk npm test -- --run tests/pdf/composer.test.tsx tests/pdf/preview.test.tsx`:** esperar falhas da interface ausente.
- [ ] **3. Implementar composição e prévia:** renderizar os bytes reais via PDF.js em canvas para funcionar também no celular; oferecer indicador de geração, navegação de páginas e download por Blob. Usar contador de revisão para descartar resultados antigos, cancelar renderizações obsoletas, liberar documentos/URLs ao trocar ou fechar e nunca baixar resultado antigo. Carregar worker PDF.js por URL gerenciada pelo Vite. Mudanças de fonte e tamanho afetam apenas aquela composição, sem alterar o acervo.
- [ ] **4. Executar os testes da tarefa, `rtk npm run typecheck` e `rtk npm run test:e2e -- e2e/pdf.spec.ts`:** esperar quatro letras em um PDF de uma página e quatro cifras em ao menos quatro páginas; validar o download com PDF.js, sem depender apenas do texto da interface.
- [ ] **5. Commit:** `rtk git commit -m 'feat: add live PDF preview and typography controls'`, após adicionar os arquivos da tarefa.

## Tarefa 5: Supabase, políticas de acesso e sessão

**Files:** criar `src/backend/*`, `supabase/config.toml`, `supabase/migrations/202610200001_archive.sql`, `supabase/tests/archive.test.sql`, `scripts/test-backend.mjs`, `.env.example`, `docs/setup-supabase.md`, `tests/backend/{repository.test.ts,access.integration.test.ts}`; adaptar `src/app/{config.ts,App.tsx}`.

**Interfaces:** implementa `AdminRepository` da tarefa 1; produz `createSupabaseRepository(client: SupabaseClient<Database>): AdminRepository` e `AuthPort` em `auth.ts`, com `current(): Promise<'anonymous' | 'admin' | 'denied'>`, `signIn(email: string, password: string): Promise<void>`, `signOut(): Promise<void>` e `subscribe(listener: () => void): () => void`. A checagem administrativa usa RPC `is_admin()`, sem confiar em campo editável do usuário.

- [ ] **1. Escrever testes de acesso antes da migração:** visitante só lê publicados; outra conta autenticada não acessa rascunhos/originais nem altera registros; somente administrador faz CRUD e upload. Tentativas diretas de RPC têm a mesma proteção. Configurar os testes de integração para recusar URL não local e não imprimir tokens. Usar usuários temporários apenas no Supabase local e testar também o bucket pela API de Storage.

```ts
it('nega alteração direta por outra conta autenticada', async () => {
  // otherClient é autenticado pela fixture local; publishedId pertence ao administrador.
  const changed = await otherClient.from('songs').update({title: 'Alterado'}).eq('id', publishedId).select();
  expect(changed.data ?? []).toHaveLength(0);
  expect((await adminRepo.getAdmin(publishedId))?.title).toBe('Canção de teste');
});
```

- [ ] **2. Preparar o runner local e executar `rtk npm run test:integration`:** instalar CLI Supabase como dependência de desenvolvimento; o script sobe a instância local com runtime de containers disponível. Esperar falhas por tabelas/políticas ausentes. Se o runtime não estiver disponível, registrar impedimento concreto e preparar a mesma verificação no CI, sem tratar testes simulados como comprovação de RLS.
- [ ] **3. Implementar migração e adaptador:** tabelas `songs`, `song_originals` e `private.app_admin` com no máximo um UUID administrativo. `songs` contém os campos dos contratos, busca normalizada e estado validado; `song_originals` contém a referência do arquivo e marca de limpeza pendente, apenas para administração. Criar bucket privado `originals`, tamanho máximo 10 MiB e tipos DOCX/PDF; o limite de 20 por lote é validado na interface. RLS/grants permitem leitura pública só de publicados e restringem demais operações ao administrador. Usar funções com `search_path` explícito e privilégios mínimos. `save_song` salva registro e referência atomicamente; `delete_song` apaga o registro e mantém a referência para limpeza idempotente. Desabilitar cadastro público e documentar provisionamento da conta pelo painel, sem credenciais no repositório.
- [ ] **4. Implementar sessão/configuração:** somente `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` entram no pacote; gerar `database.types.ts` a partir da migração aplicada. Tratar sessão expirada como perda de acesso e atualizar a interface por assinatura. Manter o modo demo explicitamente sem administração; falha de conexão de um site configurado não ativa demo.
- [ ] **4a. Completar consultas sem truncamento:** os métodos de lista percorrem resultados em páginas de 500 registros até uma página incompleta, com ordem estável por título/ID. Acrescentar teste do adaptador em que o registro procurado está na segunda página, para não depender do limite padrão da API. Implementar busca e ordenação com a mesma semântica da tarefa 1.
- [ ] **5. Executar `rtk npm test -- --run tests/backend`, `rtk npm run test:integration` e `rtk npm run typecheck`:** esperar aprovação real das operações públicas, da outra conta e da conta administrativa, incluindo Storage e RPCs. Confirmar que rascunhos não vazam pela busca e que fontes/worker continuam acessíveis ao público.
- [ ] **6. Commit:** `rtk git commit -m 'feat: secure archive persistence with Supabase'`, após adicionar os arquivos da tarefa.

## Tarefa 6: Importação de DOCX e PDF

**Files:** criar `src/import/{types.ts,validate.ts,docx.ts,pdf.ts,importFile.ts}`, `scripts/create-fixtures.mjs`, `tests/import/{validate.test.ts,docx.test.ts,pdf.test.ts}` e `tests/fixtures/*`; reutilizar `normalize.ts` da tarefa 3.

**Interfaces:** produz `ImportResult = {ok: true; draft: SongDraft; warnings: string[]} | {ok: false; code: 'invalid' | 'size' | 'encrypted' | 'empty' | 'unsupported'; message: string}`, `validateFiles(files: readonly File[]): {accepted: File[]; rejected: {name: string; message: string}[]}`, `extractDocx(data: ArrayBuffer): Promise<{text: string; warnings: string[]}>`, `extractPdf(data: ArrayBuffer): Promise<{text: string; warnings: string[]}>` e `importFile(file: File, kind: SongKind): Promise<ImportResult>`.

- [ ] **1. Criar fixtures autorais e testes:** DOCX com acentos, parágrafos, quebra de linha e tabulação; PDF com trechos posicionados de acordes/versos; inválidos, vazio e extensão falsa. O gerador usa `jszip` como dependência de desenvolvimento para DOCX mínimo e pdf-lib para PDF, com saídas reprodutíveis. Testar nomes com espaços/extensão em maiúscula, arquivo de exatamente 10 MiB versus um byte acima, 20 versus 21 arquivos, assinatura/estrutura incompatível e texto semelhante a HTML exibido literalmente. Testar sinal de PDF protegido usando a exceção de senha do parser.

```ts
it('recusa lote acima de vinte arquivos antes da extração', () => {
  const files = Array.from({length: 21}, (_, i) => new File(['%PDF-'], `Letra ${i}.pdf`));
  expect(validateFiles(files).accepted).toHaveLength(0);
  expect(validateFiles(files).rejected).toHaveLength(21);
});
```

- [ ] **2. Executar `rtk npm test -- --run tests/import`:** esperar falhas dos importadores ausentes.
- [ ] **3. Implementar validação e DOCX:** validar lote antes de processar; lote acima de 20 é recusado com mensagem, arquivos inválidos em lote válido têm erro individual. Usar Mammoth `extractRawText({arrayBuffer})`, preservar quebras/espaços com `normalizeText`, apresentar avisos do conversor e nunca inserir HTML do documento na página. Remover somente a extensão para sugerir título; artista fica vazio. Texto vazio permite recuperação manual na revisão, sem publicação automática.
- [ ] **4. Implementar PDF:** usar `getTextContent()` por página e posições transformadas dos itens para agrupar linhas de cima para baixo e trechos da esquerda para a direita, reconstruindo espaços pelas distâncias. Separar páginas e estrofes por quebras, não concatenar tudo como um parágrafo. Liberar documento/worker após uso. Documentos com layout complexo recebem aviso de revisão; senha/arquivo inválido produz erro individual, sem pedir OCR ou interromper os demais arquivos.
- [ ] **5. Executar os testes da tarefa, `rtk npm run typecheck` e o build:** esperar aprovação. No navegador, importar os dois arquivos autorais e conferir o texto reconstruído contra a origem; se o usuário disponibilizar arquivos reais, repetir com eles e registrar limitações observadas.
- [ ] **6. Commit:** `rtk git commit -m 'feat: import editable lyrics and chords from documents'`, após adicionar os arquivos da tarefa.

## Tarefa 7: Administração, revisão e publicação de lotes

**Files:** criar `src/admin/*`, `src/pdf/previewSong.ts`, `tests/admin/{batch.test.ts,saveImport.test.ts,admin.test.tsx}`, `e2e/admin.spec.ts`; conectar a rota administrativa em `src/app/App.tsx`.

**Interfaces:** consome `AdminRepository`, `AuthPort`, importadores e geradores. Produz `ImportItem = {id: string; file: File; original: OriginalRef; draft: SongDraft; reviewed: boolean; status: 'importing' | 'review' | 'saving' | 'saved' | 'error'; error: string | null}`, `saveImport(item: ImportItem, status: SongStatus, repo: AdminRepository): Promise<AdminSong>`, `previewSongPdf(song: SongDraft, options: LyricOptions, fonts: FontSource): Promise<PdfResult>` e `AdminPage({repo, auth})`. A prévia individual reutiliza internamente o mesmo layout de uma música, sem remover a validação pública de exatamente quatro.

- [ ] **1. Escrever testes:** cada importação mantém UUID e caminho estáveis nas tentativas; salvar/publicar exige título e conteúdo, e publicar exige revisão explícita. Falha de um item preserva os outros e seus textos. Repetir publicação não duplica; resultado de gravação ambíguo é reconciliado por ID antes de remover arquivo. Duplicata por título/artista/tipo avisa sem substituir. Logout/sessão expirada fecha a área e limpa estado sensível; outra conta vê acesso negado. Exclusão exige confirmação, e falha de remoção do original oferece retentativa persistida.

```ts
it('não publica um item que ainda não foi revisado', async () => {
  // item é um ImportItem válido com reviewed:false; repo é o mock de AdminRepository.
  await expect(saveImport(item, 'published', repo)).rejects.toThrow('Revise o conteúdo antes de publicar');
  expect(repo.save).not.toHaveBeenCalled();
  expect(repo.uploadOriginal).not.toHaveBeenCalled();
});
```

- [ ] **2. Executar `rtk npm test -- --run tests/admin`:** esperar falhas pelas funções e telas ausentes.
- [ ] **3. Implementar `saveImport` e estado do lote:** gerar UUID uma vez, usar o mesmo ID para registro e referência e o caminho `${id}/original.${ext}`, com extensão validada `pdf` ou `docx`, sem usar o nome original como caminho. Enviar original e salvar registro com referência pela transação da tarefa 5. Em falha, consultar `getAdmin(id)` para distinguir registro já salvo de arquivo órfão; não remover arquivo se o resultado ainda for desconhecido. Em rejeição comprovada sem registro, tentar remover o órfão; preservar os dados para nova tentativa. Usar estados por item, com processamento sequencial do lote para limitar memória. Ações do lote só publicam itens válidos e revisados.
- [ ] **4. Implementar as telas:** login por email/senha sem cadastro; lista de publicados/rascunhos; upload múltiplo e tipo por lote/item; editor de título, artista e texto; prévia individual; revisão explícita; salvar rascunho, publicar, editar e excluir. Editor de cifras monoespaçado preserva espaços. Disponibilizar colagem manual quando não houver texto extraível. Alertar duplicatas também dentro do próprio lote. Após remoção de registro, apresentar pendências de limpeza de originais e botão de repetir. Mensagens de erro não expõem detalhes de credenciais.
- [ ] **5. Executar os testes da tarefa, `rtk npm run test:integration` e `rtk npm run test:e2e -- e2e/admin.spec.ts`:** esperar importação de DOCX/PDF, revisão e publicação visível em sessão pública separada; rascunho permanece invisível. Cobrir edição, exclusão e expiração de sessão. Sem backend de teste disponível, registrar esse limite, sem simular publicação bem-sucedida.
- [ ] **6. Commit:** `rtk git commit -m 'feat: add administrator import review and publication'`, após adicionar os arquivos da tarefa.

## Tarefa 8: Publicação e validação integrada

**Files:** criar `.github/workflows/{ci.yml,pages.yml}`, `README.md`, `docs/{publication.md,verification.md}`, `e2e/{accessibility.spec.ts,base-path.spec.ts}`; finalizar `vite.config.ts`, `playwright.config.ts` e `.env.example`.

**Interfaces:** consome a aplicação completa; produz pacote estático `dist/`, documentação de configuração e pipeline de publicação. Variáveis adicionais: `VITE_BASE_PATH`, com `/` local e `/<nome-do-repositorio>/` para Pages; `VITE_DEMO`, que deve ser explicitamente `true` para publicar demonstração. Uma publicação de produção sem configuração Supabase completa falha no build.

- [ ] **1. Escrever testes integrados finais:** acervo e administração abrem sob `/acervo-musical/#/` e `/acervo-musical/#/admin`; fontes e worker carregam sem 404; nomes com espaços não quebram download. Testar largura de 390 px e 1280 px, navegação por teclado, rótulos dos campos, ordenação sem arrastar e mensagens de erro acessíveis. Prévia e arquivo baixado têm o mesmo conteúdo após alterações rápidas de fonte/tamanho.

Executar o caso administrativo com configuração do Supabase local de teste e sessão anônima; no modo demo, a administração deve apresentar a mensagem de indisponibilidade em vez do formulário de login.

```ts
test('abre administração diretamente no caminho de projeto', async ({page}) => {
  await page.goto('/acervo-musical/#/admin');
  await expect(page.getByRole('heading', {name: 'Entrar na administração'})).toBeVisible();
});
```

- [ ] **2. Executar `rtk npm run test:e2e -- e2e/base-path.spec.ts e2e/accessibility.spec.ts`:** corrigir configuração de execução antes de avaliar as falhas de produto; esperar falhas das condições ainda não atendidas.
- [ ] **3. Implementar base e pipelines:** CI em pull requests executa instalação por lockfile, testes unitários, typecheck, build, integração local Supabase e testes de navegador. Pages publica em `push` no branch principal ou acionamento manual, após as verificações do mesmo commit, usando permissões `pages: write`, `id-token: write` e artefato oficial de Pages; não publicar em eventos de pull request. Fixar versões das Actions conforme documentação oficial consultada no momento da implementação. Configurar base em fontes, worker e assets, sem strings de URL fixas no código.
- [ ] **4. Escrever instruções operacionais:** executar localmente; distinguir demo e produção; criar conta/projeto Supabase; aplicar migração, cadastrar UUID administrativo e bloquear signup; configurar URL/retorno de login; criar repositório e habilitar Pages por Actions; informar parâmetros públicos e dependências externas, sem pedir senha no chat. Registrar resultados reais de validação em `docs/verification.md`, inclusive testes ainda dependentes de infraestrutura.
- [ ] **5. Executar uma rodada final:** `rtk npm test -- --run`, `rtk npm run typecheck`, `rtk npm run build`, `rtk npm run test:integration` e `rtk npm run test:e2e`. Esperar aprovação e inspecionar visualmente PDFs de letras nas três fontes, caso de fonte manual, overflow e cifras longas. Não repetir toda a suíte sem alteração/falha que justifique. Solicitar revisão do código conforme habilidade de revisão antes da integração final.
- [ ] **6. Commit e entrega:** `rtk git commit -m 'chore: prepare verified GitHub Pages deployment'`, após adicionar os arquivos da tarefa. Quando houver acesso às contas, publicar pelo GitHub Pages e conferir o resultado do workflow e o endereço real; se faltar acesso/configuração, entregar a versão local verificável e indicar exatamente a etapa pendente. Usar o fluxo de conclusão de branch apropriado; não declarar o site online com base apenas no build local.

## Referências técnicas verificadas durante o planejamento

- [Vite: configuração inicial e requisitos de Node](https://vite.dev/guide/).
- [Mammoth: extração de texto e entrada ArrayBuffer no navegador](https://github.com/mwilliamson/mammoth.js#api).
- [PDF.js: carregamento e renderização](https://mozilla.github.io/pdf.js/examples/) e [API de texto](https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib-PDFPageProxy.html).
- [pdf-lib: fonte incorporada e métricas com fontkit](https://pdf-lib.js.org/#embed-font-and-measure-text).
- [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security), [Storage](https://supabase.com/docs/guides/storage/security/access-control) e [desenvolvimento local](https://supabase.com/docs/guides/local-development).
- [GitHub Pages: publicação com workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Revisão do plano e execução

Cobertura: fluxo público/tarefa 1; fontes e letras/2; cifras/3; prévia/4; dados e acesso/5; importação/6; administração/7; publicação e verificação integrada/8. Os cinco riscos de Review Focus têm testes nas tarefas indicadas. Ainda não houve implementação nem comprovação de integração com serviços externos.

Recomendação: execução nativa nesta conversa, pois as oito tarefas compartilham contratos, fontes e motores de PDF. Isso mantém as decisões no mesmo contexto; uma revisão independente ao final deve verificar a integração completa. A alternativa é execução por subagentes, com implementador e revisor por tarefa, a um custo maior de coordenação. Aguardar revisão do plano e escolha do método antes de iniciar a tarefa 1.
