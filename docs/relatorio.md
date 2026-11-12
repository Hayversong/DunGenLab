# DunGenLab — Relatório do Projeto

> Documento para **entender tudo o que vamos fazer e por quê**. Lê-se do começo ao fim, sem precisar abrir código. Os detalhes técnicos de referência estão em `contexto.md`; o passo a passo de execução está em `orientacao.md`.

---

## 1. Visão geral

O **DunGenLab** é um aplicativo web que mostra, de forma visual e interativa, **como algoritmos de geração procedural constroem mapas de masmorra**. Em vez de entregar só o mapa pronto, o app **anima a construção passo a passo**: você vê o andarilho abrindo caminho, a caverna se suavizando a cada iteração, o espaço sendo cortado em pedaços e as salas sendo ligadas por corredores.

A pessoa usuária escolhe o algoritmo, ajusta parâmetros, define uma *seed* (para repetir exatamente o mesmo mapa) e, ao final, vê métricas do resultado e exporta o mapa em PNG ou JSON.

**Por que esse projeto?** Porque une dois assuntos que valem muito no portfólio: (1) algoritmos de geração procedural, um tema central em jogos roguelike, e (2) frontend com Canvas e animação, que mostra domínio de renderização, estado e organização de código. Além disso, o resultado é **visual e demonstrável em segundos** (um GIF no README já vende o projeto).

## 2. O que será entregue

| Entrega | Descrição |
|---|---|
| Aplicação web | Visualizador com 3 algoritmos, animação, parâmetros, seed, métricas e exportação |
| Núcleo reutilizável | Módulo TypeScript puro com os algoritmos, sem dependência de React ou DOM |
| Testes automatizados | Determinismo do RNG, métricas e exportação |
| Repositório organizado | Histórico de commits claro, README com GIFs e explicações |
| Deploy público | Link para mostrar em currículo, LinkedIn e entrevistas |
| Documentação | Estes três arquivos, mantidos em `docs/` |

## 3. Como funciona, em termos simples

### 3.1 A grade
O mapa é uma grade de quadradinhos (tiles). Cada tile é **parede** ou **chão** (e, no BSP, o chão pode ser marcado como sala ou corredor). Tamanho padrão: 80 por 50.

### 3.2 A seed
Computadores não geram números verdadeiramente aleatórios; usam uma fórmula que, a partir de um valor inicial (a *seed*), produz uma sequência que *parece* aleatória, mas é sempre a mesma para a mesma seed. É isso que permite dizer "o mapa da seed `gato-preto`" e obter exatamente o mesmo mapa em qualquer computador, e que também torna o projeto **testável**.

### 3.3 Geradores que "pausam"
Cada algoritmo é escrito como uma *generator function* do JavaScript: uma função que pode **parar no meio, devolver um valor e continuar depois de onde parou**. Isso encaixa perfeitamente em animação: a cada quadro, a interface pede alguns passos ao algoritmo, desenha o estado atual e espera o próximo quadro. Pausar, avançar um passo ou "terminar de uma vez" vêm quase de graça.

### 3.4 Separação de responsabilidades
Três camadas independentes:
- **Núcleo:** os algoritmos, a seed e as métricas. Não sabe que existe tela.
- **Renderizador:** recebe uma grade e a desenha no canvas. Não sabe como a grade foi gerada.
- **Interface:** botões, sliders e painéis em React. Junta as duas pontas.

Essa separação facilita testar, trocar partes e reaproveitar o núcleo em outros projetos.

## 4. Os três algoritmos

### 4.1 Drunkard's Walk (Caminhada do Bêbado)
**Ideia:** um "bêbado" começa no meio do mapa e anda aleatoriamente. Por onde passa, ele abre chão. Quando já abriu a quantidade desejada de chão, para.
**Resultado:** cavernas orgânicas, irregulares e sempre conectadas (porque tudo foi aberto em um único caminho contínuo).
**Prós:** simplíssimo; garante conectividade; ótimo para ser o primeiro.
**Contras:** pouco controle sobre o formato; pode formar blocos densos ou túneis longos e feios.
**Parâmetros que mudam o visual:** porcentagem de chão, número de andarilhos e tendência de manter a direção (quanto maior, mais túneis retos).

### 4.2 Cellular Automata (Autômato Celular)
**Ideia:** começa com ruído (paredes espalhadas aleatoriamente) e repete uma regra local: cada tile olha seus 8 vizinhos e decide se vira parede ou chão conforme quantos vizinhos são parede. Depois de algumas rodadas, o ruído "cristaliza" em cavernas suaves.
**Resultado:** cavernas naturais, com aparência de grutas.
**Prós:** visual muito natural; poucos parâmetros; resultado lindo de animar (dá para ver o caos virando ordem).
**Contras:** pode gerar várias cavernas isoladas (regiões desconectadas), e é preciso tratar isso se quiser um mapa jogável.
**Parâmetros:** chance inicial de parede, número de iterações e limites de nascimento/sobrevivência da regra.

### 4.3 BSP (Binary Space Partitioning)
**Ideia:** divide o mapa em dois retângulos, depois divide cada um em dois, e assim por diante (como cortar uma folha de papel repetidamente). Nas peças finais, coloca uma sala. Depois liga as salas vizinhas com corredores, seguindo a estrutura da árvore de cortes.
**Resultado:** masmorras clássicas com salas retangulares e corredores.
**Prós:** controle total sobre tamanho e quantidade de salas; conectividade garantida pela própria estrutura; cara de "dungeon de jogo".
**Contras:** visual mais "geométrico" e previsível; é o mais trabalhoso dos três.
**Parâmetros:** tamanho mínimo das folhas, profundidade máxima, espaçamento das salas e largura dos corredores.

### Comparação rápida

| | Drunkard's Walk | Cellular Automata | BSP |
|---|---|---|---|
| Estilo | Caverna irregular | Gruta natural | Salas e corredores |
| Dificuldade | Baixa | Média | Média/alta |
| Conectividade | Garantida | **Não garantida** | Garantida |
| Controle do resultado | Baixo | Médio | Alto |
| Melhor animação | Crescimento | Cristalização | Cortes e conexões |

## 5. Funcionalidades em detalhe

1. **Animação com controles:** gerar, play/pause, avançar um passo, terminar de uma vez, reiniciar, e controle de velocidade.
2. **Painel de parâmetros dinâmico:** cada algoritmo descreve seus parâmetros e a interface monta os campos sozinha; adicionar um algoritmo novo no futuro não exige mexer na interface.
3. **Seed reproduzível:** campo de texto e botão de seed aleatória.
4. **Métricas:** porcentagem de chão, quantidade de regiões conectadas, tamanho da maior região, número de salas (BSP) e tempo de geração. Permitem **comparar algoritmos com números**, não só no olho.
5. **Exportação:** PNG para imagem e JSON para dados (com versão do formato, seed e parâmetros, permitindo recarregar depois).
6. **Descrição do passo atual:** um texto curto ("Dividindo região 2 de 5") que ajuda a entender o algoritmo enquanto ele roda.

## 6. Decisões técnicas e justificativas

| Decisão | Justificativa |
|---|---|
| **React + TypeScript + Vite** | Combinação padrão de mercado; setup rápido; tipos ajudam a evitar bugs no modelo de dados |
| **Canvas 2D** (e não DOM/SVG) | Uma grade de milhares de tiles seria pesada como elementos DOM; o canvas desenha tudo de uma vez |
| **Generator functions** | Dão pausa/avanço/animação de graça e mantêm o algoritmo escrito de forma natural |
| **Grid mutável compartilhado** | Copiar o grid inteiro a cada passo gastaria memória e tempo; o gerador muta o mesmo grid e o renderer só o redesenha |
| **Grid em `Uint8Array`** | Compacto e rápido para milhares de tiles |
| **PRNG próprio com seed (mulberry32)** | `Math.random()` não aceita seed; precisamos de reprodutibilidade |
| **Núcleo sem React** | Testável isoladamente e reutilizável em outros projetos |
| **BFS iterativo** para regiões | Recursão estoura a pilha em grids grandes |
| **Sem backend** | Reduz escopo; tudo roda no navegador; deploy estático e gratuito |
| **Vitest** | Já integrado ao Vite; testes rápidos para o núcleo |

## 7. Cronograma resumido

| Quando | O que | Resultado visível ao fim do bloco |
|---|---|---|
| Sábado manhã | Setup, tipos, grid, RNG com testes | Projeto roda; testes passam |
| Sábado tarde | Renderer, Drunkard's Walk, controles de animação | Primeira caverna crescendo no canvas |
| Domingo manhã | Cellular Automata e BSP | Três algoritmos funcionando |
| Domingo tarde | Métricas, exportação, polimento, README, deploy | Projeto publicado com link |

**Princípio de gestão:** o projeto sempre deve estar em um estado "mostrável". Ao fim do sábado já há algo funcionando; o domingo só acrescenta. Se o tempo apertar, há um plano de corte definido em `orientacao.md` (o que cortar e, principalmente, o que **não** cortar: seed, animação e README).

## 8. Riscos e mitigação

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Passar muito tempo no visual em vez de nos algoritmos | Alta | Médio | Paleta simples definida de antemão; polimento só na fase 7 |
| Loop infinito no Drunkard's Walk | Média | Alto (trava a aba) | Limite máximo de passos e margem nas bordas |
| BSP com muitos casos de borda (cortes inválidos, salas minúsculas) | Alta | Médio | Validar `minLeafSize`; testar com várias seeds |
| CA gerando cavernas desconectadas | Alta | Baixo | Mostrar na métrica de regiões; conectar regiões como extra |
| Animação duplicada/travando por bug de ciclo de vida do React | Média | Médio | Cleanup do `requestAnimationFrame`; atenção ao StrictMode |
| Escopo crescer ("já que estou aqui, vou fazer X") | Alta | Alto | Lista de fora do escopo no `contexto.md`; anotar ideias numa seção "v2" |
| Cansaço no domingo à noite deixando README e deploy de lado | Média | Alto | Deixar README e deploy como itens obrigatórios do plano de corte |

## 9. O que será aprendido

- **Algoritmos:** caminhada aleatória, autômatos celulares, particionamento binário do espaço, flood fill/BFS.
- **Determinismo:** PRNG, seeds, importância de eliminar fontes de aleatoriedade escondidas.
- **Canvas e animação:** `requestAnimationFrame`, redesenho eficiente, pixel-perfect.
- **Arquitetura:** separar domínio, renderização e interface; contratos via interfaces TypeScript.
- **Qualidade:** testes de propriedades (determinismo, limites) e testes de métricas com casos desenhados à mão.
- **Entrega:** README de portfólio, exportação de arquivos no navegador, deploy estático.

## 10. Possíveis evoluções (v2, depois do fim de semana)

- Mais algoritmos: Perlin/Simplex noise, Wave Function Collapse, Voronoi, geração por "rooms and mazes".
- Modo comparação: dois algoritmos lado a lado com a mesma seed.
- Pós-processamento: conectar regiões isoladas, remover cantos, preencher buracos.
- Compartilhar o mapa pela URL (seed e parâmetros na query string).
- Adicionar portas, pontos de spawn e itens, aproximando de um mapa de jogo real.
- Exportar para formatos de engine (por exemplo, Tiled/TMX ou CSV de tilemap) para usar no GameMaker ou na Godot.
- Reaproveitar o núcleo e as métricas como base de comparação entre algoritmos em um trabalho acadêmico sobre geração procedural de mapas.

## 11. Definição de sucesso

O projeto é considerado bem-sucedido se, ao final do fim de semana:

1. Qualquer pessoa abre o link, escolhe um algoritmo, clica em **Gerar** e entende o que está acontecendo.
2. A mesma seed gera sempre o mesmo mapa.
3. O código está organizado de modo que adicionar um quarto algoritmo exige **só criar um arquivo e registrá-lo**.
4. O README convence em 30 segundos, com um GIF da animação.
5. Você consegue **explicar cada algoritmo, com as próprias palavras, em uma entrevista**.

O item 5 é o mais importante: o objetivo final não é apenas ter o app, mas dominar o que está por trás dele.

## 12. Próximo passo

Antes de escrever código, revisar estes três documentos e confirmar:
- [ ] Os três algoritmos escolhidos estão bons ou prefere trocar algum?
- [ ] Stack (React + TypeScript + Vite) confirmada, ou prefere outra (Svelte, Vue, JS puro)?
- [ ] Onde vai publicar (Vercel, Netlify, GitHub Pages)?

Com isso confirmado, o início é a **Fase 0** de `orientacao.md`.
