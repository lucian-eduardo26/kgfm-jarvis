'use client'

import { useEffect, useState } from 'react'
import { pararCronometro } from '@/app/acoes'

export function Cronometro({
  iniciadoEm,
  tarefa,
  frente,
  area,
}: {
  iniciadoEm: string
  tarefa: string
  frente: string
  area: string
}) {
  const [agora, setAgora] = useState(() => Date.now())

  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const seg = Math.max(0, Math.floor((agora - new Date(iniciadoEm).getTime()) / 1000))
  const hh = String(Math.floor(seg / 3600)).padStart(2, '0')
  const mm = String(Math.floor((seg % 3600) / 60)).padStart(2, '0')
  const ss = String(seg % 60).padStart(2, '0')

  return (
    <div className="cartao p-4 flex items-center justify-between gap-4" style={{ borderColor: 'var(--laranja)' }}>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--laranja)' }}>
          rodando agora - {area}
        </p>
        <p className="font-semibold truncate">{tarefa}</p>
        <p className="text-xs fraco truncate">{frente}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-2xl sm:text-3xl font-mono tabular-nums">
          {hh}:{mm}:{ss}
        </span>
        <form action={pararCronometro}>
          <button className="botao-fantasma">Parar</button>
        </form>
      </div>
    </div>
  )
}
