// A AGENDA.
//
// O Lucian em 10/09/2026: "o Jarvis é focado em tempo, em gestão, estratégia,
// então minimamente a agenda tem que ter".
//
// A tela é a semana em sete colunas (a mesma do painel, para o formato ser um
// só) e a lista do que existe, dia a dia. Marcar é um formulário curto,
// porque o caso de uso que ele descreveu é curto: conversou no WhatsApp,
// acertou a reunião, e precisa lançar antes de esquecer.
//
// O QUE AINDA NÃO É: isto NÃO fala com o Google Calendar. O que está aqui é
// do Jarvis. Ligar no Google exige uma autorização que só ele pode dar, no
// Google Cloud Console, e eu não invento credencial - a tela diz isso em vez
// de fingir que sincronizou.
//
// Quando a ligação existir, o formato não muda: a mesma tira, a mesma lista,
// e a origem de cada compromisso marcada ao lado.

import Link from 'next/link'
import { exigirSessao } from '@/lib/guarda'
import { prisma } from '@/lib/prisma'
import { Moldura, Cabeca, Vazio } from '@/components/Moldura'
import { SemanaCurta } from '@/components/SemanaCurta'
import { montarSemanaCurta } from '@/lib/semanaCurta'
import { FUSO } from '@/lib/datas'
import { marcarCompromisso, apagarCompromisso } from '../acoes'

export const dynamic = 'force-dynamic'

const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

export default async function Agenda({ searchParams }: { searchParams: Promise<{ dia?: string }> }) {
  await exigirSessao()
  const { dia } = await searchParams

  const semana = await montarSemanaCurta()
  const inicio = new Date(`${semana[0].dia}T00:00:00`)
  const fim = new Date(`${semana[6].dia}T23:59:59`)

  const compromissos = await prisma.compromisso.findMany({
    where: { inicio: { gte: inicio, lte: fim } },
    orderBy: { inicio: 'asc' },
  })

  const projetos = await prisma.projeto.findMany({
    where: { ativo: true },
    select: { id: true, nome: true },
    orderBy: { nome: 'asc' },
  })

  // Agrupado por dia, porque agenda se lê por dia e não por hora corrida.
  const porDia = new Map<string, typeof compromissos>()
  for (const c of compromissos) {
    const chave = c.inicio.toLocaleDateString('en-CA', { timeZone: FUSO })
    porDia.set(chave, [...(porDia.get(chave) ?? []), c])
  }

  const hora = (d: Date) =>
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: FUSO })

  return (
    <Moldura titulo="Agenda" atalhoAtivo="/agenda">
      <div className="mb-3">
        <SemanaCurta dias={semana} titulo="esta semana" />
      </div>

      <details className="cartao p-4 mb-3" open={Boolean(dia)}>
        <summary className="rotulo cursor-pointer select-none">marcar um compromisso</summary>
        <form action={marcarCompromisso} className="mt-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs fraco block mb-1">O quê</label>
              <input name="titulo" placeholder="Reunião com a Riachuelo" className="campo" required />
            </div>
            <div>
              <label className="text-xs fraco block mb-1">Dia</label>
              <input type="date" name="dia" defaultValue={dia ?? semana.find((d) => d.hoje)?.dia} className="campo" required />
            </div>
            <div>
              <label className="text-xs fraco block mb-1">Hora</label>
              <input type="time" name="hora" defaultValue="09:00" className="campo" required />
            </div>
            <div>
              <label className="text-xs fraco block mb-1">Dura (min)</label>
              <input name="minutos" inputMode="numeric" defaultValue={60} className="campo" />
            </div>
            <div>
              <label className="text-xs fraco block mb-1">Projeto</label>
              <select name="projetoId" className="campo">
                <option value="">nenhum</option>
                {projetos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs fraco block mb-1">Onde</label>
              <input name="local" placeholder="Av. Paulista 1000, ou Google Meet" className="campo" />
            </div>
          </div>
          <button className="botao mt-3">Marcar</button>
          <p className="fraco text-xs mt-2">
            Fica no Jarvis. Ainda não vai para o Google Calendar - isso depende de uma autorização
            sua no Google, e eu não invento credencial.
          </p>
        </form>
      </details>

      <section className="cartao">
        <Cabeca
          titulo="a semana, dia a dia"
          direita={<span className="text-[10px] dado">{compromissos.length}</span>}
        />
        <div className="painel-corpo">
          {compromissos.length === 0 ? (
            <Vazio
              titulo="Semana sem compromisso marcado"
              texto="Uma semana vazia na agenda não quer dizer semana livre: quer dizer que nada foi anotado. O bloco profundo também merece um lugar aqui."
            />
          ) : (
            <div className="space-y-3">
              {semana
                .filter((d) => (porDia.get(d.dia) ?? []).length > 0)
                .map((d) => (
                  <div key={d.dia}>
                    <p className="rotulo" style={{ color: d.hoje ? 'var(--secao)' : undefined }}>
                      {DIAS[new Date(`${d.dia}T12:00:00`).getDay()]} {d.numero}
                      {d.hoje && ' · hoje'}
                    </p>
                    <ul className="mt-1.5 space-y-1.5">
                      {(porDia.get(d.dia) ?? []).map((c) => (
                        <li key={c.id} className="flex items-baseline gap-2.5 text-sm">
                          <span className="numero text-xs shrink-0">{hora(c.inicio)}</span>
                          <span className="min-w-0 flex-1">
                            <span>{c.titulo}</span>
                            {c.local && <span className="block text-[11px] fraco">{c.local}</span>}
                          </span>
                          <form action={apagarCompromisso} className="shrink-0">
                            <input type="hidden" name="id" value={c.id} />
                            <button className="text-[11px] fraco" aria-label="Apagar">
                              apagar
                            </button>
                          </form>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          )}
        </div>
      </section>

      <section className="cartao p-4 mt-3">
        <p className="rotulo mb-2">o que falta para virar Google Calendar</p>
        <p className="fraco text-sm">
          Um passo seu, no computador: autorizar o Jarvis a ler e escrever na sua agenda, no Google
          Cloud Console. Quando você tiver dez minutos na frente do PC, me avise que eu te passo o
          caminho na tela. Depois disso, marcar aqui marca lá.
        </p>
        <Link href="/conversa" className="botao-fantasma inline-block mt-3 text-sm">
          Pedir o passo a passo ao Jarvis
        </Link>
      </section>
    </Moldura>
  )
}
