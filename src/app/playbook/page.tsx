import { exigirSessao } from '@/lib/guarda'
import { prisma } from '@/lib/prisma'
import { Moldura, Vazio } from '@/components/Moldura'
import { salvarConhecimento, apagarConhecimento } from '../acoes'

export const dynamic = 'force-dynamic'

const CATEGORIAS = [
  { chave: 'tecnico', nome: 'Especificacao tecnica' },
  { chave: 'diferencial', nome: 'Diferencial da KGFM' },
  { chave: 'checklist', nome: 'Checklist / norma' },
  { chave: 'objecao', nome: 'Objecao e resposta' },
  { chave: 'insight', nome: 'Insight' },
]

export default async function Playbook() {
  await exigirSessao()
  const notas = await prisma.conhecimento.findMany({ orderBy: { atualizadoEm: 'desc' } })

  return (
    <Moldura titulo="Playbook KGFM">
      <p className="fraco text-sm mb-4 max-w-3xl">
        O lastro técnico. Serve a duas coisas: parar de deixar o que a KGFM já sabe morando só na
        sua cabeça, e dar chao para a IA quando ela te ajudar a redigir - sem isto ela inventa
        especificação com cara de certeza.
      </p>

      <form action={salvarConhecimento} className="cartao p-4 mb-3">
        <p className="rotulo mb-3">nova nota</p>
        <div className="flex flex-wrap gap-2 items-end mb-2">
          <div className="flex-1 min-w-[220px]">
            <label className="text-xs fraco block mb-1">Titulo</label>
            <input name="titulo" placeholder="Ex.: Sorter de bandeja - quando usar" className="campo" />
          </div>
          <div>
            <label className="text-xs fraco block mb-1">Categoria</label>
            <select name="categoria" className="campo">
              {CATEGORIAS.map((c) => (
                <option key={c.chave} value={c.chave}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[160px]">
            <label className="text-xs fraco block mb-1">Tags</label>
            <input name="tags" placeholder="sorter, ecommerce" className="campo" />
          </div>
        </div>
        <textarea name="conteudo" rows={4} placeholder="O conteudo. Sem formatar - escreva como falaria." className="campo" />
        <button className="botao mt-2">Guardar</button>
      </form>

      {notas.length === 0 ? (
        <Vazio
          titulo="Playbook vazio"
          texto="Comece pelo que você repete em toda reunião: quando usar cada tipo de transportador, o que a KGFM faz diferente, o checklist de NR12. Três notas já mudam a qualidade do que a IA escreve."
        />
      ) : (
        <div className="grid lg:grid-cols-2 gap-3">
          {notas.map((n) => (
            <section key={n.id} className="cartao p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">{n.titulo}</p>
                <span className="text-[10px] dado shrink-0">
                  {CATEGORIAS.find((c) => c.chave === n.categoria)?.nome.toUpperCase() ?? n.categoria.toUpperCase()}
                </span>
              </div>
              {n.tags && <p className="text-xs fraco mt-0.5">{n.tags}</p>}
              <p className="text-sm mt-2 whitespace-pre-wrap leading-relaxed">{n.conteudo}</p>
              <form action={apagarConhecimento} className="mt-2">
                <input type="hidden" name="id" value={n.id} />
                <button className="text-xs fraco">apagar</button>
              </form>
            </section>
          ))}
        </div>
      )}
    </Moldura>
  )
}
