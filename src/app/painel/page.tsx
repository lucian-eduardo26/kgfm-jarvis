import Link from 'next/link'
import { exigirSessao } from '@/lib/guarda'
import { montarPainel } from '@/lib/painel'
import { decidirAgora } from '@/lib/agora'
import { formatarHoras } from '@/lib/datas'
import { temChave } from '@/lib/classificador'
import { Moldura, Vazio } from '@/components/Moldura'
import { Mostrador } from '@/components/Mostrador'
import { Captura } from '@/components/Captura'
import { Ciclo } from '@/components/Ciclo'
import { COR_DA_ZONA } from '@/lib/mostrador'
import { limparExemplo, comandoDeVoz, continuarBloco, comecarDescanso, encerrarDescanso, pararCronometro } from '../acoes'
import { ComandoVoz } from '@/components/ComandoVoz'
import { confrontar } from '@/lib/expediente'
import { lerConfig } from '@/lib/configuracao'
import { AgendaDoDia } from '@/components/AgendaDoDia'
import { hojeSP } from '@/lib/datas'
import { vozDoDia } from '@/lib/resistencia'

export const dynamic = 'force-dynamic'

export default async function Painel() {
  await exigirSessao()
  const d = await montarPainel()
  const cfg = await lerConfig()
  const agora = decidirAgora(d)
  const horas = new Map(d.horasHoje.map((h) => [h.areaId, h.minutos]))
  const c = confrontar(d.minutosHoje)

  const agenda = d.agenda
  const voz = vozDoDia({
    percentualNoEscuro: c.percentualNoEscuro,
    minutosExpediente: c.minutosExpediente,
    temCronometro: Boolean(d.cronometro),
    criticos: d.criticosGerais.length,
    bloqueadores: d.criticosGerais.filter((x) => x.bloqueia > 0).length,
    piorIndice: Math.min(...d.areas.filter((a) => a.zona !== 'cinza').map((a) => a.indice), 100),
    temEstrategia: d.temEstrategia,
    diaParadoMaisVelho: Math.max(0, ...d.criticosGerais.map((x) => x.dias)),
  })

  return (
    <Moldura titulo="Painel">
      {/* Aviso de carga de teste. Trava com botao de liberar do lado. */}
      {d.temExemplo && (
        <div className="cartao p-3 mb-3 flex flex-wrap items-center justify-between gap-2" style={{ borderColor: 'var(--ambar)' }}>
          <p className="text-sm">
            <strong style={{ color: 'var(--ambar)' }}>Isto e carga de exemplo.</strong>{' '}
            <span className="fraco">
              Tudo marcado com [exemplo] foi inventado para os ponteiros terem o que medir. Nenhum
              numero aqui e da KGFM.
            </span>
          </p>
          <form action={limparExemplo}>
            <button className="botao-fantasma text-sm">Apagar o exemplo</button>
          </form>
        </div>
      )}

      {/* FACA AGORA - destaque maximo, uma acao obvia por tela */}
      {agora && (
        <section className="cartao p-4 sm:p-5 mb-3" style={{ borderColor: 'var(--laranja)' }}>
          <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--laranja)' }}>
            faca agora
          </p>
          <p className="text-xl sm:text-2xl font-bold mt-1 leading-tight">{agora.titulo}</p>
          <p className="fraco text-sm mt-2 max-w-3xl">{agora.porque}</p>
          {agora.frenteId && (
            <Link href={`/frentes#f${agora.frenteId}`} className="botao-fantasma inline-block mt-3">
              Abrir a frente
            </Link>
          )}
        </section>
      )}

      <div className="mb-3">
        <ComandoVoz acao={comandoDeVoz} />
      </div>

      {(d.cronometro || d.descanso) && (
        <div className="mb-3">
          <Ciclo
            cronometro={
              d.cronometro
                ? {
                    apontamentoId: d.cronometro.apontamentoId,
                    tarefaId: d.cronometro.tarefaId,
                    tarefaTitulo: d.cronometro.tarefaTitulo,
                    frenteTitulo: d.cronometro.frenteTitulo,
                    areaNome: d.cronometro.areaNome,
                    iniciadoEm: d.cronometro.iniciadoEm.toISOString(),
                    blocoDesde: d.cronometro.blocoDesde.toISOString(),
                    blocosFeitos: d.cronometro.blocosFeitos,
                  }
                : null
            }
            descanso={
              d.descanso
                ? { ...d.descanso, inicio: d.descanso.inicio.toISOString() }
                : null
            }
            emCompromisso={d.emCompromisso}
            ciclo={{
              minutosBloco: cfg.minutosBloco,
              minutosDescanso: cfg.minutosDescanso,
              minutosDescansoLongo: cfg.minutosDescansoLongo,
              blocosAteDescansoLongo: cfg.blocosAteDescansoLongo,
            }}
            acoes={{ continuarBloco, comecarDescanso, encerrarDescanso, pararCronometro }}
          />
        </div>
      )}

      {/* Mostradores */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        {d.areas.map((a) => (
          <Mostrador
            key={a.areaId}
            nome={a.nome}
            indice={a.indice}
            zona={a.zona}
            legenda={a.legenda}
            frentes={a.frentesAbertas}
            minutosHoje={horas.get(a.areaId) ?? 0}
            href={`/frentes?area=${a.chave}`}
          />
        ))}
      </section>

      <div className="mb-3">
        <AgendaDoDia a={agenda} hoje={hojeSP()} />
      </div>

      <div className="grid lg:grid-cols-2 gap-3">
        {/* Criticos */}
        <section className="cartao p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide mb-3">Criticos</h2>
          {d.criticosGerais.length === 0 ? (
            <p className="fraco text-sm">
              Nenhum. Nao e tela quebrada - e o estado que o sistema existe para produzir.
            </p>
          ) : (
            <ul className="space-y-2">
              {d.criticosGerais.map((c, i) => (
                <li key={`${c.frenteId}-${i}`} className="flex items-start gap-2 text-sm">
                  <span
                    className="mt-1.5 w-2 h-2 rounded-full shrink-0"
                    style={{ background: c.bloqueia > 0 ? COR_DA_ZONA.vermelho : COR_DA_ZONA.ambar }}
                  />
                  <span className="min-w-0">
                    <span className="font-medium">{c.titulo}</span>
                    <span className="fraco"> - {c.texto}</span>
                    {c.bloqueia > 0 && (
                      <span style={{ color: 'var(--vermelho)' }}> · trava {c.bloqueia}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Tempo de hoje - o dash em tempo real */}
        <section className="cartao p-4">
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="text-sm font-semibold uppercase tracking-wide">O dia</h2>
            <span className="text-xs fraco font-mono tabular-nums">
              {formatarHoras(c.minutosApontados)} de {formatarHoras(c.minutosExpediente)}
            </span>
          </div>

          {/* Uma barra so: o dia inteiro, com o buraco visivel. */}
          <div className="h-3 rounded-full overflow-hidden flex bg-[var(--superficie-alta)] mb-2">
            {d.areas.map((a, i) => {
              const min = horas.get(a.areaId) ?? 0
              const base = Math.max(c.minutosExpediente, d.minutosHoje, 1)
              return (
                <div
                  key={a.areaId}
                  style={{ width: `${(min / base) * 100}%`, background: 'var(--texto-medio)', opacity: 1 - i * 0.2 }}
                  title={`${a.nome}: ${formatarHoras(min)}`}
                />
              )
            })}
            <div
              className="escuro"
              style={{
                width: `${(c.minutosNoEscuro / Math.max(c.minutosExpediente, d.minutosHoje, 1)) * 100}%`,
              }}
              title={`Sem registro: ${formatarHoras(c.minutosNoEscuro)}`}
            />
          </div>

          <p
            className="text-sm"
            style={{ color: c.percentualNoEscuro >= 50 ? 'var(--vermelho)' : 'var(--fraco)' }}
          >
            <strong className="font-mono tabular-nums">{formatarHoras(c.minutosNoEscuro)}</strong> sem
            registro hoje ({c.percentualNoEscuro}% do expediente). {c.frase}
          </p>

          <ul className="space-y-1.5 mt-3">
            {d.areas.map((a, i) => {
              const min = horas.get(a.areaId) ?? 0
              return (
                <li key={a.areaId} className="flex justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: 'var(--texto-medio)', opacity: 1 - i * 0.2 }} />
                    {a.nome}
                  </span>
                  <span className="dado">{formatarHoras(min)}</span>
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      {!d.temEstrategia && (
        <div className="mt-3">
          <Vazio
            titulo="O painel ainda mede atividade, nao progresso"
            texto="Falta a estrategia: diagnostico, politica norteadora e os objetivos do ano e do mes. Sem isso os mostradores nao conseguem dizer se voce esta andando para o lado certo."
            acao={
              <Link href="/estrategia" className="botao inline-block">
                Carregar estrategia
              </Link>
            }
          />
        </div>
      )}

      {!temChave() && (
        <p className="fraco text-xs mt-3">
          Sem chave da API: a captura funciona e guarda tudo, mas ninguem classifica. Os itens ficam
          em Capturas esperando a mao.
        </p>
      )}

      {/* A voz. Escolhida pelo estado, nunca sorteada. */}
      <section className="cartao p-4 mt-3">
        <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--laranja)' }}>
          {voz.titulo}
        </p>
        <p className="text-sm mt-1 max-w-3xl">{voz.frase}</p>
      </section>

      <Captura flutuante />
    </Moldura>
  )
}
