-- AlterTable
ALTER TABLE "GoldMembership" ADD COLUMN "commitmentStartedAt" TIMESTAMP(3);
ALTER TABLE "GoldMembership" ADD COLUMN "commitmentMonthsPaid" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "GoldMembership" ADD COLUMN "subscriptionTotalPaidCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "GoldMembership" ADD COLUMN "earlyTerminationInvoiceId" TEXT;

CREATE UNIQUE INDEX "GoldMembership_earlyTerminationInvoiceId_key" ON "GoldMembership"("earlyTerminationInvoiceId");
