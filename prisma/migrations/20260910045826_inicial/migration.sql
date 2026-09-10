-- CreateEnum
CREATE TYPE "Horizonte" AS ENUM ('cinco_anos', 'dois_anos', 'ano', 'mes');

-- CreateEnum
CREATE TYPE "StatusFrente" AS ENUM ('aberta', 'fechada', 'arquivada', 'descartada');

-- CreateEnum
CREATE TYPE "AguardandoQuem" AS ENUM ('eu', 'cliente', 'terceiro');

-- CreateEnum
CREATE TYPE "StatusTarefa" AS ENUM ('aberta', 'feita', 'descartada');

-- CreateEnum
CREATE TYPE "EncerradoPor" AS ENUM ('usuario', 'troca', 'automatico');

-- CreateEnum
CREATE TYPE "TipoItem" AS ENUM ('tarefa', 'insight', 'compromisso', 'oportunidade', 'indefinido');

-- CreateEnum
CREATE TYPE "OrigemItem" AS ENUM ('texto', 'voz', 'imagem');

-- CreateEnum
CREATE TYPE "StatusItem" AS ENUM ('novo', 'classificado', 'vinculado', 'descartado');

-- CreateEnum
CREATE TYPE "DesfechoRecomendacao" AS ENUM ('pendente', 'seguida', 'ignorada');

-- CreateTable
CREATE TABLE "estrategias" (
    "id" SERIAL NOT NULL,
    "horizonte" "Horizonte" NOT NULL,
    "diagnostico" TEXT NOT NULL,
    "politica_norteadora" TEXT NOT NULL,
    "acoes" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "criada_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estrategias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "objetivos" (
    "id" SERIAL NOT NULL,
    "horizonte" "Horizonte" NOT NULL,
    "descricao" TEXT NOT NULL,
    "metrica" TEXT,
    "alvo" DOUBLE PRECISION,
    "periodo" TEXT NOT NULL,
    "estrategia_id" INTEGER,
    "area_id" INTEGER,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "objetivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicoes" (
    "id" SERIAL NOT NULL,
    "objetivo_id" INTEGER NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "observacao" TEXT,
    "em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medicoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "areas" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "limite_wip" INTEGER NOT NULL DEFAULT 2,
    "dias_para_critico" INTEGER NOT NULL,
    "meta_horas_semana" DOUBLE PRECISION,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projetos" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "cliente" TEXT,
    "area_id" INTEGER NOT NULL,
    "valor_estimado" DOUBLE PRECISION,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projetos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "frentes" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "area_id" INTEGER NOT NULL,
    "projeto_id" INTEGER,
    "objetivo_id" INTEGER,
    "status" "StatusFrente" NOT NULL DEFAULT 'aberta',
    "aberta_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimo_movimento_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aguardando_quem" "AguardandoQuem" NOT NULL DEFAULT 'eu',
    "aguardando_desde" TIMESTAMP(3),
    "fechada_em" TIMESTAMP(3),
    "descartada_em" TIMESTAMP(3),
    "motivo_descarte" TEXT,

    CONSTRAINT "frentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bloqueios" (
    "id" SERIAL NOT NULL,
    "frente_bloqueadora_id" INTEGER NOT NULL,
    "frente_bloqueada_id" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bloqueios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarefas" (
    "id" SERIAL NOT NULL,
    "frente_id" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "estimativa_min" INTEGER,
    "status" "StatusTarefa" NOT NULL DEFAULT 'aberta',
    "criada_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "concluida_em" TIMESTAMP(3),

    CONSTRAINT "tarefas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apontamentos" (
    "id" SERIAL NOT NULL,
    "tarefa_id" INTEGER NOT NULL,
    "iniciado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "encerrado_em" TIMESTAMP(3),
    "encerrado_por" "EncerradoPor",
    "revisar" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "apontamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentos" (
    "id" SERIAL NOT NULL,
    "frente_id" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT,
    "em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoItem" NOT NULL DEFAULT 'indefinido',
    "conteudo" TEXT NOT NULL,
    "conteudo_bruto" TEXT NOT NULL,
    "origem" "OrigemItem" NOT NULL DEFAULT 'texto',
    "status" "StatusItem" NOT NULL DEFAULT 'novo',
    "area_id" INTEGER,
    "frente_id" INTEGER,
    "objetivo_id" INTEGER,
    "vence_em" TIMESTAMP(3),
    "confianca_classificacao" DOUBLE PRECISION,
    "corrigido_pelo_usuario" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processado_em" TIMESTAMP(3),
    "descartado_em" TIMESTAMP(3),
    "motivo_descarte" TEXT,

    CONSTRAINT "itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recomendacoes" (
    "id" SERIAL NOT NULL,
    "frente_id" INTEGER,
    "argumento" TEXT NOT NULL,
    "gerada_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "desfecho" "DesfechoRecomendacao" NOT NULL DEFAULT 'pendente',

    CONSTRAINT "recomendacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sinteses" (
    "id" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "periodo_inicio" TIMESTAMP(3) NOT NULL,
    "periodo_fim" TIMESTAMP(3) NOT NULL,
    "texto" TEXT NOT NULL,
    "gerada_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sinteses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snapshots_diarios" (
    "id" SERIAL NOT NULL,
    "data" DATE NOT NULL,
    "area_id" INTEGER NOT NULL,
    "indice" DOUBLE PRECISION NOT NULL,
    "movimento" DOUBLE PRECISION NOT NULL,
    "criticos" DOUBLE PRECISION NOT NULL,
    "aderencia" DOUBLE PRECISION,
    "frentes" INTEGER NOT NULL,
    "horas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snapshots_diarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chamadas_ia" (
    "id" SERIAL NOT NULL,
    "modelo" TEXT NOT NULL,
    "finalidade" TEXT NOT NULL,
    "tokens_entrada" INTEGER NOT NULL,
    "tokens_saida" INTEGER NOT NULL,
    "custo_estimado" DOUBLE PRECISION NOT NULL,
    "em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chamadas_ia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "config" (
    "chave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "alterado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "config_pkey" PRIMARY KEY ("chave")
);

-- CreateIndex
CREATE INDEX "objetivos_horizonte_periodo_idx" ON "objetivos"("horizonte", "periodo");

-- CreateIndex
CREATE INDEX "medicoes_objetivo_id_em_idx" ON "medicoes"("objetivo_id", "em");

-- CreateIndex
CREATE UNIQUE INDEX "areas_nome_key" ON "areas"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "areas_chave_key" ON "areas"("chave");

-- CreateIndex
CREATE INDEX "frentes_area_id_status_idx" ON "frentes"("area_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "bloqueios_frente_bloqueadora_id_frente_bloqueada_id_key" ON "bloqueios"("frente_bloqueadora_id", "frente_bloqueada_id");

-- CreateIndex
CREATE INDEX "tarefas_frente_id_status_idx" ON "tarefas"("frente_id", "status");

-- CreateIndex
CREATE INDEX "apontamentos_iniciado_em_idx" ON "apontamentos"("iniciado_em");

-- CreateIndex
CREATE INDEX "apontamentos_encerrado_em_idx" ON "apontamentos"("encerrado_em");

-- CreateIndex
CREATE INDEX "movimentos_frente_id_em_idx" ON "movimentos"("frente_id", "em");

-- CreateIndex
CREATE INDEX "itens_status_criado_em_idx" ON "itens"("status", "criado_em");

-- CreateIndex
CREATE INDEX "recomendacoes_gerada_em_idx" ON "recomendacoes"("gerada_em");

-- CreateIndex
CREATE INDEX "sinteses_tipo_periodo_fim_idx" ON "sinteses"("tipo", "periodo_fim");

-- CreateIndex
CREATE UNIQUE INDEX "snapshots_diarios_data_area_id_key" ON "snapshots_diarios"("data", "area_id");

-- CreateIndex
CREATE INDEX "chamadas_ia_em_idx" ON "chamadas_ia"("em");

-- AddForeignKey
ALTER TABLE "objetivos" ADD CONSTRAINT "objetivos_estrategia_id_fkey" FOREIGN KEY ("estrategia_id") REFERENCES "estrategias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objetivos" ADD CONSTRAINT "objetivos_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicoes" ADD CONSTRAINT "medicoes_objetivo_id_fkey" FOREIGN KEY ("objetivo_id") REFERENCES "objetivos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projetos" ADD CONSTRAINT "projetos_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frentes" ADD CONSTRAINT "frentes_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frentes" ADD CONSTRAINT "frentes_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projetos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frentes" ADD CONSTRAINT "frentes_objetivo_id_fkey" FOREIGN KEY ("objetivo_id") REFERENCES "objetivos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloqueios" ADD CONSTRAINT "bloqueios_frente_bloqueadora_id_fkey" FOREIGN KEY ("frente_bloqueadora_id") REFERENCES "frentes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloqueios" ADD CONSTRAINT "bloqueios_frente_bloqueada_id_fkey" FOREIGN KEY ("frente_bloqueada_id") REFERENCES "frentes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefas" ADD CONSTRAINT "tarefas_frente_id_fkey" FOREIGN KEY ("frente_id") REFERENCES "frentes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apontamentos" ADD CONSTRAINT "apontamentos_tarefa_id_fkey" FOREIGN KEY ("tarefa_id") REFERENCES "tarefas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos" ADD CONSTRAINT "movimentos_frente_id_fkey" FOREIGN KEY ("frente_id") REFERENCES "frentes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens" ADD CONSTRAINT "itens_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens" ADD CONSTRAINT "itens_frente_id_fkey" FOREIGN KEY ("frente_id") REFERENCES "frentes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens" ADD CONSTRAINT "itens_objetivo_id_fkey" FOREIGN KEY ("objetivo_id") REFERENCES "objetivos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recomendacoes" ADD CONSTRAINT "recomendacoes_frente_id_fkey" FOREIGN KEY ("frente_id") REFERENCES "frentes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
