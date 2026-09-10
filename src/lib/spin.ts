// A trava do SPIN.
//
// Regra: proposta so sai depois que o cliente ADMITIU o custo do problema
// (Implicacao) e disse o que precisa (Necessidade). Sem isso, mandar proposta e
// pedir desconto - o cliente ainda nao tem motivo para pagar caro.
//
// Como toda trava deste sistema, ela avisa e oferece o botao de liberar ao
// lado, na mesma tela. Nao existe bloqueio que o Lucian nao consiga passar por
// cima; existe bloqueio que ele nao consegue passar por cima SEM PERCEBER.

export type EstadoSpin = {
  situacao: string | null
  problema: string | null
  implicacao: string | null
  necessidade: string | null
}

export type DegrauSpin = {
  letra: 'S' | 'P' | 'I' | 'N'
  nome: string
  campo: keyof EstadoSpin
  pergunta: string
  preenchido: boolean
}

export function degraus(e: EstadoSpin): DegrauSpin[] {
  return [
    {
      letra: 'S',
      nome: 'Situacao',
      campo: 'situacao',
      pergunta: 'Como e a operacao hoje? Volume, equipamento, turno, layout.',
      preenchido: Boolean(e.situacao?.trim()),
    },
    {
      letra: 'P',
      nome: 'Problema',
      campo: 'problema',
      pergunta: 'O que nao funciona? Onde para, onde erra, onde falta gente.',
      preenchido: Boolean(e.problema?.trim()),
    },
    {
      letra: 'I',
      nome: 'Implicacao',
      campo: 'implicacao',
      pergunta: 'Quanto isso CUSTA para ele? Em horas, em retrabalho, em pedido perdido, em dinheiro. Com as palavras dele.',
      preenchido: Boolean(e.implicacao?.trim()),
    },
    {
      letra: 'N',
      nome: 'Necessidade',
      campo: 'necessidade',
      pergunta: 'O que ELE disse que precisa? Se quem descreveu a solucao foi voce, este campo esta vazio.',
      preenchido: Boolean(e.necessidade?.trim()),
    },
  ]
}

export type Veredito = {
  liberado: boolean
  faltam: string[]
  aviso: string
}

export function podeMandarProposta(e: EstadoSpin): Veredito {
  const faltam: string[] = []
  if (!e.implicacao?.trim()) faltam.push('Implicacao')
  if (!e.necessidade?.trim()) faltam.push('Necessidade')

  if (faltam.length === 0) {
    return {
      liberado: true,
      faltam,
      aviso: 'O cliente admitiu o custo do problema e disse o que precisa. A proposta tem onde se apoiar.',
    }
  }

  const so = faltam.length === 1
  return {
    liberado: false,
    faltam,
    aviso:
      faltam.includes('Implicacao') && faltam.includes('Necessidade')
        ? 'O cliente ainda nao admitiu o que o problema custa, nem disse o que precisa. Mandar proposta agora e disputar preco - volte e faca a ligacao de qualificacao.'
        : so && faltam[0] === 'Implicacao'
          ? 'Falta o custo do problema com as palavras dele. Sem numero de dor, o seu numero vira caro por definicao.'
          : 'Falta a necessidade dita por ele. Se quem desenhou a solucao foi voce, a proposta vira palpite caro.',
  }
}

/** Quanto do SPIN esta de pe, de 0 a 100 - para a barra na tela. */
export function completude(e: EstadoSpin): number {
  const d = degraus(e)
  return Math.round((d.filter((x) => x.preenchido).length / d.length) * 100)
}
