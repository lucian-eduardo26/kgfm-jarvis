// A CONFIGURAÇÃO, e agora ela é o lugar ÚNICO de tudo que se liga uma vez.
//
// O Lucian em 11/09/2026: "é melhor concentrar tudo nas configurações e ter
// uma parte de conectar agenda, e acabou - não vai fazer no meio do
// aplicativo uma parte de conectar que você vai usar uma vez na vida".
//
// A tela abre pelas LIGAÇÕES (CRM e Google), porque ligação quebrada é a
// única coisa aqui capaz de fazer o resto do sistema mentir em silêncio. Os
// pesos e os limiares vêm depois: eles funcionam sozinhos no padrão.

import { exigirSessao } from '@/lib/guarda'
import { prisma } from '@/lib/prisma'
import { lerConfig, CAMPOS } from '@/lib/configuracao'
import { CONFIG_PADRAO } from '@/lib/mostrador'
import { LigarCrm } from '@/components/LigarCrm'
import { LigarGoogle } from '@/components/LigarGoogle'
import { googleConfigurado, enderecoDeRetorno, contaLigada, listarCalendarios } from '@/lib/google'
import { Moldura } from '@/components/Moldura'
import { salvarConfig, restaurarPadrao } from '../acoes'
import { EscolherVoz } from '@/components/EscolherVoz'
import { LigarSom } from '@/components/LigarSom'

export const dynamic = 'force-dynamic'

export default async function Configuracao({
  searchParams,
}: {
  searchParams: Promise<{ google?: string; motivo?: string; conta?: string }>
}) {
  await exigirSessao()
  const { google, motivo, conta: contaDoRetorno } = await searchParams

  const conta = await contaLigada()
  // Só pergunta as agendas se houver conta: sem conta a lista seria sempre nula.
  const calendarios = conta ? await listarCalendarios() : null

  // O retorno do Google vira frase em português. "invalid_grant" na tela é um
  // beco: quem lê não sabe se a culpa é dele, minha, ou do Google.
  const avisoDoGoogle =
    google === 'erro'
      ? (motivo ?? 'O Google recusou a autorização.')
      : google === 'recusado'
        ? 'Você cancelou na tela do Google. Nada foi ligado.'
        : google === 'sem-codigo'
          ? 'O Google voltou sem código de autorização. Tente de novo.'
          : google === 'sem-chave'
            ? 'Falta a credencial do Google nas variáveis do app.'
            : google === 'ligado'
              ? `Conta ${contaDoRetorno ?? ''} ligada.`
              : google === 'desligado'
                ? 'Conta desligada. O espelho para de atualizar.'
                : google === 'falhou'
                  ? 'Não consegui ler a agenda. A autorização pode ter sido revogada.'
                  : null

  const cfg = await lerConfig()
  const gravados = await prisma.config.findMany()
  const quando = new Map(gravados.map((g) => [g.chave, g.alteradoEm]))
  const areas = await prisma.area.findMany({ orderBy: { ordem: 'asc' } })
  const soma = cfg.pesoMovimento + cfg.pesoCriticos + cfg.pesoAderencia
  const gasto = await prisma.chamadaIa.aggregate({ _sum: { custoEstimado: true }, _count: true })

  return (
    <Moldura titulo="Configuração" atalhoAtivo="/config">
      {/* AS LIGAÇÕES PRIMEIRO. São as únicas coisas desta tela que, quando
          estão erradas, fazem o resto do sistema mostrar número errado sem
          avisar. Peso mal ajustado engana; ligação caída apaga. */}
      <p className="rotulo mb-2">o que o Jarvis liga</p>

      <div className="grid lg:grid-cols-2 gap-3 mb-5">
        <LigarCrm />
        <LigarGoogle
          configurado={googleConfigurado()}
          conta={conta}
          calendarios={calendarios}
          enderecoDeRetorno={enderecoDeRetorno()}
          aviso={avisoDoGoogle}
        />
      </div>

      <p className="rotulo mb-2">como o Jarvis calcula</p>

      <p className="fraco text-sm mb-4 max-w-2xl">
        Tudo aqui nasce com o padrão da especificação. Cada mudança guarda a data - se o mostrador
        mudar de cor, você precisa conseguir responder se foi o mundo que mudou ou se foi o peso.
      </p>

      <form action={salvarConfig} className="cartao p-4">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide">O mostrador</h2>
          <span className="text-xs" style={{ color: soma === 100 ? 'var(--verde)' : 'var(--ambar)' }}>
            pesos somam {soma}
            {soma !== 100 && ' - deveria somar 100'}
          </span>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {CAMPOS.map((c) => {
            const valor = cfg[c.chave]
            const padrao = CONFIG_PADRAO[c.chave]
            const data = quando.get(c.chave)
            return (
              <label key={c.chave} className="block">
                <span className="text-sm font-medium">{c.rotulo}</span>
                <input
                  type="number"
                  name={c.chave}
                  defaultValue={valor}
                  min={c.min}
                  max={c.max}
                  step={c.passo}
                  className="campo mt-1"
                />
                <span className="text-xs fraco block mt-1">{c.explicacao}</span>
                <span className="text-xs block" style={{ color: valor === padrao ? 'var(--fraco)' : 'var(--ambar)' }}>
                  {valor === padrao
                    ? `padrao: ${padrao}`
                    : `alterado de ${padrao} em ${data ? data.toLocaleDateString('pt-BR') : 'data desconhecida'}`}
                </span>
              </label>
            )
          })}
        </div>

        <div className="flex gap-2 mt-4">
          <button className="botao">Salvar</button>
          <button formAction={restaurarPadrao} className="botao-fantasma">
            Voltar ao padrão
          </button>
        </div>
      </form>

      <section className="cartao p-4 mt-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-3">Limiares por área</h2>
        <ul className="text-sm space-y-1">
          {areas.map((a) => (
            <li key={a.id} className="flex justify-between">
              <span>{a.nome}</span>
              <span className="fraco">
                critico em {a.diasParaCritico} dias uteis · limite de {a.limiteWip} frentes
              </span>
            </li>
          ))}
        </ul>
        <p className="fraco text-xs mt-2">
          Editar limiar por área entra junto com a tela de áreas. Hoje muda no banco.
        </p>
      </section>

      <EscolherVoz />

      <LigarSom />

      <section className="cartao p-4 mt-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-2">Conta da API</h2>
        <p className="text-sm">
          {gasto._count} {gasto._count === 1 ? 'chamada' : 'chamadas'} ·{' '}
          <strong>US$ {(gasto._sum.custoEstimado ?? 0).toFixed(4)}</strong> estimados
        </p>
        <p className="fraco text-xs mt-1">
          A conta sobe aqui antes de subir na fatura. Classificacao usa o modelo pequeno de propósito.
        </p>
      </section>
    </Moldura>
  )
}
