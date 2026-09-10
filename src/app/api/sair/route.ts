import { NextResponse } from 'next/server'
import { fecharSessao } from '@/lib/sessao'

export async function POST(req: Request) {
  await fecharSessao()
  return NextResponse.redirect(new URL('/entrar', req.url))
}
