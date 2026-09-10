import { exigirSessao } from '@/lib/guarda'
import { prisma } from '@/lib/prisma'
import { formatarHoras } from '@/lib/datas'
import { Moldura, Vazio } from '@/components/Moldura'
import { criarProjetoComWbs, ativarPacote, mudarFaseProjeto } from '../acoes'
import { Spin } from '@/components/Spin'
import { LinhaDoTempo } from '@/components/LinhaDoTempo'
import { montarLinhaDoTempo } from '@/lib/linhaDoTempo'

export const dynamic = 'force-dynamic'

const FASES = [
  { chave: 'desenvolvimento', nome: 'Desenvolvimento', ajuda: 'antes de fechar - ainda e aposta, e custo de venda' },
  { chave: 'fechado', nome: 'Fechado', ajuda: 'virou obrigacao, com cliente contando os dias' },
  { chave: 'entregue', nome: 'Entregue', ajuda: 'onde o dinheiro costuma ficar parado sem ninguem olhar' },
] as const

export default async function Projetos({ searchParams }: { searchParams: Promise<{ wip?: string; spin?: string }> }) {
  await exigirSessao()
  const sp = await searchParams

  const projetos = await prisma.projeto.findMany({
    where: { ativo: true },
    orderBy: { criadoEm: 'desc' },
    include: {
      decisores: { orderBy: { criadoEm: 'asc' } },
      frentes: {
        where: { status: { in: ['planejada', 'aberta', 'fechada'] } },
        orderBy: { ordem: 'asc' },
        include: {
          area: true,
          tarefas: { include: { apontamentos: true } },
          movimentos: { orderBy: { em: 'desc' }, take: 60 },
          itens: { where: { venceEm: { not: null } }, select: { conteudo: true, venceEm: true } },
        },
      },
    },
  })

  const travada = sp.wip
    ? await prisma.frente.findUnique({ where: { id: Number(sp.wip) }, include: { area: true } })
    : null

  return (
    <Moldura titulo="Projetos e WBS" atalhoAtivo="/projetos">
      {travada && (
        <section className="cartao p-4 mb-3" style={{ borderColor: 'var(--ambar)' }}>
          <p className="font-semibold" style={{ color: 'var(--ambar)' }}>
            {travada.area.nome} ja esta no limite de {travada.area.limiteWip} frentes abertas.
          </p>
          <p className="fraco text-sm mt-1">
            Ativar &quot;{travada.titulo}&quot; agora significa mais uma coisa aberta na mesma cabeca.
            O certo e fechar uma antes - mas a decisao e sua.
          </p>
          <form action={ativarPacote} className="mt-3 flex gap-2">
            <input type="hidden" name="frenteId" value={travada.id} />
            <input type="hidden" name="forcar" value="1" />
            <button className="botao">Ativar mesmo assim</button>
            <a href="/projetos" className="botao-fantasma">Deixar planejado</a>
          </form>
        </section>
      )}

      <form action={criarProjetoComWbs} className="cartao p-4 mb-3">
        <p className="rotulo mb-3">novo projeto</p>
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs fraco block mb-1">Nome</label>
            <input name="nome" placeholder="Ex.: Transportador de caixas - CD Guarulhos" className="campo" />
          </div>
          <div className="min-w-[150px]">
            <label className="text-xs fraco block mb-1">Cliente</label>
            <input name="cliente" className="campo" />
          </div>
          <div className="w-36">
            <label className="text-xs fraco block mb-1">Valor estimado</label>
            <input name="valorEstimado" type="number" step="any" className="campo" />
          </div>
          <div className="w-32">
            <label className="text-xs fraco block mb-1">Recebe em (dias)</label>
            <input name="prazoRecebimentoDias" type="number" placeholder="60" className="campo" />
          </div>
          <div className="w-28">
            <label className="text-xs fraco block mb-1">Chance (%)</label>
            <input name="probabilidade" type="number" defaultValue={50} className="campo" />
          </div>
          <div>
            <label className="text-xs fraco block mb-1">Fase</label>
            <select name="fase" className="campo">
              {FASES.map((f) => (
                <option key={f.chave} value={f.chave}>{f.nome}</option>
              ))}
            </select>
          </div>
          <button className="botao">Criar com WBS</button>
        </div>
        <p className="fraco text-xs mt-2">
          A WBS padrao entra desdobrada nos quatro setores, com os pacotes PLANEJADOS - nao abertos.
          Plano nao consome limite de WIP; so o que voce ativa e que conta.
        </p>
      </form>

      {projetos.length === 0 ? (
        <Vazio
          titulo="Nenhum projeto"
          texto="Projeto e o centro de custo: e por ele que as horas do cronometro se agrupam. Crie um e a WBS desdobra sozinha em Comercial, Engenharia, Producao e ADM."
        />
      ) : (
        <div className="space-y-3">
          {projetos.map((p) => {
            const minutos = p.frentes.reduce(
              (s, f) =>
                s +
                f.tarefas.reduce(
                  (st, t) =>
                    st +
                    t.apontamentos.reduce(
                      (sa, a) => sa + ((a.encerradoEm ?? new Date()).getTime() - a.iniciadoEm.getTime()) / 60000,
                      0,
                    ),
                  0,
                ),
              0,
            )
            const porArea = new Map<string, number>()
            for (const f of p.frentes) {
              const m = f.tarefas.reduce(
                (st, t) =>
                  st +
                  t.apontamentos.reduce(
                    (sa, a) => sa + ((a.encerradoEm ?? new Date()).getTime() - a.iniciadoEm.getTime()) / 60000,
                    0,
                  ),
                0,
              )
              porArea.set(f.area.nome, (porArea.get(f.area.nome) ?? 0) + m)
            }

            return (
              <section key={p.id} className="cartao p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{p.nome}</p>
                    <p className="text-xs fraco mt-0.5">
                      {p.cliente ?? 'sem cliente'} ·{' '}
                      {p.valorEstimado ? `R$ ${p.valorEstimado.toLocaleString('pt-BR')}` : 'sem valor'} ·{' '}
                      {FASES.find((f) => f.chave === p.fase)?.nome}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-lg">{formatarHoras(minutos)}</p>
                    <p className="text-[10px] fraco font-mono">APONTADO NO PROJETO</p>
                  </div>
                </div>

                {minutos > 0 && (
                  <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs fraco">
                    {[...porArea.entries()]
                      .filter(([, m]) => m > 0)
                      .map(([nome, m]) => (
                        <li key={nome} className="font-mono">
                          {nome}: {formatarHoras(m)}
                        </li>
                      ))}
                  </ul>
                )}

                {/* A WBS */}
                <ul className="mt-4 space-y-1.5">
                  {p.frentes.map((f) => {
                    const feitas = f.tarefas.filter((t) => t.status === 'feita').length
                    return (
                      <li key={f.id} className="flex flex-wrap items-center gap-2 text-sm border-t border-[var(--linha)] pt-1.5">
                        <span
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                          style={{ background: 'var(--superficie-alta)', color: 'var(--fraco)' }}
                        >
                          {f.area.nome.slice(0, 3).toUpperCase()}
                        </span>
                        <span className="flex-1 min-w-[160px]">{f.titulo}</span>
                        <span className="text-xs fraco font-mono">
                          {feitas}/{f.tarefas.length}
                        </span>
                        {f.status === 'planejada' ? (
                          <form action={ativarPacote}>
                            <input type="hidden" name="frenteId" value={f.id} />
                            <button className="botao-fantasma text-xs" style={{ minHeight: 32 }}>
                              Ativar
                            </button>
                          </form>
                        ) : (
                          <span
                            className="text-[10px] font-mono px-2 py-1 rounded"
                            style={{
                              color: f.status === 'aberta' ? 'var(--verde)' : 'var(--fraco)',
                              background: 'var(--superficie-alta)',
                            }}
                          >
                            {f.status === 'aberta' ? 'ATIVO' : 'FECHADO'}
                          </span>
                        )}
                      </li>
                    )
                  })}
                </ul>

                <LinhaDoTempo r={montarLinhaDoTempo({ frentes: p.frentes })} />

                <Spin
                  projetoId={p.id}
                  estado={{ situacao: p.situacao, problema: p.problema, implicacao: p.implicacao, necessidade: p.necessidade }}
                  propostaEnviadaEm={p.propostaEnviadaEm}
                  decisores={p.decisores}
                  travado={sp.spin === String(p.id)}
                />

                <form action={mudarFaseProjeto} className="flex gap-2 mt-3 items-center">
                  <input type="hidden" name="projetoId" value={p.id} />
                  <select name="fase" defaultValue={p.fase} className="campo text-sm" style={{ minHeight: 38, width: 'auto' }}>
                    {FASES.map((f) => (
                      <option key={f.chave} value={f.chave}>{f.nome}</option>
                    ))}
                  </select>
                  <button className="botao-fantasma text-sm" style={{ minHeight: 38 }}>
                    Mudar fase
                  </button>
                  <span className="text-xs fraco">
                    mudar de fase acrescenta os pacotes novos, sem apagar os antigos
                  </span>
                </form>
              </section>
            )
          })}
        </div>
      )}
    </Moldura>
  )
}
