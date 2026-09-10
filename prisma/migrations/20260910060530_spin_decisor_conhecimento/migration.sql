-- AlterTable
ALTER TABLE "projetos" ADD COLUMN     "implicacao" TEXT,
ADD COLUMN     "necessidade" TEXT,
ADD COLUMN     "problema" TEXT,
ADD COLUMN     "proposta_enviada_em" TIMESTAMP(3),
ADD COLUMN     "situacao" TEXT;

-- CreateTable
CREATE TABLE "decisores" (
    "id" SERIAL NOT NULL,
    "projeto_id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "cargo" TEXT,
    "o_que_doi_para_ele" TEXT,
    "interesses" TEXT,
    "historico" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decisores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conhecimento" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "tags" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conhecimento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "decisores_projeto_id_idx" ON "decisores"("projeto_id");

-- CreateIndex
CREATE INDEX "conhecimento_categoria_idx" ON "conhecimento"("categoria");

-- AddForeignKey
ALTER TABLE "decisores" ADD CONSTRAINT "decisores_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projetos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
