// A AGENDA DO GOOGLE ESPELHADA NO JARVIS, e os blocos indo no sentido oposto.
//
// O Lucian em 11/09/2026: "quando eu travo uma reunião na agenda, é via agenda
// e acabou. Então o Jarvis só lê a minha agenda, e coloca o que leu na dele,
// só pra espelhar."
//
// QUEM MANDA É O GOOGLE, e essa hierarquia precisa ser absoluta para o sistema
// não mentir. O que vem de lá entra marcado como espelho; sincronizar de novo
// substitui o espelho inteiro da faixa de datas. Editar o espelho aqui não
// adianta - na próxima sincronização a edição some, e sumir em silêncio é o
// pior defeito que um sistema de agenda pode ter. Por isso não existe tela
// para editar espelho: o que é do Google se edita no Google.
//
// NO SENTIDO CONTRÁRIO vai só o que o Jarvis criou: os blocos de trabalho. Eles
// carregam uma marca privada no evento, e é ela que permite o Jarvis refazer o
// plano sem nunca tocar numa reunião que ele não criou.

import { prisma } from './prisma'
import { lerEventos, criarEvento, type EventoGoogle } from './google'

/** O prefixo do espelho. Compromisso sem ele foi marcado aqui dentro. */
export const MARCA_ESPELHO = '[Google]'

export type ResultadoDaSincronia = {
  ok: boolean
  lidos: number
  espelhados: number
  removidos: number
  erro?: string
}

export async function sincronizarDoGoogle(
  de: Date,
  ate: Date,
): Promise<ResultadoDaSincronia> {
  const eventos = await lerEventos(de, ate)
  if (eventos === null) {
    return {
      ok: false,
      lidos: 0,
      espelhados: 0,
      removidos: 0,
      erro: 'O Jarvis não conseguiu ler a agenda. A conta pode não estar ligada, ou a autorização foi revogada.',
    }
  }

  // Só o espelho é apagado. Compromisso marcado no Jarvis não tem a marca e
  // sobrevive a qualquer sincronização.
  const removidos = await prisma.compromisso.deleteMany({
    where: { inicio: { gte: de, lte: ate }, titulo: { startsWith: MARCA_ESPELHO } },
  })

  // Evento que o próprio Jarvis criou no Google não volta como espelho: ele já
  // é dele. Espelhar o próprio reflexo duplicaria o bloco a cada sincronia.
  const deFora = eventos.filter((e: EventoGoogle) => !e.doJarvis)

  for (const e of deFora) {
    await prisma.compromisso.create({
      data: {
        titulo: `${MARCA_ESPELHO} ${e.titulo}`,
        inicio: e.inicio,
        fim: e.fim,
        local: e.local,
      },
    })
  }

  return { ok: true, lidos: eventos.length, espelhados: deFora.length, removidos: removidos.count }
}

export type BlocoParaAgenda = {
  titulo: string
  inicio: Date
  fim: Date
  porque: string
  projetoId?: number | null
}

/**
 * Os blocos do plano indo para o Google.
 *
 * O `porque` vai na descrição de propósito: às 14h de uma terça, olhando um
 * bloco chamado "Embalagem", a pergunta que aparece é "por que isso agora?" -
 * e a resposta tem que estar no próprio evento, não numa tela que ele teria
 * que abrir.
 */
export async function mandarBlocosParaOGoogle(
  blocos: BlocoParaAgenda[],
): Promise<{ criados: number; erros: string[] }> {
  const erros: string[] = []
  let criados = 0

  for (const b of blocos) {
    const r = await criarEvento({
      titulo: b.titulo,
      inicio: b.inicio,
      fim: b.fim,
      descricao: `${b.porque}\n\nBloqueado pelo Jarvis KGFM.`,
    })
    if ('erro' in r) erros.push(`${b.titulo}: ${r.erro}`)
    else {
      criados++
      // O bloco também entra no Jarvis, para a semana daqui refletir o que
      // foi travado lá - sem esperar a próxima sincronização.
      await prisma.compromisso.create({
        data: { titulo: b.titulo, inicio: b.inicio, fim: b.fim, projetoId: b.projetoId ?? null },
      })
    }
  }

  return { criados, erros }
}
