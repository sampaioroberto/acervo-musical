# Revisão independente

Revisão de todo o branch, realizada em contexto novo por um agente independente, sobre o commit 9df6ad949b90d1efc3b749988a74f6727d4eeceb. O revisor teve acesso à especificação, plano, decisões e evidências e não modificou os arquivos. Resultado: pronto para integração após corrigir quatro achados importantes. Nenhum achado crítico ou menor separado.

## Achados e correções

1. **Transação pendente e remoção do original.** Uma consulta negativa logo após erro de transporte não comprova que a transação falhou. A correção distingue rejeições comprovadas de resultados ambíguos; preserva o original e reutiliza o identificador estável. O teste faz o commit somente depois da reconciliação negativa e confirma arquivo e vínculo intactos, sem duplicação na retentativa. A classificação de erros também foi verificada usando o cliente Supabase real com transporte controlado.
2. **Recuo do primeiro acorde.** O trim global removia espaços horizontais reconstruídos. Agora somente linhas vazias externas são removidas. Um PDF real sintético, começando com um acorde quatro espaços à direita do verso, reproduziu a falha e passou com a correção.
3. **Estado privado durante troca de conta.** A identidade é invalidada imediatamente, desmontando os formulários antes da consulta de autorização. Renovação do token da mesma conta preserva a edição. Testes cobrem consultas retardadas que negam ou rejeitam acesso, preservação na renovação e eventos de identidade emitidos pelo adaptador.
4. **Quebra de linhas na consulta de cifras.** Cifras agora preservam espaços e linhas e têm rolagem horizontal. Letras continuam com quebra automática. A regressão compara os estilos calculados do componente; o estilo aplicado também foi conferido no navegador via CUA.

Cada achado teve uma regressão observada falhar antes da correção e passar depois. As correções foram feitas em uma única rodada, sem nova revisão independente. A suíte final passou com 49 testes; integração real passou com 2 testes; SQL/pgTAP passou com 4; TypeScript e build passaram.

## Pontos que o revisor não julgou e decisões do implementador

- **Publicação e Supabase na nuvem:** ainda não configurados. A entrega local pode ser conferida, mas a publicação exige seguir setup-supabase.md e publication.md. Custo: a primeira configuração em produção ainda pode revelar problemas de ambiente.
- **Execução remota de CI/Playwright:** configuração revisada; execução não realizada. O workflow de publicação depende do CI aprovado. Custo: eventuais diferenças do ambiente remoto serão descobertas na primeira execução.
- **Arquivos reais do usuário:** não fornecidos. A revisão do texto importado é obrigatória antes de publicar. Custo: documentos reais podem exigir correção manual.
- **Tabelas, colunas, imagens, estilos do Word e OCR:** permanecem fora do escopo aprovado. Custo: documentos com esses recursos precisam de revisão ou texto manual.
- **Nova inspeção visual independente:** o revisor não controlou o navegador. A inspeção documentada por CUA e Poppler foi feita pelo implementador. Custo: não há segunda avaliação visual independente.
- **Nova execução independente das suítes/políticas:** o revisor não repetiu os testes completos. O implementador executou novamente os testes após as correções e registrou os resultados. Custo: os resultados não foram recertificados por outra pessoa ou ambiente.

Não há achados menores adiados.

## Retentativa de upload com resultado incerto

Se aparecer “Não foi possível confirmar o resultado”, mantenha a revisão aberta e tente salvar novamente sem reimportar. O arquivo é preservado porque a gravação anterior ainda pode confirmar. Abandonar essa revisão pode deixar um original privado sem associação: não se faz remoção automática baseada apenas em tempo ou em uma consulta negativa, pois isso poderia apagar um arquivo de uma transação tardia.
