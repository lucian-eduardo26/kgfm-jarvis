// O começo da autorização: manda ele para o Google.
//
// Exige sessão do Jarvis antes. Sem isso, qualquer um que descobrisse o
// endereço poderia iniciar uma ligação de conta - e a tela seguinte é a do
// Google, que parece legítima porque É legítima.

import { redirect } from 'next/navigation'
import { temSessao } from '@/lib/sessao'
import { googleConfigurado, urlDeConsentimento } from '@/lib/google'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await temSessao())) redirect('/entrar')
  if (!googleConfigurado()) redirect('/agenda?google=sem-chave')
  redirect(urlDeConsentimento())
}
