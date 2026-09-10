# O banco - 3 minutos e você dorme

## Por que preciso de você

Eu ia aproveitar o banco do CRM, mas a trava de segurança do Claude Code me
impediu de ler o arquivo de senhas do CRM - e ela está certa: segredo de um
projeto não deve vazar para outro. Melhor assim. O Jarvis merece banco próprio.

## Os passos

1. Abra **console.neon.tech** e entre (mesma conta do CRM).
2. Botão **New Project**.
3. Nome: `jarvis`
4. Região: **South America (São Paulo)** - `sa-east-1`. Isso importa: banco
   longe do servidor deixa cada tela lenta. Foi lição do CRM.
5. Clique em **Create**.
6. A tela seguinte já mostra a **connection string**. É um texto longo que
   começa com `postgresql://`. Clique no ícone de copiar.

## Onde colar

Abra no Bloco de Notas:

    C:\0 KGFM\03 GESTÃO\0311 ESTRATÉGICO\03112 JARVIS\.env.local

Acrescente DUAS linhas, colando a mesma coisa nas duas:

    DATABASE_URL=postgresql://...cole aqui...
    DIRECT_URL=postgresql://...cole a mesma coisa aqui...

Sem aspas, sem espaço antes ou depois do `=`. Salve e feche.

(As duas linhas existem porque o Prisma usa uma para conversar no dia a dia e
outra para mexer na estrutura do banco. Se a página do Neon oferecer as duas
versões - "pooled" e "direct" - use a pooled na primeira e a direct na segunda.
Se só aparecer uma, repita a mesma nas duas que funciona.)

## Depois disso

Pode dormir. Eu crio as tabelas, subo o sistema e deixo funcionando. De manhã
você abre e me diz o que está errado.

**Senha temporária da tela de entrada: `jarvis2026`.** Trocar é uma linha no
mesmo arquivo, e eu explico de manhã.
