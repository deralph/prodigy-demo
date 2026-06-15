-- DropIndex
DROP INDEX "AuditLog_occurredAt_idx";

-- CreateTable
CREATE TABLE "AuditToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuditToken_token_key" ON "AuditToken"("token");

-- CreateIndex
CREATE INDEX "AuditToken_token_idx" ON "AuditToken"("token");

-- CreateIndex
CREATE INDEX "AuditToken_clientId_idx" ON "AuditToken"("clientId");

-- CreateIndex
CREATE INDEX "AuditToken_expiresAt_idx" ON "AuditToken"("expiresAt");

-- AddForeignKey
ALTER TABLE "OrgLedger" ADD CONSTRAINT "OrgLedger_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
