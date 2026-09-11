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

import { exigirSessao } from '@/lib/guarda'
import { prisma } from '@/lib/prisma'
import { Moldura, Cabeca, Vazio } from '@/components/Moldura'
import { SemanaCurta } from '@/components/SemanaCurta'
import { montarSemanaCurta } from '@/lib/semanaCurta'
import { FUSO } from '@/lib/datas'
import { marcarCompromisso, apagarCompromisso, gerarPlanoDoDia } from '../acoes'

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

  // O ultimo plano gerado para amanha. Texto de IA custa dinheiro: gera uma
  // vez e le quantas vezes quiser.
  const amanhaInicio = new Date(semana.find((d) => d.hoje)?.dia ?? semana[0].dia)
  amanhaInicio.setDate(amanhaInicio.getDate() + 1)
  amanhaInicio.setHours(0, 0, 0, 0)
  const plano = await prisma.sintese.findFirst({
    where: { tipo: 'plano-do-dia', periodoInicio: { gte: amanhaInicio } },
    orderBy: { id: 'desc' },
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

      {/* O BOTAO QUE FUNCIONA HOJE. A ligacao direta com o Google depende de
          uma autorizacao que so ele pode dar; o arquivo de calendario nao
          depende de ninguem e o Google importa. Pior em uma coisa so: nao
          sincroniza de volta. Para marcar aqui e ver la, resolve. */}
      <section className="cartao p-4 mt-3">
        <p className="rotulo mb-2">levar para o Google Calendar</p>
        <p className="fraco text-sm">
          Baixa as duas próximas semanas num arquivo de calendário. No celular, toque e escolha
          abrir no Google Agenda; no computador, use Configurações, Importar e exportar.
        </p>
        <a href="/api/agenda.ics" download className="botao inline-block mt-3">
          Gerar a semana
        </a>
        <p className="fraco text-xs mt-3">
          Isto leva os compromissos daqui para lá. O contrário ainda não acontece - mudou no
          Google, o Jarvis não fica sabendo. Para a ligação de mão dupla, preciso de dez minutos
          seus no Google Cloud Console.
        </p>
      </section>

      {/* O PLANO DE AMANHA. E o consultor, e nao a lista: ele diz a hora de
          cada bloco, o que fica de fora, e o custo de ter ficado. */}
      <section className="cartao p-4 mt-3">
        <p className="rotulo mb-2">o plano de amanhã</p>
        <p className="fraco text-sm">
          O Jarvis monta a agenda de amanhã hora a hora, a partir da régua de prioridade, do que
          depende de você e do que já está marcado. Custa cerca de setenta centavos por vez.
        </p>
        <form action={gerarPlanoDoDia} className="mt-3 flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs fraco block mb-1">Foco do dia (opcional)</label>
            <input name="foco" placeholder="o dia inteiro em comercial" className="campo" />
          </div>
          <button className="botao">Montar o dia</button>
        </form>
        {plano && (
          <div className="mt-4 pt-4 border-t border-[var(--linha)]">
            <p className="text-sm whitespace-pre-wrap">{plano.texto}</p>
            <p className="text-[11px] fraco mt-3">
              Gerado em {plano.geradaEm.toLocaleString('pt-BR', { timeZone: FUSO })}
            </p>
          </div>
        )}
      </section>
    </Moldura>
  )
}
