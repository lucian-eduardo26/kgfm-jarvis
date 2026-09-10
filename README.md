# Jarvis KGFM

O que eu faço agora, e por quê.

Sistema pessoal de estratégia, decisão e execução do Lucian. Especificação em
[CLAUDE.md](CLAUDE.md) e [briefing-jarvis.md](briefing-jarvis.md).

---

## Para o Lucian: como abrir e mexer

### Ver o sistema rodando no seu PC

Abra o Claude Code na pasta do projeto e peça para subir, ou rode você mesmo:

```bash
npm run dev
```

Depois abra `http://localhost:3000` no navegador. A senha é a que estiver
configurada no arquivo `.env` (hoje: `jarvis2026` - **troque**).

### As telas

Tudo se navega pelos **três pontinhos** no canto superior direito. Não existe
menu em árvore.

| Tela | Para quê |
|---|---|
| **Painel** | o cockpit: faça agora, comando de voz, os quatro mostradores, críticos e o dia |
| **Conversa** | falar com o Jarvis; ele lê o painel inteiro antes de responder |
| **A semana** | check-in de domingo, check-out de sexta, e o desdobramento até o objetivo do mês |
| **Projetos** | os projetos e a WBS desdobrada nos quatro setores |
| **Frentes** | o que está aberto, com as tarefas e o cronômetro |
| **Estratégia** | diagnóstico, política norteadora, ações e os objetivos com número |
| **Capturas** | o que você jogou na caixa e como a IA classificou |
| **Configuração** | pesos do mostrador, limiares e a conta da API |

### Os comandos que existem

```bash
npm run dev        # sobe o sistema no seu PC
npm run teste      # confere a fórmula do mostrador, sem precisar de banco
npm run semear     # cria ou corrige os quatro setores
npm run rascunho   # carrega a estratégia de rascunho (não sobrescreve o que existir)
npm run exemplo    # carrega dados de exemplo, todos marcados com [exemplo]
npm run limpar     # apaga só o que o exemplo criou
```

### Depois de qualquer mudança no banco

Esta é a armadilha que já custou dois episódios no CRM: **pare o servidor
antes**, senão o `prisma generate` falha em silêncio e a tela quebra enquanto o
build continua passando.

```bash
npx prisma migrate dev --name o-que-mudou
npx prisma generate
npm run dev
```

---

## Onde as decisões moram

Cada regra do sistema vive em **um** arquivo, para não existirem duas verdades
com o mesmo nome - foi a lição mais cara do CRM.

| Arquivo | Decide |
|---|---|
| `src/lib/mostrador.ts` | a fórmula do índice, o que é crítico, as zonas de cor |
| `src/lib/expediente.ts` | quanto do dia ficou sem registro |
| `src/lib/agora.ts` | o que o painel manda fazer agora, e o argumento |
| `src/lib/resistencia.ts` | a voz que confronta, escolhida pelo estado |
| `src/lib/semana.ts` | o desdobramento semana → mês → objetivo |
| `src/lib/wbs.ts` | a WBS padrão por fase de projeto |
| `src/lib/conversa.ts` | o que o Jarvis sabe quando conversa |
| `src/lib/comando.ts` | fala → cronômetro rodando |

## Documentos

- [docs/mostrador.md](docs/mostrador.md) - a fórmula, com a calibragem conferida
- [docs/areas-e-medicao.md](docs/areas-e-medicao.md) - como cortar as áreas e o que medir primeiro
- [docs/banco-de-conhecimento.md](docs/banco-de-conhecimento.md) - insights, e o que fazer com o Obsidian
- [docs/CHAVE-ANTHROPIC.md](docs/CHAVE-ANTHROPIC.md) - a chave da API, passo a passo
- [docs/BANCO-NEON.md](docs/BANCO-NEON.md) - o banco, passo a passo
- [BACKLOG.md](BACKLOG.md) - o que ficou de fora de propósito

## Stack

Next.js 16 (App Router) · TypeScript · Prisma 6 · Postgres no Neon · Tailwind ·
API Anthropic para classificação, conversa e rituais · Web Speech API do
navegador para voz (custo zero) · Vercel em `gru1`, mesma região do banco.
