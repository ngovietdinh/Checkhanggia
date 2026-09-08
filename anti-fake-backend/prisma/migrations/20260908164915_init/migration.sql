-- CreateEnum
CREATE TYPE "CodeStatus" AS ENUM ('unscanned', 'scanned', 'revoked');

-- CreateEnum
CREATE TYPE "HierarchyLevel" AS ENUM ('unit', 'box', 'carton');

-- CreateEnum
CREATE TYPE "DataSource" AS ENUM ('manual', 'api');

-- CreateEnum
CREATE TYPE "DataQualityStatus" AS ENUM ('verified', 'unverified');

-- CreateEnum
CREATE TYPE "FraudReportStatus" AS ENUM ('new', 'verifying', 'confirmed', 'rejected');

-- CreateEnum
CREATE TYPE "AppRole" AS ENUM ('ENTERPRISE_ADMIN', 'ENTERPRISE_STAFF');

-- CreateEnum
CREATE TYPE "ScanResult" AS ENUM ('valid_first', 'duplicate', 'not_found', 'wrong_secret', 'revoked', 'blocked');

-- CreateTable
CREATE TABLE "fraud_report" (
    "id" TEXT NOT NULL,
    "public_id" TEXT,
    "image_urls" TEXT[],
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "store_name" TEXT,
    "description" TEXT,
    "status" "FraudReportStatus" NOT NULL DEFAULT 'new',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fraud_report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" "AppRole" NOT NULL,
    "enterprise_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse_export" (
    "id" TEXT NOT NULL,
    "enterprise_id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "destination_region" TEXT NOT NULL,
    "agency_name" TEXT NOT NULL,
    "carton_quantity" INTEGER NOT NULL,
    "exported_by" TEXT NOT NULL,
    "exported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warehouse_export_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enterprise" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "api_key_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enterprise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product" (
    "id" TEXT NOT NULL,
    "enterprise_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category_code" TEXT NOT NULL,
    "warranty_months" INTEGER NOT NULL DEFAULT 0,
    "data_source" "DataSource" NOT NULL DEFAULT 'manual',
    "external_ref_id" TEXT,
    "data_quality_status" "DataQualityStatus" NOT NULL DEFAULT 'verified',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_batch" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "enterprise_id" TEXT NOT NULL,
    "batch_number" TEXT NOT NULL,
    "manufacture_date" TIMESTAMP(3) NOT NULL,
    "expiry_date" TIMESTAMP(3),
    "factory_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "code" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "secret_hash" TEXT NOT NULL,
    "status" "CodeStatus" NOT NULL DEFAULT 'unscanned',
    "parent_code_id" TEXT,
    "hierarchy_level" "HierarchyLevel" NOT NULL DEFAULT 'unit',
    "first_scanned_at" TIMESTAMP(3),
    "first_scanned_lat" DOUBLE PRECISION,
    "first_scanned_lng" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "code_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scan_log" (
    "id" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "code_id" TEXT,
    "result" "ScanResult" NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "device_fingerprint" TEXT,
    "request_ip" TEXT,
    "scanned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scan_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fraud_report_public_id_idx" ON "fraud_report"("public_id");

-- CreateIndex
CREATE INDEX "fraud_report_status_idx" ON "fraud_report"("status");

-- CreateIndex
CREATE UNIQUE INDEX "app_user_email_key" ON "app_user"("email");

-- CreateIndex
CREATE INDEX "app_user_enterprise_id_idx" ON "app_user"("enterprise_id");

-- CreateIndex
CREATE INDEX "warehouse_export_enterprise_id_idx" ON "warehouse_export"("enterprise_id");

-- CreateIndex
CREATE INDEX "warehouse_export_destination_region_idx" ON "warehouse_export"("destination_region");

-- CreateIndex
CREATE UNIQUE INDEX "enterprise_api_key_hash_key" ON "enterprise"("api_key_hash");

-- CreateIndex
CREATE INDEX "product_enterprise_id_idx" ON "product"("enterprise_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_enterprise_id_external_ref_id_key" ON "product"("enterprise_id", "external_ref_id");

-- CreateIndex
CREATE INDEX "product_batch_enterprise_id_idx" ON "product_batch"("enterprise_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_batch_product_id_batch_number_key" ON "product_batch"("product_id", "batch_number");

-- CreateIndex
CREATE UNIQUE INDEX "code_public_id_key" ON "code"("public_id");

-- CreateIndex
CREATE INDEX "code_batch_id_idx" ON "code"("batch_id");

-- CreateIndex
CREATE INDEX "code_parent_code_id_idx" ON "code"("parent_code_id");

-- CreateIndex
CREATE INDEX "code_status_idx" ON "code"("status");

-- CreateIndex
CREATE INDEX "scan_log_public_id_idx" ON "scan_log"("public_id");

-- CreateIndex
CREATE INDEX "scan_log_code_id_idx" ON "scan_log"("code_id");

-- CreateIndex
CREATE INDEX "scan_log_scanned_at_idx" ON "scan_log"("scanned_at");

-- AddForeignKey
ALTER TABLE "app_user" ADD CONSTRAINT "app_user_enterprise_id_fkey" FOREIGN KEY ("enterprise_id") REFERENCES "enterprise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_export" ADD CONSTRAINT "warehouse_export_enterprise_id_fkey" FOREIGN KEY ("enterprise_id") REFERENCES "enterprise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouse_export" ADD CONSTRAINT "warehouse_export_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "product_batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_enterprise_id_fkey" FOREIGN KEY ("enterprise_id") REFERENCES "enterprise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_batch" ADD CONSTRAINT "product_batch_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_batch" ADD CONSTRAINT "product_batch_enterprise_id_fkey" FOREIGN KEY ("enterprise_id") REFERENCES "enterprise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "code" ADD CONSTRAINT "code_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "product_batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "code" ADD CONSTRAINT "code_parent_code_id_fkey" FOREIGN KEY ("parent_code_id") REFERENCES "code"("id") ON DELETE SET NULL ON UPDATE CASCADE;
