'use client'

// O sinal de que ESTÁ gravando, no formato que todo mundo já conhece de
// aplicativo de mensagem: ponto vermelho pulsando e o tempo correndo.
//
// Pedido do Lucian em 10/09/2026, e o motivo é bom: sem ver o tempo andar não
// dá para saber se ainda está gravando ou se travou calado. Microfone aceso
// não prova nada - o número subindo, sim.
//
// A terceira informação é a que mais importa e nenhum aplicativo de mensagem
// mostra: se está ENTENDENDO. Passou de quatro segundos sem reconhecer nada,
// o ponto muda de cor e o texto avisa. Assim ele sabe a diferença entre
// "estou falando e você não pega" e "parei de falar".

export function Gravando({ segundos, mudo }: { segundos: number; mudo: boolean }) {
  const m = Math.floor(segundos / 60)
  const s = segundos % 60
  const relogio = `${m}:${String(s).padStart(2, '0')}`

  return (
    <span className="gravando" role="status" aria-live="polite">
      <span className={mudo ? 'gravando-ponto gravando-ponto-mudo' : 'gravando-ponto'} aria-hidden />
      <span className="numero gravando-tempo">{relogio}</span>
      <span className="gravando-texto">{mudo ? 'não estou ouvindo nada' : 'gravando'}</span>
    </span>
  )
}
