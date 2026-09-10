@AGENTS.md

# CLAUDE.md — Jarvis KGFM

Contexto permanente do projeto. Leia este arquivo inteiro antes de qualquer tarefa.

---

## 1. Quem é o usuário

Lucian, fundador e dono da KGFM Soluções Industriais (integradora de automação intralogística, Guarulhos/SP). Opera praticamente sozinho: é comercial, engenharia, prospecção e entregas ao mesmo tempo. Financeiro é BPO terceirizado; freelancers só quando há serviço fechado.

**Padrões dele que o sistema existe para combater** (ele mesmo os nomeou — trate como requisito, não como julgamento):

- Procrastina até o prazo apertar.
- Começa rotinas e abandona no meio, principalmente sob estresse.
- Tende a ficar no operacional em vez da estratégia.
- **Crítico:** deixa proposta comercial parada por inércia — não é prazo, é inércia. É a porta de entrada de receita.
- **Crítico:** atrasa emissão de nota fiscal e cobrança.
- Constrói infraestrutura quando deveria estar vendendo ("armadilha operador/arquiteto").

**Consequência de design:** o sistema não pode depender da disciplina dele. Tem que ser mais fácil usar do que não usar, e tem que cobrar sozinho.

## 2. O problema

O gargalo da KGFM é a atenção do Lucian. Quatro áreas competem pela mesma cabeça, e a escolha do que fazer agora é feita por memória e pressão, não por dado.

Sintomas reais no momento da concepção:
- Cotação Shopee (peças pequenas) parada e atrasada, sem depender de capital de giro.
- Projeto Riachuelo (alto valor) devagar por dispersão, não por falta de capacidade.
- Prospecção só destravou virando frente exclusiva por 4 dias — e a engenharia parou nesse período.

## 3. O que o sistema responde

Duas perguntas, e nada mais:

1. **Diariamente:** "O que eu faço agora, e por quê?"
2. **Semanal e trimestralmente:** "O que eu fiz me aproximou de onde eu quero estar?"

Todo requisito que não sirva a uma dessas duas perguntas é candidato a corte.

---

## 4. Fundamento — literatura aplicada

Cada tese abaixo já foi filtrada para o caso do Lucian. **Não são sugestões: são regras de implementação.**

### Getting Things Done (Allen) — captura sem atrito
- **Aplica:** o cérebro é para ter ideias, não guardá-las. Ideia retida gera custo mental contínuo. Sistema em que não se confia continua sendo carregado na cabeça.
- **Descartado:** contextos ("ligações", "no escritório"), taxonomia rígida de listas.
- **Regra:** captura em menos de 10 segundos, entrada única, zero campos obrigatórios. Classificação é sempre feita pela IA, nunca pelo usuário. Ritual semanal de reconciliação disparado pelo painel.

### Teoria das Restrições (Goldratt) — priorização
- **Aplica:** o Lucian **é** a restrição. A capacidade do sistema é a capacidade dele. Otimizar o que não passa por ele é desperdício. Dia de cotação parada é receita não realizada, não custo.
- **Descartado:** tambor-pulmão-corda, contabilidade de ganho, throughput em unidades.
- **Regra:** o algoritmo de priorização aponta para **o que destrava fluxo**, não para o mais atrasado. Item atrasado que não bloqueia nada perde para item no prazo que trava três frentes. Toda recomendação carrega o argumento do porquê. O sistema marca itens que estão na fila dele indevidamente (candidatos a delegação).

### Personal Kanban (Benson & Barry) — limite de WIP
- **Aplica:** trabalho em progresso não entrega valor. A própria experiência dele confirma: o CRM só saiu quando virou frente única por 4 dias.
- **Descartado:** quadro físico, cerimônia de colunas, granularidade de tarefa atômica.
- **Regra:** limite duro de frentes abertas por área (padrão: 2). O painel **bloqueia** abrir a terceira sem fechar ou arquivar explicitamente. A unidade visual é a frente, não a tarefa.
- **Regra do cronômetro (10/09/2026):** tarefas existem, mas **dentro** da frente - o painel nunca vira quadro de trinta cartões. E **só um cronômetro roda por vez** no sistema inteiro: começar tarefa de outra área encerra a anterior. O limite de WIP deixa de ser aviso e vira física - você não consegue estar em duas coisas porque o relógio não deixa.

### Deep Work (Newport) — blocos
- **Aplica:** engenharia e proposta são trabalho profundo; prospecção e follow-up são rasos. Misturar degrada os dois. O peso da engenharia na cabeça enquanto faz comercial é resíduo de atenção, não indisciplina.
- **Descartado:** prescrição monástica de isolamento. O modelo aplicável é o rítmico.
- **Regra:** recomendação por bloco de área, nunca por tarefa avulsa. Cruzamento com o Google Calendar para achar janelas reais. Alerta quando o dia está fragmentado demais para conter trabalho profundo.

### Good Strategy Bad Strategy (Rumelt) — estratégia e descarte
- **Aplica:** estratégia é diagnóstico + política norteadora + ações coerentes. Sem política explícita, toda oportunidade parece boa e ele diz sim para tudo.
- **Descartado:** estudos de caso corporativos, aparato analítico.
- **Regra:** a estratégia é armazenada **estruturada** nesses três campos, não como texto solto. Toda oportunidade nova é confrontada com a política norteadora antes de virar frente.

### A Guerra da Arte (Pressfield) - a Resistencia como numero
- **Aplica:** a forca que se opoe ao trabalho que importa nao chega como
  preguica, chega como tarefa urgente que nao e a sua. Explica a armadilha
  operador/arquiteto e a proposta parada por inercia.
- **Descartado:** musa, vocabulario de artista, Resistencia como entidade.
- **Regra:** o tempo do expediente que nao virou apontamento CONTA COMO NADA
  FEITO e aparece listrado na barra do dia (`src/lib/expediente.ts`). A voz do
  painel (`src/lib/resistencia.ts`) e escolhida pelo estado, nunca sorteada, e
  as frases sao escritas por nos - aplicar Pressfield, nao cita-lo, porque
  reproduzir trecho de obra protegida dentro do produto seria copia.
- **Regra:** zero gamificacao. Sem medalha, sem sequencia de dias, sem elogio.

---

## 5. Camada de estratégia — horizontes

Espinha dorsal. Os indicadores medem avanço **em função da estratégia**, não produtividade genérica.

| Horizonte | Conteúdo | Revisão |
|---|---|---|
| 5 anos | Onde a KGFM precisa estar: posição de mercado, porte de projeto, capacidade | Só por decisão consciente |
| 2 anos | Apostas estruturais que viabilizam o de 5 anos | Anual |
| Ano corrente | Objetivos do ano, com números | Trimestral |
| Mês | Desdobramento em avanços concretos | Mensal |
| Semana / dia | Frentes e blocos — o que o painel opera | Contínuo |

**Regra de coerência:** toda frente deve amarrar em um objetivo mensal; todo objetivo mensal, em um objetivo anual. Frente que não amarra em nada o sistema sinaliza como candidata a descarte, explicitamente.

**Revisão trimestral** (4x/ano), conduzida pelo sistema:
1. O que avançou e o que travou — com dado, não memória.
2. Onde estava o gargalo no trimestre.
3. O que entrou fora da estratégia e quanto tempo consumiu.
4. O que muda no ano corrente. Horizontes de 2 e 5 anos só entram se algo estrutural mudou.

**Dinamismo sem perder o eixo:** oportunidades (feira, indicação, cliente novo) não são bloqueadas — o sistema explicita o custo e responde se avança, é neutra ou compete com a estratégia. Todo descarte fica registrado **com o motivo**, para não reabrir a discussão dali a seis meses.

---

## 6. Arquitetura funcional

### Camada 1 — Captura
Entrada única. O usuário não escolhe pasta, categoria ou projeto.

- **Texto** — desktop e mobile
- **Voz** — mobile, uso em trânsito
- **Imagem / print** — recorte de LinkedIn, notícia, e-mail; extração do conteúdo via visão da IA

A IA classifica em `tarefa`, `insight`, `compromisso` ou `oportunidade`, e associa a área, projeto e — quando aplicável — objetivo estratégico. O usuário só corrige quando errar.

Insights de feira, livro e conteúdo entram aqui, vinculados ao tema, e reaparecem quando o assunto voltar.

### Camada 2 — Painel de instrumentos
Visual, não relatório. É o coração e a maior diferença em relação ao CRM.

- **Mostrador por área** — comercial, engenharia, prospecção, entregas: quanto foi alimentada e quanto está afastada do planejado
- **Criticidade** — o que vai atrasar, cliente sem retorno, reunião sem preparo
- **Alinhamento estratégico** — quanto do esforço recente serviu aos objetivos declarados
- **Cronograma** dos projetos ativos, sem abrir Project ou Asana

### Camada 3 — Cérebro
Lê o estado do banco, cruza com a agenda e devolve:
- Recomendação do que fazer agora, com o argumento
- Alerta de desalinhamento entre execução e estratégia
- Síntese semanal: o que andou, o que travou, onde está o gargalo
- Condução da revisão trimestral

---

## 7. UX — especificação

### Princípios
1. **Leitura de relance.** O painel comunica em 2 segundos, sem interpretar tabela. Ponteiro, barra e cor antes de número.
2. **Uma ação óbvia por tela.** Nunca oferecer cinco caminhos.
3. **Sem navegação em árvore.** Nada de menu com submenu. Desktop mostra tudo; mobile mostra o essencial.
4. **Captura sempre a um toque**, de qualquer tela.
5. **Cor com significado fixo:** verde = em dia, âmbar = atenção, vermelho = crítico. Cor nunca é decoração.
6. **Nada de tela vazia.** Estado sem dado explica o que fazer para preenchê-lo.

### Desktop — tela única (dashboard)
Layout em grade, densidade alta, aproveitando monitor grande. Sem scroll para o conteúdo primário.

```
┌──────────────────────────────────────────────────────────────┐
│  FAÇA AGORA  →  [frente recomendada]   "porque ..."          │  faixa superior, destaque máximo
├───────────────┬───────────────┬───────────────┬──────────────┤
│  COMERCIAL    │  ENGENHARIA   │  PROSPECÇÃO   │  ENTREGAS    │  4 mostradores
│  ◕ ponteiro   │  ◕ ponteiro   │  ◕ ponteiro   │  ◕ ponteiro  │
│  2 frentes    │  1 frente     │  2 frentes    │  0 frentes   │
├───────────────┴───────────────┼───────────────┴──────────────┤
│  CRÍTICOS                     │  AGENDA DE HOJE              │
│  • parado há N dias           │  blocos + janelas livres     │
│  • sem retorno há N dias      │  aviso de dia fragmentado    │
├───────────────────────────────┼──────────────────────────────┤
│  FRENTES ABERTAS              │  ALINHAMENTO ESTRATÉGICO     │
│  cartões, agrupados por área  │  barra por objetivo do ano   │
└───────────────────────────────┴──────────────────────────────┘
```
Captura: campo fixo no topo, sempre focável por atalho de teclado.

### Mobile — pilha vertical, PWA instalável
Ordem de prioridade na tela:
1. **Botão de captura** — fixo, flutuante, sempre acessível. Toque abre texto; toque longo abre voz; ícone lateral abre câmera/galeria.
2. **Faça agora** — cartão único com a recomendação e o porquê.
3. **Mostradores** — em linha, compactos, roláveis na horizontal.
4. **Críticos** — lista curta.
5. **Agenda de hoje** — resumo.

Nada de tabela em mobile. Nada que exija zoom.

### O mostrador (componente central)
Semicírculo com ponteiro. Cada área tem:
- **Valor:** índice de saúde 0–100, composto por (a) frentes em movimento nos últimos 7 dias, (b) itens críticos abertos, (c) aderência ao objetivo do mês.
- **Zonas:** 0–39 vermelho, 40–69 âmbar, 70–100 verde.
- **Legenda curta:** "engenharia parada há 6 dias".
- **Toque/clique:** abre as frentes daquela área. Nada mais.

### Menu e configuração

Três pontinhos no canto superior direito, mesmo lugar em desktop e mobile. É a
única navegação do sistema - não existe menu em árvore. Dentro dele: Painel,
Frentes, Estratégia, Capturas, Configuração.

**Página de configuração** (nada aqui é obrigatório mexer; tudo nasce com o
padrão da especificação e tem botão "voltar ao padrão"):
- Pesos dos três componentes do mostrador. A soma tem que dar 100
- Desconto por item crítico, e o dobro para frente que bloqueia outra
- Limiar de "parado há N dias úteis", por área
- Limite de WIP, por área
- Meta de horas por semana, por área
- Auto-encerramento do cronômetro (padrão: 3 horas)
- Senha de acesso e chave da API

**Toda mudança de peso é gravada com data.** Se o mostrador mudar de cor, você
precisa conseguir responder se foi o mundo que mudou ou se foi o peso.

### Tom da interface
Direto, sem elogio, sem gamificação, sem parabenizar. Quando algo está parado, o texto diz há quantos dias está parado. O usuário pediu explicitamente para não ser poupado.

---

## 8. Stack e decisões técnicas

| Camada | Escolha | Por quê |
|---|---|---|
| Framework | **Next.js (App Router)** | Front e back no mesmo projeto, deploy direto na Vercel |
| Hospedagem | **Vercel** (plano free) | Já em uso no CRM, zero custo adicional |
| Banco | **Neon Postgres** (free) | Já em uso. 0,5 GB e 100 CU-h/mês por projeto — folgado para texto |
| ORM | **Prisma** | Já roda no CRM, com migrations e lições caras aprendidas. Segundo ORM significa que nenhuma dessas lições atravessa e que existem dois dialetos na cabeça de uma pessoa só. Decidido em 10/09/2026 |
| UI | **Tailwind + shadcn/ui** | Sem custo, componentes prontos, responsivo |
| Gráficos | **Recharts** ou SVG próprio | Mostrador de ponteiro compensa fazer em SVG puro |
| Voz | **Web Speech API** (nativa do navegador) | Celular confirmado como **Android** em 10/09/2026: a API nativa reconhece fala de graça, sem plataforma extra e sem fallback pago |
| Visão (print) | **API Anthropic** (modelo com visão) | Extrai conteúdo do print |
| Inteligência | **API Anthropic** | Classificação, recomendação, sínteses |
| Agenda | **Google Calendar API** (OAuth, somente leitura na v1) | Gratuita |
| Mobile | **PWA instalável** | Evita app store, evita build nativo, evita custo |
| Agendamento | **Vercel Cron** | Para a síntese diária/semanal. Atenção: o plano free tem limite de execuções por dia |
| Autenticação | Sessão simples de usuário único, senha em variável de ambiente | Sistema de uma pessoa. Não vale pagar Clerk/Auth0 |

**Custo honesto:** hospedagem e banco ficam em zero. A API Anthropic é cobrada por uso e é **separada** da assinatura do Claude Code — a assinatura não cobre chamadas de API. Para manter baixo: usar modelo pequeno na classificação (que é a chamada mais frequente) e modelo maior só na recomendação diária e nas sínteses. Fazer classificação em lote quando possível.

### Integrações — decisão
- **v1:** Google Calendar (leitura).
- **Depois:** escrita na agenda; CRM/Agendor; e-mail.
- **Descartado:** Zapier, Make e qualquer middleware. A tentativa anterior com Zapier custou tempo e travou. Código próprio elimina a camada de tradução, que é onde as integrações quebram.

### Modelo de dados (fechado em 10/09/2026)

Treze tabelas, quase todas com menos de oito campos. `descarte` foi cortada -
descarte é estado com motivo, mora em `item` e em `frente`.

- `estrategia` - horizonte, diagnostico, politica_norteadora, acoes, periodo
- `objetivo` - horizonte (ano/mes), descricao, metrica, alvo, estrategia_id, area_id
- `medicao` - objetivo_id, valor, em. O realizado da aderência, com história
- `area` - nome, limite_wip, dias_para_critico, meta_horas_semana, ordem
- `projeto` - nome, cliente, area_id, valor_estimado. Rótulo, não ciclo de vida
- `frente` - titulo, area_id, projeto_id, objetivo_id, status, aberta_em,
  ultimo_movimento_em, aguardando_quem (eu/cliente/terceiro), aguardando_desde,
  descartada_em, motivo_descarte
- `bloqueio` - frente_bloqueadora_id, frente_bloqueada_id. Uma frente trava
  várias; campo único não sustenta a priorização por restrição
- `tarefa` - frente_id, titulo, estimativa_min, status, criada_em, concluida_em
- `apontamento` - tarefa_id, iniciado_em, encerrado_em, encerrado_por
  (usuario/troca/automatico), revisar. É o cronômetro
- `movimento` - frente_id, tipo, descricao, em. Sem esta tabela a revisão
  trimestral não tem dado, só a última data
- `item` - tipo, conteudo, conteudo_bruto, origem, status, area_id, frente_id,
  objetivo_id, vence_em, confianca_classificacao, corrigido_pelo_usuario,
  criado_em, descartado_em, motivo_descarte
- `recomendacao` - frente_id, argumento, gerada_em, desfecho. Sem registrar o
  que foi recomendado, não há como saber se o cérebro acerta
- `sintese` - tipo, periodo_inicio, periodo_fim, texto, gerada_em
- `snapshot_diario` - data, indices por area. O gráfico está no BACKLOG, mas
  histórico não se recupera depois: grava desde o primeiro dia
- `chamada_ia` - modelo, tokens_entrada, tokens_saida, custo_estimado, em
- `config` - chave, valor, alterado_em. Pesos do mostrador e limiares

---

## 9. Escopo da v1

**Entra** (bloco concentrado, alvo ~4 dias, no ritmo do CRM):
- Captura por texto, voz e imagem com classificação automática
- Banco de estratégia, projetos, áreas e frentes
- Painel desktop + mobile com mostradores, críticos e alinhamento
- Leitura do Google Calendar
- Recomendação diária com argumento
- Síntese semanal
- Limite de WIP com bloqueio, com botão de liberar ao lado
- Tarefas dentro da frente, com cronômetro start/stop e painel de horas do dia
- Página de configuração com ajuste dos pesos do mostrador

**Fica para depois:**
- Escrita na agenda
- Integração com CRM/Agendor
- Previsão automática de cronograma de engenharia
- Relatórios para terceiros
- Ritual trimestral automatizado (na v1 é conduzido em conversa)

**Por que esse corte:** escrita em agenda e integração com CRM são o tipo de item que transforma 4 dias em um mês. Nenhum dos dois responde "o que faço agora".

## 9.1 As areas sao tipos de atencao, nao departamentos

Pergunta do Lucian em 10/09/2026: "prospeccao e do comercial, entregas e
produtivo - reuniao com fornecedor e o que?". A resposta inteira, com o corte
recomendado (Prospeccao / Proposta / Execucao / Empresa), a regra do fornecedor
e a ordem do que medir primeiro, esta em **docs/areas-e-medicao.md**.

Resumo do que nao pode se perder: cortar por organograma apagaria o sintoma que
originou o projeto - prospeccao morrendo em silencio enquanto a engenharia anda.
Centro de custo nao e area: e `projeto`, com `projeto.fase`, e as horas sobem
por apontamento -> tarefa -> frente -> projeto.

## 10. Riscos a vigiar durante a construção

1. **Armadilha operador/arquiteto.** Enquanto o Jarvis é construído, Shopee e Riachuelo continuam parados. Escopo travado, sem "só mais uma feature".
2. **Atrito na captura.** Cada passo a mais derruba a adesão. Se passar de 10 segundos, está errado.
3. **Painel vazio.** Só entra em uso com estratégia e projetos reais carregados.
4. **Escopo visual subestimado.** É a parte mais cara. Definir os mostradores antes de escrever código.
5. **Estratégia genérica.** Se o horizonte de 5 anos virar frase de efeito, o filtro de oportunidade não filtra nada.

## 11. Como trabalhar comigo neste projeto

- Português do Brasil.
- Direto, sem elogio, sem validação. Confronte quando fizer sentido.
- Execute a tarefa inteira e preste contas no fim, em vez de pedir OK a cada passo.
- Explique o porquê das decisões técnicas — abordagem aconselhativa, não só executora.
- Aponte quando ele estiver "coando mosquito e engolindo camelo": priorizar o que gera reunião e receita sobre o que organiza infraestrutura.
- Nunca usar copiar/colar do sistema operacional ao mexer em planilhas dele — a área de transferência é compartilhada com o Windows.
