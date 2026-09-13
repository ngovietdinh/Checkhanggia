-- AlterTable
ALTER TABLE "counterfeit_alert" ADD COLUMN     "barcode" TEXT;

-- AlterTable
ALTER TABLE "product" ADD COLUMN     "barcode" TEXT;

-- CreateIndex
CREATE INDEX "counterfeit_alert_barcode_idx" ON "counterfeit_alert"("barcode");

-- CreateIndex
CREATE INDEX "product_barcode_idx" ON "product"("barcode");
