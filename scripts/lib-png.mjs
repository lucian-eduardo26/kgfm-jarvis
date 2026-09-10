// Leitor e escritor de PNG em Node puro.
//
// Existe porque os arquivos oficiais da marca sao PNG de 3601x3601 com
// muita margem branca, e o projeto nao tem (nem precisa de) uma
// biblioteca de imagem. Le so o que os arquivos da KGFM usam: paleta de
// 8 bits sem entrelacamento. Escreve RGBA.
import { deflateSync, inflateSync } from "node:zlib";
import { readFileSync, writeFileSync } from "node:fs";

function crc32(buf) {
  const tabela = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabela[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = tabela[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/** Le um PNG de paleta e devolve {largura, altura, dados} em RGBA. */
export function lerPng(caminho) {
  const arquivo = readFileSync(caminho);
  let pos = 8;
  let largura = 0,
    altura = 0,
    profundidade = 0,
    tipo = 0;
  let paleta = null,
    transparencia = null;
  const pedacos = [];

  while (pos < arquivo.length) {
    const tamanho = arquivo.readUInt32BE(pos);
    const nome = arquivo.toString("ascii", pos + 4, pos + 8);
    const dados = arquivo.subarray(pos + 8, pos + 8 + tamanho);
    if (nome === "IHDR") {
      largura = dados.readUInt32BE(0);
      altura = dados.readUInt32BE(4);
      profundidade = dados[8];
      tipo = dados[9];
      if (dados[12] !== 0) throw new Error("PNG entrelacado nao suportado");
    } else if (nome === "PLTE") paleta = Buffer.from(dados);
    else if (nome === "tRNS") transparencia = Buffer.from(dados);
    else if (nome === "IDAT") pedacos.push(dados);
    else if (nome === "IEND") break;
    pos += 12 + tamanho;
  }

  if (tipo !== 3 || profundidade !== 8)
    throw new Error(`so leio PNG de paleta 8 bits (veio tipo ${tipo}/${profundidade})`);

  const cru = inflateSync(Buffer.concat(pedacos));
  const indices = Buffer.alloc(largura * altura);

  // desfaz os filtros linha a linha (1 byte por pixel, entao "anterior"
  // e o pixel imediatamente a esquerda)
  for (let y = 0; y < altura; y++) {
    const inicio = y * (largura + 1);
    const filtro = cru[inicio];
    for (let x = 0; x < largura; x++) {
      const bruto = cru[inicio + 1 + x];
      const a = x > 0 ? indices[y * largura + x - 1] : 0;
      const b = y > 0 ? indices[(y - 1) * largura + x] : 0;
      const c = x > 0 && y > 0 ? indices[(y - 1) * largura + x - 1] : 0;
      let valor;
      switch (filtro) {
        case 0: valor = bruto; break;
        case 1: valor = bruto + a; break;
        case 2: valor = bruto + b; break;
        case 3: valor = bruto + ((a + b) >> 1); break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
          valor = bruto + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
          break;
        }
        default: throw new Error("filtro desconhecido: " + filtro);
      }
      indices[y * largura + x] = valor & 0xff;
    }
  }

  const dados = Buffer.alloc(largura * altura * 4);
  for (let i = 0; i < largura * altura; i++) {
    const p = indices[i];
    dados[i * 4] = paleta[p * 3];
    dados[i * 4 + 1] = paleta[p * 3 + 1];
    dados[i * 4 + 2] = paleta[p * 3 + 2];
    dados[i * 4 + 3] = transparencia && p < transparencia.length ? transparencia[p] : 255;
  }

  return { largura, altura, dados };
}

/** Recorta a margem em volta do conteudo. `vazio(r,g,b,a)` diz o que e margem. */
export function aparar(img, vazio, folgaPct = 0) {
  let x0 = img.largura, y0 = img.altura, x1 = -1, y1 = -1;
  for (let y = 0; y < img.altura; y++) {
    for (let x = 0; x < img.largura; x++) {
      const i = (y * img.largura + x) * 4;
      if (vazio(img.dados[i], img.dados[i + 1], img.dados[i + 2], img.dados[i + 3])) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  if (x1 < 0) throw new Error("imagem vazia depois de aparar");

  const folga = Math.round(Math.max(x1 - x0, y1 - y0) * folgaPct);
  x0 = Math.max(0, x0 - folga);
  y0 = Math.max(0, y0 - folga);
  x1 = Math.min(img.largura - 1, x1 + folga);
  y1 = Math.min(img.altura - 1, y1 + folga);

  return recortar(img, x0, y0, x1 - x0 + 1, y1 - y0 + 1);
}

export function recortar(img, x0, y0, largura, altura) {
  const dados = Buffer.alloc(largura * altura * 4);
  for (let y = 0; y < altura; y++)
    img.dados.copy(
      dados,
      y * largura * 4,
      ((y0 + y) * img.largura + x0) * 4,
      ((y0 + y) * img.largura + x0 + largura) * 4
    );
  return { largura, altura, dados };
}

/** Reducao por media de area: e o que da borda limpa em logo vetorial. */
export function redimensionar(img, novaLargura, novaAltura) {
  const dados = Buffer.alloc(novaLargura * novaAltura * 4);
  const px = img.largura / novaLargura;
  const py = img.altura / novaAltura;

  for (let y = 0; y < novaAltura; y++) {
    const ya = Math.floor(y * py), yb = Math.max(ya + 1, Math.ceil((y + 1) * py));
    for (let x = 0; x < novaLargura; x++) {
      const xa = Math.floor(x * px), xb = Math.max(xa + 1, Math.ceil((x + 1) * px));
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let sy = ya; sy < Math.min(yb, img.altura); sy++) {
        for (let sx = xa; sx < Math.min(xb, img.largura); sx++) {
          const i = (sy * img.largura + sx) * 4;
          const alfa = img.dados[i + 3] / 255;
          // media com peso do alfa, senao a borda puxa a cor do vazio
          r += img.dados[i] * alfa;
          g += img.dados[i + 1] * alfa;
          b += img.dados[i + 2] * alfa;
          a += img.dados[i + 3];
          n++;
        }
      }
      const j = (y * novaLargura + x) * 4;
      const somaAlfa = a / 255;
      dados[j] = somaAlfa > 0 ? Math.round(r / somaAlfa) : 0;
      dados[j + 1] = somaAlfa > 0 ? Math.round(g / somaAlfa) : 0;
      dados[j + 2] = somaAlfa > 0 ? Math.round(b / somaAlfa) : 0;
      dados[j + 3] = Math.round(a / n);
    }
  }
  return { largura: novaLargura, altura: novaAltura, dados };
}

/** Troca toda cor visivel por uma so, preservando o alfa (silhueta). */
export function pintar(img, [r, g, b]) {
  const dados = Buffer.from(img.dados);
  for (let i = 0; i < dados.length; i += 4) {
    dados[i] = r;
    dados[i + 1] = g;
    dados[i + 2] = b;
  }
  return { ...img, dados };
}

/** Poe a imagem centralizada dentro de um quadrado de cor solida. */
export function sobreFundo(img, lado, [r, g, b], ocupacao = 1) {
  const dados = Buffer.alloc(lado * lado * 4);
  for (let i = 0; i < lado * lado; i++) {
    dados[i * 4] = r;
    dados[i * 4 + 1] = g;
    dados[i * 4 + 2] = b;
    dados[i * 4 + 3] = 255;
  }
  const alvo = Math.round(lado * ocupacao);
  const escala = Math.min(alvo / img.largura, alvo / img.altura);
  const menor = redimensionar(
    img,
    Math.max(1, Math.round(img.largura * escala)),
    Math.max(1, Math.round(img.altura * escala))
  );
  const dx = Math.round((lado - menor.largura) / 2);
  const dy = Math.round((lado - menor.altura) / 2);

  for (let y = 0; y < menor.altura; y++) {
    for (let x = 0; x < menor.largura; x++) {
      const i = (y * menor.largura + x) * 4;
      const alfa = menor.dados[i + 3] / 255;
      if (alfa === 0) continue;
      const j = ((dy + y) * lado + dx + x) * 4;
      for (let c = 0; c < 3; c++)
        dados[j + c] = Math.round(menor.dados[i + c] * alfa + dados[j + c] * (1 - alfa));
    }
  }
  return { largura: lado, altura: lado, dados };
}

export function gravarPng(caminho, img) {
  const bloco = (tipo, dados) => {
    const t = Buffer.from(tipo, "ascii");
    const tam = Buffer.alloc(4);
    tam.writeUInt32BE(dados.length);
    const corpo = Buffer.concat([t, dados]);
    const soma = Buffer.alloc(4);
    soma.writeUInt32BE(crc32(corpo));
    return Buffer.concat([tam, corpo, soma]);
  };

  const linha = img.largura * 4 + 1;
  const cru = Buffer.alloc(img.altura * linha);
  for (let y = 0; y < img.altura; y++) {
    cru[y * linha] = 0;
    img.dados.copy(cru, y * linha + 1, y * img.largura * 4, (y + 1) * img.largura * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(img.largura, 0);
  ihdr.writeUInt32BE(img.altura, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA

  writeFileSync(
    caminho,
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      bloco("IHDR", ihdr),
      bloco("IDAT", deflateSync(cru, { level: 9 })),
      bloco("IEND", Buffer.alloc(0)),
    ])
  );
}
