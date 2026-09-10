import { exigirSessao } from '@/lib/guarda'
import { prisma } from '@/lib/prisma'
import { lerConfig } from '@/lib/configuracao'
import { criticosDaFrente } from '@/lib/mostrador'
import { diasUteisEntre, formatarHoras } from '@/lib/datas'
import { Moldura, Vazio } from '@/components/Moldura'
import { Captura } from '@/components/Captura'
import {
  abrirFrente,
  criarTarefa,
  iniciarCronometro,
  pararCronometro,
  concluirTarefa,
  mexerNaFrente,
  mudarEspera,
  fecharFrente,
} from '../acoes'

export const dynamic = 'force-dynamic'

export default async function Frentes({
  searchParams,
}: {
  searchParams: Promise<{ area?: string; wip?: string; titulo?: string }>
}) {
  await exigirSessao()
  const sp = await searchParams
  const cfg = await lerConfig()

  const areas = await prisma.area.findMany({ orderBy: { ordem: 'asc' } })
  const filtro = sp.area ? areas.find((a) => a.chave === sp.area) : null

  const frentes = await prisma.frente.findMany({
    where: { status: 'aberta', ...(filtro ? { areaId: filtro.id } : {}) },
    include: {
      area: true,
      projeto: true,
      tarefas: { where: { status: 'aberta' }, include: { apontamentos: true } },
      bloqueiaEstas: true,
    },
    orderBy: { ultimoMovimentoEm: 'asc' },
  })

  const areaTravada = sp.wip ? areas.find((a) => a.id === Number(sp.wip)) : null

  return (
    <Moldura titulo={filtro ? `Frentes · ${filtro.nome}` : 'Frentes abertas'}>
      {/* A trava de WIP - e o botao de liberar do lado, na mesma tela. */}
      {areaTravada && (
        <section className="cartao p-4 mb-3" style={{ borderColor: 'var(--ambar)' }}>
          <p className="font-semibold" style={{ color: 'var(--ambar)' }}>
            {areaTravada.nome} ja tem {areaTravada.limiteWip} frentes abertas.
          </p>
          <p className="fraco text-sm mt-1">
            Trabalho em progresso nao entrega valor. O certo e fechar uma antes de abrir outra - mas
            a decisao e sua, e o sistema nao bloqueia sem oferecer a saida.
          </p>
          <form action={abrirFrente} className="mt-3 flex flex-wrap gap-2">
            <input type="hidden" name="titulo" value={sp.titulo ?? ''} />
            <input type="hidden" name="areaId" value={areaTravada.id} />
            <input type="hidden" name="forcar" value="1" />
            <button className="botao">Abrir mesmo assim</button>
            <a href="/frentes" className="botao-fantasma">
              Deixar para depois
            </a>
          </form>
        </section>
      )}

      {/* Abrir frente */}
      <form action={abrirFrente} className="cartao p-4 mb-3 flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[220px]">
          <label className="text-xs fraco block mb-1">Nova frente</label>
          <input name="titulo" placeholder="Ex.: Cotacao Shopee pecas pequenas" className="campo" />
        </div>
        <div>
          <label className="text-xs fraco block mb-1">Area</label>
          <select name="areaId" className="campo" defaultValue={filtro?.id ?? areas[0]?.id}>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>
        </div>
        <button className="botao">Abrir</button>
      </form>

      {frentes.length === 0 ? (
        <Vazio
          titulo="Nenhuma frente aberta"
          texto="Frente e a unidade do painel: um assunto que anda, nao uma tarefa solta. Abra as que estao vivas hoje - o mostrador so mede o que existe aqui."
        />
      ) : (
        <div className="grid lg:grid-cols-2 gap-3">
          {frentes.map((f) => {
            const criticos = criticosDaFrente(
              {
                id: f.id,
                titulo: f.titulo,
                ultimoMovimentoEm: f.ultimoMovimentoEm,
                aguardandoQuem: f.aguardandoQuem,
                aguardandoDesde: f.aguardandoDesde,
                bloqueiaQuantas: f.bloqueiaEstas.length,
                proximoCompromissoEm: null,
              },
              f.area.diasParaCritico,
              cfg,
            )
            const parada = diasUteisEntre(f.ultimoMovimentoEm)
            return (
              <section key={f.id} id={`f${f.id}`} className="cartao p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold leading-tight">{f.titulo}</p>
                    <p className="text-xs fraco mt-0.5">
                      {f.area.nome}
                      {f.projeto ? ` · ${f.projeto.nome}` : ''} ·{' '}
                      {parada === 0 ? 'movida hoje' : `parada ha ${parada} dias uteis`}
                    </p>
                  </div>
                  {criticos.length > 0 && (
                    <span
                      className="text-xs px-2 py-1 rounded-lg shrink-0"
                      style={{ background: 'rgba(220,38,38,.15)', color: 'var(--vermelho)' }}
                    >
                      {criticos[0].motivo === 'cobrar' ? 'cobrar' : 'critico'}
                    </span>
                  )}
                </div>

                {/* Tarefas e cronometro */}
                <ul className="mt-3 space-y-1.5">
                  {f.tarefas.map((t) => {
                    const rodando = t.apontamentos.some((a) => !a.encerradoEm)
                    const minutos = t.apontamentos.reduce(
                      (s, a) => s + ((a.encerradoEm ?? new Date()).getTime() - a.iniciadoEm.getTime()) / 60000,
                      0,
                    )
                    return (
                      <li key={t.id} className="flex items-center gap-2 text-sm">
                        <form action={rodando ? pararCronometro : iniciarCronometro}>
                          <input type="hidden" name="tarefaId" value={t.id} />
                          <button
                            className="w-9 h-9 grid place-items-center rounded-lg border shrink-0"
                            style={{
                              borderColor: rodando ? 'var(--laranja)' : 'var(--linha)',
                              color: rodando ? 'var(--laranja)' : 'inherit',
                            }}
                            aria-label={rodando ? 'Parar' : 'Comecar'}
                          >
                            {rodando ? (
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                                <rect width="12" height="12" rx="2" />
                              </svg>
                            ) : (
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                                <path d="M2 1l9 5-9 5z" />
                              </svg>
                            )}
                          </button>
                        </form>
                        <span className="flex-1 min-w-0 truncate">{t.titulo}</span>
                        {minutos > 0 && <span className="text-xs fraco shrink-0">{formatarHoras(minutos)}</span>}
                        <form action={concluirTarefa}>
                          <input type="hidden" name="tarefaId" value={t.id} />
                          <button className="text-xs fraco px-2 py-1">feita</button>
                        </form>
                      </li>
                    )
                  })}
                </ul>

                <form action={criarTarefa} className="mt-2 flex gap-2">
                  <input type="hidden" name="frenteId" value={f.id} />
                  <input name="titulo" placeholder="Nova tarefa" className="campo text-sm" style={{ minHeight: 40 }} />
                  <button className="botao-fantasma text-sm shrink-0" style={{ minHeight: 40 }}>
                    +
                  </button>
                </form>

                <div className="flex flex-wrap gap-2 mt-3 text-xs">
                  <form action={mexerNaFrente}>
                    <input type="hidden" name="frenteId" value={f.id} />
                    <input type="hidden" name="descricao" value="sinalizado na tela" />
                    <button className="botao-fantasma text-xs" style={{ minHeight: 36 }}>
                      Andei nisso
                    </button>
                  </form>
                  <form action={mudarEspera}>
                    <input type="hidden" name="frenteId" value={f.id} />
                    <input type="hidden" name="quem" value={f.aguardandoQuem === 'eu' ? 'cliente' : 'eu'} />
                    <button className="botao-fantasma text-xs" style={{ minHeight: 36 }}>
                      {f.aguardandoQuem === 'eu' ? 'Passei a bola' : 'A bola voltou'}
                    </button>
                  </form>
                  <form action={fecharFrente}>
                    <input type="hidden" name="frenteId" value={f.id} />
                    <button className="botao-fantasma text-xs" style={{ minHeight: 36 }}>
                      Fechar
                    </button>
                  </form>
                </div>
              </section>
            )
          })}
        </div>
      )}

      <Captura flutuante />
    </Moldura>
  )
}
