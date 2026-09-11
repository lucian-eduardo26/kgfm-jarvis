// O bloco de SPIN dentro do projeto, com a trava da proposta.

import { degraus, podeMandarProposta, completude, type EstadoSpin } from '@/lib/spin'
import { salvarSpin, marcarPropostaEnviada, salvarDecisor } from '@/app/acoes'

type Decisor = {
  id: number
  nome: string
  cargo: string | null
  oQueDoiParaEle: string | null
  interesses: string | null
}

export function Spin({
  projetoId,
  estado,
  propostaEnviadaEm,
  decisores,
  travado,
}: {
  projetoId: number
  estado: EstadoSpin
  propostaEnviadaEm: Date | null
  decisores: Decisor[]
  travado: boolean
}) {
  const v = podeMandarProposta(estado)
  const pct = completude(estado)

  return (
    <div className="mt-4 pt-3 border-t border-[var(--linha)]">
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="rotulo">qualificacao spin</p>
        <div className="flex items-center gap-2">
          <div className="w-24 h-1.5 rounded-full bg-[var(--superficie-alta)] overflow-hidden">
            <div
              className="h-full"
              style={{ width: `${pct}%`, background: v.liberado ? 'var(--verde)' : 'var(--ambar)' }}
            />
          </div>
          <span className="text-[10px] dado">{pct}%</span>
        </div>
      </div>

      {/* A trava, quando ele tentou registrar proposta sem base. */}
      {travado && (
        <div className="cartao p-3 mb-3" style={{ borderColor: 'var(--ambar)' }}>
          <p className="text-sm" style={{ color: 'var(--ambar)' }}>
            {v.aviso}
          </p>
          <form action={marcarPropostaEnviada} className="flex gap-2 mt-2">
            <input type="hidden" name="projetoId" value={projetoId} />
            <input type="hidden" name="forcar" value="1" />
            <button className="botao text-sm">Registrar mesmo assim</button>
            <a href="/projetos" className="botao-fantasma text-sm">
              Voltar e qualificar
            </a>
          </form>
        </div>
      )}

      <form action={salvarSpin} className="grid sm:grid-cols-2 gap-3">
        <input type="hidden" name="projetoId" value={projetoId} />
        {degraus(estado).map((d) => (
          <label key={d.campo} className="block">
            <span className="text-xs font-semibold">
              <span className="dado mr-1">{d.letra}</span>
              {d.nome}
              {!d.preenchido && (d.letra === 'I' || d.letra === 'N') && (
                <span style={{ color: 'var(--ambar)' }}> · falta</span>
              )}
            </span>
            <textarea
              name={d.campo}
              defaultValue={estado[d.campo] ?? ''}
              rows={2}
              placeholder={d.pergunta}
              className="campo mt-1 text-sm"
            />
          </label>
        ))}
        <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
          <button className="botao-fantasma text-sm">Salvar SPIN</button>

          {propostaEnviadaEm ? (
            <span className="text-xs dado">
              PROPOSTA ENVIADA EM {propostaEnviadaEm.toLocaleDateString('pt-BR')}
            </span>
          ) : (
            <button
              formAction={marcarPropostaEnviada}
              className="botao-fantasma text-sm"
              style={v.liberado ? { borderColor: 'var(--verde)', color: 'var(--verde)' } : undefined}
            >
              Registrar proposta enviada
            </button>
          )}

          <span className="text-xs" style={{ color: v.liberado ? 'var(--verde)' : 'var(--fraco)' }}>
            {v.liberado ? 'qualificado' : `falta ${v.faltam.join(' e ')}`}
          </span>
        </div>
      </form>

      {/* O decisor. Carnegie: o que dói para ELE, com as palavras dele. */}
      <div className="mt-4">
        <p className="rotulo mb-2">quem decide</p>
        {decisores.length > 0 && (
          <ul className="space-y-2 mb-2">
            {decisores.map((d) => (
              <li key={d.id} className="text-sm">
                <span className="font-medium">{d.nome}</span>
                {d.cargo && <span className="fraco"> · {d.cargo}</span>}
                {d.oQueDoiParaEle && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--ambar)' }}>
                    dói: {d.oQueDoiParaEle}
                  </p>
                )}
                {d.interesses && <p className="text-xs fraco">interesses: {d.interesses}</p>}
              </li>
            ))}
          </ul>
        )}
        <form action={salvarDecisor} className="grid sm:grid-cols-4 gap-2">
          <input type="hidden" name="projetoId" value={projetoId} />
          <input name="nome" placeholder="Nome" className="campo text-sm" style={{ minHeight: 38 }} />
          <input name="cargo" placeholder="Cargo" className="campo text-sm" style={{ minHeight: 38 }} />
          <input
            name="oQueDoiParaEle"
            placeholder="O que dói para ele (palavras dele)"
            className="campo text-sm"
            style={{ minHeight: 38 }}
          />
          <div className="flex gap-2">
            <input name="interesses" placeholder="Interesses" className="campo text-sm" style={{ minHeight: 38 }} />
            <button className="botao-fantasma text-sm shrink-0" style={{ minHeight: 38 }}>
              +
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
