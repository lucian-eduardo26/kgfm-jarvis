-- AlterEnum
ALTER TYPE "StatusFrente" ADD VALUE 'planejada';

-- AlterTable
ALTER TABLE "frentes" ADD COLUMN     "ordem" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pacote" TEXT;
