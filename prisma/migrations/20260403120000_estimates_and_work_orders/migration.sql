-- CreateEnum
CREATE TYPE "EstimateStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CONVERTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "Estimate" (
    "id" TEXT NOT NULL,
    "restaurantName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "addressLine" TEXT,
    "lineItems" JSONB NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "notes" TEXT,
    "status" "EstimateStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Estimate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthorizedWorkOrder" (
    "id" TEXT NOT NULL,
    "estimateId" TEXT NOT NULL,
    "restaurantName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "addressLine" TEXT,
    "lineItems" JSONB NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "notes" TEXT,
    "workerId" TEXT,
    "authorizedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'authorized',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthorizedWorkOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Estimate_email_idx" ON "Estimate"("email");

-- CreateIndex
CREATE INDEX "Estimate_expiresAt_idx" ON "Estimate"("expiresAt");

-- CreateIndex
CREATE INDEX "Estimate_status_idx" ON "Estimate"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AuthorizedWorkOrder_estimateId_key" ON "AuthorizedWorkOrder"("estimateId");

-- CreateIndex
CREATE INDEX "AuthorizedWorkOrder_email_idx" ON "AuthorizedWorkOrder"("email");

-- AddForeignKey
ALTER TABLE "AuthorizedWorkOrder" ADD CONSTRAINT "AuthorizedWorkOrder_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
