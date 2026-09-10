import { entrar } from '../acoes'

export default async function Entrar({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams
  return (
    <main className="min-h-dvh grid place-items-center px-5">
      <form action={entrar} className="w-full max-w-sm">
        <h1 className="text-4xl font-black tracking-tight text-center">
          <span style={{ color: 'var(--laranja)' }}>J</span>ARVIS
        </h1>
        <p className="fraco text-sm text-center mt-1 mb-8">O que eu faco agora, e por que.</p>

        <input
          name="senha"
          type="password"
          autoFocus
          autoComplete="current-password"
          placeholder="Senha"
          className="campo"
        />
        {erro && (
          <p className="text-sm mt-2" style={{ color: 'var(--vermelho)' }}>
            Senha errada.
          </p>
        )}
        <button className="botao w-full mt-3">Entrar</button>
      </form>
    </main>
  )
}
