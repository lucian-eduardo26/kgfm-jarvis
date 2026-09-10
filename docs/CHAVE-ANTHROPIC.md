# A chave da API - passo a passo

> ## ATENÇÃO: NÃO COMPRE DENTRO DO APLICATIVO DO CLAUDE
>
> Existem **dois lugares diferentes** que vendem crédito, e eles não se
> conversam:
>
> | Onde | O que é | Serve para o Jarvis? |
> |---|---|---|
> | Dentro do app do Claude (menu em português, "uso extra") | crédito da sua assinatura | **NÃO** |
> | **console.anthropic.com** → Billing | crédito da API | **SIM** |
>
> Se você comprar no lugar errado, o Jarvis continua dizendo que não tem chave.
> O dinheiro não some - ele vira crédito de Claude Code, que você usa de
> qualquer jeito - mas não é o que liga o Jarvis.
>
> **Confira sempre:** abra console.anthropic.com → Billing. Se o saldo aparece
> ali, é o certo. Aconteceu de comprar no lugar errado em 10/09/2026.

## O que é essa chave, em português

O Jarvis precisa que uma inteligência leia o que você fala ("Jarvis, estou
fazendo o levantamento da cotação") e decida sozinha: isso é tarefa, é da área
comercial, é do projeto Shopee, e o cronômetro começa agora. Quem faz isso é a
API da Anthropic.

**Ela é cobrada por uso e NÃO está incluída na sua assinatura do Claude.** São
duas contas separadas na mesma empresa: a assinatura paga o Claude que conversa
com você; a API paga o Jarvis funcionando sozinho, quando você não está olhando.

Sem a chave o sistema **não quebra**: captura, cronômetro, mostradores, runway,
WBS e as travas continuam funcionando. O que para é o que precisa pensar -
comando de voz, conversa, classificação automática e os rituais de semana.

---

## Parte 1 - criar a chave (5 minutos)

1. Abra **console.anthropic.com**. É diferente do claude.ai - o console é a
   parte de desenvolvedor. Entre com o mesmo e-mail de sempre.

2. Se for a primeira vez, ele pede para criar uma organização. Pode chamar de
   **KGFM** e seguir.

3. No menu da esquerda procure **Billing** (ou *Plans & Billing*). Se o saldo
   estiver zerado, clique em **Add credits** e coloque o mínimo, **US$ 5**.
   Precisa de cartão de crédito.
   *Este passo é seu - eu não coloco cartão nem faço compra.*

4. Ainda no menu da esquerda, **API keys** → botão **Create Key**.

5. Nome da chave: `jarvis`. Confirme.

6. **A chave aparece uma vez só.** Copie inteira - ela começa com `sk-ant-`.
   Se fechar a janela sem copiar, é só apagar e criar outra.

---

## Parte 2 - colar em DOIS lugares

O Jarvis roda em dois lugares, e cada um lê a chave do seu próprio canto.

### 2.1 - Na Vercel (o site no ar, o que você usa no celular)

1. **vercel.com** → projeto **kgfm-jarvis**
2. **Settings** → **Environment Variables**
3. Procure `ANTHROPIC_API_KEY` (ela já existe, vazia). Clique nos três
   pontinhos ao lado → **Edit**.
4. Cole a chave no campo de valor. Deixe marcado *Production* e *Preview*.
5. Salve.
6. **Vá em Deployments e clique em Redeploy no deploy mais recente.**
   Isto é obrigatório: variável nova só vale para deploys feitos DEPOIS dela.
   Sem o redeploy, o site continua sem chave e você vai achar que não funcionou.

### 2.2 - No PC (quando você roda pelo atalho)

Abra no Bloco de Notas:

    C:\0 KGFM\03 GESTÃO\0311 ESTRATÉGICO\03112 JARVIS\.env

Ache a linha que começa com `ANTHROPIC_API_KEY=` e cole a chave logo depois do
`=`, sem espaço e sem aspas:

    ANTHROPIC_API_KEY=sk-ant-cole-a-sua-aqui

Salve e feche. Se o Jarvis estiver aberto, feche a janela preta e abra de novo.

---

## Parte 3 - conferir que funcionou

Abra o Painel e, na caixa **"o que você está fazendo"**, escreva ou fale:

> estou levantando os preços da cotação

- **Funcionou:** ele responde com uma frase, o cronômetro começa a correr, e
  aparece se aquilo é ou não a prioridade do dia.
- **Não funcionou:** aparece *"Sem chave da API eu não entendo o que você
  falou"*. Aí ou a chave não foi salva, ou faltou o **redeploy**.

---

## Quanto isso custa, de verdade

O sistema usa o modelo pequeno onde a chamada é frequente e o grande só onde
precisa pensar. Por uso:

| O quê | Modelo | Custo aproximado por vez |
|---|---|---|
| Classificar uma captura | Haiku | menos de meio centavo de dólar |
| Um comando de voz | Sonnet | cerca de US$ 0,015 |
| Uma pergunta na conversa | Sonnet | cerca de US$ 0,015 |
| Check-in ou check-out da semana | Sonnet | cerca de US$ 0,03 |

Com uso pesado - 20 capturas, 10 comandos e 10 perguntas por dia - dá algo
entre **US$ 8 e US$ 12 por mês**. Com uso normal, bem menos. Os US$ 5 mínimos
duram semanas.

**Você não precisa confiar nessa estimativa:** a tela **Configuração** mostra
quantas chamadas foram feitas e o custo acumulado. A conta sobe ali antes de
subir na fatura.

---

## Se acabar o crédito

As telas continuam funcionando; só o que pensa volta a dizer que não tem chave.
Nada se perde, nada quebra.
