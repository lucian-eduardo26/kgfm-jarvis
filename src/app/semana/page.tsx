import { exigirSessao } from '@/lib/guarda'
import { prisma } from '@/lib/prisma'
import { montarSemana } from '@/lib/semana'
import { formatarHoras } from '@/lib/datas'
import { Moldura } from '@/components/Moldura'
import { rodarCheckin, rodarCheckout } from '../acoes'

export const dynamic = 'force-dynamic'

export default async function Semana() {
  await exigirSessao()
  const s = await montarSemana()
  const [checkin, checkout] = await Promise.all([
    prisma.sintese.findFirst({ where: { tipo: 'checkin', periodoInicio: s.inicio }, orderBy: { geradaEm: 'desc' } }),
    prisma.sintese.findFirst({ where: { tipo: 'checkout', periodoInicio: s.inicio }, orderBy: { geradaEm: 'desc' } }),
  ])

  return (
    <Moldura titulo="A semana" atalhoAtivo="/semana">
      {/* Os numeros. Calculados aqui, nao pela IA - numero que muda sozinho
          nao serve para decidir. */}
      <section className="cartao p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="rotulo">
            semana de {s.inicio.toLocaleDateString('pt-BR')} · {s.diasUteisDecorridosNaSemana} de{' '}
            {s.diasUteisNaSemana} dias uteis
          </p>
          <p className="font-mono text-sm">
            {formatarHoras(s.minutosApontados)} de {formatarHoras(s.minutosExpedienteDecorrido)}
          </p>
        </div>

        <div className="h-3 rounded-full overflow-hidden flex bg-[var(--superficie-alta)] mt-3">
          {s.horasPorArea.map((h, i) => (
            <div
              key={h.area}
              style={{
                width: `${(h.minutos / Math.max(s.minutosExpedienteDecorrido, s.minutosApontados, 1)) * 100}%`,
                background: 'var(--texto-medio)',
                opacity: 1 - i * 0.2,
              }}
              title={`${h.area}: ${formatarHoras(h.minutos)}`}
            />
          ))}
          <div
            className="escuro"
            style={{
              width: `${(s.minutosNoEscuro / Math.max(s.minutosExpedienteDecorrido, s.minutosApontados, 1)) * 100}%`,
            }}
          />
        </div>
        <p
          className="text-sm mt-2"
          style={{ color: s.percentualNoEscuro >= 50 ? 'var(--vermelho)' : 'var(--fraco)' }}
        >
          {formatarHoras(s.minutosNoEscuro)} sem registro na semana ({s.percentualNoEscuro}%).
        </p>

        <ul className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-xs fraco font-mono">
          {s.horasPorArea.map((h) => (
            <li key={h.area}>
              {h.area}: {formatarHoras(h.minutos)}
            </li>
          ))}
        </ul>
      </section>

      {/* O desdobramento: semana -> mes -> objetivo */}
      <section className="cartao p-4 mt-3">
        <p className="rotulo mb-3">o desdobramento até o objetivo do mes</p>
        {s.objetivos.length === 0 ? (
          <p className="fraco text-sm">
            Nenhum objetivo do mês com número. Sem alvo não existe desdobramento - e sem
            desdobramento a semana e só uma lista de vontades. Carregue em Estratégia.
          </p>
        ) : (
          <ul className="space-y-3">
            {s.objetivos.map((o) => (
              <li key={o.descricao}>
                <div className="flex flex-wrap justify-between gap-2 text-sm">
                  <span>
                    {o.descricao}
                    {o.area && <span className="fraco"> · {o.area}</span>}
                  </span>
                  <span className="font-mono" style={{ color: o.noRitmo ? 'var(--verde)' : 'var(--vermelho)' }}>
                    {o.realizado} / {o.alvo} · esperado {o.esperadoHoje}
                  </span>
                </div>
                <p className="text-xs fraco mt-0.5 font-mono">
                  faltam {o.faltam} em {o.diasUteisRestantesNoMes} dias uteis = {o.porSemana}/semana ={' '}
                  {o.porDiaUtil}/dia util
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid lg:grid-cols-2 gap-3 mt-3">
        <section className="cartao p-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="rotulo">check-in · o plano</p>
            <form action={rodarCheckin}>
              <button className="botao-fantasma text-sm">{checkin ? 'Refazer' : 'Montar a semana'}</button>
            </form>
          </div>
          {checkin ? (
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{checkin.texto}</p>
          ) : (
            <p className="fraco text-sm">
              O plano da semana sai por bloco de área, nunca por tarefa avulsa, e sempre com a secao
              do que fica de fora - plano sem descarte não e plano. Domingo a noite ou segunda cedo.
            </p>
          )}
        </section>

        <section className="cartao p-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="rotulo">check-out · a conta</p>
            <form action={rodarCheckout}>
              <button className="botao-fantasma text-sm">{checkout ? 'Refazer' : 'Fechar a semana'}</button>
            </form>
          </div>
          {checkout ? (
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{checkout.texto}</p>
          ) : (
            <p className="fraco text-sm">
              Sexta no fim do dia: o que andou, onde esteve o gargalo, plano contra realidade, e a
              leitura honesta das horas. Semana com muito tempo sem registro não e boa nem ruim - e
              semana que não foi medida.
            </p>
          )}
        </section>
      </div>
    </Moldura>
  )
}
