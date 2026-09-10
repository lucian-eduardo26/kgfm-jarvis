-- CreateEnum
CREATE TYPE "TipoProjeto" AS ENUM ('peca', 'sistema');

-- AlterTable
ALTER TABLE "frentes" ADD COLUMN     "dias_estimados" INTEGER;

-- AlterTable
ALTER TABLE "projetos" ADD COLUMN     "inicio_em" TIMESTAMP(3),
ADD COLUMN     "materia_prima_nossa" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tem_revestimento" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tipo" "TipoProjeto" NOT NULL DEFAULT 'peca';
