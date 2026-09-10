# Briefing — Jarvis KGFM
Sistema pessoal de estratégia, decisão e execução para o CEO da KGFM

---

## 1. Problema

O gargalo da KGFM é a atenção do Lucian. Comercial, engenharia, prospecção e entregas competem pela mesma cabeça, e a escolha do que fazer agora é feita por memória e por pressão — não por dado.

Sintomas atuais:

- Cotação de peças pequenas (Shopee) parada e atrasada, sem depender de capital de giro.
- Projeto Riachuelo (alto valor) andando devagar por dispersão, não por falta de capacidade.
- Prospecção só destravou quando virou foco exclusivo por alguns dias — e nesse período a engenharia parou.

O padrão é claro: uma área anda quando as outras param. E o custo não é só de prazo — é psicológico. Carregar quatro frentes na cabeça consome energia que deveria ir para decisão.

Falta instrumento. **O que não é medido não é gerenciado** — e hoje nada aqui é medido.

## 2. Objetivo

Um assistente que responde, várias vezes por dia, a uma pergunta só:

> "O que eu faço agora, e por quê?"

E uma segunda, no fim de cada semana e de cada trimestre:

> "Isso que eu fiz me aproximou de onde eu quero estar?"

Resultado esperado: menos carga mental, decisão mais rápida e melhor, dinheiro que para de vazar por projeto travado.

**Critério de sucesso da v1:** em uma semana de uso, o painel substitui o esforço de lembrar, e nenhum projeto ativo fica parado por esquecimento.

---

## 3. Fundamento — o que a literatura resolve aqui

Cada referência abaixo entra por um motivo específico. Não é resumo de livro: é a tese, o que se aplica ao seu caso, **o que descartar**, e a regra concreta que ela vira dentro do sistema. Literatura que não vira comportamento é decoração.

### 3.1 Getting Things Done — David Allen

**A tese.** O cérebro é bom em ter ideias e péssimo em guardá-las. Toda ideia retida gera um custo mental contínuo, mesmo quando você não está pensando nela conscientemente. A solução é externalizar tudo para um sistema em que você confie — e a confiança é o ponto: um sistema que você desconfia continua sendo carregado na cabeça.

**O que se aplica a você.** Exatamente o diagnóstico da sua tortura psicológica. Você não está sobrecarregado só por volume de trabalho; está sobrecarregado por ser o repositório de tudo. E a **revisão semanal** dele — o momento fixo em que o sistema é reconciliado com a realidade — é o que impede o sistema de virar cemitério de itens velhos.

**O que descartar.** O sistema de contextos ("ligações", "no escritório", "recados") é de 2001 e pressupõe alguém que executa tarefas discretas. Você não trabalha assim: seu trabalho é decisão e bloco longo. Descartar também a taxonomia rígida de listas — a classificação tem que ser feita pelo sistema, não por você.

**Vira no sistema:**
- Captura em segundos, entrada única, zero campos obrigatórios.
- Classificação automática pelo Claude, nunca pelo usuário.
- Ritual semanal de reconciliação, disparado pelo próprio painel.

### 3.2 A Meta / Teoria das Restrições — Eliyahu Goldratt

**A tese.** Todo sistema tem uma restrição, e a capacidade do sistema inteiro é a capacidade dessa restrição. Melhorar qualquer coisa que não seja o gargalo não aumenta o resultado — só aumenta o estoque em processo. O ciclo é: identificar a restrição, explorá-la ao máximo, subordinar tudo a ela, elevá-la, e recomeçar.

**O que se aplica a você.** Você **é** a restrição da KGFM. Isso não é fraqueza, é a descrição correta do sistema — e muda tudo. Significa que otimizar processo que não passa por você é desperdício, e que a pergunta certa não é "o que está mais atrasado?", e sim "o que está travando o fluxo?". Um item atrasado que não bloqueia nada é menos urgente do que um item no prazo que trava três frentes.

Também explica o vazamento de dinheiro: cada dia que a cotação Shopee fica parada não é custo de produção, é receita não realizada — o que Goldratt chama de custo da restrição ociosa.

**O que descartar.** Todo o aparato de chão de fábrica: tambor-pulmão-corda, contabilidade de ganho, medição de throughput em unidades. Você não está gerenciando uma planta, está gerenciando uma agenda.

**Vira no sistema:**
- O algoritmo de priorização aponta para o que destrava fluxo, não para o mais atrasado.
- Toda recomendação vem com o argumento do porquê — a lógica da restrição fica explícita.
- Identificação de itens que só você pode fazer versus itens que estão na sua fila indevidamente (candidatos a delegação).

> Nota comercial: essa mesma tese é a citação a usar no slide de fluxo e gargalo do deck da KGFM.

### 3.3 Personal Kanban — Jim Benson & Tonianne DeMaria Barry

**A tese.** Duas regras só: visualize o trabalho e limite o trabalho em progresso. O limite de WIP é o mecanismo — trabalho em progresso não entrega valor, e cada frente aberta a mais multiplica o custo de coordenação mental.

**O que se aplica a você.** É o remédio direto para "estou fazendo várias coisas ao mesmo tempo". Note que sua própria experiência já validou isso: o CRM só ficou pronto quando virou frente única por quatro dias. O sistema precisa transformar essa descoberta acidental em regra.

**O que descartar.** O quadro físico de post-its e a cerimônia de colunas. E cuidado com o excesso de granularidade: seu quadro não deve ter trinta cartões — deve ter frentes.

**Vira no sistema:**
- Limite duro de frentes abertas por área. O painel bloqueia a abertura de uma nova sem fechar ou explicitamente arquivar a anterior.
- Frentes, não tarefas atômicas, como unidade de visualização.

### 3.4 Deep Work — Cal Newport

**A tese.** Trabalho cognitivamente exigente exige blocos longos sem interrupção. A troca de contexto deixa "resíduo de atenção": parte da mente continua na tarefa anterior, e a capacidade cai mesmo depois que você mudou de assunto.

**O que se aplica a você.** Engenharia e proposta comercial são trabalho profundo; prospecção e follow-up são rasos. Misturar os dois no mesmo dia degrada os dois. É por isso que a engenharia "pesa na mente" mesmo quando você está no comercial — é resíduo de atenção, não falta de disciplina.

**O que descartar.** A prescrição monástica de isolamento. Você é dono de empresa, tem cliente e equipe; o modelo aplicável é o rítmico — blocos por área em dias ou períodos fixos.

**Vira no sistema:**
- Recomendação por bloco de área, não por tarefa avulsa.
- Cruzamento com a agenda do Google para achar as janelas de bloco profundo reais.
- Alerta quando um dia está fragmentado demais para conter trabalho profundo.

### 3.5 Good Strategy Bad Strategy — Richard Rumelt

**A tese.** Estratégia não é lista de metas nem frase de visão. É um núcleo de três partes: **diagnóstico** (qual é o problema real), **política norteadora** (a abordagem escolhida para atacá-lo) e **ações coerentes** (movimentos que se reforçam). Estratégia ruim é a que só empilha objetivos ambiciosos sem escolher o que não fazer.

**O que se aplica a você.** É o que dá conteúdo à camada de horizontes da seção 4 — e, principalmente, é o que permite **descartar**. Sem política norteadora explícita, toda oportunidade parece boa e você diz sim para tudo. Com ela, dá para dizer: essa é ótima e não é nossa.

**O que descartar.** Os estudos de caso corporativos de larga escala. Interessa o núcleo e o teste de coerência, não o aparato analítico.

**Vira no sistema:**
- A estratégia é armazenada estruturada (diagnóstico, política, ações), não como texto solto.
- Filtro de oportunidade: toda oportunidade nova é confrontada com a política norteadora antes de virar frente.

### 3.6 A Guerra da Arte / Turning Pro - Steven Pressfield
*(acrescentado em 10/09/2026, a pedido do Lucian)*

**A tese.** Existe uma forca previsivel que se opoe a todo trabalho que importa.
Pressfield chama de Resistencia. Ela nao chega como preguica - chega disfarcada
de tarefa urgente, de pesquisa necessaria, de ferramenta que precisa ser
construida antes. Quanto mais importante o trabalho, mais forte ela puxa. A
saida nao e inspiracao: e virar profissional, aparecer no horario e trabalhar
mesmo sem vontade.

**O que se aplica a voce.** E a descricao literal de tres itens da sua propria
lista: procrastinar ate o prazo apertar, abandonar rotina sob estresse, e
construir infraestrutura quando deveria estar vendendo. A "armadilha
operador/arquiteto" que voce nomeou e a Resistencia em estado puro - construir
sistema e mais agradavel do que ligar para o comprador, e parece trabalho.

E ele da o teste que faltava: **o profissional aparece todo dia e conta as
horas**. Nao "se sentiu produtivo" - contou. Por isso tempo sem registro conta
como nada feito.

**O que descartar.** A mistica de musa, o vocabulario de artista e a leitura de
que Resistencia e uma entidade. Aqui ela e um numero: as horas do expediente
que nao viraram apontamento.

**Vira no sistema:**
- O buraco do dia: expediente decorrido menos horas apontadas, listrado na barra.
  Sem desconto de almoco nem de reuniao - se foi trabalho, aponta.
- A voz do painel (`src/lib/resistencia.ts`) confronta pelo estado, nunca por
  sorteio, e as frases sao escritas por nos: aplicar Pressfield, nao cita-lo.
- Nada de elogio, medalha ou sequencia de dias. Gamificacao e o oposto de virar
  profissional: transforma o trabalho em recompensa externa.

---

## 4. Camada de estratégia — horizontes

A espinha dorsal do sistema. Os indicadores medem avanço **em função da estratégia**, não produtividade genérica.

### Estrutura de horizontes

| Horizonte | O que contém | Frequência de mudança |
|---|---|---|
| **5 anos** | Onde a KGFM precisa estar. Posição de mercado, porte de projeto, capacidade instalada. | Raramente. Muda por decisão consciente, não por evento. |
| **2 anos** | As apostas estruturais que tornam o horizonte de 5 anos possível. | Revisão anual. |
| **Ano corrente** | Objetivos do ano, com números. | Revisão trimestral. |
| **Mês** | Desdobramento dos objetivos do ano em avanços concretos. | Ajuste mensal. |
| **Semana / dia** | Frentes e blocos. É o que o painel opera no dia a dia. | Contínuo. |

Cada nível existe para justificar o de baixo. Toda frente aberta no painel deve conseguir responder a que objetivo mensal serve, e todo objetivo mensal, a que objetivo anual serve. **Frente que não amarra em nada é candidata natural a descarte** — e o sistema deve dizer isso na cara.

### Revisão trimestral

Quatro vezes por ano, ritual fixo e conduzido pelo próprio sistema:

1. O que avançou e o que travou, com dado, não com memória.
2. Onde estava o gargalo no trimestre.
3. O que entrou fora da estratégia e consumiu tempo — e quanto.
4. O que muda no ano corrente. O horizonte de 2 e 5 anos só entra em pauta se algo estrutural mudou.

A cadência trimestral é deliberada: curta o suficiente para corrigir rota, longa o suficiente para não virar reação a ruído.

### Dinamismo sem perder o eixo

Oportunidades vão aparecer — feira, indicação, cliente novo, projeto grande fora do foco. O sistema não bloqueia; ele **explicita o custo**:

- Toda oportunidade nova é confrontada com a política norteadora e com as frentes já abertas.
- O sistema responde: isso avança a estratégia, é neutro, ou compete com ela?
- Decisões de descarte ficam registradas com o motivo. Assim, quando a mesma oportunidade voltar em seis meses, você não reabre a discussão do zero.

## 5. Arquitetura funcional — três camadas

### Camada 1 — Captura
Entrada única, sem escolher pasta, categoria ou projeto.

- **Texto** (desktop e mobile)
- **Voz** (mobile, uso em trânsito)
- **Print de tela / recorte** (LinkedIn, notícia, e-mail), com extração do conteúdo da imagem

O Claude classifica sozinho em **tarefa**, **insight**, **compromisso** ou **contato/oportunidade**, associa à área, ao projeto e — quando aplicável — ao objetivo estratégico. O usuário só corrige quando errar.

Insights de feiras, livros e conteúdo entram por aqui e ficam vinculados ao tema, disponíveis quando o assunto voltar (como a citação do Goldratt para o deck comercial).

*Por que assim:* atrito de registro é a causa número um de morte desses sistemas. Se levar mais que dez segundos, você abandona em duas semanas — e o histórico de tentativas anteriores confirma isso.

### Camada 2 — Painel de instrumentos
Visual, não relatório. É o coração do sistema e a parte que mais o diferencia do CRM.

- **Mostrador por área** — comercial, engenharia, prospecção, entregas: quanto cada uma foi alimentada e quanto está afastada do planejado.
- **Criticidade:** o que vai atrasar, cliente sem retorno, reunião sem preparo.
- **Alinhamento estratégico:** quanto do esforço recente serviu aos objetivos declarados.
- **Cronograma** dos projetos ativos, sem abrir Project ou Asana.

Duas interfaces:
- **Desktop:** aproveita monitor grande, tudo visível de uma vez, sem navegação.
- **Mobile:** consulta rápida, captura e a próxima ação.

*Por que assim:* o mostrador tem que comunicar em dois segundos, de relance. Número em tabela exige leitura e interpretação — ponteiro e barra não exigem.

### Camada 3 — Cérebro
O Claude lê o estado do banco, cruza com a agenda do Google e devolve:

- Recomendação do que fazer agora, **com o argumento do porquê**.
- Alerta de desalinhamento entre execução e estratégia.
- Síntese semanal: o que andou, o que travou, onde está o gargalo.
- Condução da revisão trimestral.

## 5.4 Tarefas e tempo real (acrescentado em 10/09/2026)

A frente continua sendo a unidade do painel. Dentro dela existem **tarefas**, e
cada tarefa tem cronômetro **start/stop**. O dashboard passa a mostrar tempo
real: horas apontadas hoje por área, cronômetro corrente em destaque, e o
confronto entre horas gastas e horas planejadas por área.

**Um cronômetro por vez, no sistema inteiro.** Começar tarefa de outra área
encerra a anterior com motivo "troca". Isso não é limitação técnica: é o limite
de WIP e o Deep Work saindo do papel. O relógio não deixa você estar em duas
frentes, e o registro da troca vira o dado que mostra quantas vezes por dia a
sua atenção pulou.

**Contra o esquecimento.** Cronômetro depende de disciplina, e este sistema foi
desenhado para não depender dela. Três defesas:
- Começar é um toque, direto do cartão da frente. Nunca uma tela de formulário.
- Auto-encerramento depois de N horas (padrão 3), marcando o apontamento como
  "revisar". Sem isso, uma noite esquecida vira 14 horas de engenharia e o
  dashboard mente com cara de precisão.
- O painel cobra o silêncio: "6 horas de expediente hoje, nenhum apontamento".

**Efeito colateral que economiza trabalho:** apontar tempo já é mexer na frente.
O apontamento gera `movimento` sozinho, então não existe registro manual de
"andei nisso".

**O que ainda NÃO muda:** a fórmula do mostrador continua medindo movimento por
data de último toque. Trocar para horas apontadas exige saber quanto é "normal"
por área, e isso só aparece depois de duas ou três semanas de uso. Trocar antes
seria chute com aparência de método.

## 6. Stack

Reaproveita integralmente o que já roda no CRM:

- **Vercel** — hospedagem da aplicação, front-end e funções de servidor.
- **Neon (Postgres)** — banco de dados. Plano gratuito: 0,5 GB de armazenamento e 100 CU-hours por projeto/mês. Para dados de texto, folgado.
- **Claude Code** — construção e evolução, sem Zapier/Make e sem custo de ferramenta intermediária.
- **Google Calendar** — somente leitura na v1. Não se constrói agenda própria.

*Ponto de atenção:* o limite que aperta primeiro tende a ser o tempo de execução das funções na Vercel, não o banco.

*Por que sem middleware:* a tentativa anterior com Zapier custou tempo, custou dinheiro e travou. Código próprio via Claude Code elimina a camada de tradução entre ferramentas — que é justamente onde as integrações quebram.

## 7. Escopo

**Entra na v1** (bloco concentrado, alvo de ~4 dias, no modelo do CRM):
- Captura por texto, voz e imagem, com classificação automática
- Banco de estratégia (horizontes), projetos, áreas e frentes
- Painel com mostradores por área, criticidade e alinhamento estratégico
- Leitura da agenda do Google
- Recomendação diária "o que fazer agora e por quê"
- Síntese semanal
- Tarefas dentro da frente, com cronômetro start/stop e horas do dia por área
- Menu de três pontinhos e página de configuração com ajuste dos pesos

**Fica para depois:**
- Escrita na agenda (criar e mover compromissos)
- Integração com o CRM/Agendor
- Previsão automática de cronograma de engenharia
- Relatórios para terceiros
- Ritual trimestral automatizado (na v1, conduzido em conversa)

*Por que esse corte:* escrita em agenda e integração com CRM são o tipo de item que transforma quatro dias em um mês. Ambos são melhorias do sistema — nenhum dos dois é o que responde "o que faço agora".

## 8. Riscos

1. **Armadilha operador/arquiteto.** Construir sistema é mais agradável do que fechar venda. Enquanto o Jarvis é construído, Shopee e Riachuelo continuam parados. *Mitigação:* bloco concentrado fora do horário comercial, escopo travado, sem "só mais uma feature".
2. **Captura com atrito.** Qualquer passo a mais derruba a adesão. *Mitigação:* caixa única, classificação automática, zero campos obrigatórios.
3. **Painel bonito e vazio.** Instrumento sem dado não mede nada. *Mitigação:* a v1 só entra em uso com estratégia e projetos ativos reais carregados.
4. **Escopo visual subestimado.** É a parte mais cara e a que diferencia do CRM. *Mitigação:* definir os mostradores antes de escrever código.
5. **Estratégia genérica.** Se o horizonte de 5 anos virar frase de efeito, o filtro de oportunidade não filtra nada e o alinhamento não mede nada. *Mitigação:* aplicar o núcleo de Rumelt — diagnóstico, política, ações — na primeira carga.

## 9. Próximo passo

Abrir o projeto no Claude Code com este briefing e começar pelos dois itens que travam todo o resto:

1. **Definir os mostradores:** quais áreas, o que cada ponteiro mede, e qual o critério de crítico.
2. **Carregar a estratégia:** diagnóstico, política norteadora e objetivos dos horizontes de 5 anos, 2 anos e ano corrente.

Sem o item 2, o painel mede atividade. Com ele, mede progresso.
