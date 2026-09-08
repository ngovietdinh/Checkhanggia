-- CreateTable
CREATE TABLE "counterfeit_alert" (
    "id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "product_type" TEXT,
    "registration_number" TEXT,
    "violating_batches" TEXT[],
    "responsible_entity" TEXT,
    "source_group" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "counterfeit_alert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "counterfeit_alert_product_name_idx" ON "counterfeit_alert"("product_name");
