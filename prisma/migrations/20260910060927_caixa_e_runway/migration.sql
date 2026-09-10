-- CreateTable
CREATE TABLE "caixa" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "saldo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "custo_fixo_mensal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "parcela_emprestimo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "margem_bruta" DOUBLE PRECISION NOT NULL DEFAULT 0.28,
    "limite_baixo_ticket" DOUBLE PRECISION NOT NULL DEFAULT 100000,
    "teto_hora_baixo_ticket" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "caixa_pkey" PRIMARY KEY ("id")
);
