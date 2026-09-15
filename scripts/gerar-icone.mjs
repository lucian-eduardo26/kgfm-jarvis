// Gera os icones do Jarvis.
//
// POR QUE ESTE DESENHO MUDOU (15/09/2026)
//
// A versao anterior era um anel laranja vazado sobre fundo preto. Numa tela
// grande parecia bem; na BARRA DE TAREFAS do Windows, que ja e preta, o fundo
// sumia e sobrava um anel laranja flutuando - lido como botao de gravar, nao
// como aplicativo. O Lucian mandou a foto: ao lado do ladrilho solido do CRM,
// o Jarvis parecia um defeito.
//
// A licao: icone de barra escura precisa de CAMPO SOLIDO E CLARO. O que da
// silhueta e o ladrilho preenchido, nao o simbolo desenhado dentro dele.
//
// A FAMILIA, e como os dois nao se confundem:
//   CRM     ladrilho LARANJA  + simbolo KGFM em azul-aco
//   Jarvis  ladrilho AZUL-ACO + cronometro em escuro
//
// Mesmo recorte de ladrilho (os dois cantos chanfrados da KGFM), mesmas tres
// cores oficiais, campos trocados. A 24 pixels da barra de tarefas a diferenca
// e a COR DO QUADRADO, que se le antes de qualquer desenho - e nao dois
// quadrados laranjas iguais que so se distinguem de perto.
//
// E ha uma razao de marca para o Jarvis nao ser laranja: nos dois sistemas o
// laranja significa ATRASO, nunca enfeite. Um icone inteiro de laranja seria
// justamente o enfeite que a regra proibe.
//
// Sem dependencia externa: desenha em 4x e reduz, o que da a suavizacao de
// borda de graca. Escreve PNG com scripts/lib-png.mjs, o mesmo do CRM.
//
//   node scripts/gerar-icone.mjs
//
// Rodar de novo so se a marca mudar.

import { mkdirSync } from 'node:fs'
import { gravarPng, redimensionar } from './lib-png.mjs'

// As tres cores saem do icone oficial do CRM, amostradas pixel a pixel - nao
// sao aproximacao de olho.
const FUNDO = [0x0b, 0x0b, 0x0c] // #0b0b0c, o preto da marca
const ACO = [0x74, 0xb6, 0xc4] // #74b6c4, o azul do simbolo KGFM
const ESCALA = 4 // desenha grande e reduz: e daqui que vem a borda lisa

/** Distancia de um ponto ao segmento (ax,ay)-(bx,by). */
function distanciaDoSegmento(px, py, ax, ay, bx, by) {
  const vx = bx - ax
  const vy = by - ay
  const wx = px - ax
  const wy = py - ay
  const comprimento = vx * vx + vy * vy
  const t = comprimento === 0 ? 0 : Math.max(0, Math.min(1, (wx * vx + wy * vy) / comprimento))
  const dx = px - (ax + t * vx)
  const dy = py - (ay + t * vy)
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Desenha o icone num quadrado de `lado`.
 * `ocupacao` encolhe tudo dentro do quadrado - o icone "maskable" do Android
 * pode ser cortado em circulo pelo sistema, entao o ladrilho precisa caber com
 * folga na zona segura.
 */
function desenhar(lado, ocupacao = 1) {
  const n = lado * ESCALA
  const dados = Buffer.alloc(n * n * 4)

  // O LADRILHO. Margem pequena para o quadrado nao encostar na borda, e os
  // dois chanfros em diagonal - canto superior esquerdo e inferior direito -
  // que sao a assinatura do ladrilho KGFM e ja estao no icone do CRM.
  const margem = (n * (1 - 0.92 * ocupacao)) / 2
  const x0 = margem
  const y0 = margem
  const x1 = n - margem
  const y1 = n - margem
  const chanfro = (x1 - x0) * 0.17

  // O CRONOMETRO, centrado no ladrilho e deslocado um fio para baixo, para a
  // coroa do topo caber sem espremer o anel.
  const cx = n / 2
  const cy = n / 2 + (x1 - x0) * 0.025
  const raio = (x1 - x0) * 0.285
  const espessura = (x1 - x0) * 0.082

  // O PONTEIRO aponta para cerca de uma hora. Reto para cima viraria simbolo
  // de "ligar"; na diagonal le-se cronometro correndo.
  // A ponta para ANTES do anel: encostada, os dois viram uma mancha so nos
  // 24 pixels da barra de tarefas, e o cronometro perde o ponteiro.
  const angulo = 0.72
  const alcance = raio - espessura * 1.35
  const pontaX = cx + Math.sin(angulo) * alcance
  const pontaY = cy - Math.cos(angulo) * alcance
  const grossuraPonteiro = espessura * 0.72

  // A COROA em cima: e ela que faz o desenho virar cronometro, e nao relogio
  // de parede nem alvo de tiro.
  const coroaMeiaLargura = (x1 - x0) * 0.052
  const coroaTopo = cy - raio - espessura / 2 - (x1 - x0) * 0.055
  const coroaBase = cy - raio + espessura * 0.1

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const i = (y * n + x) * 4
      const px = x + 0.5
      const py = y + 0.5

      const noQuadrado = px >= x0 && px <= x1 && py >= y0 && py <= y1
      const foraDoChanfro =
        px - x0 + (py - y0) > chanfro && x1 - px + (y1 - py) > chanfro
      const noLadrilho = noQuadrado && foraDoChanfro

      let cor = noLadrilho ? ACO : FUNDO

      if (noLadrilho) {
        const d = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2)
        const noAnel = Math.abs(d - raio) <= espessura / 2
        const noPonteiro =
          distanciaDoSegmento(px, py, cx, cy, pontaX, pontaY) <= grossuraPonteiro / 2
        const naCoroa =
          Math.abs(px - cx) <= coroaMeiaLargura && py >= coroaTopo && py <= coroaBase

        if (noAnel || noPonteiro || naCoroa) cor = FUNDO
      }

      dados[i] = cor[0]
      dados[i + 1] = cor[1]
      dados[i + 2] = cor[2]
      dados[i + 3] = 255
    }
  }

  return redimensionar({ largura: n, altura: n, dados }, lado, lado)
}

mkdirSync('public', { recursive: true })

// NOMES NOVOS, e nao os antigos sobrescritos. O Windows e o iOS guardam o
// icone do aplicativo instalado com afinco: trocar o conteudo do mesmo arquivo
// costuma deixar o icone velho na barra por dias. O CRM ja passou por isso e
// resolveu do mesmo jeito, com o sufixo -v2.
const arquivos = [
  // Android e o manifesto
  ['public/icone-192-v2.png', 192, 1],
  ['public/icone-512-v2.png', 512, 1],
  // Maskable: o Android pode cortar em circulo, entao o ladrilho entra menor
  ['public/icone-maskable-512-v2.png', 512, 0.78],
  // iPhone: PNG opaco, sem transparencia e sem cantos - o iOS arredonda sozinho
  ['public/apple-touch-icon-v2.png', 180, 1],
  // Aba do navegador
  ['public/icone-32-v2.png', 32, 1],
]

for (const [caminho, lado, ocupacao] of arquivos) {
  gravarPng(caminho, desenhar(lado, ocupacao))
  console.log('gerado', caminho, `${lado}x${lado}`)
}

console.log('')
console.log('Ladrilho azul-aco #74b6c4 com cronometro escuro, sobre #0b0b0c.')
console.log('Par com o CRM: la o ladrilho e laranja e o simbolo e azul-aco.')
console.log('Na barra de tarefas os dois se separam pela cor do quadrado.')
