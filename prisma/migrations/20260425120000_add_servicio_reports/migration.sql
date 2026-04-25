-- CreateTable
CREATE TABLE "ServicioReport" (
    "id" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "restaurantName" TEXT NOT NULL,
    "technicianName" TEXT NOT NULL,
    "serviceDate" TIMESTAMP(3) NOT NULL,
    "serviceLanguage" TEXT NOT NULL,
    "bookingReference" TEXT,
    "checklistAirGap" TEXT NOT NULL,
    "checklistHandSink" TEXT NOT NULL,
    "checklistGreaseTrap" TEXT NOT NULL,
    "notes" TEXT,
    "laborHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "laborSubtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "materialsSubtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "partsSubtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherChargesSubtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "invoiceSubtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "depositCredit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amountDue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pdfUrl" TEXT,
    "pdfPathname" TEXT,
    "photosBefore" JSONB NOT NULL DEFAULT '[]',
    "photosAfter" JSONB NOT NULL DEFAULT '[]',
    "purgeAfter" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicioReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServicioReport_clientEmail_idx" ON "ServicioReport"("clientEmail");

-- CreateIndex
CREATE INDEX "ServicioReport_purgeAfter_idx" ON "ServicioReport"("purgeAfter");
