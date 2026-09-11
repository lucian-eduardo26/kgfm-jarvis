// O CRONOGRAMA DE UM PROJETO, pacote a pacote.
//
// A tela da carteira responde "como está a empresa". Esta responde a pergunta
// seguinte: "onde exatamente este projeto está, e quem está segurando".
//
// Cada linha é um pacote da corrente com a previsão calculada. A cor de quem
// segura importa mais do que parece: atraso de terceiro é telefonema, de
// cliente é cobrança, e só o atraso que é seu vira bloco na agenda.

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { exigirSessao } from '@/lib/guarda'
import { prisma } from '@/lib/prisma'
import { Moldura, Cabeca } from '@/components/Moldura'
import { montarCronograma, dataCurta, oQueFazerComOAtraso, horasCurtas } from '@/lib/cronograma'
import { NOME_DO_TIPO } from '@/lib/modelos'
import { definirInicioDoProjeto, editarProjeto, marcarPacote } from '../../acoes'
import { PacoteLinha } from '@/components/PacoteLinha'
import { Spin } from '@/components/Spin'

export const dynamic = 'force-dynamic'

const COR_DE_QUEM: Record<string, string> = {
  eu: 'var(--texto)',
  terceiro: 'var(--verde)',
  cliente: 'var(--ambar)',
}

const NOME_DE_QUEM: Record<string, string> = {
  eu: 'VOCÊ',
  terceiro: 'TERCEIRO',
  cliente: 'CLIENTE',
}

export default async function ProjetoDetalhe({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ corrente?: string }>
}) {
  await exigirSessao()
  const { id } = await params
  const { corrente } = await searchParams
  const travada = corrente === 'travada'

  const projeto = await prisma.projeto.findUnique({
    where: { id: Number(id) },
    include: {
      frentes: {
        where: { status: { not: 'descartada' } },
        include: { area: { select: { nome: true } } },
        orderBy: { ordem: 'asc' },
      },
      decisores: { orderBy: { criadoEm: 'asc' } },
    },
  })

  if (!projeto) notFound()

  const c = montarCronograma(projeto.inicioEm, projeto.frentes)
  const atrasado = c.atrasoMaximo > 0

  // O que falta na qualificacao, para o resumo fechado ja dizer sem abrir.
  const faltaSpin = [
    !projeto.implicacao?.trim() ? 'a implicação' : null,
    !projeto.necessidade?.trim() ? 'a necessidade' : null,
  ].filter(Boolean) as string[]

  return (
    <Moldura titulo={projeto.nome} atalhoAtivo="/projetos">
      <div className="mb-3">
        <Link href="/projetos" className="text-xs fraco">
          &lt; todos os projetos
        </Link>
      </div>

      <section className="cartao p-4 mb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-bold leading-tight">{projeto.nome}</h2>
            <p className="text-xs fraco mt-1">
              {projeto.cliente ?? 'sem cliente'} · {NOME_DO_TIPO[projeto.tipo]} · {projeto.fase}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="numero text-2xl" style={{ color: atrasado ? 'var(--vermelho)' : 'var(--texto)' }}>
              {c.progresso}%
            </p>
            <p className="text-[10px] fraco font-mono">EXECUTADO</p>
          </div>
        </div>

        {/* As condições que geraram esta corrente, ditas em português. */}
        <p className="text-xs fraco mt-3">
          {projeto.tipo === 'peca' ? (
            <>
              {projeto.materiaPrimaNossa ? 'A matéria-prima sai daqui' : 'A matéria-prima é do fornecedor'} ·{' '}
              {projeto.temRevestimento ? 'tem revestimento' : 'sem revestimento'}
            </>
          ) : (
            'Corrente de sistema: descoberta, proposta e execução'
          )}
        </p>

        {atrasado && (
          <p className="text-sm mt-3" style={{ color: 'var(--vermelho)' }}>
            {c.atrasoMaximo} dias de atraso, e a bola está com {NOME_DE_QUEM[c.atrasoDe ?? 'eu'].toLowerCase()}.
            O próximo passo é {oQueFazerComOAtraso(c.atrasoDe)}.
          </p>
        )}
      </section>

      {travada && (
        <p className="cartao p-3 mb-3 text-sm" style={{ borderColor: 'var(--ambar)', color: 'var(--ambar)' }}>
          O resto foi salvo, mas o tipo e as condições não mudaram: este projeto já tem pacote
          fechado, e trocar a corrente apagaria o que já andou. Para mudar mesmo assim, reabra os
          pacotes fechados antes.
        </p>
      )}

      {/* Editar na mão. Ele pediu em 10/09/2026, e com razão: todo projeto
          nascia do script ou do ditado e depois ficava congelado.
          Valor e prazo moram aqui de propósito - são os dois números que
          faltam para a régua de prioridade parar de empatar todo mundo. */}
      <form action={editarProjeto} className="cartao p-4 mb-3">
        <input type="hidden" name="projetoId" value={projeto.id} />
        <p className="rotulo mb-3">editar o projeto</p>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs fraco block mb-1">Nome</label>
            <input name="nome" defaultValue={projeto.nome} className="campo" />
          </div>
          <div>
            <label className="text-xs fraco block mb-1">Cliente</label>
            <input name="cliente" defaultValue={projeto.cliente ?? ''} className="campo" />
          </div>
          <div>
            <label className="text-xs fraco block mb-1">Tipo</label>
            <select name="tipo" defaultValue={projeto.tipo} className="campo">
              <option value="peca">Peça usinada</option>
              <option value="sistema">Sistema</option>
            </select>
          </div>
          <div>
            <label className="text-xs fraco block mb-1">Valor estimado (R$)</label>
            <input
              name="valorEstimado"
              inputMode="decimal"
              defaultValue={projeto.valorEstimado ?? ''}
              placeholder="18000"
              className="campo"
            />
          </div>
          <div>
            <label className="text-xs fraco block mb-1">Recebe em (dias)</label>
            <input
              name="prazoRecebimentoDias"
              inputMode="numeric"
              defaultValue={projeto.prazoRecebimentoDias ?? ''}
              placeholder="60"
              className="campo"
            />
          </div>
          <div>
            <label className="text-xs fraco block mb-1">Chance de fechar (%)</label>
            <input
              name="probabilidade"
              inputMode="numeric"
              defaultValue={projeto.probabilidade ?? ''}
              className="campo"
            />
          </div>
        </div>

        {projeto.tipo === 'peca' && (
          <div className="flex flex-wrap gap-4 mt-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="materiaPrimaNossa" defaultChecked={projeto.materiaPrimaNossa} />
              A matéria-prima sai daqui
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="temRevestimento" defaultChecked={projeto.temRevestimento} />
              Tem banho ou revestimento
            </label>
          </div>
        )}

        <button className="botao mt-3">Guardar</button>
        <p className="fraco text-xs mt-2">
          Valor e prazo alimentam a régua de prioridade. Mudar o tipo ou as condições refaz a WBS -
          e por isso só funciona enquanto nenhum pacote estiver fechado.
        </p>
      </form>

      {/* A data de início é o que faz o cronograma existir. Enquanto ela for
          o dia em que o projeto foi cadastrado, a previsão está errada - e a
          tela diz isso em vez de fingir. */}
      <form action={definirInicioDoProjeto} className="cartao p-4 mb-3">
        <p className="rotulo mb-2">quando este projeto começou de verdade</p>
        <div className="flex flex-wrap gap-2 items-end">
          <input type="hidden" name="projetoId" value={projeto.id} />
          <div className="min-w-[170px]">
            <input
              type="date"
              name="inicio"
              defaultValue={projeto.inicioEm ? projeto.inicioEm.toISOString().slice(0, 10) : ''}
              className="campo"
            />
          </div>
          <button className="botao">Corrigir a data</button>
        </div>
        <p className="fraco text-xs mt-2">
          Todas as previsões saem daqui. Sem a data certa, o cronograma é bonito e errado.
        </p>
      </form>

      {/* A QUALIFICAÇÃO MORA AQUI, e não na lista de projetos.
          O Lucian em 10/09/2026: "isso é só um banco de dados que vai estar
          guardado ali em algum lugar". É memória para montar apresentação e
          sustentar venda complexa - o que ele precisa ver ao abrir o sistema
          é projeto andando, não entrevista de qualificação.
          Fica depois do cronograma pelo mesmo motivo: é consulta, não é o
          que decide o dia. */}
      <details className="cartao p-4 mb-3">
        <summary className="rotulo cursor-pointer select-none">
          a qualificação deste projeto
          {faltaSpin.length > 0 && (
            <span className="ml-2 text-[10px]" style={{ color: 'var(--ambar)' }}>
              falta {faltaSpin.join(' e ')}
            </span>
          )}
        </summary>
        <div className="mt-3">
          <Spin
            projetoId={projeto.id}
            estado={{
              situacao: projeto.situacao,
              problema: projeto.problema,
              implicacao: projeto.implicacao,
              necessidade: projeto.necessidade,
            }}
            propostaEnviadaEm={projeto.propostaEnviadaEm}
            decisores={projeto.decisores}
            travado={false}
          />
        </div>
      </details>

      <section className="cartao">
        <Cabeca
          titulo="o cronograma"
          direita={
            <span className="text-[10px] dado">
              {c.temData && c.entregaPrevista ? `ENTREGA ${dataCurta(c.entregaPrevista)}` : 'SEM DATA'}
            </span>
          }
        />
        <div className="painel-corpo">
          {c.pacotes.length === 0 ? (
            <p className="fraco text-sm">
              Este projeto ainda não tem WBS. Diga ao Jarvis que tipo ele é e a corrente se desdobra
              com as datas - ou abra os pacotes na tela de projetos.
            </p>
          ) : (
            <ol className="space-y-1.5">
              {c.pacotes.map((p) => (
                <li key={p.id} className="flex items-center gap-2 text-sm py-1">
                  <span
                    className="numero text-[11px] shrink-0 w-5 text-right"
                    style={{ color: p.fechado ? 'var(--laranja)' : 'var(--fraco)' }}
                  >
                    {p.ordem}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      style={{
                        textDecoration: p.fechado ? 'line-through' : undefined,
                        color: p.fechado ? 'var(--fraco)' : undefined,
                      }}
                    >
                      {p.pacote ?? p.titulo}
                    </span>
                    <span className="block text-[11px] dado mt-0.5">
                      {dataCurta(p.inicioPrevisto)} a {dataCurta(p.fimPrevisto)} · {p.dias}d · {p.areaNome}
                    </span>
                  </span>
                  <span className="shrink-0 text-right mr-1">
                    <span
                      className="text-[10px] font-mono block"
                      style={{ color: COR_DE_QUEM[p.quemSegura] }}
                    >
                      {NOME_DE_QUEM[p.quemSegura]}
                    </span>
                    <span className="text-[10px] dado block">{horasCurtas(p.minutos)}</span>
                    {p.atrasado && (
                      <span className="block text-[10px] numero" style={{ color: 'var(--vermelho)' }}>
                        +{p.diasDeAtraso}d
                      </span>
                    )}
                  </span>

                  <PacoteLinha
                    frenteId={p.id}
                    percentual={p.percentual}
                    fechado={p.fechado}
                    acao={marcarPacote}
                  />
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </Moldura>
  )
}
