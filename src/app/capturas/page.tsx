import { exigirSessao } from '@/lib/guarda'
import { prisma } from '@/lib/prisma'
import { Moldura, Vazio } from '@/components/Moldura'
import { Captura } from '@/components/Captura'
import { corrigirItem, descartarItem } from '../acoes'

export const dynamic = 'force-dynamic'

const TIPOS = ['tarefa', 'insight', 'compromisso', 'oportunidade', 'indefinido'] as const

export default async function Capturas() {
  await exigirSessao()
  const [itens, areas, corrigidos, total] = await Promise.all([
    prisma.item.findMany({
      where: { descartadoEm: null },
      orderBy: { criadoEm: 'desc' },
      take: 80,
      include: { area: true, frente: true },
    }),
    prisma.area.findMany({ orderBy: { ordem: 'asc' } }),
    prisma.item.count({ where: { corrigidoPeloUsuario: true } }),
    prisma.item.count(),
  ])

  return (
    <Moldura titulo="Capturas">
      {/* Classificacao errada e silenciosa: este numero e o alarme. */}
      {total > 0 && (
        <p className="fraco text-sm mb-3">
          {total} capturas · {corrigidos} corrigidas na mao (
          {Math.round((corrigidos / total) * 100)}%). Se esse numero subir muito, quem esta errando e
          a classificacao, nao voce.
        </p>
      )}

      {itens.length === 0 ? (
        <Vazio
          titulo="Nada capturado ainda"
          texto="A caixa de baixo aceita qualquer coisa: uma ideia, um nome, um prazo. Sem escolher pasta, sem campo obrigatorio. Se levar mais que dez segundos, esta errado."
        />
      ) : (
        <ul className="space-y-2">
          {itens.map((i) => (
            <li key={i.id} className="cartao p-3">
              <p className="text-sm">{i.conteudo}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs fraco">
                <span>{i.criadoEm.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                <span>·</span>
                <span>{i.origem}</span>
                {i.confiancaClassificacao != null && (
                  <>
                    <span>·</span>
                    <span style={{ color: i.confiancaClassificacao < 0.5 ? 'var(--ambar)' : undefined }}>
                      confianca {Math.round(i.confiancaClassificacao * 100)}%
                    </span>
                  </>
                )}
                {i.frente && (
                  <>
                    <span>·</span>
                    <span>{i.frente.titulo}</span>
                  </>
                )}
                {i.corrigidoPeloUsuario && <span style={{ color: 'var(--ambar)' }}>· corrigido</span>}
              </div>

              <form action={corrigirItem} className="flex flex-wrap gap-2 mt-2">
                <input type="hidden" name="id" value={i.id} />
                <select name="tipo" defaultValue={i.tipo} className="campo text-sm" style={{ minHeight: 40, width: 'auto' }}>
                  {TIPOS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <select name="areaId" defaultValue={i.areaId ?? ''} className="campo text-sm" style={{ minHeight: 40, width: 'auto' }}>
                  <option value="">sem area</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome}
                    </option>
                  ))}
                </select>
                <button className="botao-fantasma text-sm" style={{ minHeight: 40 }}>
                  Corrigir
                </button>
                <button
                  formAction={descartarItem}
                  className="text-sm fraco px-2"
                  style={{ minHeight: 40 }}
                >
                  Descartar
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <Captura flutuante />
    </Moldura>
  )
}
