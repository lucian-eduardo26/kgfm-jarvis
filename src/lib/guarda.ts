import { redirect } from 'next/navigation'
import { temSessao } from './sessao'

/** Toda tela interna passa por aqui. Sistema de uma pessoa, porta unica. */
export async function exigirSessao() {
  if (!(await temSessao())) redirect('/entrar')
}
