import { exigirSessao } from '@/lib/guarda'
import { prisma } from '@/lib/prisma'
import { montarSemana } from '@/lib/semana'
import { formatarHoras } from '@/lib/datas'
import { calcularRunway, auditarHoraFundador, preverEntradas, reais } from '@/lib/caixa'
import { Moldura } from '@/components/Moldura'
import { salvarCaixa } from '../acoes'

export const dynamic = 'force-dynamic'

export default async function Caixa() {
  await exigirSessao()
  const c = await prisma.caixa.findUnique({ where: { id: 1 } })
  const r = calcularRunway(c)
  const s = await montarSemana()

  // A hora-fundador da semana, ligando apontamento -> frente -> projeto -> valor.
  const apontamentos = await prisma.apontamento.findMany({
    where: { iniciadoEm: { gte: s.inicio, lt: s.fim } },
    include: { tarefa: { include: { frente: { include: { projeto: true } } } } },
  })
  const a = auditarHoraFundador(
    apontamentos.map((ap) => ({
      minutos: Math.max(0, ((ap.encerradoEm ?? new Date()).getTime() - ap.iniciadoEm.getTime()) / 60000),
      valorDoProjeto: ap.tarefa.frente.projeto?.valorEstimado ?? null,
    })),
    c,
  )

  const projetos = await prisma.projeto.findMany({ where: { ativo: true } })
  const emProposta = projetos
    .filter((p) => p.propostaEnviadaEm && p.fase === 'desenvolvimento')
    .reduce((sm, p) => sm + (p.valorEstimado ?? 0), 0)
  const emDesenvolvimento = projetos
    .filter((p) => !p.propostaEnviadaEm && p.fase === 'desenvolvimento')
    .reduce((sm, p) => sm + (p.valorEstimado ?? 0), 0)

  const previsao = preverEntradas(projetos, r.queimaMensal, c?.margemBruta ?? 0)

  const corRunway =
    r.zona === 'vermelho' ? 'var(--vermelho)' : r.zona === 'ambar' ? 'var(--ambar)' : r.zona === 'verde' ? 'var(--verde)' : 'var(--cinza)'

  return (
    <Moldura titulo="Caixa e runway" atalhoAtivo="/caixa">
      <section className="cartao p-5" style={{ borderColor: corRunway }}>
        <p className="rotulo">dias de vida do caixa</p>
        <div className="flex flex-wrap items-end gap-4 mt-1">
          <p className="número text-6xl leading-none" style={{ color: corRunway }}>
            {r.configurado && r.zona !== 'cinza' ? r.dias : '--'}
          </p>
          {r.configurado && (
            <div className="text-sm fraco">
              <p>
                queima <span className="dado">{reais(r.queimaMensal)}</span> por mes ·{' '}
                <span className="dado">{reais(r.queimaDiaria)}</span> por dia
              </p>
              <p>
                equilibrio: faturar <span className="dado">{reais(r.faturamentoDeEquilibrio)}</span> por mes
              </p>
            </div>
          )}
        </div>
        <p className="text-sm mt-3 max-w-3xl" style={{ color: r.zona === 'vermelho' ? 'var(--vermelho)' : 'var(--fraco)' }}>
          {r.frase}
        </p>
      </section>

      <div className="grid lg:grid-cols-2 gap-3 mt-3">
        {/* A auditoria da hora-fundador */}
        <section className="cartao p-4">
          <p className="rotulo mb-2">a sua hora, esta semana</p>
          <div className="h-3 rounded-full overflow-hidden flex bg-[var(--superficie-alta)] mb-2">
            <div
              style={{
                width: `${a.minutosAltoTicket + a.minutosBaixoTicket > 0 ? (a.minutosAltoTicket / (a.minutosAltoTicket + a.minutosBaixoTicket)) * 100 : 0}%`,
                background: 'var(--texto-medio)',
              }}
              title={`Alto ticket: ${formatarHoras(a.minutosAltoTicket)}`}
            />
            <div
              style={{
                width: `${a.minutosAltoTicket + a.minutosBaixoTicket > 0 ? (a.minutosBaixoTicket / (a.minutosAltoTicket + a.minutosBaixoTicket)) * 100 : 0}%`,
                background: a.estourou ? 'var(--vermelho)' : 'var(--ambar)',
              }}
              title={`Baixo ticket: ${formatarHoras(a.minutosBaixoTicket)}`}
            />
          </div>
          <ul className="text-xs space-y-1">
            <li className="flex justify-between">
              <span>Projeto grande</span>
              <span className="dado">{formatarHoras(a.minutosAltoTicket)}</span>
            </li>
            <li className="flex justify-between">
              <span style={{ color: a.estourou ? 'var(--vermelho)' : undefined }}>Baixo ticket</span>
              <span className="dado">{formatarHoras(a.minutosBaixoTicket)}</span>
            </li>
            <li className="flex justify-between fraco">
              <span>Sem projeto</span>
              <span className="dado">{formatarHoras(a.minutosSemProjeto)}</span>
            </li>
          </ul>
          <p className="text-sm mt-3" style={{ color: a.estourou ? 'var(--vermelho)' : 'var(--fraco)' }}>
            {a.frase}
          </p>
        </section>

        {/* O funil em dinheiro */}
        <section className="cartao p-4">
          <p className="rotulo mb-2">o funil, em dinheiro</p>
          <ul className="text-sm space-y-2">
            <li className="flex justify-between">
              <span>Proposta enviada, aguardando</span>
              <span className="dado">{reais(emProposta)}</span>
            </li>
            <li className="flex justify-between">
              <span>Em desenvolvimento, sem proposta</span>
              <span className="dado">{reais(emDesenvolvimento)}</span>
            </li>
          </ul>
          {/* O que entra em 90 dias, com PRAZO DE RECEBIMENTO. Valor sem data
              nao paga folha - foi a correcao que faltava nos dois planos. */}
          <div className="mt-3 pt-3 border-t border-[var(--linha)]">
            <p className="rotulo mb-2">o que entra em 90 dias</p>
            <ul className="text-sm space-y-1">
              <li className="flex justify-between">
                <span>Com data de recebimento até 90 dias</span>
                <span className="dado">{reais(previsao.entraEm90Dias)}</span>
              </li>
              <li className="flex justify-between fraco">
                <span>Ponderado pela probabilidade</span>
                <span className="dado">{reais(previsao.entraEm90DiasPonderado)}</span>
              </li>
              {previsao.semPrazo > 0 && (
                <li className="flex justify-between" style={{ color: 'var(--ambar)' }}>
                  <span>Sem prazo informado</span>
                  <span className="dado">{reais(previsao.semPrazo)}</span>
                </li>
              )}
            </ul>
            <p className="text-sm mt-2" style={{ color: previsao.semPrazo > 0 ? 'var(--ambar)' : 'var(--fraco)' }}>
              {previsao.frase}
            </p>
          </div>
        </section>
      </div>

      <form action={salvarCaixa} className="cartao p-4 mt-3">
        <p className="rotulo mb-3">os números do caixa</p>
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="block">
            <span className="text-xs fraco">Saldo em caixa hoje (R$)</span>
            <input name="saldo" type="number" step="any" defaultValue={c?.saldo ?? ''} className="campo mt-1" />
          </label>
          <label className="block">
            <span className="text-xs fraco">Custo fixo mensal (R$)</span>
            <input name="custoFixoMensal" type="number" step="any" defaultValue={c?.custoFixoMensal ?? ''} className="campo mt-1" />
          </label>
          <label className="block">
            <span className="text-xs fraco">Parcela do emprestimo (R$/mes)</span>
            <input name="parcelaEmprestimo" type="number" step="any" defaultValue={c?.parcelaEmprestimo ?? ''} className="campo mt-1" />
          </label>
          <label className="block">
            <span className="text-xs fraco">Margem bruta media (%)</span>
            <input
              name="margemBruta"
              type="number"
              step="1"
              defaultValue={c ? Math.round(c.margemBruta * 100) : 28}
              className="campo mt-1"
            />
          </label>
          <label className="block">
            <span className="text-xs fraco">Baixo ticket abaixo de (R$)</span>
            <input
              name="limiteBaixoTicket"
              type="number"
              step="any"
              defaultValue={c?.limiteBaixoTicket ?? 100000}
              className="campo mt-1"
            />
          </label>
          <label className="block">
            <span className="text-xs fraco">Teto da sua hora em baixo ticket (%)</span>
            <input
              name="tetoHoraBaixoTicket"
              type="number"
              step="1"
              defaultValue={c ? Math.round(c.tetoHoraBaixoTicket * 100) : 20}
              className="campo mt-1"
            />
          </label>
        </div>
        <button className="botao mt-3">Salvar</button>
        <p className="fraco text-xs mt-2">
          O saldo não se atualiza sozinho - o Jarvis não fala com banco nenhum. Corrija aqui quando o
          número mudar de verdade; runway em cima de saldo velho é pior do que runway nenhum.
        </p>
      </form>
    </Moldura>
  )
}
