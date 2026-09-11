// A LIGAÇÃO COM O CRM, e o atalho para abrir um pelo outro.
//
// O Lucian em 11/09/2026: "pensei talvez até abrir o app do CRM através do
// Jarvis e vice-versa, se for bom; se não, esquece. Tem de ser integrado por
// voz, texto, frente ou mensagem."
//
// As duas coisas são diferentes e vale dizer qual é qual:
//
//   O ATALHO é um link. Custa nada, serve para o dedo, e não integra nada -
//   continuam dois sistemas, um do lado do outro.
//
//   A INTEGRAÇÃO é a frase dele achar o lugar certo sozinha: "liguei pro
//   Jackson da Roge" virar toque no CRM sem ele escolher aplicativo nenhum.
//   Essa é a que muda o dia, e é a que depende do token.

import { crmConfigurado } from '@/lib/crm'

const CRM = process.env.CRM_URL?.trim() || 'https://kgfm-crm-kgfm-solucoes.vercel.app'

export function LigarCrm() {
  const ligado = crmConfigurado()

  return (
    <section className="cartao p-4" style={ligado ? undefined : { borderColor: 'var(--ambar)' }}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="rotulo" style={{ color: ligado ? undefined : 'var(--ambar)' }}>
          {ligado ? 'CRM conectado' : 'o CRM ainda não está ligado'}
        </p>
        <a href={CRM} target="_blank" rel="noreferrer" className="text-[11px] dado">
          ABRIR O CRM
        </a>
      </div>

      {ligado ? (
        <p className="fraco text-sm mt-2">
          Quando você disser que ligou ou falou com alguém que existe no CRM, o Jarvis registra a
          nota lá em vez de abrir trabalho aqui. Prospecção mora no CRM; projeto mora no Jarvis.
        </p>
      ) : (
        <>
          <p className="fraco text-sm mt-2">
            Sem isto, o Jarvis não reconhece quando você está falando de prospecção - toda frase
            vira trabalho de projeto ou captura. São dois minutos, e precisa ser você: o segredo
            mora no arquivo de configuração do CRM, e eu não abro segredo de outro sistema.
          </p>
          <ol className="mt-3 space-y-2 text-sm fraco list-decimal pl-4">
            <li>
              No computador, abra o arquivo <span className="dado">.env</span> da pasta do CRM e
              copie o valor de <span className="dado">AGENT_TOKEN</span>. Ele vem entre aspas -
              copie sem as aspas.
            </li>
            <li>
              Na Vercel do Jarvis, crie a variável <span className="dado">CRM_TOKEN</span> com esse
              valor, e <span className="dado">CRM_URL</span> com{' '}
              <span className="dado break-all">{CRM}</span>.
            </li>
            <li>Redeploy. Variável nova só vale para deploy feito depois dela.</li>
          </ol>
        </>
      )}

      <p className="fraco text-xs mt-3">
        O que a ligação destrava: a lista de clientes vinda do CRM nos projetos, o registro de
        toque por voz, e o topo do funil - quantas conversas viraram contato real.
      </p>
    </section>
  )
}
