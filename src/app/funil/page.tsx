// O FUNIL DESENHADO, e os indicadores que valem a pena.
//
// O desenho é um funil de verdade - cada etapa mais estreita que a anterior,
// na proporção do dinheiro que ela carrega. Não é enfeite: a largura É o
// número, e é isso que faz enxergar que o topo está vazio sem ler nada.
//
// Cada indicador mostra a fonte de onde veio. Ele precisa poder discordar com
// fundamento, e para isso precisa saber de onde a régua saiu.

import Link from 'next/link'
import { exigirSessao } from '@/lib/guarda'
import { Moldura, Cabeca } from '@/components/Moldura'
import { montarFunil, COR_DA_ZONA_INDICADOR } from '@/lib/funil'

export const dynamic = 'force-dynamic'

const reais = (n: number) =>
  n >= 1000 ? `R$ ${Math.round(n / 1000).toLocaleString('pt-BR')} mil` : `R$ ${Math.round(n).toLocaleString('pt-BR')}`

export default async function FunilPage() {
  await exigirSessao()
  const f = await montarFunil()

  // A largura de cada etapa é proporcional ao valor, com um piso para a etapa
  // vazia continuar visível - etapa que some da tela não comunica que está
  // vazia, comunica que não existe.
  const maior = Math.max(1, ...f.etapas.map((e) => e.valor))

  return (
    <Moldura titulo="Funil e indicadores" atalhoAtivo="/funil">
      {f.faltando.length > 0 && (
        <section className="cartao p-4 mb-3" style={{ borderColor: 'var(--ambar)' }}>
          <p className="rotulo mb-1" style={{ color: 'var(--ambar)' }}>
            os números estão incompletos
          </p>
          <p className="fraco text-sm">
            Falta {f.faltando.join(' e ')}. Enquanto isso, o que está abaixo é o que dá para calcular
            com o que existe - e não o retrato da empresa.
          </p>
        </section>
      )}

      <section className="cartao mb-3">
        <Cabeca
          titulo="o funil"
          direita={<span className="text-[10px] dado">{reais(f.totalPonderado)} PONDERADO</span>}
        />
        <div className="p-3 space-y-2">
          {f.etapas.map((e) => {
            const largura = Math.max(22, (e.valor / maior) * 100)
            return (
              <div key={e.chave}>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium">{e.nome}</span>
                  <span className="numero text-xs">
                    {e.quantidade} · {reais(e.valor)}
                  </span>
                </div>
                <div className="funil-trilho">
                  <div
                    className="funil-fatia"
                    style={{ width: `${largura}%` }}
                    role="img"
                    aria-label={`${e.nome}: ${reais(e.valor)}`}
                  >
                    <span className="funil-ponderado" style={{ width: `${e.valor > 0 ? (e.valorPonderado / e.valor) * 100 : 0}%` }} />
                  </div>
                </div>
                <p className="text-[11px] fraco mt-0.5">{e.significa}</p>
              </div>
            )
          })}
        </div>
        <p className="text-[11px] fraco px-3 pb-3">
          A faixa cheia é o valor total; a parte mais clara dentro dela é o valor ponderado pela
          chance de fechar. A diferença entre as duas é o que o otimismo custa.
        </p>
      </section>

      <div className="grid sm:grid-cols-2 gap-3">
        {f.indicadores.map((i) => (
          <section key={i.chave} className="cartao p-4">
            <div className="flex items-baseline justify-between gap-2">
              <p className="rotulo">{i.nome}</p>
              <span className="numero text-lg" style={{ color: COR_DA_ZONA_INDICADOR[i.zona] }}>
                {i.valor}
              </span>
            </div>
            <p className="text-[11px] dado mt-0.5">alvo: {i.alvo}</p>
            <p className="text-sm fraco mt-2">{i.leitura}</p>
            <p className="text-[11px] mt-2" style={{ color: 'var(--fraco)', opacity: 0.75 }}>
              {i.fonte}
            </p>
          </section>
        ))}
      </div>

      <section className="cartao p-4 mt-3">
        <p className="rotulo mb-2">o que ainda não vem do CRM</p>
        <p className="fraco text-sm">
          O topo do funil - quantas conversas viraram contato real - vive no CRM de prospecção, e o
          Jarvis ainda não lê de lá. Falta o token do CRM nas variáveis deste app. Com ele, entra
          aqui quantos convites viraram conversa e quantas conversas viraram oportunidade, que é o
          que diz se o funil vai ser reabastecido.
        </p>
        <Link href="/prioridades" className="botao-fantasma inline-block mt-3 text-sm">
          Ver a ordem dos projetos
        </Link>
      </section>
    </Moldura>
  )
}
