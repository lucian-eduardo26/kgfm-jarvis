// WBS basica por projeto - o desdobramento padrao, nos quatro setores.
//
// DECISAO DE PROJETO: os pacotes nascem com status "planejada", nao "aberta".
// Se a WBS abrisse todas as frentes, um projeto novo estouraria o limite de WIP
// das quatro areas de uma vez, e o Personal Kanban morreria no primeiro dia.
// A WBS e o PLANO; o quadro e o AGORA. Voce ativa o pacote quando chega a vez -
// e a ativacao passa pelo limite de WIP como qualquer outra frente.
//
// Nao e o MS Project e nao quer ser: nao tem duracao, nem dependencia entre
// pacotes, nem caminho critico. Tem o suficiente para o cronometro saber a que
// projeto e a que setor cada hora pertence - o centro de custo.

export type PacoteWbs = {
  area: 'comercial' | 'engenharia' | 'producao' | 'adm'
  pacote: string
  tarefas: string[]
}

export type FaseWbs = 'desenvolvimento' | 'fechado' | 'entregue'

export const WBS: Record<FaseWbs, PacoteWbs[]> = {
  // Antes de entrar: o projeto ainda e uma aposta. Tudo aqui e custo de venda.
  desenvolvimento: [
    {
      area: 'comercial',
      pacote: 'Qualificacao e levantamento',
      tarefas: ['Entender a demanda com o cliente', 'Visita tecnica', 'Levantar restricoes de layout e operacao'],
    },
    {
      area: 'engenharia',
      pacote: 'Concepcao tecnica',
      tarefas: ['Definir conceito e layout', 'Lista preliminar de materiais', 'Dimensionar equipamentos'],
    },
    {
      area: 'producao',
      pacote: 'Consulta a fornecedores',
      tarefas: ['Cotar itens principais', 'Confirmar prazo de fabricacao', 'Checar disponibilidade de montagem'],
    },
    {
      area: 'adm',
      pacote: 'Proposta e cadastro',
      tarefas: ['Precificar', 'Montar a proposta', 'Cadastro e condicoes comerciais', 'Enviar e registrar o envio'],
    },
  ],

  // Fechado: agora e obrigacao, e tem cliente contando os dias.
  fechado: [
    {
      area: 'adm',
      pacote: 'Contrato e faturamento',
      tarefas: ['Contrato ou pedido formal', 'Cronograma de medicao', 'Emitir nota fiscal', 'Acompanhar recebimento'],
    },
    {
      area: 'engenharia',
      pacote: 'Projeto executivo',
      tarefas: ['Detalhamento', 'Lista final de materiais', 'Documentacao para fabricacao', 'Aprovacao com o cliente'],
    },
    {
      area: 'producao',
      pacote: 'Suprimentos',
      tarefas: ['Emitir ordens de compra', 'Acompanhar prazo dos fornecedores', 'Receber e conferir'],
    },
    {
      area: 'producao',
      pacote: 'Fabricacao e montagem',
      tarefas: ['Fabricacao', 'Montagem em campo', 'Comissionamento', 'Testes com o cliente'],
    },
    {
      area: 'comercial',
      pacote: 'Relacao durante a obra',
      tarefas: ['Reuniao de acompanhamento', 'Tratar aditivos e mudancas de escopo'],
    },
  ],

  // Entregue: onde o dinheiro costuma ficar parado sem ninguem olhar.
  entregue: [
    {
      area: 'adm',
      pacote: 'Fechamento financeiro',
      tarefas: ['Ultima medicao', 'Faturar o saldo', 'Cobrar o que estiver em aberto', 'Encerrar o projeto'],
    },
    {
      area: 'producao',
      pacote: 'Assistencia',
      tarefas: ['Atender chamados de garantia', 'Registrar ajustes feitos'],
    },
    {
      area: 'comercial',
      pacote: 'Pos-venda',
      tarefas: ['Colher o resultado obtido', 'Mapear a proxima oportunidade na conta'],
    },
  ],
}

/** A WBS acumula: projeto fechado tambem carrega o que sobrou do desenvolvimento. */
export function pacotesDaFase(fase: FaseWbs): PacoteWbs[] {
  if (fase === 'desenvolvimento') return WBS.desenvolvimento
  if (fase === 'fechado') return [...WBS.desenvolvimento, ...WBS.fechado]
  return [...WBS.desenvolvimento, ...WBS.fechado, ...WBS.entregue]
}
