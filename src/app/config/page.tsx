import { exigirSessao } from '@/lib/guarda'
import { prisma } from '@/lib/prisma'
import { lerConfig, CAMPOS } from '@/lib/configuracao'
import { CONFIG_PADRAO } from '@/lib/mostrador'
import { Moldura } from '@/components/Moldura'
import { salvarConfig, restaurarPadrao } from '../acoes'
import { EscolherVoz } from '@/components/EscolherVoz'

export const dynamic = 'force-dynamic'

export default async function Configuracao() {
  await exigirSessao()
  const cfg = await lerConfig()
  const gravados = await prisma.config.findMany()
  const quando = new Map(gravados.map((g) => [g.chave, g.alteradoEm]))
  const areas = await prisma.area.findMany({ orderBy: { ordem: 'asc' } })
  const soma = cfg.pesoMovimento + cfg.pesoCriticos + cfg.pesoAderencia
  const gasto = await prisma.chamadaIa.aggregate({ _sum: { custoEstimado: true }, _count: true })

  return (
    <Moldura titulo="Configuracao" atalhoAtivo="/config">
      <p className="fraco text-sm mb-4 max-w-2xl">
        Tudo aqui nasce com o padrão da especificação. Cada mudanca guarda a data - se o mostrador
        mudar de cor, você precisa conseguir responder se foi o mundo que mudou ou se foi o peso.
      </p>

      <form action={salvarConfig} className="cartao p-4">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide">O mostrador</h2>
          <span className="text-xs" style={{ color: soma === 100 ? 'var(--verde)' : 'var(--ambar)' }}>
            pesos somam {soma}
            {soma !== 100 && ' - deveria somar 100'}
          </span>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {CAMPOS.map((c) => {
            const valor = cfg[c.chave]
            const padrao = CONFIG_PADRAO[c.chave]
            const data = quando.get(c.chave)
            return (
              <label key={c.chave} className="block">
                <span className="text-sm font-medium">{c.rotulo}</span>
                <input
                  type="number"
                  name={c.chave}
                  defaultValue={valor}
                  min={c.min}
                  max={c.max}
                  step={c.passo}
                  className="campo mt-1"
                />
                <span className="text-xs fraco block mt-1">{c.explicacao}</span>
                <span className="text-xs block" style={{ color: valor === padrao ? 'var(--fraco)' : 'var(--ambar)' }}>
                  {valor === padrao
                    ? `padrao: ${padrao}`
                    : `alterado de ${padrao} em ${data ? data.toLocaleDateString('pt-BR') : 'data desconhecida'}`}
                </span>
              </label>
            )
          })}
        </div>

        <div className="flex gap-2 mt-4">
          <button className="botao">Salvar</button>
          <button formAction={restaurarPadrao} className="botao-fantasma">
            Voltar ao padrão
          </button>
        </div>
      </form>

      <section className="cartao p-4 mt-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-3">Limiares por área</h2>
        <ul className="text-sm space-y-1">
          {areas.map((a) => (
            <li key={a.id} className="flex justify-between">
              <span>{a.nome}</span>
              <span className="fraco">
                critico em {a.diasParaCritico} dias uteis · limite de {a.limiteWip} frentes
              </span>
            </li>
          ))}
        </ul>
        <p className="fraco text-xs mt-2">
          Editar limiar por área entra junto com a tela de áreas. Hoje muda no banco.
        </p>
      </section>

      <EscolherVoz />

      <section className="cartao p-4 mt-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-2">Conta da API</h2>
        <p className="text-sm">
          {gasto._count} {gasto._count === 1 ? 'chamada' : 'chamadas'} ·{' '}
          <strong>US$ {(gasto._sum.custoEstimado ?? 0).toFixed(4)}</strong> estimados
        </p>
        <p className="fraco text-xs mt-1">
          A conta sobe aqui antes de subir na fatura. Classificacao usa o modelo pequeno de propósito.
        </p>
      </section>
    </Moldura>
  )
}
