-- Store only keyed identity digests and verification metadata.
-- Raw BVNs must never be persisted.
CREATE TABLE "IdentityVerification" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "identifierHash" TEXT NOT NULL,
    "nameNormalized" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerReference" TEXT,
    "verifiedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdentityVerification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "IdentityVerification_clientId_idx" ON "IdentityVerification"("clientId");
CREATE INDEX "IdentityVerification_type_identifierHash_idx" ON "IdentityVerification"("type", "identifierHash");

ALTER TABLE "IdentityVerification" ADD CONSTRAINT "IdentityVerification_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
