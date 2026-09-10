-- CreateTable
CREATE TABLE "compromissos" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fim" TIMESTAMP(3) NOT NULL,
    "local" TEXT,
    "frente_id" INTEGER,
    "projeto_id" INTEGER,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compromissos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "compromissos_inicio_idx" ON "compromissos"("inicio");
