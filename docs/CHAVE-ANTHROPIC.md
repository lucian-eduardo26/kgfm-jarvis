# A chave da API - passo a passo (5 minutos)

## O que é essa chave, em português

O Jarvis precisa que uma inteligência leia o que você captura ("ligar pro
comprador da Shopee") e decida sozinha: isso é tarefa, é da área comercial, é
do projeto Shopee. Quem faz isso é a API da Anthropic.

**Ela é cobrada por uso e NÃO está incluída na sua assinatura do Claude.** São
duas contas separadas na mesma empresa: a assinatura paga o Claude que está
falando com você agora; a API paga o Jarvis funcionando sozinho, quando você
não está olhando. Não tem como fugir disso - sem chave, o Jarvis vira formulário
manual.

**Quanto custa, de verdade:** classificar uma captura curta custa fração de
centavo. Se você capturar 20 coisas por dia e receber uma recomendação diária,
fica na casa de poucos dólares por mês. O crédito mínimo (US$ 5) deve durar
semanas. Eu vou gravar cada chamada numa tabela do banco, então você vê a conta
subindo antes de a fatura chegar.

## Os passos

1. Abra **console.anthropic.com** (é diferente de claude.ai) e entre com o mesmo
   e-mail de sempre.
2. No menu da esquerda, **Billing** (ou "Plans & Billing"). Se o saldo estiver
   zerado, clique em **Add credits** e coloque o mínimo, US$ 5. Precisa de cartão.
   *Esse passo é seu - eu não coloco cartão nem faço compra.*
3. Ainda no menu da esquerda, **API keys** → botão **Create Key**.
4. Nome da chave: `jarvis`. Confirme.
5. **A chave aparece UMA vez só.** Copie inteira (começa com `sk-ant-`).

## Onde colar

Na pasta do projeto:

    C:\0 KGFM\03 GESTÃO\0311 ESTRATÉGICO\03112 JARVIS\.env

Se o arquivo já existir, abra no Bloco de Notas e acrescente uma linha no fim.
Se não existir, crie. A linha é assim, sem espaço e sem aspas:

    ANTHROPIC_API_KEY=sk-ant-cole-a-sua-aqui

Salve e feche. Pronto - pode dormir. Eu leio o arquivo daqui.

## Se você não fizer isso hoje

Nada trava. Eu construo o sistema inteiro com um classificador de mentira, que
joga tudo numa caixa "sem classificar" e deixa você arrastar na mão. Quando a
chave aparecer, ele liga sozinho, sem eu mexer em código. Só não dá para dizer
que a captura funciona antes de a chave existir.
