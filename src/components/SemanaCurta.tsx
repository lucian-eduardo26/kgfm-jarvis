// A SEMANA EM SETE COLUNAS, do tamanho de um cartão.
//
// O Lucian em 10/09/2026: "o card da agenda com uma janelinha que mostra a
// minha semana, sempre por semana".
//
// É a "visão geral" da mantra de Shneiderman aplicada ao tempo: sete colunas,
// um traço por compromisso, hoje marcado. Não dá para ler o que é cada
// compromisso - e não precisa. A pergunta que este cartão responde é "a minha
// semana está cheia ou vazia, e onde", que é a pergunta de quem está
// decidindo o que fazer agora.
//
// O detalhe fica a um toque, na tela da agenda. Details-on-demand.
//
// Isto NÃO é o Google Calendar ainda: mostra o que está no Jarvis. Quando a
// conexão com o Google existir, a mesma tira passa a mostrar os dois - o
// formato não muda, só a fonte.

import Link from 'next/link'

export type DiaDaSemana = {
  /** ISO do dia, para a chave e para o link. */
  dia: string
  sigla: string
  numero: number
  compromissos: number
  hoje: boolean
}

export function SemanaCurta({ dias, titulo = 'a semana' }: { dias: DiaDaSemana[]; titulo?: string }) {
  const total = dias.reduce((s, d) => s + d.compromissos, 0)

  return (
    <section className="cartao">
      <div className="painel-cabeca">
        <span className="rotulo">{titulo}</span>
        <Link href="/agenda" className="text-[10px] dado">
          {total === 0 ? 'SEM COMPROMISSO' : `${total} NA SEMANA`}
        </Link>
      </div>

      <div className="p-2">
        <div className="semana-tiras">
          {dias.map((d) => (
            <Link
              key={d.dia}
              href={`/agenda?dia=${d.dia}`}
              className={d.hoje ? 'semana-dia semana-dia-hoje' : 'semana-dia'}
              aria-label={`${d.sigla} ${d.numero}, ${d.compromissos} compromissos`}
            >
              <span className="semana-sigla">{d.sigla}</span>
              <span className="numero semana-numero" style={{ color: d.hoje ? 'var(--texto)' : 'var(--texto-medio)' }}>
                {d.numero}
              </span>
              <span className="semana-marcas">
                {d.compromissos === 0 ? (
                  <span className="semana-vazio" />
                ) : (
                  Array.from({ length: Math.min(3, d.compromissos) }).map((_, i) => (
                    <span key={i} className="semana-marca" />
                  ))
                )}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
