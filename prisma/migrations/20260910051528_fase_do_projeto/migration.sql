-- CreateEnum
CREATE TYPE "FaseProjeto" AS ENUM ('desenvolvimento', 'fechado', 'entregue');

-- AlterTable
ALTER TABLE "projetos" ADD COLUMN     "fase" "FaseProjeto" NOT NULL DEFAULT 'desenvolvimento';
