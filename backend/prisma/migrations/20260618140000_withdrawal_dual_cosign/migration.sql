-- Real dual-co-signature support for AND-mandate joint withdrawals.
-- Previously an AND-mandate withdrawal only required a checkbox ticked by
-- whichever holder happened to be logged in, claiming the other holder
-- agreed — not an actual second signature. Now that each joint holder can
-- have their own separate login, we can (and must) require the OTHER
-- holder to actually log in and co-sign before a withdrawal can be
-- disbursed.
ALTER TABLE "WalletTransaction" ADD COLUMN "requestedByAuthUserId" TEXT;
ALTER TABLE "WalletTransaction" ADD COLUMN "requiresCoSign" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WalletTransaction" ADD COLUMN "coSignedByAuthUserId" TEXT;
ALTER TABLE "WalletTransaction" ADD COLUMN "coSignedAt" TIMESTAMP(3);
