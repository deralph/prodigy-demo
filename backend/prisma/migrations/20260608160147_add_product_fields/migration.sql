-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "category" TEXT,
ADD COLUMN     "clientTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "earlyExitPenalty" DECIMAL(5,2),
ADD COLUMN     "hasTenor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lockInStr" TEXT,
ADD COLUMN     "maxInvestKobo" BIGINT,
ADD COLUMN     "riskLevel" TEXT,
ADD COLUMN     "tenorOptions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "withholdingTaxRate" DECIMAL(5,2) NOT NULL DEFAULT 10.00;

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");
