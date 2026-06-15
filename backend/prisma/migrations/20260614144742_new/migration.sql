/*
  Warnings:

  - Made the column `interestEarnedKobo` on table `StaffLoan` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "StaffLoan" ALTER COLUMN "interestEarnedKobo" SET NOT NULL;
