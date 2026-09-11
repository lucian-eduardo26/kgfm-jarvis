// AS DUAS CORRENTES DE TRABALHO, escritas como o Lucian ditou em 10/09/2026 e
// aprovadas por ele ("é isso aí, está correto").
//
// Cada tipo de projeto tem uma corrente própria, e a corrente é SEQUENCIAL: um
// pacote começa quando o anterior termina. Não tem caminho crítico porque a
// corrente É o caminho crítico - ela é uma linha só.
//
// O QUE FAZ ISTO NÃO SER UMA LISTA FIXA: a condição. Ele deu a regra duas vezes
// sem perceber - "dependendo do tipo eu tenho logística de envio de matéria-
// prima" e "se tiver banho, tem banho". Duas perguntas geram quatro correntes
// diferentes do mesmo molde. Quatro modelos fixos deixariam três desatualizados.
//
// OS DIAS SÃO ESTIMATIVA MINHA, e ele ainda não corrigiu. Estão aqui para o
// cronograma existir desde o primeiro dia em vez de esperar - e ficam na frente
// (`Frente.diasEstimados`), não presos no código, para ele ajustar projeto a
// projeto sem depender de deploy.
//
// PRÓXIMO PASSO COMBINADO: mover estes modelos para o banco, para ele corrigir
// um pacote pela conversa e o próximo projeto daquele tipo já nascer certo.
// Enquanto isso não existe, editar este arquivo é o jeito.

import type { TipoProjeto } from '@prisma/client'

export type ChaveArea = 'comercial' | 'engenharia' | 'producao' | 'adm'
export type QuemSegura = 'eu' | 'cliente' | 'terceiro'

/** As perguntas cujas respostas mudam a corrente. */
export type Condicoes = {
  materiaPrimaNossa: boolean
  temRevestimento: boolean
}

export type PacoteModelo = {
  ordem: number
  pacote: string
  area: ChaveArea
  etapa: string
  quemSegura: QuemSegura
  /** Dias de CALENDARIO que o pacote consome. Alimenta o cronograma. */
  dias: number
  /** Minutos DELE que o pacote consome. Alimenta a semana e a capacidade.
      Sao coisas diferentes: fabricacao tem 5 dias e 0 minuto dele. */
  minutos: number
  /** Depois que o anterior fecha, este deveria comecar em ate N dias. */
  diasParaIniciar?: number
  /** Fase do projeto em que este pacote entra. */
  fase: 'desenvolvimento' | 'fechado' | 'entregue'
  /** Sem condição, o pacote sempre existe. */
  condicao?: (c: Condicoes) => boolean
  tarefas: string[]
}

const seTemRevestimento = (c: Condicoes) => c.temRevestimento
const seMateriaPrimaNossa = (c: Condicoes) => c.materiaPrimaNossa

// ---------------------------------------------------------------------------
// CORRENTE A - PEÇA USINADA
//
// A corrente do Batoque do Logimat. Quase tudo é ADM e Produção; engenharia
// não aparece porque o desenho já existe. Repare que dos doze pacotes, sete
// esperam terceiro: peça usinada é um projeto que passa a maior parte do
// tempo girando fora da mão dele.
// ---------------------------------------------------------------------------

const PECA: PacoteModelo[] = [
  // A ORDEM VEIO DELE em 10/09/2026, corrigindo a minha: a programação da
  // produção é DEPOIS da cotação, e não antes. "Eu coto, eu tenho o preço, aí
  // eu decido a programação, vou fechar com esse fornecedor ou com aquele."
  //
  // Os minutos também são dele, e é a parte mais valiosa desta lista: a hora
  // que ele gasta é a única coisa que não corre em paralelo.
  {
    ordem: 1,
    pacote: 'Pedido do cliente',
    area: 'adm',
    etapa: 'venda',
    quemSegura: 'cliente',
    dias: 0,
    minutos: 5,
    fase: 'fechado',
    tarefas: ['Ler o pedido e conferir quantidade e desenho'],
  },
  {
    ordem: 2,
    pacote: 'Cotação com o fornecedor',
    area: 'adm',
    etapa: 'compras',
    quemSegura: 'eu',
    dias: 1,
    minutos: 60,
    // Depois que o pedido do cliente entra, a cotação tem que sair em dois
    // dias. Passou disso, o Jarvis cobra. Padrão dele, editável por projeto.
    diasParaIniciar: 2,
    fase: 'desenvolvimento',
    tarefas: ['Mandar o desenho para os fornecedores', 'Comparar as cotações'],
  },
  {
    ordem: 3,
    pacote: 'Programação da produção',
    area: 'producao',
    etapa: 'fabricacao',
    quemSegura: 'eu',
    dias: 1,
    minutos: 60,
    diasParaIniciar: 2,
    fase: 'fechado',
    tarefas: ['Escolher o fornecedor', 'Definir o roteiro de fabricação'],
  },
  {
    ordem: 4,
    pacote: 'Atualizar preço e fechar condição',
    area: 'adm',
    etapa: 'compras',
    quemSegura: 'eu',
    dias: 1,
    minutos: 60,
    diasParaIniciar: 1,
    fase: 'desenvolvimento',
    tarefas: ['Confirmar preço atual', 'Fechar prazo e condição de pagamento'],
  },
  {
    ordem: 5,
    pacote: 'Colocar o pedido',
    area: 'adm',
    etapa: 'compras',
    quemSegura: 'eu',
    dias: 0,
    minutos: 30,
    diasParaIniciar: 1,
    fase: 'fechado',
    tarefas: ['Emitir o pedido de compra', 'Confirmar o recebimento com o fornecedor'],
  },
  {
    ordem: 6,
    pacote: 'Logística de envio da matéria-prima',
    area: 'producao',
    etapa: 'logistica',
    quemSegura: 'terceiro',
    dias: 2,
    minutos: 120,
    diasParaIniciar: 2,
    fase: 'fechado',
    condicao: seMateriaPrimaNossa,
    tarefas: ['Separar a matéria-prima', 'Contratar o frete de ida', 'Confirmar a chegada'],
  },
  {
    ordem: 7,
    pacote: 'Fabricação',
    area: 'producao',
    etapa: 'fabricacao',
    quemSegura: 'terceiro',
    // Cinco dias do fornecedor, e ZERO minuto dele. É exatamente aqui que os
    // dois números se separam: o calendário anda, a agenda dele não.
    dias: 5,
    minutos: 0,
    diasParaIniciar: 1,
    fase: 'fechado',
    tarefas: ['Acompanhar o andamento', 'Confirmar a data de conclusão'],
  },
  {
    ordem: 8,
    pacote: 'Logística de retirada da peça',
    area: 'producao',
    etapa: 'logistica',
    quemSegura: 'terceiro',
    dias: 2,
    minutos: 30,
    diasParaIniciar: 1,
    fase: 'fechado',
    tarefas: ['Agendar a retirada', 'Conferir a peça na saída'],
  },
  {
    ordem: 9,
    pacote: 'Logística de ida para o revestimento',
    area: 'producao',
    etapa: 'logistica',
    quemSegura: 'terceiro',
    dias: 2,
    minutos: 30,
    diasParaIniciar: 1,
    fase: 'fechado',
    condicao: seTemRevestimento,
    tarefas: ['Levar a peça para o banho'],
  },
  {
    ordem: 10,
    pacote: 'Revestimento ou banho',
    area: 'producao',
    etapa: 'fabricacao',
    quemSegura: 'terceiro',
    dias: 2,
    minutos: 0,
    diasParaIniciar: 1,
    fase: 'fechado',
    condicao: seTemRevestimento,
    tarefas: ['Acompanhar o processo', 'Conferir a espessura e o acabamento'],
  },
  {
    ordem: 11,
    pacote: 'Logística de retorno do revestimento',
    area: 'producao',
    etapa: 'logistica',
    quemSegura: 'terceiro',
    dias: 2,
    minutos: 30,
    diasParaIniciar: 1,
    fase: 'fechado',
    condicao: seTemRevestimento,
    tarefas: ['Retirar a peça do banho', 'Conferir no recebimento'],
  },
  {
    ordem: 12,
    pacote: 'Embalagem',
    area: 'producao',
    etapa: 'expedicao',
    quemSegura: 'eu',
    dias: 1,
    minutos: 60,
    diasParaIniciar: 1,
    fase: 'fechado',
    tarefas: ['Conferir a quantidade', 'Embalar e identificar'],
  },
  {
    ordem: 13,
    pacote: 'Logística para o cliente',
    area: 'producao',
    etapa: 'logistica',
    quemSegura: 'terceiro',
    dias: 3,
    minutos: 30,
    diasParaIniciar: 1,
    fase: 'fechado',
    tarefas: ['Contratar o frete', 'Emitir a nota de remessa', 'Confirmar a entrega'],
  },
  {
    ordem: 14,
    pacote: 'Faturar e cobrar',
    area: 'adm',
    etapa: 'financeiro',
    quemSegura: 'eu',
    dias: 2,
    minutos: 45,
    diasParaIniciar: 1,
    fase: 'entregue',
    tarefas: ['Emitir a nota fiscal', 'Acompanhar o recebimento'],
  },
]

// ---------------------------------------------------------------------------
// CORRENTE B - SISTEMA DE AUTOMAÇÃO
//
// Aqui a fase importa: antes do pedido é aposta, depois é obrigação. Repare
// quantos pacotes esperam o CLIENTE - é onde o calendário some sem ninguém
// perceber, e é o que o cronograma passa a cobrar.
// ---------------------------------------------------------------------------

const SISTEMA: PacoteModelo[] = [
  { ordem: 1, pacote: 'Reunião inicial', area: 'comercial', etapa: 'venda', quemSegura: 'cliente', dias: 5, minutos: 150, diasParaIniciar: 2, fase: 'desenvolvimento', tarefas: ['Marcar a reunião', 'Entender a demanda'] },
  { ordem: 2, pacote: 'Visita presencial e levantamento', area: 'comercial', etapa: 'venda', quemSegura: 'eu', dias: 3, minutos: 90, diasParaIniciar: 2, fase: 'desenvolvimento', tarefas: ['Agendar a visita', 'Levantar a operação em campo', 'Fotografar e medir'] },
  { ordem: 3, pacote: 'Transcrição e resumo da visita', area: 'engenharia', etapa: 'desenvolvimento', quemSegura: 'eu', dias: 2, minutos: 90, diasParaIniciar: 2, fase: 'desenvolvimento', tarefas: ['Transcrever a gravação', 'Resumir o que foi dito', 'Listar o que ficou em aberto'] },
  { ordem: 4, pacote: 'Análise do layout atual', area: 'engenharia', etapa: 'desenvolvimento', quemSegura: 'eu', dias: 3, minutos: 90, diasParaIniciar: 2, fase: 'desenvolvimento', tarefas: ['Estudar o layout existente', 'Mapear os gargalos'] },
  { ordem: 5, pacote: 'E-mail de kick-off com a lista de dados', area: 'engenharia', etapa: 'desenvolvimento', quemSegura: 'eu', dias: 1, minutos: 90, diasParaIniciar: 2, fase: 'desenvolvimento', tarefas: ['Montar a lista de dados', 'Enviar com prazo de resposta'] },
  { ordem: 6, pacote: 'Cliente responder os dados', area: 'engenharia', etapa: 'desenvolvimento', quemSegura: 'cliente', dias: 10, minutos: 300, diasParaIniciar: 2, fase: 'desenvolvimento', tarefas: ['Cobrar a resposta', 'Conferir o que veio'] },
  { ordem: 7, pacote: 'Análise das respostas', area: 'engenharia', etapa: 'desenvolvimento', quemSegura: 'eu', dias: 4, minutos: 120, diasParaIniciar: 2, fase: 'desenvolvimento', tarefas: ['Analisar os dados recebidos', 'Dimensionar a solução'] },
  { ordem: 8, pacote: 'Reunião de alinhamento', area: 'comercial', etapa: 'venda', quemSegura: 'cliente', dias: 7, minutos: 210, diasParaIniciar: 2, fase: 'desenvolvimento', tarefas: ['Marcar a reunião', 'Alinhar premissas e escopo'] },
  { ordem: 9, pacote: 'Gerar o layout proposto', area: 'engenharia', etapa: 'desenvolvimento', quemSegura: 'eu', dias: 7, minutos: 210, diasParaIniciar: 2, fase: 'desenvolvimento', tarefas: ['Desenhar o layout', 'Dimensionar equipamentos', 'Montar a lista preliminar'] },
  { ordem: 10, pacote: 'Apresentar o layout', area: 'comercial', etapa: 'venda', quemSegura: 'cliente', dias: 5, minutos: 150, diasParaIniciar: 2, fase: 'desenvolvimento', tarefas: ['Apresentar', 'Colher as objeções'] },
  { ordem: 11, pacote: 'Ajustes do layout', area: 'engenharia', etapa: 'desenvolvimento', quemSegura: 'eu', dias: 4, minutos: 120, diasParaIniciar: 2, fase: 'desenvolvimento', tarefas: ['Ajustar o desenho', 'Revalidar as premissas'] },
  { ordem: 12, pacote: 'Precificar e montar a proposta', area: 'adm', etapa: 'financeiro', quemSegura: 'eu', dias: 3, minutos: 90, diasParaIniciar: 2, fase: 'desenvolvimento', tarefas: ['Cotar os itens principais', 'Precificar', 'Montar a proposta'] },
  { ordem: 13, pacote: 'Apresentar a proposta', area: 'comercial', etapa: 'venda', quemSegura: 'cliente', dias: 5, minutos: 150, diasParaIniciar: 2, fase: 'desenvolvimento', tarefas: ['Apresentar a proposta', 'Registrar o envio'] },
  { ordem: 14, pacote: 'Negociação e fechamento', area: 'comercial', etapa: 'venda', quemSegura: 'cliente', dias: 15, minutos: 450, diasParaIniciar: 2, fase: 'desenvolvimento', tarefas: ['Tratar as objeções', 'Ajustar condições', 'Conseguir o aceite'] },

  { ordem: 15, pacote: 'Pedido formal e cadastro', area: 'adm', etapa: 'financeiro', quemSegura: 'eu', dias: 3, minutos: 90, diasParaIniciar: 2, fase: 'fechado', tarefas: ['Receber o pedido', 'Cadastro e condições comerciais'] },
  { ordem: 16, pacote: 'Projeto executivo e detalhamento', area: 'engenharia', etapa: 'detalhamento', quemSegura: 'eu', dias: 20, minutos: 600, diasParaIniciar: 2, fase: 'fechado', tarefas: ['Detalhar', 'Lista final de materiais', 'Documentação para fabricação'] },
  { ordem: 17, pacote: 'Aprovação do executivo com o cliente', area: 'engenharia', etapa: 'detalhamento', quemSegura: 'cliente', dias: 7, minutos: 210, diasParaIniciar: 2, fase: 'fechado', tarefas: ['Enviar para aprovação', 'Tratar os comentários'] },
  { ordem: 18, pacote: 'Compra de material', area: 'adm', etapa: 'compras', quemSegura: 'eu', dias: 5, minutos: 150, diasParaIniciar: 2, fase: 'fechado', tarefas: ['Emitir as ordens de compra', 'Confirmar prazos'] },
  { ordem: 19, pacote: 'Contratos com fornecedores', area: 'adm', etapa: 'compras', quemSegura: 'eu', dias: 5, minutos: 150, diasParaIniciar: 2, fase: 'fechado', tarefas: ['Fechar contrato de fabricação', 'Fechar contrato de montagem'] },
  { ordem: 20, pacote: 'Fabricação', area: 'producao', etapa: 'fabricacao', quemSegura: 'terceiro', dias: 30, minutos: 900, diasParaIniciar: 2, fase: 'fechado', tarefas: ['Acompanhar o andamento', 'Inspecionar antes do embarque'] },
  { ordem: 21, pacote: 'Logística para a obra', area: 'producao', etapa: 'logistica', quemSegura: 'terceiro', dias: 5, minutos: 150, diasParaIniciar: 2, fase: 'fechado', tarefas: ['Contratar o transporte', 'Confirmar a chegada no cliente'] },
  { ordem: 22, pacote: 'Montagem e mão de obra', area: 'producao', etapa: 'montagem', quemSegura: 'eu', dias: 20, minutos: 600, diasParaIniciar: 2, fase: 'fechado', tarefas: ['Mobilizar a equipe', 'Montar em campo', 'Conferir o alinhamento'] },
  { ordem: 23, pacote: 'Gestão da equipe de montagem', area: 'producao', etapa: 'montagem', quemSegura: 'eu', dias: 20, minutos: 600, diasParaIniciar: 2, fase: 'fechado', tarefas: ['Acompanhar diariamente', 'Resolver as pendências de campo'] },
  { ordem: 24, pacote: 'Comissionamento', area: 'producao', etapa: 'montagem', quemSegura: 'eu', dias: 7, minutos: 210, diasParaIniciar: 2, fase: 'fechado', tarefas: ['Testar a operação', 'Ajustar parâmetros'] },
  { ordem: 25, pacote: 'Startup com o cliente', area: 'producao', etapa: 'montagem', quemSegura: 'cliente', dias: 5, minutos: 150, diasParaIniciar: 2, fase: 'fechado', tarefas: ['Treinar a equipe do cliente', 'Operação assistida', 'Termo de aceite'] },
  { ordem: 26, pacote: 'Faturamento e recebimento', area: 'adm', etapa: 'financeiro', quemSegura: 'eu', dias: 10, minutos: 300, diasParaIniciar: 2, fase: 'entregue', tarefas: ['Emitir a nota fiscal', 'Acompanhar o recebimento'] },
]

export const MODELOS: Record<TipoProjeto, PacoteModelo[]> = {
  peca: PECA,
  sistema: SISTEMA,
}

export const NOME_DO_TIPO: Record<TipoProjeto, string> = {
  peca: 'Peça usinada',
  sistema: 'Sistema',
}

/**
 * A corrente de verdade deste projeto: o modelo do tipo, com os pacotes
 * condicionais já resolvidos pelas respostas.
 */
export function correnteDoProjeto(tipo: TipoProjeto, condicoes: Condicoes): PacoteModelo[] {
  return MODELOS[tipo].filter((p) => !p.condicao || p.condicao(condicoes))
}

/** Quantos dias a corrente inteira leva, do primeiro pacote ao último. */
export function duracaoTotal(tipo: TipoProjeto, condicoes: Condicoes): number {
  return correnteDoProjeto(tipo, condicoes).reduce((s, p) => s + p.dias, 0)
}
