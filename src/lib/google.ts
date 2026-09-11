// O JARVIS FALANDO COM O GOOGLE CALENDAR, por conta própria.
//
// O Lucian em 11/09/2026: "eu quero uma solução em que o Jarvis acessa o
// Google Calendar sozinho, e não o Claude. Não tem saída, tem que fazer. Na
// agenda, o tempo, é o foco desse Jarvis."
//
// SEM BIBLIOTECA. A `googleapis` traz o cliente de TODOS os produtos do Google
// e passa de 100MB instalada - num projeto que usa dois endpoints de calendário
// isso é peso morto que atrasa todo deploy. Aqui é `fetch` e a API REST, que é
// o que a biblioteca faz por baixo de qualquer jeito.
//
// COMO A AUTORIZAÇÃO FUNCIONA, em três passos:
//
//   1. O Jarvis manda ele para o Google com `urlDeConsentimento`. Ele escolhe
//      a conta e aprova. Isso acontece no navegador DELE, no site do Google -
//      o Jarvis nunca vê a senha, e eu também não.
//   2. O Google devolve um código para `/api/google/retorno`, que troca esse
//      código por um REFRESH TOKEN e guarda no banco.
//   3. Desse momento em diante o Jarvis se vira sozinho: troca o refresh token
//      por um token de acesso de uma hora sempre que precisa.
//
// `access_type=offline` e `prompt=consent` existem por um motivo prático: sem
// os dois, o Google devolve refresh token só na PRIMEIRA autorização da vida,
// e reconectar depois de um erro vira um quebra-cabeça sem solução.

import { prisma } from './prisma'

const AUTORIZAR = 'https://accounts.google.com/o/oauth2/v2/auth'
const TROCAR = 'https://oauth2.googleapis.com/token'
const CALENDARIO = 'https://www.googleapis.com/calendar/v3'
const QUEM_SOU = 'https://www.googleapis.com/oauth2/v2/userinfo'

// Ler e escrever eventos, e ver a lista de agendas. Nada de Gmail, nada de
// Drive: escopo a mais é risco a mais sem função nenhuma.
const ESCOPOS = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ')

export function googleConfigurado(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim())
}

/** O endereço de retorno tem que bater EXATAMENTE com o do Console. */
export function enderecoDeRetorno(): string {
  const base = process.env.URL_DO_APP?.trim() || 'http://localhost:3210'
  return `${base.replace(/\/$/, '')}/api/google/retorno`
}

export function urlDeConsentimento(): string {
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? '',
    redirect_uri: enderecoDeRetorno(),
    response_type: 'code',
    scope: ESCOPOS,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
  })
  return `${AUTORIZAR}?${p.toString()}`
}

type RespostaDeToken = {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  error?: string
  error_description?: string
}

/** Passo 2: o código vira refresh token, e a conta fica ligada. */
export async function ligarConta(codigo: string): Promise<{ email: string } | { erro: string }> {
  const r = await fetch(TROCAR, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: codigo,
      client_id: process.env.GOOGLE_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      redirect_uri: enderecoDeRetorno(),
      grant_type: 'authorization_code',
    }),
  })

  const j = (await r.json()) as RespostaDeToken
  if (!r.ok || !j.refresh_token) {
    // A mensagem do Google é em inglês e técnica; traduzir aqui é o que
    // impede ele de ficar olhando para "invalid_grant" sem saber o que fazer.
    return {
      erro:
        j.error === 'redirect_uri_mismatch'
          ? 'O endereço de retorno não bate com o cadastrado no Google Console. Confira se lá está exatamente o mesmo endereço que aparece na tela de configuração.'
          : !j.refresh_token
            ? 'O Google não devolveu a autorização de longo prazo. Isso costuma acontecer quando a conta já foi autorizada antes: revogue o acesso do Jarvis na sua conta Google e tente de novo.'
            : (j.error_description ?? j.error ?? 'O Google recusou a autorização.'),
    }
  }

  // Descobrir QUAL conta foi ligada. Ligar a errada é o tipo de erro que só
  // aparece depois de uma semana marcando compromisso no lugar errado.
  const eu = await fetch(QUEM_SOU, { headers: { Authorization: `Bearer ${j.access_token}` } })
  const dados = (await eu.json()) as { email?: string }
  const email = dados.email ?? 'conta sem e-mail'

  await prisma.contaGoogle.upsert({
    where: { email },
    create: { email, refreshToken: j.refresh_token, escopos: ESCOPOS },
    update: { refreshToken: j.refresh_token, escopos: ESCOPOS },
  })

  return { email }
}

/** Passo 3: o token de acesso de uma hora, pedido na hora que precisa. */
async function tokenDeAcesso(): Promise<string | null> {
  const conta = await prisma.contaGoogle.findFirst({ orderBy: { usadoEm: 'desc' } })
  if (!conta || !googleConfigurado()) return null

  const r = await fetch(TROCAR, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      refresh_token: conta.refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  const j = (await r.json()) as RespostaDeToken
  return j.access_token ?? null
}

export async function contaLigada() {
  return prisma.contaGoogle.findFirst({ orderBy: { usadoEm: 'desc' } })
}

export async function desligarConta() {
  await prisma.contaGoogle.deleteMany({})
}


export type CalendarioGoogle = {
  id: string
  nome: string
  principal: boolean
  /** Ele pode escrever nesta agenda? Agenda só de leitura não recebe bloco. */
  escreve: boolean
}

/**
 * AS AGENDAS QUE ELE ENXERGA, e não só a principal.
 *
 * Feriados e aniversários ficam de fora: são feeds, não compromissos que
 * consomem a hora dele, e entupiriam a semana com ruído.
 */
export async function listarCalendarios(): Promise<CalendarioGoogle[] | null> {
  const token = await tokenDeAcesso()
  if (!token) return null

  const r = await fetch(`${CALENDARIO}/users/me/calendarList?maxResults=250`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!r.ok) return null

  const j = (await r.json()) as {
    items?: { id: string; summary?: string; primary?: boolean; accessRole?: string }[]
  }

  return (j.items ?? [])
    .filter((c) => !/holiday|#contacts|birthday/i.test(c.id))
    .map((c) => ({
      id: c.id,
      nome: c.summary ?? c.id,
      principal: Boolean(c.primary),
      escreve: c.accessRole === 'owner' || c.accessRole === 'writer',
    }))
}

export type EventoGoogle = {
  id: string
  titulo: string
  inicio: Date
  fim: Date
  local: string | null
  /** Evento que o próprio Jarvis criou. */
  doJarvis: boolean
  /** De qual agenda veio. Empresa e pessoal não se misturam na leitura. */
  calendarioId: string
  calendarioNome: string
}

/** A marca que o Jarvis põe no que ele mesmo cria, para se reconhecer depois. */
export const MARCA_DO_JARVIS = 'jarvis-kgfm'

export async function lerEventos(de: Date, ate: Date): Promise<EventoGoogle[] | null> {
  const token = await tokenDeAcesso()
  if (!token) return null

  // TODAS AS AGENDAS, e este era um bug de verdade: o código lia só
  // `primary`, então ENTRADAS KGFM, SAÍDAS KGFM e qualquer agenda de empresa
  // compartilhada eram ignoradas em silêncio. Ele viu primeiro - marcou uma
  // reunião na agenda da empresa e ela não apareceu no Jarvis.
  const calendarios = await listarCalendarios()
  if (!calendarios) return null

  const p = new URLSearchParams({
    timeMin: de.toISOString(),
    timeMax: ate.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  })

  const tudo: EventoGoogle[] = []

  for (const c of calendarios) {
    const r = await fetch(`${CALENDARIO}/calendars/${encodeURIComponent(c.id)}/events?${p}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    // Uma agenda que falha não derruba as outras: melhor semana incompleta
    // do que semana nenhuma.
    if (!r.ok) continue

    const j = (await r.json()) as {
      items?: {
        id: string
        summary?: string
        location?: string
        start?: { dateTime?: string; date?: string }
        end?: { dateTime?: string; date?: string }
        extendedProperties?: { private?: Record<string, string> }
      }[]
    }

    for (const e of j.items ?? []) {
      // Evento de dia inteiro não tem hora e não disputa bloco de trabalho.
      if (!e.start?.dateTime || !e.end?.dateTime) continue
      tudo.push({
        id: e.id,
        titulo: e.summary ?? '(sem título)',
        inicio: new Date(e.start.dateTime),
        fim: new Date(e.end.dateTime),
        local: e.location ?? null,
        doJarvis: e.extendedProperties?.private?.origem === MARCA_DO_JARVIS,
        calendarioId: c.id,
        calendarioNome: c.nome,
      })
    }
  }

  return tudo.sort((a, b) => a.inicio.getTime() - b.inicio.getTime())
}

export async function criarEvento(e: {
  titulo: string
  inicio: Date
  fim: Date
  descricao?: string
  local?: string
  /**
   * EM QUAL AGENDA. Vazio cai na principal.
   *
   * Compromisso de cliente vai para a agenda da empresa; compromisso pessoal
   * vai para a pessoal. Misturar os dois foi exatamente a queixa dele - a
   * vida pessoal e a da empresa convivem no Jarvis, mas não no mesmo lugar.
   */
  calendarioId?: string | null
}): Promise<{ id: string } | { erro: string }> {
  const token = await tokenDeAcesso()
  if (!token) return { erro: 'O Jarvis não está ligado a nenhuma conta do Google.' }

  const alvo = encodeURIComponent(e.calendarioId?.trim() || 'primary')

  const r = await fetch(`${CALENDARIO}/calendars/${alvo}/events`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      summary: e.titulo,
      description: e.descricao,
      location: e.local,
      start: { dateTime: e.inicio.toISOString(), timeZone: 'America/Sao_Paulo' },
      end: { dateTime: e.fim.toISOString(), timeZone: 'America/Sao_Paulo' },
      // A marca fica numa propriedade privada, e não no título: título é do
      // Lucian, e poluir com etiqueta de sistema é o tipo de coisa que faz a
      // agenda virar inútil de ler.
      extendedProperties: { private: { origem: MARCA_DO_JARVIS } },
    }),
  })

  if (!r.ok) {
    const t = await r.text()
    return { erro: `O Google recusou: ${t.slice(0, 180)}` }
  }
  const j = (await r.json()) as { id: string }
  return { id: j.id }
}

/** Apagar só o que o Jarvis criou, e nunca o que ele marcou à mão. */
export async function apagarEventoDoJarvis(id: string): Promise<boolean> {
  const token = await tokenDeAcesso()
  if (!token) return false
  const r = await fetch(`${CALENDARIO}/calendars/primary/events/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  return r.ok || r.status === 410
}
