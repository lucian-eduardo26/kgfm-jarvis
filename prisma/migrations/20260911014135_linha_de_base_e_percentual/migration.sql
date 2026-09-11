-- AlterTable
ALTER TABLE "frentes" ADD COLUMN     "base_fim_em" TIMESTAMP(3),
ADD COLUMN     "base_inicio_em" TIMESTAMP(3),
ADD COLUMN     "percentual" INTEGER NOT NULL DEFAULT 0;
