// A CORRENTE ANDANDO SOZINHA: fechou um pacote, o próximo começa.
//
// O Lucian em 11/09/2026, e é a regra que faltava no sistema inteiro:
//
//   "Se a logística do banho está finalizada, o processo do banho está
//    iniciado. E aí quando a empresa me sinalizar que conseguiu terminar, eu
//    faço a logística de retirada, que aí só vai faltar embalagem."
//
// A corrente é sequencial - isso já estava no modelo. O que não estava é que
// FECHAR UM PACOTE É O MESMO EVENTO QUE ABRIR O SEGUINTE. Enquanto foram dois
// atos separados, o segundo simplesmente não acontecia: o banho ficava
// "planejado" com a peça já dentro do tanque, e o prazo do fornecedor começava
// a correr sem ninguém contando.
//
// A DIFERENÇA QUE ESTE ARQUIVO EXISTE PARA GUARDAR:
//
//   PACOTE DELE (`aguardandoQuem = eu`)
//   Consome hora dele. Anda com cronômetro, e só anda quando ele está nele.
//
//   ENGRENAGEM (`aguardandoQuem = terceiro | cliente`)
//   Não consome hora nenhuma dele. Anda sozinha, no relógio do mundo, e o que
//   importa é DESDE QUANDO - porque banho que devia levar dois dias e está no
//   quarto é a informação mais cara do projeto.
//
// `aguardandoDesde` é o que faz a engrenagem existir na tela. Antes ele só era
// preenchido quando o Lucian apertava "passei a bola" na tela de Frentes, à
// mão. Agora nasce junto com o pacote que começou.

import { prisma } from './prisma'

export type PacoteIniciado = {
  id: number
  titulo: string
  /** Quem segura este pacote agora que ele começou. */
  quem: 'eu' | 'cliente' | 'terceiro'
  /** Prazo do pacote, em dias de calendário. */
  dias: number | null
}

/**
 * O PRÓXIMO PACOTE DA CORRENTE COMEÇA.
 *
 * Procura, dentro do mesmo projeto, o pacote de menor `ordem` que ainda não
 * fechou e vem depois do que acabou de fechar. Abre, carimba a data real de
 * início e - se o pacote é de terceiro - liga o relógio da espera.
 *
 * Devolve null quando não há próximo: ou o projeto acabou, ou o pacote fechado
 * não pertence a projeto nenhum (frente solta não tem corrente).
 */
export async function iniciarProximoPacote(
  projetoId: number | null,
  ordemQueFechou: number,
  agora: Date = new Date(),
): Promise<PacoteIniciado | null> {
  if (!projetoId) return null

  const proximo = await prisma.frente.findFirst({
    where: {
      projetoId,
      ordem: { gt: ordemQueFechou },
      status: { not: 'fechada' },
      descartadaEm: null,
    },
    orderBy: { ordem: 'asc' },
  })
  if (!proximo) return null

  // Já estava rodando: não recarimba a data de início. Reabrir a contagem de
  // uma espera que já corria apagaria justamente o atraso que interessa ver.
  if (proximo.status === 'aberta' && proximo.realInicioEm) {
    return {
      id: proximo.id,
      titulo: proximo.titulo,
      quem: proximo.aguardandoQuem,
      dias: proximo.diasEstimados,
    }
  }

  await prisma.frente.update({
    where: { id: proximo.id },
    data: {
      status: 'aberta',
      realInicioEm: proximo.realInicioEm ?? agora,
      ultimoMovimentoEm: agora,
      // O RELÓGIO DA ENGRENAGEM. Só existe quando o pacote não é dele: o que
      // está na mão dele não "aguarda", é feito.
      aguardandoDesde: proximo.aguardandoQuem === 'eu' ? null : agora,
    },
  })

  await prisma.movimento.create({
    data: {
      frenteId: proximo.id,
      tipo: 'pacote-iniciado',
      descricao:
        proximo.aguardandoQuem === 'eu'
          ? 'começou porque o pacote anterior fechou'
          : `girando com ${proximo.aguardandoQuem} desde agora`,
    },
  })

  return {
    id: proximo.id,
    titulo: proximo.titulo,
    quem: proximo.aguardandoQuem,
    dias: proximo.diasEstimados,
  }
}

/** A frase que o sistema devolve quando a corrente andou. Fato, não elogio. */
export function fraseDoProximo(p: PacoteIniciado | null): string {
  if (!p) return ''
  if (p.quem === 'eu') {
    return ` Começou "${p.titulo}", e é sua.`
  }
  const prazo = p.dias && p.dias > 0 ? `, ${p.dias} ${p.dias === 1 ? 'dia' : 'dias'} de prazo` : ''
  return ` "${p.titulo}" começou a girar com o ${p.quem}${prazo} - está contando sozinho.`
}
