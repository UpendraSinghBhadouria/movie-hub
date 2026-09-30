/*
  Warnings:

  - Added the required column `lockId` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "lockId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "providerOrderId" TEXT;

-- CreateIndex
CREATE INDEX "Booking_lockId_idx" ON "Booking"("lockId");

-- CreateIndex
CREATE INDEX "Payment_providerOrderId_idx" ON "Payment"("providerOrderId");
