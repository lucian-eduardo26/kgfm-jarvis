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
        <p className="fraco text-sm">
          São dez minutos, uma vez só, e precisa ser você: a autorização sai da sua conta Google e
          eu não crio credencial no seu nome.
        </p>

        {/* FECHADO POR PADRÃO. Seis passos abertos numa tela de celular são um
            palmo de rolagem que ele vai ler uma vez na vida. */}
        <details className="mt-3">
          <summary className="text-sm cursor-pointer select-none" style={{ color: 'var(--ambar)' }}>
            ver o passo a passo
          </summary>

          <ol className="mt-3 space-y-2 text-sm fraco list-decimal pl-4">
            <li>
              Abra <span className="dado">console.cloud.google.com</span> e crie um projeto chamado
              Jarvis KGFM.
            </li>
            <li>
              Em <strong>APIs e serviços</strong>, ative a <strong>Google Calendar API</strong>.
            </li>
            <li>
              Em <strong>Tela de permissão OAuth</strong>, escolha <strong>Externo</strong>, ponha o
              nome Jarvis KGFM e o seu e-mail. Em usuários de teste, adicione as duas contas: a
              pessoal e a do Workspace.
            </li>
            <li>
              Em <strong>Credenciais</strong>, crie um <strong>ID do cliente OAuth</strong> do tipo
              <strong> Aplicativo da Web</strong>. No campo de URI de redirecionamento autorizado,
              cole exatamente isto:
              <span
                className="block dado text-[11px] mt-1 p-2 rounded break-all"
                style={{ background: 'var(--superficie-alta)' }}
              >
                {enderecoDeRetorno}
              </span>
            </li>
            <li>
              Copie o <strong>ID do cliente</strong> e a <strong>chave secreta</strong> e ponha na
              Vercel como <span className="dado">GOOGLE_CLIENT_ID</span> e{' '}
              <span className="dado">GOOGLE_CLIENT_SECRET</span>. Ponha também{' '}
              <span className="dado">URL_DO_APP</span> com o endereço do Jarvis.
            </li>
            <li>Redeploy na Vercel. Variável nova só vale para deploy feito depois dela.</li>
          </ol>

          <p className="fraco text-xs mt-3">
            A Calendar API é gratuita e não exige faturamento ligado. O crédito de teste que o
            Console oferece é propaganda, não conta a pagar - e, passados os noventa dias, o Google
            não cobra sozinho: ele espera você fazer o upgrade.
          </p>
        </details>

        <p className="fraco text-xs mt-3">
          Quando terminar, este bloco vira um botão de conectar. Se travar em algum passo, me diga
          em qual - eu sei onde cada um costuma emperrar.
        </p>
      </section>
    )
  }

  if (!conta) {
    return (
      <section className="cartao p-4">
        <p className="rotulo mb-2">agenda do Google - pronta para conectar</p>
        <p className="fraco text-sm">
          Clique e escolha a conta. A autorização acontece no site do Google - o Jarvis não vê a sua
          senha, e você pode revogar quando quiser, na sua conta Google.
        </p>
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

      <p className="fraco text-sm mt-2">
        O Jarvis lê a sua agenda e espelha na tela da Agenda. O que vem do Google aparece marcado, e
        se edita no Google - quem manda lá é ele.
      </p>

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
          <p className="fraco text-[11px] mt-2">
            Compromisso pessoal continua indo para a principal. Só aparecem aqui as agendas em que
            você tem permissão de escrever.
          </p>
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
