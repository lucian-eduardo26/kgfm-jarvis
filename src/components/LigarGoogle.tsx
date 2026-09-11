// A LIGAÇÃO COM O GOOGLE. Mora na Configuração, e só lá.
//
// O Lucian em 11/09/2026: "não vai fazer no meio do aplicativo uma parte de
// conectar que você vai usar uma vez na vida".
//
// Ele tem razão, e a regra é geral: o que se faz UMA VEZ não disputa espaço
// com o que se faz TODO DIA. A Agenda é tela de trabalho diário; passo a
// passo de credencial é instalação. Antes o bloco inteiro ficava no meio da
// Agenda, empurrando a semana para baixo em toda visita.
//
// Aqui ele tem três caras, e nenhuma delas é uma parede de texto:
//   sem credencial   aviso curto, e o passo a passo fechado num detalhe
//   com credencial   um botão de conectar
//   conectado        a conta, as agendas, e onde o Jarvis escreve
//
// O que o Jarvis NUNCA pede: senha. A autorização acontece no site do Google,
// no navegador dele. O Jarvis recebe de volta só uma permissão revogável, que
// ele pode cancelar na conta Google a qualquer hora.

import { desligarGoogle, sincronizarAgenda, definirCalendarioDaEmpresa } from '@/app/acoes'
import type { CalendarioGoogle } from '@/lib/google'

export function LigarGoogle({
  configurado,
  conta,
  calendarios,
  enderecoDeRetorno,
  aviso,
}: {
  configurado: boolean
  conta: { email: string; usadoEm: Date; calendarioId: string | null } | null
  calendarios: CalendarioGoogle[] | null
  enderecoDeRetorno: string
  aviso?: string | null
}) {
  if (!configurado) {
    return (
      <section className="cartao p-4" style={{ borderColor: 'var(--ambar)' }}>
        <p className="rotulo mb-2" style={{ color: 'var(--ambar)' }}>
          agenda do Google - falta ligar
        </p>
        <p className="fraco text-sm">Faltam as duas credenciais na Vercel.</p>

        {/* FECHADO, E CURTO. Ele em 11/09/2026: "não tem que ter texto
            explicativo demais não, coisa de Google dentro do aplicativo não".
            O passo a passo fica porque ele ainda não terminou; o que saiu foi
            o que explicava em vez de instruir. */}
        <details className="mt-2">
          <summary className="text-sm cursor-pointer select-none" style={{ color: 'var(--ambar)' }}>
            passo a passo
          </summary>

          <ol className="mt-3 space-y-2 text-sm fraco list-decimal pl-4">
            <li>
              <span className="dado">console.cloud.google.com</span>, projeto Jarvis KGFM.
            </li>
            <li>
              APIs e serviços: ativar a <strong>Google Calendar API</strong>.
            </li>
            <li>
              Tela de permissão OAuth: <strong>Externo</strong>. Em usuários de teste, as duas
              contas - a pessoal e a do Workspace.
            </li>
            <li>
              Credenciais: <strong>ID do cliente OAuth</strong>, tipo Aplicativo da Web. URI de
              redirecionamento:
              <span
                className="block dado text-[11px] mt-1 p-2 rounded break-all"
                style={{ background: 'var(--superficie-alta)' }}
              >
                {enderecoDeRetorno}
              </span>
            </li>
            <li>
              Na Vercel: <span className="dado">GOOGLE_CLIENT_ID</span>,{' '}
              <span className="dado">GOOGLE_CLIENT_SECRET</span> e{' '}
              <span className="dado">URL_DO_APP</span>.
            </li>
            <li>Redeploy.</li>
          </ol>
        </details>
      </section>
    )
  }

  if (!conta) {
    return (
      <section className="cartao p-4">
        <p className="rotulo mb-2">agenda do Google - pronta para conectar</p>
        <p className="fraco text-sm">Escolha a conta na tela do Google.</p>
        {aviso && (
          <p className="text-sm mt-2" style={{ color: 'var(--ambar)' }}>
            {aviso}
          </p>
        )}
        <a href="/api/google/entrar" className="botao inline-block mt-3">
          Conectar a agenda
        </a>
      </section>
    )
  }

  return (
    <section className="cartao p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="rotulo">agenda do Google - conectada</p>
        <span className="text-[11px] dado">{conta.email}</span>
      </div>

      {aviso && (
        <p className="text-sm mt-2" style={{ color: 'var(--ambar)' }}>
          {aviso}
        </p>
      )}

      {/* QUAL AGENDA É A DA EMPRESA.
          O Jarvis LÊ todas - hora ocupada é hora ocupada, venha de onde vier.
          Mas ESCREVER é outra conversa: reunião de cliente lançada na agenda
          pessoal é erro que aparece na frente do cliente. */}
      {calendarios && calendarios.length > 1 && (
        <form action={definirCalendarioDaEmpresa} className="mt-3 pt-3 border-t border-[var(--linha)]">
          <label className="text-xs fraco block mb-1">
            Onde o Jarvis lança compromisso de cliente
          </label>
          <div className="flex flex-wrap gap-2 items-end">
            <select
              name="calendarioId"
              defaultValue={conta.calendarioId ?? ''}
              className="campo flex-1 min-w-[200px]"
            >
              <option value="">A principal (pessoal)</option>
              {calendarios
                .filter((c) => c.escreve && !c.principal)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
            </select>
            <button className="botao-fantasma">Guardar</button>
          </div>
        </form>
      )}

      {calendarios && (
        <details className="mt-3">
          <summary className="text-[11px] fraco cursor-pointer select-none">
            {calendarios.length} agendas sendo lidas
          </summary>
          <ul className="mt-2 space-y-1">
            {calendarios.map((c) => (
              <li key={c.id} className="text-[11px] fraco flex items-baseline gap-2">
                <span className="truncate">{c.nome}</span>
                {!c.escreve && <span className="dado shrink-0">só leitura</span>}
                {c.principal && <span className="dado shrink-0">principal</span>}
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="flex flex-wrap gap-2 mt-3">
        <form action={sincronizarAgenda}>
          <button className="botao">Sincronizar agora</button>
        </form>
        <form action={desligarGoogle}>
          <button className="botao-fantasma">Desligar</button>
        </form>
      </div>
    </section>
  )
}
