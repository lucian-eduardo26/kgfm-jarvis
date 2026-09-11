-- CreateTable
CREATE TABLE "contas_google" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "escopos" TEXT NOT NULL,
    "calendario_id" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contas_google_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contas_google_email_key" ON "contas_google"("email");
