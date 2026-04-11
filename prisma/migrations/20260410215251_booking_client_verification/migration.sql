-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "approvalOverLimitNote" TEXT,
ADD COLUMN     "billingContactName" TEXT,
ADD COLUMN     "invoiceEmail" TEXT,
ADD COLUMN     "siteContactName" TEXT,
ADD COLUMN     "siteContactPhone" TEXT,
ADD COLUMN     "spendLimitCents" INTEGER,
ADD COLUMN     "workDescription" TEXT;
