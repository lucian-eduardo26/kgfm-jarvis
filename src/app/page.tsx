import { redirect } from 'next/navigation'
import { temSessao } from '@/lib/sessao'

export default async function Raiz() {
  redirect((await temSessao()) ? '/painel' : '/entrar')
}
