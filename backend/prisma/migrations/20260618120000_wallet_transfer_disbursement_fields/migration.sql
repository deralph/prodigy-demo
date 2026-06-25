-- Add fields to capture Paystack transfer disbursement code and failure
-- reason directly on the ledger record, so the full withdrawal lifecycle
-- (request -> admin approval -> automatic Paystack disbursement -> success
-- or failure) is visible on the transaction itself.
ALTER TABLE "WalletTransaction" ADD COLUMN "paystackTransferCode" TEXT;
ALTER TABLE "WalletTransaction" ADD COLUMN "failureReason" TEXT;
