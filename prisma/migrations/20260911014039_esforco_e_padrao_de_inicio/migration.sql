-- AlterTable
ALTER TABLE "frentes" ADD COLUMN     "dias_para_iniciar" INTEGER,
ADD COLUMN     "minutos_estimados" INTEGER,
ADD COLUMN     "real_fim_em" TIMESTAMP(3),
ADD COLUMN     "real_inicio_em" TIMESTAMP(3);
