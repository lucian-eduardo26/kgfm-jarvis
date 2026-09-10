// WBS basica por projeto - o desdobramento padrão, nos quatro setores.
//
// DECISÃO DE PROJETO: os pacotes nascem com status "planejada", não "aberta".
// Se a WBS abrisse todas as frentes, um projeto novo estouraria o limite de WIP
// das quatro áreas de uma vez, e o Personal Kanban morreria no primeiro dia.
// A WBS é o PLANO; o quadro é o AGORA. Você ativa o pacote quando chega a vez -
// e a ativação passa pelo limite de WIP como qualquer outra frente.
//
// Não e o MS Project e não quer ser: não tem duração, nem dependencia entre
// pacotes, nem caminho crítico. Tem o suficiente para o cronômetro saber a que
// projeto e a que setor cada hora pertence - o centro de custo.

export type PacoteWbs = {
  area: 'comercial' | 'engenharia' | 'producao' | 'adm'
  pacote: string
  tarefas: string[]
}

export type FaseWbs = 'desenvolvimento' | 'fechado' | 'entregue'

export const WBS: Record<FaseWbs, PacoteWbs[]> = {
  // Antes de entrar: o projeto ainda é uma aposta. Tudo aqui é custo de venda.
  desenvolvimento: [
    {
      area: 'comercial',
      pacote: 'Qualificação e levantamento',
      tarefas: ['Entender a demanda com o cliente', 'Visita tecnica', 'Levantar restricoes de layout e operacao'],
    },
    {
      area: 'engenharia',
      pacote: 'Concepcao técnica',
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
      tarefas: ['Precificar', 'Montar a proposta', 'Cadastro e condições comerciais', 'Enviar e registrar o envio'],
    },
  ],

  // Fechado: agora e obrigacao, e tem cliente contando os dias.
  fechado: [
    {
      area: 'adm',
      pacote: 'Contrato e faturamento',
      tarefas: ['Contrato ou pedido formal', 'Cronograma de medição', 'Emitir nota fiscal', 'Acompanhar recebimento'],
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
      tarefas: ['Reunião de acompanhamento', 'Tratar aditivos e mudancas de escopo'],
    },
  ],

  // Entregue: onde o dinheiro costuma ficar parado sem ninguém olhar.
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
      tarefas: ['Colher o resultado obtido', 'Mapear a próxima oportunidade na conta'],
    },
  ],
}

/** A WBS acumula: projeto fechado também carrega o que sobrou do desenvolvimento. */
export function pacotesDaFase(fase: FaseWbs): PacoteWbs[] {
  if (fase === 'desenvolvimento') return WBS.desenvolvimento
  if (fase === 'fechado') return [...WBS.desenvolvimento, ...WBS.fechado]
  return [...WBS.desenvolvimento, ...WBS.fechado, ...WBS.entregue]
}
