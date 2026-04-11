-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "tabletCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Booking_tabletCode_key" ON "Booking"("tabletCode");
