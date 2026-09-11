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
// ONDE MORA A LIGAÇÃO COM O GOOGLE: na Configuração, e não aqui.
//
// O Lucian em 11/09/2026: "não vai fazer no meio do aplicativo uma parte de
// conectar que você vai usar uma vez na vida". O passo a passo de credencial
// ocupava metade desta tela em toda visita, para ser lido uma vez. Ficou lá,
// e aqui sobrou uma linha: qual conta está espelhando, e um botão de
// sincronizar. Trabalho diário na tela de trabalho; instalação na instalação.

import Link from 'next/link'
import { exigirSessao } from '@/lib/guarda'
import { prisma } from '@/lib/prisma'
import { Moldura, Cabeca, Vazio } from '@/components/Moldura'
import { SemanaCurta } from '@/components/SemanaCurta'
import { montarSemanaCurta } from '@/lib/semanaCurta'
import { FUSO } from '@/lib/datas'
import { marcarCompromisso, apagarCompromisso, gerarPlanoDoDia, sincronizarAgenda } from '../acoes'
import { googleConfigurado, contaLigada } from '@/lib/google'

export const dynamic = 'force-dynamic'

const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

export default async function Agenda({
  searchParams,
}: {
  searchParams: Promise<{ dia?: string; sincronia?: string }>
}) {
  await exigirSessao()
  const { dia, sincronia } = await searchParams

  const conta = await contaLigada()
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

      {/* A LIGAÇÃO COM O GOOGLE, EM UMA LINHA. Ela fica aqui por um motivo só:
          esta lista pode estar incompleta, e quem olha precisa saber disso na
          mesma tela. O que NÃO fica aqui é o passo a passo de credencial -
          esse mora na Configuração, que é onde se instala uma coisa. */}
      {/* EMPILHADO NO CELULAR, lado a lado no computador. Numa tela de 375px o
          botão ao lado do texto espremia a frase numa coluna de cinco palavras
          quebradas - o texto fica com a linha inteira, e a ação vem embaixo. */}
      <div className="cartao px-4 py-3 mb-3 flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-2.5">
        <span className="flex items-baseline gap-2 min-w-0 flex-1">
          <span
            className="shrink-0 translate-y-[-2px]"
            style={{
              width: 7,
              height: 7,
              borderRadius: 999,
              background: conta ? 'var(--verde)' : 'var(--fraco)',
            }}
            aria-hidden
          />
          {conta ? (
            <span className="text-sm min-w-0">
              Espelhando <span className="dado">{conta.email}</span>
              {sincronia && (
                <span className="text-[11px] ml-2" style={{ color: 'var(--verde)' }}>
                  {sincronia} espelhados agora
                </span>
              )}
            </span>
          ) : (
            <span className="fraco text-sm min-w-0">
              {googleConfigurado()
                ? 'A agenda do Google ainda não está conectada.'
                : 'O Jarvis ainda não lê o Google Calendar.'}{' '}
              Esta lista mostra só o que foi marcado aqui.
            </span>
          )}
        </span>

        {conta ? (
          <form action={sincronizarAgenda} className="shrink-0">
            <button className="botao-fantasma text-xs px-3 w-full sm:w-auto">Sincronizar</button>
          </form>
        ) : (
          <Link href="/config" className="botao-fantasma text-xs px-3 shrink-0 text-center">
            Conectar na Configuração
          </Link>
        )}
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
