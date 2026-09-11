// A volta do Google: o código vira autorização de longo prazo.
//
// Tudo o que pode dar errado aqui dá errado de um jeito confuso - "invalid
// grant", "redirect uri mismatch" - então nada de mostrar a mensagem crua do
// Google. O erro vai traduzido para a tela da agenda, com o que fazer.

import { redirect } from 'next/navigation'
import { temSessao } from '@/lib/sessao'
import { ligarConta } from '@/lib/google'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  if (!(await temSessao())) redirect('/entrar')

  const url = new URL(request.url)
  const codigo = url.searchParams.get('code')
  const recusado = url.searchParams.get('error')

  // Ele clicou em cancelar na tela do Google. Não é erro, é uma decisão.
  if (recusado) redirect('/agenda?google=recusado')
  if (!codigo) redirect('/agenda?google=sem-codigo')

  const r = await ligarConta(codigo)
  if ('erro' in r) {
    redirect(`/agenda?google=erro&motivo=${encodeURIComponent(r.erro)}`)
  }

  redirect(`/agenda?google=ligado&conta=${encodeURIComponent(r.email)}`)
}
