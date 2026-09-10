import { redirect } from 'next/navigation'
import { temSessao } from './sessao'

/** Toda tela interna passa por aqui. Sistema de uma pessoa, porta única. */
export async function exigirSessao() {
  if (!(await temSessao())) redirect('/entrar')
}
