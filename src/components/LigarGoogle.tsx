// A LIGAÇÃO COM O GOOGLE, e o passo a passo de quando ela ainda não existe.
//
// Este bloco tem duas caras porque tem dois momentos, e o segundo é o que
// costuma ser mal resolvido: quando falta credencial, a maioria dos sistemas
// mostra "não configurado" e deixa a pessoa se virar. Aqui ele mostra
// exatamente o que fazer, na ordem, com os valores que precisam ser colados.
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
          falta ligar o Jarvis ao Google
        </p>
        <p className="fraco text-sm">
          São dez minutos, uma vez só, e precisa ser você: a autorização sai da sua conta Google e
          eu não crio credencial no seu nome.
        </p>

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
            <span className="block dado text-[11px] mt-1 p-2 rounded break-all" style={{ background: 'var(--superficie-alta)' }}>
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
          Quando terminar, este bloco vira um botão de conectar. Se travar em algum passo, me diga
          em qual - eu sei onde cada um costuma emperrar.
        </p>
      </section>
    )
  }

  if (!conta) {
    return (
      <section className="cartao p-4">
        <p className="rotulo mb-2">o Google está pronto para conectar</p>
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
        <p className="rotulo">agenda conectada</p>
        <span className="text-[11px] dado">{conta.email}</span>
      </div>

      <p className="fraco text-sm mt-2">
        O Jarvis lê a sua agenda e espelha aqui. O que vem do Google aparece marcado, e se edita no
        Google - quem manda lá é ele.
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
            <select name="calendarioId" defaultValue={conta.calendarioId ?? ''} className="campo flex-1 min-w-[200px]">
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
