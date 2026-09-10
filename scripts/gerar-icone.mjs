// Gera os icones do Jarvis para a tela inicial do celular.
//
// Por que desenhado por codigo e nao recortado da marca: o icone do CRM ja e o
// ladrilho da KGFM, e dois aplicativos com o MESMO icone na tela inicial e um
// jeito garantido de abrir o errado com pressa. O Jarvis usa a mesma familia -
// preto e o laranja #FF3D00 - com a marca propria que ja esta no cabecalho do
// sistema: um anel com um ponto no centro.
//
// Sem dependencia externa: desenha em 4x e reduz, o que da a suavizacao de
// borda de graca. Escreve PNG com scripts/lib-png.mjs, o mesmo do CRM.
//
//   node scripts/gerar-icone.mjs
//
// Rodar de novo so se a marca mudar.

import { mkdirSync } from 'node:fs'
import { gravarPng, redimensionar } from './lib-png.mjs'

const FUNDO = [10, 10, 11] // #0a0a0b, o mesmo fundo do sistema
const LARANJA = [255, 61, 0] // #ff3d00, o laranja oficial da KGFM
const ESCALA = 4 // desenha grande e reduz: e daqui que vem a borda lisa

/**
 * Desenha o simbolo num quadrado de `lado`.
 * `ocupacao` encolhe o desenho dentro do quadrado - o icone "maskable" do
 * Android pode ser cortado em circulo pelo sistema, entao o simbolo precisa
 * caber com folga na zona segura.
 */
function desenhar(lado, ocupacao = 1) {
  const n = lado * ESCALA
  const dados = Buffer.alloc(n * n * 4)

  const c = n / 2
  const raioAnel = n * 0.34 * ocupacao
  const espessura = n * 0.075 * ocupacao
  const raioPonto = n * 0.125 * ocupacao

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const i = (y * n + x) * 4
      const dx = x + 0.5 - c
      const dy = y + 0.5 - c
      const d = Math.sqrt(dx * dx + dy * dy)

      const noAnel = Math.abs(d - raioAnel) <= espessura / 2
      const noPonto = d <= raioPonto
      const cor = noAnel || noPonto ? LARANJA : FUNDO

      dados[i] = cor[0]
      dados[i + 1] = cor[1]
      dados[i + 2] = cor[2]
      dados[i + 3] = 255
    }
  }

  return redimensionar({ largura: n, altura: n, dados }, lado, lado)
}

mkdirSync('public', { recursive: true })

const arquivos = [
  // Android e o manifesto
  ['public/icone-192.png', 192, 1],
  ['public/icone-512.png', 512, 1],
  // Maskable: o Android pode cortar em circulo, entao o simbolo entra menor
  ['public/icone-maskable-512.png', 512, 0.72],
  // iPhone: precisa de PNG opaco, sem transparencia e sem cantos - o iOS
  // arredonda sozinho
  ['public/apple-touch-icon.png', 180, 1],
  // Aba do navegador
  ['public/icone-32.png', 32, 1],
]

for (const [caminho, lado, ocupacao] of arquivos) {
  gravarPng(caminho, desenhar(lado, ocupacao))
  console.log('gerado', caminho, `${lado}x${lado}`)
}

console.log('')
console.log('Marca: anel laranja #FF3D00 com ponto ao centro, sobre #0a0a0b.')
console.log('Diferente do icone do CRM de proposito - dois iguais na tela inicial')
console.log('e o jeito garantido de abrir o errado com pressa.')
