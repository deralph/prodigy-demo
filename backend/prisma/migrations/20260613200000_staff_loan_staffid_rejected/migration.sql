-- AlterTable: add staffId, rejectionReason, interestEarnedKobo to StaffLoan
ALTER TABLE "StaffLoan" ADD COLUMN IF NOT EXISTS "staffId" TEXT;
ALTER TABLE "StaffLoan" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
ALTER TABLE "StaffLoan" ADD COLUMN IF NOT EXISTS "interestEarnedKobo" BIGINT DEFAULT 0;

-- AlterEnum: add REJECTED to LoanStatus
ALTER TYPE "LoanStatus" ADD VALUE IF NOT EXISTS 'REJECTED';
