-- AlterTable
ALTER TABLE "public"."payroll_runs" ADD COLUMN     "bonusDescription" TEXT,
ADD COLUMN     "taxableIncome" DOUBLE PRECISION NOT NULL DEFAULT 0;
