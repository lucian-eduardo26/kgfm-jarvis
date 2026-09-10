// O CRONOGRAMA DE UM PROJETO, pacote a pacote.
//
// A tela da carteira responde "como está a empresa". Esta responde a pergunta
// seguinte: "onde exatamente este projeto está, e quem está segurando".
//
// Cada linha é um pacote da corrente com a previsão calculada. A cor de quem
// segura importa mais do que parece: atraso de terceiro é telefonema, de
// cliente é cobrança, e só o atraso que é seu vira bloco na agenda.

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { exigirSessao } from '@/lib/guarda'
import { prisma } from '@/lib/prisma'
import { Moldura, Cabeca } from '@/components/Moldura'
import { montarCronograma, dataCurta, oQueFazerComOAtraso } from '@/lib/cronograma'
import { NOME_DO_TIPO } from '@/lib/modelos'
import { definirInicioDoProjeto } from '../../acoes'

export const dynamic = 'force-dynamic'

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

export default async function ProjetoDetalhe({ params }: { params: Promise<{ id: string }> }) {
  await exigirSessao()
  const { id } = await params

  const projeto = await prisma.projeto.findUnique({
    where: { id: Number(id) },
    include: {
      frentes: {
        where: { status: { not: 'descartada' } },
        include: { area: { select: { nome: true } } },
        orderBy: { ordem: 'asc' },
      },
    },
  })

  if (!projeto) notFound()

  const c = montarCronograma(projeto.inicioEm, projeto.frentes)
  const atrasado = c.atrasoMaximo > 0

  return (
    <Moldura titulo={projeto.nome} atalhoAtivo="/projetos">
      <div className="mb-3">
        <Link href="/projetos" className="text-xs fraco">
          &lt; todos os projetos
        </Link>
      </div>

      <section className="cartao p-4 mb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-bold leading-tight">{projeto.nome}</h2>
            <p className="text-xs fraco mt-1">
              {projeto.cliente ?? 'sem cliente'} · {NOME_DO_TIPO[projeto.tipo]} · {projeto.fase}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="numero text-2xl" style={{ color: atrasado ? 'var(--vermelho)' : 'var(--texto)' }}>
              {c.progresso}%
            </p>
            <p className="text-[10px] fraco font-mono">EXECUTADO</p>
          </div>
        </div>

        {/* As condições que geraram esta corrente, ditas em português. */}
        <p className="text-xs fraco mt-3">
          {projeto.tipo === 'peca' ? (
            <>
              {projeto.materiaPrimaNossa ? 'A matéria-prima sai daqui' : 'A matéria-prima é do fornecedor'} ·{' '}
              {projeto.temRevestimento ? 'tem revestimento' : 'sem revestimento'}
            </>
          ) : (
            'Corrente de sistema: descoberta, proposta e execução'
          )}
        </p>

        {atrasado && (
          <p className="text-sm mt-3" style={{ color: 'var(--vermelho)' }}>
            {c.atrasoMaximo} dias de atraso, e a bola está com {NOME_DE_QUEM[c.atrasoDe ?? 'eu'].toLowerCase()}.
            O próximo passo é {oQueFazerComOAtraso(c.atrasoDe)}.
          </p>
        )}
      </section>

      {/* A data de início é o que faz o cronograma existir. Enquanto ela for
          o dia em que o projeto foi cadastrado, a previsão está errada - e a
          tela diz isso em vez de fingir. */}
      <form action={definirInicioDoProjeto} className="cartao p-4 mb-3">
        <p className="rotulo mb-2">quando este projeto começou de verdade</p>
        <div className="flex flex-wrap gap-2 items-end">
          <input type="hidden" name="projetoId" value={projeto.id} />
          <div className="min-w-[170px]">
            <input
              type="date"
              name="inicio"
              defaultValue={projeto.inicioEm ? projeto.inicioEm.toISOString().slice(0, 10) : ''}
              className="campo"
            />
          </div>
          <button className="botao">Corrigir a data</button>
        </div>
        <p className="fraco text-xs mt-2">
          Todas as previsões saem daqui. Sem a data certa, o cronograma é bonito e errado.
        </p>
      </form>

      <section className="cartao">
        <Cabeca
          titulo="o cronograma"
          direita={
            <span className="text-[10px] dado">
              {c.temData && c.entregaPrevista ? `ENTREGA ${dataCurta(c.entregaPrevista)}` : 'SEM DATA'}
            </span>
          }
        />
        <div className="painel-corpo">
          {c.pacotes.length === 0 ? (
            <p className="fraco text-sm">
              Este projeto ainda não tem WBS. Diga ao Jarvis que tipo ele é e a corrente se desdobra
              com as datas - ou abra os pacotes na tela de projetos.
            </p>
          ) : (
            <ol className="space-y-1.5">
              {c.pacotes.map((p) => (
                <li key={p.id} className="flex items-baseline gap-2.5 text-sm">
                  <span
                    className="numero text-[11px] shrink-0 w-5 text-right"
                    style={{ color: p.fechado ? 'var(--laranja)' : 'var(--fraco)' }}
                  >
                    {p.ordem}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      style={{
                        textDecoration: p.fechado ? 'line-through' : undefined,
                        color: p.fechado ? 'var(--fraco)' : undefined,
                      }}
                    >
                      {p.pacote ?? p.titulo}
                    </span>
                    <span className="block text-[11px] dado mt-0.5">
                      {dataCurta(p.inicioPrevisto)} a {dataCurta(p.fimPrevisto)} · {p.dias}d · {p.areaNome}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span
                      className="text-[10px] font-mono"
                      style={{ color: COR_DE_QUEM[p.quemSegura] }}
                    >
                      {NOME_DE_QUEM[p.quemSegura]}
                    </span>
                    {p.atrasado && (
                      <span className="block text-[10px] numero" style={{ color: 'var(--vermelho)' }}>
                        +{p.diasDeAtraso}d
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </Moldura>
  )
}
