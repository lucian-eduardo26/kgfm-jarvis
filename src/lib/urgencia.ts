// OS SINALIZADORES DE URGÊNCIA.
//
// O Lucian em 11/09/2026: "eu quero que você monte um sistema que me alerta:
// tal coisa está vencendo, isso tem que ser feito hoje até tal hora, pra que a
// gente consiga dentro do horário comercial e cumpra o prazo da nota fiscal.
// Afinal o caixa é quem manda nessa prioridade."
//
// O QUE ESTE MÓDULO FAZ QUE O CRONOGRAMA NÃO FAZIA: ele calcula DE TRÁS PARA
// A FRENTE, a partir da data de corte do cliente, e não para a frente a partir
// do início do projeto.
//
// A diferença é a diferença entre saber que está atrasado e saber o que fazer
// hoje. O cronograma diz "entrega dia 23". Este módulo diz "o corte é dia 14,
// então o plano perde a janela por 9 dias, e o dinheiro sai de 15 de outubro
// para 25 de outubro".
//
// A REGRA QUE DECIDE O NÍVEL: não é o tamanho do atraso, é o que ele CUSTA.
// Um pacote atrasado que não atravessa nenhuma data de corte é aborrecimento.
// Um dia perdido em cima do corte são dez dias de caixa.

import { carteiraDeProjetos } from './projetos'
import { regraDoCliente, melhorJanela, dataLonga } from './recebimento'
import { diaSP, diasUteisEntre } from './datas'

export type NivelDeUrgencia = 'estourou' | 'hoje' | 'aperta' | 'folgado'

export type Alerta = {
  projetoId: number
  projeto: string
  cliente: string
  nivel: NivelDeUrgencia
  /** A frase curta, do jeito que ele fala. */
  titulo: string
  /** O porquê, com os números. */
  porque: string
  /** O que fazer, e até quando. */
  acao: string
  corte: Date
  diasAteOCorte: number
  /** Quantos dias o plano atual passa do corte. Zero quer dizer que cabe. */
  diasDeEstouro: number
  custoEmDias: number
}

const ORDEM: Record<NivelDeUrgencia, number> = { estourou: 0, hoje: 1, aperta: 2, folgado: 3 }

// O TIPO DA NOTA NÃO DECIDE MAIS NADA AQUI.
//
// A escolha da janela passou para `melhorJanela`, em recebimento.ts, e a razão
// é do Lucian: "o corte de material é dia 20, mas se eu enviar dia 19 vou
// receber dia 25. Estou jogando pra frente à toa."
//
// A data de corte não é uma regra a cumprir - é uma porta, e há mais de uma
// porta aberta. A pergunta certa é qual delas põe o dinheiro na conta mais
// cedo, e não qual delas casa com o tipo da nota.

export async function alertasDeCaixa(agora: Date = new Date()): Promise<Alerta[]> {
  const carteira = await carteiraDeProjetos()
  const hoje = diaSP(agora)
  const alertas: Alerta[] = []

  for (const p of carteira) {
    const regra = regraDoCliente(p.cliente)
    // Sem regra de recebimento não há corte, e sem corte não há urgência de
    // caixa - só prazo de projeto, que o cronograma já cobra.
    if (!regra) continue
    // Projeto que ainda não foi vendido não tem nota para emitir.
    if (p.fase === 'desenvolvimento') continue

    const janela = melhorJanela(regra, hoje)
    const entrega = p.cronograma.entregaPrevista

    // Quantos dias o plano passa do corte. Sem cronograma, assume que cabe -
    // melhor calar do que gritar sobre um projeto que ninguém planejou ainda.
    const diasDeEstouro = entrega
      ? Math.max(0, Math.round((diaSP(entrega).getTime() - janela.corte.getTime()) / 86400000))
      : 0

    // DIA CORRIDO MENTE QUANDO TEM FIM DE SEMANA NO MEIO, e foi ele quem
    // apontou: "sexta 11, aí 12 e 13 sábado e domingo, 14 é segunda". Quatro
    // dias corridos até o corte parecem folga; na verdade é UM dia de trabalho
    // mais a manhã de segunda. Contar corrido aqui produziria um verde
    // tranquilizador em cima de um prazo que não cabe.
    const uteis = diasUteisEntre(hoje, janela.corte)

    let nivel: NivelDeUrgencia
    if (janela.diasAteOCorte < 0) nivel = 'estourou'
    else if (diasDeEstouro > 0) nivel = uteis <= 1 ? 'estourou' : 'hoje'
    else if (uteis <= 1) nivel = 'hoje'
    else if (uteis <= 3) nivel = 'aperta'
    else nivel = 'folgado'

    const titulo =
      nivel === 'estourou'
        ? `${p.nome} perdeu a janela`
        : nivel === 'hoje'
          ? `${p.nome} não fatura no dia ${janela.corte.getDate() + 1}`
          : nivel === 'aperta'
            ? `${p.nome}: ${uteis} dias úteis até o corte`
            : `${p.nome} cabe na janela`

    const porque =
      diasDeEstouro > 0
        ? `O plano entrega ${entrega ? dataLonga(entrega) : 'sem data'} e o corte é ${dataLonga(janela.corte)}. ` +
          `São ${diasDeEstouro} dias a mais do que cabe.`
        : `A nota precisa sair até ${dataLonga(janela.corte)} para o dinheiro entrar ${dataLonga(janela.pagamento)}.`

    const acao =
      diasDeEstouro > 0
        ? `Comprimir ${diasDeEstouro} dias da corrente, ou faturar parcial. Perder o corte joga o dinheiro de ${dataLonga(janela.pagamento)} para ${dataLonga(janela.pagamentoSePerder)}: ${janela.custoEmDiasDeAtraso} dias a mais sem esse caixa.`
        : `Faltam ${uteis} ${uteis === 1 ? 'dia útil' : 'dias úteis'} até o corte, e ${janela.diasAteOCorte} dias de calendário. Perder custa ${janela.custoEmDiasDeAtraso} dias de caixa.`

    alertas.push({
      projetoId: p.id,
      projeto: p.nome,
      cliente: p.cliente ?? '',
      nivel,
      titulo,
      porque,
      acao,
      corte: janela.corte,
      diasAteOCorte: janela.diasAteOCorte,
      diasDeEstouro,
      custoEmDias: janela.custoEmDiasDeAtraso,
    })
  }

  return alertas.sort((a, b) => ORDEM[a.nivel] - ORDEM[b.nivel] || a.diasAteOCorte - b.diasAteOCorte)
}

export const COR_DO_NIVEL: Record<NivelDeUrgencia, string> = {
  estourou: 'var(--vermelho)',
  hoje: 'var(--vermelho)',
  aperta: 'var(--ambar)',
  folgado: 'var(--verde)',
}
