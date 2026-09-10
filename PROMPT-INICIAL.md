# Prompt de abertura — colar no Claude Code

> Como usar: crie a pasta do projeto, coloque `CLAUDE.md` e `briefing-jarvis.md` dentro dela, abra o Claude Code na pasta e cole o texto abaixo.

---

Leia `CLAUDE.md` e `briefing-jarvis.md` inteiros antes de responder.

Você vai construir o **Jarvis KGFM**: um sistema pessoal de estratégia, decisão e execução para um CEO que é, ele próprio, o gargalo da empresa. Stack definida no CLAUDE.md: Next.js na Vercel, Neon Postgres, Drizzle, Tailwind + shadcn/ui, PWA para mobile, API Anthropic para inteligência, Google Calendar somente leitura.

**Não comece a escrever código ainda.** Antes disso, execute nesta ordem:

**1. Definição dos mostradores.**
Proponha a fórmula do índice de saúde 0–100 por área, com os pesos de cada componente e o critério de "crítico". Justifique cada peso. Este é o item que trava todo o resto — se o mostrador estiver errado, o sistema mede a coisa errada.

**2. Modelo de dados.**
Parta do esqueleto da seção 8 do CLAUDE.md, complete e critique. Aponte o que falta e o que está sobrando.

**3. Plano de construção em 4 blocos**, um por dia de trabalho, com o que fica pronto e utilizável ao fim de cada bloco. Ordem obrigatória: o que prova o conceito antes do que embeleza.

**4. Riscos técnicos** que você enxerga e que não estão no CLAUDE.md.

Entregue os quatro itens de uma vez, sem me pedir confirmação no meio. Depois disso eu aprovo e você começa a construir.

Duas restrições que não se negociam:
- **Escopo travado na v1.** Se aparecer ideia boa fora do escopo, registre em um arquivo `BACKLOG.md` e siga.
- **Captura em menos de 10 segundos.** Qualquer decisão de UX que aumente o atrito da captura está errada por definição.
