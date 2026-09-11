// O ALERTA DE CAIXA, no topo de tudo.
//
// O Lucian em 11/09/2026: "eu quero sinalizadores de urgência, de alerta - tal
// coisa está vencendo, isso tem que ser feito hoje até tal hora. Afinal o
// caixa é quem manda nessa prioridade."
//
// Fica ACIMA do relógio e das barras, e é o único bloco do sistema que tem
// esse direito. O motivo: tudo mais no painel responde "como estão as coisas";
// isto responde "o que você perde se não fizer hoje", e essa pergunta vence.
//
// Some quando não há nada vencendo. Alerta que vive na tela é papel de parede,
// e papel de parede não alerta ninguém.

import Link from 'next/link'
import type { Alerta } from '@/lib/urgencia'
import { COR_DO_NIVEL } from '@/lib/urgencia'

export function AlertaDeCaixa({ alertas }: { alertas: Alerta[] }) {
  // Folgado não é alerta, é estado normal. Só aparece o que aperta.
  const vivos = alertas.filter((a) => a.nivel !== 'folgado')
  if (vivos.length === 0) return null

  const pior = vivos[0]
  const cor = COR_DO_NIVEL[pior.nivel]

  return (
    <section className="cartao p-4 mb-3" style={{ borderColor: cor }}>
      <p className="rotulo" style={{ color: cor }}>
        {pior.nivel === 'estourou'
          ? 'passou do corte'
          : pior.nivel === 'hoje'
            ? 'tem que ser hoje'
            : 'o corte está perto'}
      </p>

      <div className="mt-2 space-y-3">
        {vivos.map((a) => (
          <div key={a.projetoId}>
            <Link href={`/projetos/${a.projetoId}`} className="font-semibold hover:underline">
              {a.titulo}
            </Link>
            <p className="text-sm fraco mt-0.5">{a.porque}</p>
            <p className="text-sm mt-0.5" style={{ color: COR_DO_NIVEL[a.nivel] }}>
              {a.acao}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
