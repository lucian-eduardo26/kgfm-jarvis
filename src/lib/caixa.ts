// RUNWAY - quantos dias de vida o caixa tem.
//
// Entrou em 10/09/2026, quando apareceu o dado que faltava: custo fixo mensal e
// emprestimo de curto prazo. Com isso, a hierarquia do sistema muda.
//
// Ate aqui o Jarvis respondia "o que eu faco agora" olhando fluxo de trabalho.
// Fluxo de trabalho e a pergunta certa QUANDO EXISTE CAIXA. Com runway curto, a
// pergunta certa e outra: o que entra dinheiro mais rapido. Um mostrador verde
// numa empresa com 40 dias de caixa e um instrumento medindo a coisa errada com
// muita precisao.
//
// Por isso o runway fica ACIMA do painel, e nao dentro dele.
//
// Duas contas, e nenhuma delas e opiniao:
//   queima mensal      = custo fixo + parcela do emprestimo
//   runway em dias     = saldo / (queima / 30)
//   faturamento minimo = queima / margem bruta   (o ponto de equilibrio)
//
// E uma auditoria: a HORA-FUNDADOR. Hora dele em projeto de baixo ticket e a
// despesa mais cara da empresa, porque o custo nao e o salario dele - e o
// negocio grande que nao andou naquele dia.

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
      frase: 'Caixa nao configurado. Enquanto o custo fixo nao entrar, o sistema mede fluxo de trabalho sem saber quanto tempo de vida esse trabalho tem.',
    }
  }

  const queimaMensal = c.custoFixoMensal + c.parcelaEmprestimo
  const queimaDiaria = queimaMensal / 30
  const dias = queimaDiaria > 0 ? Math.floor(c.saldo / queimaDiaria) : 0
  const faturamentoDeEquilibrio = c.margemBruta > 0 ? queimaMensal / c.margemBruta : 0

  // Saldo zerado quase sempre quer dizer "ninguem digitou", nao "acabou o
  // dinheiro". Alarme falso queima a credibilidade do alarme verdadeiro, entao
  // aqui o sistema admite que nao sabe em vez de gritar.
  if (c.saldo <= 0) {
    return {
      configurado: true,
      queimaMensal,
      queimaDiaria,
      dias: 0,
      faturamentoDeEquilibrio,
      zona: 'cinza',
      frase: `Queima de ${queimaMensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })} por mes conhecida, saldo nao. Sem o saldo de hoje nao existe runway - e runway e o unico numero que reordena o dia inteiro.`,
    }
  }

  // Os cortes sao de sobrevivencia, nao de conforto: 30 dias e um mes de folha
  // sem nada entrando; 90 dias e o ciclo de venda tipico de um projeto grande.
  const zona = dias < 30 ? 'vermelho' : dias < 90 ? 'ambar' : 'verde'

  const frase =
    dias < 30
      ? `${dias} dias de caixa. Neste patamar nao existe projeto estrategico: existe o que fatura rapido. Qualquer bloco profundo que nao termine em dinheiro nos proximos 30 dias esta no lugar errado.`
      : dias < 90
        ? `${dias} dias de caixa - menos que o ciclo de venda de um projeto grande. O funil precisa ter algo curto rodando em paralelo ao longo, ou o longo nao chega a tempo.`
        : `${dias} dias de caixa. Da para trabalhar o funil longo sem decidir sob pressao - que e exatamente quando as decisoes saem melhores.`

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
    ? 'Nenhuma hora apontada em frente ligada a projeto - sem isso nao da para auditar onde a sua hora foi parar.'
    : estourou
      ? `${percentual}% da sua hora foi para projeto de baixo ticket, contra um teto de ${teto}%. O custo disso nao e o seu salario: e o negocio grande que nao andou. Isso e trabalho de PJ com procedimento escrito, nao de fundador.`
      : `${percentual}% da sua hora em baixo ticket, dentro do teto de ${teto}%. A hora esta indo para onde o dinheiro esta.`

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
