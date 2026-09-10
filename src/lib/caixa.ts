// RUNWAY - quantos dias de vida o caixa tem.
//
// Entrou em 10/09/2026, quando apareceu o dado que faltava: custo fixo mensal e
// emprestimo de curto prazo. Com isso, a hierarquia do sistema muda.
//
// Até aqui o Jarvis respondia "o que eu faço agora" olhando fluxo de trabalho.
// Fluxo de trabalho é a pergunta certa QUANDO EXISTE CAIXA. Com runway curto, a
// pergunta certa é outra: o que entra dinheiro mais rápido. Um mostrador verde
// numa empresa com 40 dias de caixa é um instrumento medindo a coisa errada com
// muita precisão.
//
// Por isso o runway fica ACIMA do painel, e não dentro dele.
//
// Duas contas, e nenhuma delas e opinião:
//   queima mensal      = custo fixo + parcela do emprestimo
//   runway em dias     = saldo / (queima / 30)
//   faturamento minimo = queima / margem bruta   (o ponto de equilibrio)
//
// E uma auditoria: a HORA-FUNDADOR. Hora dele em projeto de baixo ticket é a
// despesa mais cara da empresa, porque o custo não é o salário dele - é o
// negócio grande que não andou naquele dia.

export type EstadoCaixa = {
  saldo: number
  custoFixoMensal: number
  parcelaEmprestimo: number
  margemBruta: number
  limiteBaixoTicket: number
  tetoHoraBaixoTicket: number
}

export type Runway = {
  configurado: boolean
  queimaMensal: number
  queimaDiaria: number
  dias: number
  faturamentoDeEquilibrio: number
  zona: 'vermelho' | 'ambar' | 'verde' | 'cinza'
  frase: string
}

export function calcularRunway(c: EstadoCaixa | null): Runway {
  if (!c || (c.custoFixoMensal <= 0 && c.parcelaEmprestimo <= 0)) {
    return {
      configurado: false,
      queimaMensal: 0,
      queimaDiaria: 0,
      dias: 0,
      faturamentoDeEquilibrio: 0,
      zona: 'cinza',
      frase: 'Caixa não configurado. Enquanto o custo fixo não entrar, o sistema mede fluxo de trabalho sem saber quanto tempo de vida esse trabalho tem.',
    }
  }

  const queimaMensal = c.custoFixoMensal + c.parcelaEmprestimo
  const queimaDiaria = queimaMensal / 30
  const dias = queimaDiaria > 0 ? Math.floor(c.saldo / queimaDiaria) : 0
  const faturamentoDeEquilibrio = c.margemBruta > 0 ? queimaMensal / c.margemBruta : 0

  // Saldo zerado quase sempre quer dizer "ninguém digitou", não "acabou o
  // dinheiro". Alarme falso queima a credibilidade do alarme verdadeiro, entao
  // aqui o sistema admite que não sabe em vez de gritar.
  if (c.saldo <= 0) {
    return {
      configurado: true,
      queimaMensal,
      queimaDiaria,
      dias: 0,
      faturamentoDeEquilibrio,
      zona: 'cinza',
      frase: `Queima de ${queimaMensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })} por mês conhecida, saldo não. Sem o saldo de hoje não existe runway - e runway é o único número que reordena o dia inteiro.`,
    }
  }

  // Os cortes são de sobrevivência, não de conforto: 30 dias é um mês de folha
  // sem nada entrando; 90 dias é o ciclo de venda típico de um projeto grande.
  const zona = dias < 30 ? 'vermelho' : dias < 90 ? 'ambar' : 'verde'

  const frase =
    dias < 30
      ? `${dias} dias de caixa. Neste patamar não existe projeto estratégico: existe o que fatura rapido. Qualquer bloco profundo que não termine em dinheiro nos proximos 30 dias está no lugar errado.`
      : dias < 90
        ? `${dias} dias de caixa - menos que o ciclo de venda de um projeto grande. O funil precisa ter algo curto rodando em paralelo ao longo, ou o longo não chega a tempo.`
        : `${dias} dias de caixa. Da para trabalhar o funil longo sem decidir sob pressao - que e exatamente quando as decisões saem melhores.`

  return { configurado: true, queimaMensal, queimaDiaria, dias, faturamentoDeEquilibrio, zona, frase }
}

// ---------- a hora-fundador ----------

export type AuditoriaHoraFundador = {
  minutosBaixoTicket: number
  minutosAltoTicket: number
  minutosSemProjeto: number
  percentualBaixoTicket: number
  teto: number
  estourou: boolean
  frase: string
}

export function auditarHoraFundador(
  entradas: { minutos: number; valorDoProjeto: number | null }[],
  c: EstadoCaixa | null,
): AuditoriaHoraFundador {
  const limite = c?.limiteBaixoTicket ?? 100000
  const teto = Math.round((c?.tetoHoraBaixoTicket ?? 0.2) * 100)

  let baixo = 0
  let alto = 0
  let sem = 0
  for (const e of entradas) {
    if (e.valorDoProjeto == null) sem += e.minutos
    else if (e.valorDoProjeto < limite) baixo += e.minutos
    else alto += e.minutos
  }

  const comProjeto = baixo + alto
  const percentual = comProjeto > 0 ? Math.round((baixo / comProjeto) * 100) : 0
  const estourou = comProjeto > 0 && percentual > teto

  const frase = !comProjeto
    ? 'Nenhuma hora apontada em frente ligada a projeto - sem isso não da para auditar onde a sua hora foi parar.'
    : estourou
      ? `${percentual}% da sua hora foi para projeto de baixo ticket, contra um teto de ${teto}%. O custo disso não e o seu salario: e o negócio grande que não andou. Isso e trabalho de PJ com procedimento escrito, não de fundador.`
      : `${percentual}% da sua hora em baixo ticket, dentro do teto de ${teto}%. A hora está indo para onde o dinheiro está.`

  return {
    minutosBaixoTicket: Math.round(baixo),
    minutosAltoTicket: Math.round(alto),
    minutosSemProjeto: Math.round(sem),
    percentualBaixoTicket: percentual,
    teto,
    estourou,
    frase,
  }
}

export function reais(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}


// ---------- o que entra, e quando ----------
//
// A correção mais importante que este arquivo faz nos dois planos que chegaram
// pronto: nenhum deles olhava PRAZO DE RECEBIMENTO. Projeto de R$ 300k que paga
// 60 dias depois da entrega não resolve caixa em 90 dias - ele resolve caixa no
// ano que vem. Com runway curto, prazo de recebimento manda mais que valor.

export type ProjetoParaPrevisao = {
  nome: string
  valorEstimado: number | null
  probabilidade: number | null
  prazoRecebimentoDias: number | null
  propostaEnviadaEm: Date | null
}

export type Previsao = {
  entraEm90Dias: number
  entraEm90DiasPonderado: number
  semPrazo: number
  cobreMesesDeQueima: number
  frase: string
}

export function preverEntradas(
  projetos: ProjetoParaPrevisao[],
  queimaMensal: number,
  margemBruta: number,
): Previsao {
  let bruto = 0
  let ponderado = 0
  let semPrazo = 0

  for (const p of projetos) {
    const valor = p.valorEstimado ?? 0
    if (valor <= 0) continue
    if (p.prazoRecebimentoDias == null) {
      semPrazo += valor
      continue
    }
    if (p.prazoRecebimentoDias > 90) continue
    bruto += valor
    ponderado += valor * ((p.probabilidade ?? 50) / 100)
  }

  const caixaGerado = ponderado * margemBruta
  const cobre = queimaMensal > 0 ? caixaGerado / queimaMensal : 0

  const frase =
    semPrazo > 0
      ? `${reais(semPrazo)} em projetos sem prazo de recebimento informado. Sem essa data eles não entram na previsão - valor sem data não paga folha.`
      : bruto === 0
        ? 'Nenhum projeto com recebimento previsto para os próximos 90 dias. O funil pode estar cheio e o caixa vazio ao mesmo tempo.'
        : `Ponderado pela probabilidade e pela margem, o que entra em 90 dias cobre ${cobre.toFixed(1)} meses de queima.`

  return {
    entraEm90Dias: bruto,
    entraEm90DiasPonderado: ponderado,
    semPrazo,
    cobreMesesDeQueima: cobre,
    frase,
  }
}
