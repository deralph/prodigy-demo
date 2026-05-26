-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('CORPORATE', 'INDIVIDUAL', 'JOINT');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('PENDING_KYC', 'KYC_SUBMITTED', 'KYC_UNDER_REVIEW', 'ACTIVE', 'SUSPENDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "MandateType" AS ENUM ('AND', 'OR');

-- CreateEnum
CREATE TYPE "KycDocStatus" AS ENUM ('NOT_UPLOADED', 'UPLOADED', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'FLAGGED');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'OPERATIONS', 'COMPLIANCE', 'FINANCE', 'AUDIT', 'INVESTMENT');

-- CreateEnum
CREATE TYPE "AdminStatus" AS ENUM ('ACTIVE', 'LOCKED', 'DELETED');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "InvestmentStatus" AS ENUM ('PENDING_APPROVAL', 'ACTIVE', 'MATURED', 'PRE_TERMINATED', 'ROLLED_OVER', 'REJECTED');

-- CreateEnum
CREATE TYPE "ApprovalType" AS ENUM ('KYC', 'SUBSCRIPTION', 'REDEMPTION', 'PRE_TERMINATION', 'STAFF_LOAN', 'DIVIDEND');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('WALLET_FUNDING', 'WALLET_WITHDRAWAL', 'SUBSCRIPTION', 'REDEMPTION', 'PRE_TERMINATION_PAYOUT', 'DIVIDEND_PAYOUT', 'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT', 'FEE');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'SUCCESSFUL', 'FAILED', 'REVERSED');

-- CreateEnum
CREATE TYPE "PreTermStatus" AS ENUM ('PENDING_OPS', 'APPROVED_OPS', 'PENDING_FINANCE', 'DISBURSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FinanceQueueStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'DISBURSED');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('PENDING', 'ACTIVE', 'REPAID', 'DEFAULTED');

-- CreateEnum
CREATE TYPE "DividendStatus" AS ENUM ('DECLARED', 'PENDING_PAYMENT', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EodRunStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('ON_TRACK', 'AT_RISK', 'ACHIEVED');

-- CreateEnum
CREATE TYPE "AuditCategory" AS ENUM ('AUTH', 'KYC', 'INVESTMENT', 'FINANCE', 'OPERATIONS', 'COMPLIANCE', 'SYSTEM', 'AUDIT');

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "clientRef" TEXT NOT NULL,
    "type" "ClientType" NOT NULL,
    "status" "ClientStatus" NOT NULL DEFAULT 'PENDING_KYC',
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Nigeria',
    "rcNumber" TEXT,
    "taxId" TEXT,
    "scumlCert" TEXT,
    "secondaryName" TEXT,
    "secondaryEmail" TEXT,
    "secondaryPhone" TEXT,
    "mandateType" "MandateType" DEFAULT 'AND',
    "walletBalance" BIGINT NOT NULL DEFAULT 0,
    "pendingBalance" BIGINT NOT NULL DEFAULT 0,
    "virtualAccountNo" TEXT,
    "virtualAccountBank" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "refreshToken" TEXT,
    "passwordResetToken" TEXT,
    "passwordResetExpiry" TIMESTAMP(3),
    "otpCode" TEXT,
    "otpExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT,
    "adminUserId" TEXT,

    CONSTRAINT "AuthUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "authUserId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "adminRef" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL,
    "status" "AdminStatus" NOT NULL DEFAULT 'ACTIVE',
    "department" TEXT,
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KycRecord" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewNotes" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KycRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KycDocument" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "docKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileMimeType" TEXT,
    "fileSizeBytes" INTEGER,
    "status" "KycDocStatus" NOT NULL DEFAULT 'NOT_UPLOADED',
    "uploadedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KycDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "roiMin" DECIMAL(5,2) NOT NULL,
    "roiMax" DECIMAL(5,2) NOT NULL,
    "minInvestKobo" BIGINT NOT NULL,
    "lockInDays" INTEGER,
    "color" TEXT,
    "isNegotiated" BOOLEAN NOT NULL DEFAULT false,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investment" (
    "id" TEXT NOT NULL,
    "investRef" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "status" "InvestmentStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "principalKobo" BIGINT NOT NULL,
    "roiRate" DECIMAL(5,2) NOT NULL,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    "tenorDays" INTEGER NOT NULL,
    "valueDate" TIMESTAMP(3) NOT NULL,
    "maturityDate" TIMESTAMP(3) NOT NULL,
    "autoRollover" BOOLEAN NOT NULL DEFAULT false,
    "bookedById" TEXT,
    "bookedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Investment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestmentEvent" (
    "id" TEXT NOT NULL,
    "investmentId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "note" TEXT,
    "performedById" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestmentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Approval" (
    "id" TEXT NOT NULL,
    "approvalRef" TEXT NOT NULL,
    "type" "ApprovalType" NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "clientId" TEXT,
    "investmentId" TEXT,
    "productId" TEXT,
    "amountKobo" BIGINT,
    "details" JSONB,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewNotes" TEXT,

    CONSTRAINT "Approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "txnRef" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "amountKobo" BIGINT NOT NULL,
    "description" TEXT,
    "paystackRef" TEXT,
    "bankName" TEXT,
    "bankAcctNo" TEXT,
    "bankAcctName" TEXT,
    "initiatedById" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreTermination" (
    "id" TEXT NOT NULL,
    "preTermRef" TEXT NOT NULL,
    "investmentId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" "PreTermStatus" NOT NULL DEFAULT 'PENDING_OPS',
    "requestedAmountKobo" BIGINT NOT NULL,
    "penaltyKobo" BIGINT NOT NULL DEFAULT 0,
    "netPayoutKobo" BIGINT NOT NULL,
    "reason" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "opsApprovedById" TEXT,
    "opsApprovedAt" TIMESTAMP(3),
    "financeApprovedById" TEXT,
    "financeApprovedAt" TIMESTAMP(3),
    "disbursedAt" TIMESTAMP(3),
    "rejectedById" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,

    CONSTRAINT "PreTermination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceQueueItem" (
    "id" TEXT NOT NULL,
    "fqRef" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "FinanceQueueStatus" NOT NULL DEFAULT 'PENDING',
    "clientId" TEXT NOT NULL,
    "amountKobo" BIGINT NOT NULL,
    "penaltyKobo" BIGINT NOT NULL DEFAULT 0,
    "notes" TEXT,
    "preTermId" TEXT,
    "requestedById" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedById" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceQueueItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorporateEntity" (
    "id" TEXT NOT NULL,
    "entityRef" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sector" TEXT,
    "staffCount" INTEGER NOT NULL DEFAULT 0,
    "clientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorporateEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffLoan" (
    "id" TEXT NOT NULL,
    "loanRef" TEXT NOT NULL,
    "corporateId" TEXT NOT NULL,
    "clientId" TEXT,
    "staffName" TEXT NOT NULL,
    "staffEmail" TEXT,
    "department" TEXT,
    "principalKobo" BIGINT NOT NULL,
    "interestRate" DECIMAL(5,2) NOT NULL,
    "tenorMonths" INTEGER NOT NULL,
    "monthlyPaymentKobo" BIGINT NOT NULL,
    "disbursedAt" TIMESTAMP(3),
    "maturityDate" TIMESTAMP(3),
    "status" "LoanStatus" NOT NULL DEFAULT 'PENDING',
    "outstandingKobo" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffLoan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanRepayment" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "amountKobo" BIGINT NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "LoanRepayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dividend" (
    "id" TEXT NOT NULL,
    "dividendRef" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "rate" DECIMAL(5,2) NOT NULL,
    "totalPayoutKobo" BIGINT NOT NULL,
    "eligibleCount" INTEGER NOT NULL,
    "declarationDate" TIMESTAMP(3) NOT NULL,
    "paymentDate" TIMESTAMP(3),
    "notes" TEXT,
    "status" "DividendStatus" NOT NULL DEFAULT 'DECLARED',
    "declaredById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dividend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DividendEntry" (
    "id" TEXT NOT NULL,
    "dividendId" TEXT NOT NULL,
    "investmentId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "amountKobo" BIGINT NOT NULL,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "DividendEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetAmountKobo" BIGINT NOT NULL,
    "currentKobo" BIGINT NOT NULL DEFAULT 0,
    "targetDate" TIMESTAMP(3),
    "status" "GoalStatus" NOT NULL DEFAULT 'ON_TRACK',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Beneficiary" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "percentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Beneficiary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegacyNote" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegacyNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Statement" (
    "id" TEXT NOT NULL,
    "investmentId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "fileUrl" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "holder" TEXT,

    CONSTRAINT "Statement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskProfile" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "score" INTEGER,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "RiskProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "amountKobo" BIGINT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "auditRef" TEXT NOT NULL,
    "adminId" TEXT,
    "adminName" TEXT NOT NULL,
    "adminRole" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetEntity" TEXT,
    "category" "AuditCategory" NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EodRun" (
    "id" TEXT NOT NULL,
    "runDate" DATE NOT NULL,
    "status" "EodRunStatus" NOT NULL DEFAULT 'RUNNING',
    "triggeredById" TEXT NOT NULL,
    "steps" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,

    CONSTRAINT "EodRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_clientRef_key" ON "Client"("clientRef");

-- CreateIndex
CREATE UNIQUE INDEX "Client_email_key" ON "Client"("email");

-- CreateIndex
CREATE INDEX "Client_type_idx" ON "Client"("type");

-- CreateIndex
CREATE INDEX "Client_status_idx" ON "Client"("status");

-- CreateIndex
CREATE INDEX "Client_email_idx" ON "Client"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AuthUser_email_key" ON "AuthUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AuthUser_clientId_key" ON "AuthUser"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthUser_adminUserId_key" ON "AuthUser"("adminUserId");

-- CreateIndex
CREATE INDEX "AuthUser_email_idx" ON "AuthUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_authUserId_idx" ON "Session"("authUserId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_adminRef_key" ON "AdminUser"("adminRef");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE INDEX "AdminUser_role_idx" ON "AdminUser"("role");

-- CreateIndex
CREATE INDEX "AdminUser_status_idx" ON "AdminUser"("status");

-- CreateIndex
CREATE UNIQUE INDEX "KycRecord_clientId_key" ON "KycRecord"("clientId");

-- CreateIndex
CREATE INDEX "KycDocument_clientId_idx" ON "KycDocument"("clientId");

-- CreateIndex
CREATE INDEX "KycDocument_status_idx" ON "KycDocument"("status");

-- CreateIndex
CREATE UNIQUE INDEX "KycDocument_clientId_docKey_key" ON "KycDocument"("clientId", "docKey");

-- CreateIndex
CREATE UNIQUE INDEX "Product_code_key" ON "Product"("code");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Investment_investRef_key" ON "Investment"("investRef");

-- CreateIndex
CREATE INDEX "Investment_clientId_idx" ON "Investment"("clientId");

-- CreateIndex
CREATE INDEX "Investment_productId_idx" ON "Investment"("productId");

-- CreateIndex
CREATE INDEX "Investment_status_idx" ON "Investment"("status");

-- CreateIndex
CREATE INDEX "Investment_maturityDate_idx" ON "Investment"("maturityDate");

-- CreateIndex
CREATE INDEX "InvestmentEvent_investmentId_idx" ON "InvestmentEvent"("investmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Approval_approvalRef_key" ON "Approval"("approvalRef");

-- CreateIndex
CREATE UNIQUE INDEX "Approval_investmentId_key" ON "Approval"("investmentId");

-- CreateIndex
CREATE INDEX "Approval_type_idx" ON "Approval"("type");

-- CreateIndex
CREATE INDEX "Approval_status_idx" ON "Approval"("status");

-- CreateIndex
CREATE INDEX "Approval_clientId_idx" ON "Approval"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "WalletTransaction_txnRef_key" ON "WalletTransaction"("txnRef");

-- CreateIndex
CREATE INDEX "WalletTransaction_clientId_idx" ON "WalletTransaction"("clientId");

-- CreateIndex
CREATE INDEX "WalletTransaction_type_idx" ON "WalletTransaction"("type");

-- CreateIndex
CREATE INDEX "WalletTransaction_status_idx" ON "WalletTransaction"("status");

-- CreateIndex
CREATE INDEX "WalletTransaction_createdAt_idx" ON "WalletTransaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PreTermination_preTermRef_key" ON "PreTermination"("preTermRef");

-- CreateIndex
CREATE UNIQUE INDEX "PreTermination_investmentId_key" ON "PreTermination"("investmentId");

-- CreateIndex
CREATE INDEX "PreTermination_clientId_idx" ON "PreTermination"("clientId");

-- CreateIndex
CREATE INDEX "PreTermination_status_idx" ON "PreTermination"("status");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceQueueItem_fqRef_key" ON "FinanceQueueItem"("fqRef");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceQueueItem_preTermId_key" ON "FinanceQueueItem"("preTermId");

-- CreateIndex
CREATE INDEX "FinanceQueueItem_clientId_idx" ON "FinanceQueueItem"("clientId");

-- CreateIndex
CREATE INDEX "FinanceQueueItem_status_idx" ON "FinanceQueueItem"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CorporateEntity_entityRef_key" ON "CorporateEntity"("entityRef");

-- CreateIndex
CREATE INDEX "CorporateEntity_name_idx" ON "CorporateEntity"("name");

-- CreateIndex
CREATE UNIQUE INDEX "StaffLoan_loanRef_key" ON "StaffLoan"("loanRef");

-- CreateIndex
CREATE INDEX "StaffLoan_corporateId_idx" ON "StaffLoan"("corporateId");

-- CreateIndex
CREATE INDEX "StaffLoan_status_idx" ON "StaffLoan"("status");

-- CreateIndex
CREATE INDEX "LoanRepayment_loanId_idx" ON "LoanRepayment"("loanId");

-- CreateIndex
CREATE UNIQUE INDEX "Dividend_dividendRef_key" ON "Dividend"("dividendRef");

-- CreateIndex
CREATE INDEX "Dividend_productId_idx" ON "Dividend"("productId");

-- CreateIndex
CREATE INDEX "Dividend_status_idx" ON "Dividend"("status");

-- CreateIndex
CREATE INDEX "DividendEntry_dividendId_idx" ON "DividendEntry"("dividendId");

-- CreateIndex
CREATE INDEX "DividendEntry_clientId_idx" ON "DividendEntry"("clientId");

-- CreateIndex
CREATE INDEX "Goal_clientId_idx" ON "Goal"("clientId");

-- CreateIndex
CREATE INDEX "Beneficiary_clientId_idx" ON "Beneficiary"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "LegacyNote_clientId_key" ON "LegacyNote"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Statement_investmentId_key" ON "Statement"("investmentId");

-- CreateIndex
CREATE INDEX "Statement_clientId_idx" ON "Statement"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "RiskProfile_clientId_key" ON "RiskProfile"("clientId");

-- CreateIndex
CREATE INDEX "ActivityLog_clientId_idx" ON "ActivityLog"("clientId");

-- CreateIndex
CREATE INDEX "ActivityLog_occurredAt_idx" ON "ActivityLog"("occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "AuditLog_auditRef_key" ON "AuditLog"("auditRef");

-- CreateIndex
CREATE INDEX "AuditLog_adminId_idx" ON "AuditLog"("adminId");

-- CreateIndex
CREATE INDEX "AuditLog_category_idx" ON "AuditLog"("category");

-- CreateIndex
CREATE INDEX "AuditLog_occurredAt_idx" ON "AuditLog"("occurredAt");

-- CreateIndex
CREATE INDEX "EodRun_runDate_idx" ON "EodRun"("runDate");

-- CreateIndex
CREATE UNIQUE INDEX "EodRun_runDate_key" ON "EodRun"("runDate");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- AddForeignKey
ALTER TABLE "AuthUser" ADD CONSTRAINT "AuthUser_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthUser" ADD CONSTRAINT "AuthUser_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_authUserId_fkey" FOREIGN KEY ("authUserId") REFERENCES "AuthUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KycRecord" ADD CONSTRAINT "KycRecord_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KycDocument" ADD CONSTRAINT "KycDocument_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investment" ADD CONSTRAINT "Investment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentEvent" ADD CONSTRAINT "InvestmentEvent_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "Investment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "Investment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreTermination" ADD CONSTRAINT "PreTermination_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "Investment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceQueueItem" ADD CONSTRAINT "FinanceQueueItem_preTermId_fkey" FOREIGN KEY ("preTermId") REFERENCES "PreTermination"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffLoan" ADD CONSTRAINT "StaffLoan_corporateId_fkey" FOREIGN KEY ("corporateId") REFERENCES "CorporateEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffLoan" ADD CONSTRAINT "StaffLoan_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanRepayment" ADD CONSTRAINT "LoanRepayment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "StaffLoan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dividend" ADD CONSTRAINT "Dividend_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DividendEntry" ADD CONSTRAINT "DividendEntry_dividendId_fkey" FOREIGN KEY ("dividendId") REFERENCES "Dividend"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DividendEntry" ADD CONSTRAINT "DividendEntry_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "Investment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Beneficiary" ADD CONSTRAINT "Beneficiary_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegacyNote" ADD CONSTRAINT "LegacyNote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Statement" ADD CONSTRAINT "Statement_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "Investment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Statement" ADD CONSTRAINT "Statement_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskProfile" ADD CONSTRAINT "RiskProfile_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
