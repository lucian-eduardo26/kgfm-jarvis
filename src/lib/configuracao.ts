// Le os pesos do mostrador da tabela config, caindo no padrão quando não há
// nada gravado. Toda gravação carimba a data - se o mostrador mudar de cor,
// tem que dar para saber se foi o mundo ou se foi o peso.

import { prisma } from './prisma'
import { CONFIG_PADRAO, type ConfigMostrador } from './mostrador'

export type CampoConfig = {
  chave: keyof ConfigMostrador
  rotulo: string
  explicacao: string
  min: number
  max: number
  passo: number
}

export const CAMPOS: CampoConfig[] = [
  { chave: 'pesoMovimento', rotulo: 'Peso do movimento', explicacao: 'Quanto o ponteiro liga para frentes andando. Os três pesos precisam somar 100.', min: 0, max: 100, passo: 5 },
  { chave: 'pesoCriticos', rotulo: 'Peso dos críticos', explicacao: 'Quanto o ponteiro liga para o que já estourou o prazo.', min: 0, max: 100, passo: 5 },
  { chave: 'pesoAderencia', rotulo: 'Peso da aderência', explicacao: 'Quanto o ponteiro liga para o objetivo do mês. Com peso baixo, aderência sozinha nunca vira vermelho.', min: 0, max: 100, passo: 5 },
  { chave: 'descontoCritico', rotulo: 'Desconto por crítico', explicacao: 'Quantos pontos cada item crítico tira da área. Em 34, três críticos zeram.', min: 5, max: 100, passo: 1 },
  { chave: 'multiplicadorBloqueio', rotulo: 'Multiplicador de bloqueio', explicacao: 'Quanto pesa mais um crítico numa frente que trava outras.', min: 1, max: 5, passo: 1 },
  { chave: 'diasAguardandoTerceiro', rotulo: 'Dias esperando o outro', explicacao: 'Dias úteis sem retorno até virar crítico de cobranca. Antes disso a bola não e sua.', min: 1, max: 30, passo: 1 },
  { chave: 'diasCompromissoProximo', rotulo: 'Compromisso proximo', explicacao: 'Dias úteis de antecedencia para cobrar preparo de compromisso.', min: 0, max: 10, passo: 1 },
  { chave: 'minutosBloco', rotulo: 'Bloco de trabalho (min)', explicacao: 'Quanto dura um bloco antes do sistema sugerir pausa. Sugestão, nunca imposicao.', min: 10, max: 120, passo: 5 },
  { chave: 'minutosDescanso', rotulo: 'Descanso curto (min)', explicacao: 'A pausa entre blocos. Não conta como trabalho.', min: 1, max: 30, passo: 1 },
  { chave: 'minutosDescansoLongo', rotulo: 'Descanso longo (min)', explicacao: 'A pausa maior, depois de alguns blocos seguidos.', min: 5, max: 60, passo: 5 },
  { chave: 'blocosAteDescansoLongo', rotulo: 'Blocos até o descanso longo', explicacao: 'Quantos blocos seguidos antes da pausa maior.', min: 2, max: 8, passo: 1 },
  { chave: 'autoEncerrarHoras', rotulo: 'Auto-encerrar cronometro', explicacao: 'Horas até o cronômetro esquecido se encerrar sozinho e pedir revisão.', min: 1, max: 12, passo: 1 },
]

export async function lerConfig(): Promise<ConfigMostrador> {
  const linhas = await prisma.config.findMany()
  const cfg = { ...CONFIG_PADRAO }
  for (const l of linhas) {
    if (l.chave in cfg) {
      const n = Number(l.valor)
      if (Number.isFinite(n)) (cfg as Record<string, number>)[l.chave] = n
    }
  }
  return cfg
}

export async function gravarConfig(valores: Partial<Record<keyof ConfigMostrador, number>>) {
  for (const [chave, valor] of Object.entries(valores)) {
    if (valor == null || !Number.isFinite(valor)) continue
    await prisma.config.upsert({
      where: { chave },
      create: { chave, valor: String(valor) },
      update: { valor: String(valor) },
    })
  }
}

export async function voltarAoPadrao() {
  await prisma.config.deleteMany({ where: { chave: { in: CAMPOS.map((c) => c.chave) } } })
}
