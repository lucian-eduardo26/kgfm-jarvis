-- AlterTable
ALTER TABLE "apontamentos" ADD COLUMN     "bloco_desde" TIMESTAMP(3),
ADD COLUMN     "blocos_feitos" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "descansos" (
    "id" SERIAL NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fim" TIMESTAMP(3),
    "minutos" INTEGER NOT NULL,
    "tarefa_id" INTEGER,

    CONSTRAINT "descansos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "descansos_inicio_idx" ON "descansos"("inicio");
