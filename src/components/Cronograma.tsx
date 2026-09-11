// O CRONOGRAMA EM TRÊS GRUPOS, e não em catorze linhas.
//
// O Lucian em 10/09/2026: "esse formato de lista parece que tem um metro na
// vertical no celular. Deu umas dez roladas para chegar no fim. Encontra esse
// conhecimento pra gente aplicar de forma eficiente."
//
// A disciplina existe e é velha. Duas ideias resolvem isto:
//
// 1. A MANTRA DE SHNEIDERMAN (1996), de visualização de informação:
//    "overview first, zoom and filter, then details-on-demand" - visão geral
//    primeiro, filtrar, e detalhe só quando pedido. A tela antiga pulava o
//    primeiro passo e entregava só detalhe, catorze vezes.
//
// 2. DIVULGAÇÃO PROGRESSIVA (Nielsen, 1995): mostrar o pouco que importa
//    agora e guardar o resto atrás de um toque.
//
// Aplicado aqui: os pacotes viram três grupos por ESTADO, e não uma fila.
//
//    FEITO     fechado, recolhido. É história, e história não disputa tela.
//    AGORA     o que está rodando e o próximo. Aberto, porque é o trabalho.
//    DEPOIS    o resto do plano, recolhido.
//
// De catorze linhas para duas abertas e dois resumos. O que ele precisa ver
// ao abrir o projeto é onde ele está - não o plano inteiro de novo.
//
// O grupo AGORA nunca recolhe: se recolhesse, a tela abriria sem responder a
// única pergunta que ela existe para responder.

import type { PacoteNoTempo } from '@/lib/cronograma'
import { dataCurta, horasCurtas } from '@/lib/cronograma'
import { PacoteLinha } from './PacoteLinha'

const COR_DE_QUEM: Record<string, string> = {
  eu: 'var(--texto)',
  terceiro: 'var(--verde)',
  cliente: 'var(--ambar)',
}

const NOME_DE_QUEM: Record<string, string> = {
  eu: 'VOCÊ',
  terceiro: 'TERCEIRO',
  cliente: 'CLIENTE',
}

function Linha({ p, acao }: { p: PacoteNoTempo; acao: (f: FormData) => Promise<void> }) {
  return (
    <li className="flex items-center gap-2 text-sm py-1">
      <span
        className="numero text-[11px] shrink-0 w-5 text-right"
        style={{ color: p.fechado ? 'var(--verde)' : 'var(--fraco)' }}
      >
        {p.ordem}
      </span>

      <span className="min-w-0 flex-1">
        <span style={{ color: p.fechado ? 'var(--fraco)' : undefined }}>{p.pacote ?? p.titulo}</span>
        {/* Quem segura desceu para esta linha em 10/09/2026. Em coluna própria
            ele custava 60px de largura fixa, e num telefone de 375px sobravam
            87px para o nome do pacote - que saía quebrado em quatro linhas.
            Aqui a cor continua dizendo a mesma coisa e não custa coluna. */}
        <span className="block text-[11px] dado mt-0.5">
          {dataCurta(p.inicioPrevisto)} a {dataCurta(p.fimPrevisto)} · {p.dias}d
          {p.minutos > 0 && ` · ${horasCurtas(p.minutos)} sua`}
          {' · '}
          <span style={{ color: COR_DE_QUEM[p.quemSegura] }}>{NOME_DE_QUEM[p.quemSegura]}</span>
        </span>
        {p.paradoParaComecar && (
          <span className="block text-[11px] mt-0.5" style={{ color: 'var(--ambar)' }}>
            parado há {p.diasParado} dias esperando começar
          </span>
        )}
        {p.furouABase && (
          <span className="block text-[11px] mt-0.5" style={{ color: 'var(--vermelho)' }}>
            fechou {p.diasAlemDaBase}d depois da linha de base
          </span>
        )}
      </span>

      {p.atrasado && (
        <span className="shrink-0 text-[10px] numero mr-1" style={{ color: 'var(--vermelho)' }}>
          +{p.diasDeAtraso}d
        </span>
      )}

      <PacoteLinha frenteId={p.id} percentual={p.percentual} fechado={p.fechado} acao={acao} />
    </li>
  )
}

function Grupo({
  titulo,
  resumo,
  pacotes,
  acao,
  aberto = false,
  cor,
}: {
  titulo: string
  resumo: string
  pacotes: PacoteNoTempo[]
  acao: (f: FormData) => Promise<void>
  aberto?: boolean
  cor: string
}) {
  if (pacotes.length === 0) return null

  return (
    <details open={aberto} className="grupo-cronograma">
      <summary>
        <span className="grupo-titulo" style={{ color: cor }}>
          {titulo}
        </span>
        <span className="grupo-resumo">{resumo}</span>
        <span className="numero grupo-conta">{pacotes.length}</span>
      </summary>
      <ol className="mt-1">
        {pacotes.map((p) => (
          <Linha key={p.id} p={p} acao={acao} />
        ))}
      </ol>
    </details>
  )
}

export function Cronograma({
  pacotes,
  acao,
}: {
  pacotes: PacoteNoTempo[]
  acao: (f: FormData) => Promise<void>
}) {
  const feitos = pacotes.filter((p) => p.fechado)
  const naoFeitos = pacotes.filter((p) => !p.fechado)

  // AGORA é o que já começou mais o próximo da fila. Dois pacotes na maior
  // parte do tempo - e dois é o que cabe numa tela sem rolar.
  const comecados = naoFeitos.filter((p) => p.percentual > 0)
  const proximo = naoFeitos.find((p) => p.percentual === 0)
  const agora = [...comecados, ...(proximo && comecados.length === 0 ? [proximo] : [])]
  const idsAgora = new Set(agora.map((p) => p.id))
  const depois = naoFeitos.filter((p) => !idsAgora.has(p.id))

  const minutosDepois = depois.reduce((s, p) => s + p.minutos, 0)
  const diasDepois = depois.reduce((s, p) => s + p.dias, 0)

  if (pacotes.length === 0) {
    return (
      <p className="fraco text-sm">
        Este projeto ainda não tem WBS. Diga ao Jarvis que tipo ele é e a corrente se desdobra com
        as datas.
      </p>
    )
  }

  return (
    <div className="space-y-1">
      <Grupo
        titulo="Feito"
        resumo={feitos.length > 0 ? `até ${dataCurta(feitos[feitos.length - 1].fimPrevisto)}` : ''}
        pacotes={feitos}
        acao={acao}
        cor="var(--verde)"
      />

      <Grupo
        titulo="Agora"
        resumo={agora.length > 0 ? agora[0].pacote ?? '' : 'nada em andamento'}
        pacotes={agora}
        acao={acao}
        aberto
        cor="var(--laranja)"
      />

      <Grupo
        titulo="Depois"
        resumo={`${diasDepois}d de prazo${minutosDepois > 0 ? `, ${horasCurtas(minutosDepois)} sua` : ''}`}
        pacotes={depois}
        acao={acao}
        cor="var(--fraco)"
      />
    </div>
  )
}
