/*
  Warnings:

  - Added the required column `showId` to the `BookingSeat` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "EventCategory_active_sortOrder_idx";

-- AlterTable
ALTER TABLE "BookingSeat" ADD COLUMN     "showId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "ShowSeat" (
    "id" TEXT NOT NULL,
    "showId" TEXT NOT NULL,
    "seatId" TEXT NOT NULL,
    "status" "SeatStatus" NOT NULL DEFAULT 'AVAILABLE',
    "price" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShowSeat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShowSeat_showId_idx" ON "ShowSeat"("showId");

-- CreateIndex
CREATE INDEX "ShowSeat_seatId_idx" ON "ShowSeat"("seatId");

-- CreateIndex
CREATE UNIQUE INDEX "ShowSeat_showId_seatId_key" ON "ShowSeat"("showId", "seatId");

-- CreateIndex
CREATE INDEX "BookingSeat_showId_idx" ON "BookingSeat"("showId");

-- AddForeignKey
ALTER TABLE "ShowSeat" ADD CONSTRAINT "ShowSeat_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowSeat" ADD CONSTRAINT "ShowSeat_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "Seat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingSeat" ADD CONSTRAINT "BookingSeat_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show"("id") ON DELETE CASCADE ON UPDATE CASCADE;
