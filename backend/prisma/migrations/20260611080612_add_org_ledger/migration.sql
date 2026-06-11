-- CreateTable
CREATE TABLE "OrgLedger" (
    "id" TEXT NOT NULL,
    "entryRef" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "amountKobo" BIGINT NOT NULL,
    "clientId" TEXT,
    "preTermId" TEXT,
    "fqItemId" TEXT,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrgLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrgLedger_entryRef_key" ON "OrgLedger"("entryRef");

-- CreateIndex
CREATE INDEX "OrgLedger_type_idx" ON "OrgLedger"("type");

-- CreateIndex
CREATE INDEX "OrgLedger_createdAt_idx" ON "OrgLedger"("createdAt");
