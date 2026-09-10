// Prova a calibragem de docs/mostrador.md. Roda sem banco.
// npm run teste

import { calcularArea, notaMovimento, pontuacaoCriticos, CONFIG_PADRAO } from '../src/lib/mostrador'
import type { FrenteParaCalculo } from '../src/lib/mostrador'
import { diasUteisEntre, diasUteisDoMes } from '../src/lib/datas'

let falhas = 0
function conferir(nome: string, obtido: unknown, esperado: unknown) {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado)
  if (!ok) falhas++
  console.log(`${ok ? 'ok  ' : 'FALHOU'} ${nome} -> ${JSON.stringify(obtido)}${ok ? '' : ` (esperava ${JSON.stringify(esperado)})`}`)
}

// Ancora fixa: quarta-feira, 10/09/2026, meio-dia em Sao Paulo.
const AGORA = new Date('2026-09-10T15:00:00Z')

function diasUteisAtras(n: number): Date {
  const d = new Date(AGORA)
  let contados = 0
  while (contados < n) {
    d.setUTCDate(d.getUTCDate() - 1)
    const s = d.getUTCDay()
    if (s !== 0 && s !== 6) contados++
  }
  return d
}

console.log('--- datas ---')
conferir('diasUteisEntre 0', diasUteisEntre(AGORA, AGORA), 0)
conferir('diasUteisEntre 5', diasUteisEntre(diasUteisAtras(5), AGORA), 5)
conferir('setembro/2026 tem 22 dias uteis', diasUteisDoMes(AGORA).total, 22)

console.log('\n--- nota de movimento ---')
conferir('parada 0 dias', notaMovimento(0), 1)
conferir('parada 3 dias', notaMovimento(3), 1)
conferir('parada 5 dias', notaMovimento(5), 0.6)
conferir('parada 12 dias', notaMovimento(12), 0.3)
conferir('parada 20 dias', notaMovimento(20), 0)

console.log('\n--- desconto por critico ---')
const umCritico = [{ frenteId: 1, titulo: 'x', motivo: 'parada' as const, dias: 4, bloqueia: 0, texto: '' }]
conferir('1 critico', pontuacaoCriticos(umCritico), 66)
conferir('3 críticos zeram', pontuacaoCriticos([...umCritico, ...umCritico, ...umCritico]), 0)
conferir('crítico que bloqueia desconta o dobro', pontuacaoCriticos([{ ...umCritico[0], bloqueia: 1 }]), 32)

console.log('\n--- calibragem do comercial em 10/09/2026 ---')
const frente = (id: number, titulo: string, paradaHa: number): FrenteParaCalculo => ({
  id,
  titulo,
  ultimoMovimentoEm: diasUteisAtras(paradaHa),
  aguardandoQuem: 'eu',
  aguardandoDesde: null,
  bloqueiaQuantas: 0,
  proximoCompromissoEm: null,
})

const comercial = calcularArea(
  {
    areaId: 1,
    chave: 'comercial',
    nome: 'Comercial',
    diasParaCritico: 3,
    frentes: [frente(1, 'Cotacao Shopee', 12), frente(2, 'Projeto Riachuelo', 5)],
    objetivoDoMes: null,
  },
  CONFIG_PADRAO,
  AGORA,
)
conferir('movimento', comercial.movimento, 45)
conferir('criticos abertos', comercial.criticos.length, 2)
conferir('pontos de críticos', comercial.criticosPontos, 32)
conferir('indice', comercial.indice, 39)
conferir('zona', comercial.zona, 'vermelho')
console.log('   legenda:', comercial.legenda)

console.log('\n--- area sem frente ---')
const semFrenteComObjetivo = calcularArea(
  { areaId: 2, chave: 'entregas', nome: 'Entregas', diasParaCritico: 5, frentes: [], objetivoDoMes: { alvo: 10, realizado: 5 } },
  CONFIG_PADRAO,
  AGORA,
)
conferir('sem frente mas com objetivo e vermelho', semFrenteComObjetivo.zona, 'vermelho')
const semFrenteSemObjetivo = calcularArea(
  { areaId: 3, chave: 'entregas', nome: 'Entregas', diasParaCritico: 5, frentes: [], objetivoDoMes: null },
  CONFIG_PADRAO,
  AGORA,
)
conferir('sem frente e sem objetivo e cinza', semFrenteSemObjetivo.zona, 'cinza')

console.log('\n--- a bola esta com o cliente ---')
const esperando = calcularArea(
  {
    areaId: 4,
    chave: 'comercial',
    nome: 'Comercial',
    diasParaCritico: 3,
    frentes: [
      {
        ...frente(9, 'Proposta enviada', 8),
        aguardandoQuem: 'cliente',
        aguardandoDesde: diasUteisAtras(2),
      },
    ],
    objetivoDoMes: null,
  },
  CONFIG_PADRAO,
  AGORA,
)
conferir('esperando cliente há 2 dias não e crítico', esperando.criticos.length, 0)
const cobrar = calcularArea(
  {
    areaId: 5,
    chave: 'comercial',
    nome: 'Comercial',
    diasParaCritico: 3,
    frentes: [
      {
        ...frente(10, 'Proposta enviada', 8),
        aguardandoQuem: 'cliente',
        aguardandoDesde: diasUteisAtras(6),
      },
    ],
    objetivoDoMes: null,
  },
  CONFIG_PADRAO,
  AGORA,
)
conferir('esperando há 6 dias vira crítico de cobranca', cobrar.criticos[0]?.motivo, 'cobrar')

console.log('\n--- tudo em dia ---')
const saudavel = calcularArea(
  {
    areaId: 6,
    chave: 'engenharia',
    nome: 'Engenharia',
    diasParaCritico: 7,
    frentes: [frente(11, 'A', 0), frente(12, 'B', 1)],
    objetivoDoMes: { alvo: 22, realizado: 22 },
  },
  CONFIG_PADRAO,
  AGORA,
)
conferir('área saudavel e verde', saudavel.zona, 'verde')

console.log(falhas === 0 ? '\nTUDO PASSOU' : `\n${falhas} FALHA(S)`)
process.exit(falhas === 0 ? 0 : 1)
