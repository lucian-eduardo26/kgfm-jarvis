// O JARVIS FALANDO COM O CRM DE PROSPECÇÃO.
//
// O Lucian em 11/09/2026: "tem de ser integrado por voz, texto, frente ou
// mensagem. Liga a frente. É algo inteligente, automático, integrado."
//
// A integração que importa NÃO é abrir um aplicativo pelo outro - isso é um
// link, e um link não integra nada. A integração é esta: ele fala uma frase
// só, e o sistema descobre sozinho se aquilo é trabalho de projeto ou toque
// de prospecção, e registra no lugar certo.
//
//   "estou detalhando o Batoque"        vira cronômetro numa frente daqui
//   "liguei pro Jackson da Roge"        vira interação no CRM, lá
//
// POR QUE PELA API E NÃO PELO BANCO: a regra do CRM diz que `/api/agent/*` é a
// única porta do Claude, e ela existe por um bom motivo - a API valida, checa
// as travas de conta e registra quem decidiu o quê. Entrar direto no banco
// pularia as três coisas.
//
// O QUE FALTA PARA ISTO FUNCIONAR: `CRM_URL` e `CRM_TOKEN` nas variáveis deste
// app. O token é o mesmo `AGENT_TOKEN` que já existe no CRM, e só ele pode
// copiar - eu não abro o arquivo de segredos de outro sistema.

const PADRAO_URL = 'https://kgfm-crm-kgfm-solucoes.vercel.app'

export function crmConfigurado(): boolean {
  return Boolean(process.env.CRM_TOKEN?.trim())
}

function base(): string {
  return (process.env.CRM_URL?.trim() || PADRAO_URL).replace(/\/$/, '')
}

async function pedir<T>(caminho: string, opcoes?: RequestInit): Promise<T | null> {
  if (!crmConfigurado()) return null
  try {
    const r = await fetch(`${base()}${caminho}`, {
      ...opcoes,
      headers: {
        // O token no .env do CRM vem ENTRE ASPAS, e mandar as aspas no header
        // devolve 401 sem explicação nenhuma. Tirar aqui evita uma tarde
        // inteira de caça ao fantasma.
        Authorization: `Bearer ${(process.env.CRM_TOKEN ?? '').replace(/^"|"$/g, '')}`,
        'Content-Type': 'application/json',
        ...(opcoes?.headers ?? {}),
      },
      cache: 'no-store',
    })
    if (!r.ok) return null
    return (await r.json()) as T
  } catch {
    // O CRM fora do ar NUNCA pode derrubar o Jarvis. Falha vira null, e quem
    // chamou decide o que fazer sem a informação.
    return null
  }
}

export type PessoaDoCrm = {
  id: string
  nome: string
  cargo: string | null
  status: string
  empresa: string | null
  empresa_situacao: string | null
}

export type ContaDoCrm = {
  id: string
  nome: string
  situacao: string
  motivo_trava: string | null
}

/** Procura pessoa e empresa pelo nome. Duas letras já bastam lá. */
export async function buscarNoCrm(
  q: string,
): Promise<{ pessoas: PessoaDoCrm[]; contas: ContaDoCrm[] } | null> {
  if (q.trim().length < 2) return null
  return pedir(`/api/agent/buscar?q=${encodeURIComponent(q.trim())}`)
}

/** A lista de clientes, para o campo de cliente do projeto parar de ser texto
    solto. O Lucian pediu: "lista de clientes pega igual do CRM". */
export async function clientesDoCrm(): Promise<string[]> {
  // A busca exige termo, então varre o alfabeto em pedaços e junta. Não é
  // bonito, mas evita criar endpoint novo no CRM só para isto.
  const letras = ['a', 'e', 'i', 'o', 'u', 'r', 's', 'c']
  const nomes = new Set<string>()
  for (const l of letras) {
    const r = await buscarNoCrm(l)
    for (const c of r?.contas ?? []) nomes.add(c.nome)
  }
  return [...nomes].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

export type ToqueParaRegistrar = {
  pessoaId: string
  tipo: 'visita_perfil' | 'convite' | 'mensagem' | 'resposta_recebida' | 'nota'
  texto?: string
  canal?: string
}

/**
 * Registrar no CRM o que ele contou por voz.
 *
 * Só grava NOTA e RESPOSTA RECEBIDA por esta via, de propósito. Convite e
 * mensagem são atos de prospecção que acontecem no LinkedIn, com o navegador
 * dele - registrar aqui um convite que ninguém enviou encheria o CRM de
 * trabalho que não existiu, e a taxa de conversão passaria a mentir.
 */
export async function registrarToque(t: ToqueParaRegistrar): Promise<boolean> {
  if (t.tipo !== 'nota' && t.tipo !== 'resposta_recebida') return false
  const r = await pedir<{ ok?: boolean }>('/api/agent/interacao', {
    method: 'POST',
    body: JSON.stringify({
      pessoa_id: t.pessoaId,
      tipo: t.tipo,
      texto: t.texto,
      canal: t.canal ?? 'jarvis',
    }),
  })
  return r !== null
}

/**
 * O que na frase parece nome de gente ou de empresa do CRM.
 *
 * Heurística simples e barata: palavras que começam com maiúscula e não são
 * do começo da frase. "Liguei pro Jackson da Roge" devolve Jackson e Roge.
 * Errar aqui custa uma busca à toa; não errar exigiria IA em toda frase.
 */
export function nomesProvaveis(texto: string): string[] {
  const fora = new Set(['eu', 'o', 'a', 'de', 'da', 'do', 'para', 'pro', 'com', 'no', 'na'])
  return texto
    .split(/\s+/)
    .slice(1)
    .filter((p) => /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]{2,}$/.test(p))
    .filter((p) => !fora.has(p.toLowerCase()))
    .slice(0, 4)
}
