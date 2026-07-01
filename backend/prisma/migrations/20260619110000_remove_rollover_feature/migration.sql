-- The "auto-rollover" toggle on investments was captured at subscription
-- time but no execution logic anywhere (EOD job included) ever read or
-- acted on it — investments simply moved to MATURED at maturity regardless
-- of this flag, and the ROLLED_OVER status was never set by any code path.
-- Removed entirely per product decision rather than building out the
-- feature, since it would have been new functionality, not a fix.

ALTER TABLE "Investment" DROP COLUMN "autoRollover";

-- Recreate InvestmentStatus without ROLLED_OVER (Postgres doesn't support
-- DROP VALUE on enums directly).
ALTER TYPE "InvestmentStatus" RENAME TO "InvestmentStatus_old";
CREATE TYPE "InvestmentStatus" AS ENUM ('PENDING_APPROVAL', 'ACTIVE', 'MATURED', 'PRE_TERMINATED', 'REJECTED');
ALTER TABLE "Investment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Investment" ALTER COLUMN "status" TYPE "InvestmentStatus" USING ("status"::text::"InvestmentStatus");
ALTER TABLE "Investment" ALTER COLUMN "status" SET DEFAULT 'PENDING_APPROVAL';
DROP TYPE "InvestmentStatus_old";
