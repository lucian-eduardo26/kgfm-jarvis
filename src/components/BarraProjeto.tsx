// A GESTÃO À VISTA: uma barra por projeto, a empresa inteira numa tela.
//
// Pedido do Lucian em 10/09/2026: "eu quero ver a minha empresa acontecendo".
//
// A BARRA MOSTRA DUAS COISAS NA MESMA ESCALA, e é a diferença entre elas que
// carrega a informação:
//
//   1. os SEGMENTOS são os pacotes da WBS, cada um com a largura dos seus
//      dias - fabricação de 15 dias ocupa quinze vezes mais barra do que a
//      embalagem de 1 dia, porque é isso que ela consome de calendário;
//   2. o RISCO VERTICAL é hoje, na posição proporcional do prazo.
//
// Se o preenchido está atrás do risco, o projeto está atrasado, e o tamanho
// do vão É o atraso. Ninguém precisa ler número nenhum para ver isso.
//
// Cor: pacote fechado usa o laranja da marca; pacote atrasado usa vermelho de
// estado; o resto é superfície apagada. Como em todo o resto do sistema, cor
// só entra quando significa alguma coisa.

import Link from 'next/link'
import type { ProjetoNaCarteira } from '@/lib/projetos'
import { dataCurta, oQueFazerComOAtraso } from '@/lib/cronograma'

function Segmentos({ p }: { p: ProjetoNaCarteira }) {
  const c = p.cronograma
  if (!c.temData || c.pacotes.length === 0) return null

  return (
    <div className="barra-projeto" role="img" aria-label={`${p.cronograma.progresso}% executado`}>
      {c.pacotes.map((pk) => (
        <span
          key={pk.id}
          className={`barra-parte${pk.fechado ? ' barra-feita' : ''}${pk.atrasado ? ' barra-atrasada' : ''}`}
          style={{ flexGrow: pk.dias }}
          title={`${pk.pacote} · ${pk.dias} dias · ${pk.fechado ? 'feito' : pk.atrasado ? `${pk.diasDeAtraso} dias de atraso` : 'planejado'}`}
        />
      ))}
      {/* Onde estamos hoje dentro do prazo. */}
      <span className="barra-hoje" style={{ left: `${p.tempoDecorrido}%` }} aria-hidden />
    </div>
  )
}

export function BarraProjeto({ p }: { p: ProjetoNaCarteira }) {
  const c = p.cronograma
  const atrasado = c.atrasoMaximo > 0

  return (
    <Link href={`/projetos/${p.id}`} className="linha-projeto">
      {/* Sem quebra de linha aqui de propósito: com `flex-wrap`, um nome
          comprido empurrava o tipo e o percentual para baixo, e só naquela
          linha - as barras deixavam de se alinhar entre si. O nome corta, o
          resto fica sempre no mesmo lugar. */}
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-semibold truncate">{p.nome}</span>
        <span className="flex items-center gap-2 shrink-0">
          <span className="chip-tipo">{p.tipoNome}</span>
          <span className="numero text-sm" style={{ color: atrasado ? 'var(--vermelho)' : 'var(--texto)' }}>
            {c.progresso}%
          </span>
        </span>
      </div>

      <div className="flex items-baseline gap-2 mt-0.5">
        <span className="text-xs fraco truncate">{p.cliente ?? 'sem cliente'}</span>
        {!p.temWbs && <span className="text-[10px] fraco">· sem WBS ainda</span>}
      </div>

      <div className="mt-2">
        {p.temWbs && c.temData ? (
          <Segmentos p={p} />
        ) : (
          // Estado honesto: sem pacotes não existe barra. Desenhar uma vazia
          // faria parecer projeto parado, e a verdade é "ainda não medido".
          <div className="barra-projeto barra-vazia" aria-hidden />
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2 mt-1.5 text-[11px]">
        <span className="dado">{c.inicio ? dataCurta(c.inicio) : 'sem início'}</span>
        {atrasado ? (
          <span style={{ color: 'var(--vermelho)' }}>
            {c.atrasoMaximo}d atrasado · {oQueFazerComOAtraso(c.atrasoDe)}
          </span>
        ) : (
          <span className="fraco">{p.temWbs ? 'no prazo' : 'aguardando WBS'}</span>
        )}
        <span className="dado">{c.entregaPrevista ? dataCurta(c.entregaPrevista) : '-'}</span>
      </div>
    </Link>
  )
}
