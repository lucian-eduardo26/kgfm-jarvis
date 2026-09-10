// Sessao de usuário único. Não vale pagar Clerk/Auth0 para uma pessoa.
// A senha nunca fica no codigo: só o hash, numa variavel de ambiente.

import crypto from 'node:crypto'
import { cookies } from 'next/headers'

const COOKIE = 'jarvis_sessao'
const DIAS = 30

function hashDaSenha(senha: string): string {
  return crypto.createHash('sha256').update(senha).digest('hex')
}

function segredo(): string {
  return process.env.APP_PASSWORD_HASH ?? ''
}

/** Assinatura do cookie: sem isto qualquer um digita o cookie na mão. */
function assinar(valor: string): string {
  return crypto.createHmac('sha256', segredo() || 'sem-segredo').update(valor).digest('hex')
}

export function senhaConfere(senha: string): boolean {
  const esperado = segredo()
  if (!esperado) return false
  const a = Buffer.from(hashDaSenha(senha))
  const b = Buffer.from(esperado)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export async function abrirSessao() {
  const ate = String(Date.now() + DIAS * 24 * 3600_000)
  const jar = await cookies()
  jar.set(COOKIE, `${ate}.${assinar(ate)}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: DIAS * 24 * 3600,
  })
}

export async function fecharSessao() {
  const jar = await cookies()
  jar.delete(COOKIE)
}

export async function temSessao(): Promise<boolean> {
  const jar = await cookies()
  const bruto = jar.get(COOKIE)?.value
  if (!bruto) return false
  const [ate, assinatura] = bruto.split('.')
  if (!ate || !assinatura) return false
  if (assinar(ate) !== assinatura) return false
  return Number(ate) > Date.now()
}
