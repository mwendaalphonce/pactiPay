-- CreateEnum
CREATE TYPE "public"."contract_type" AS ENUM ('PERMANENT', 'CONTRACT', 'CASUAL', 'INTERN');

-- CreateEnum
CREATE TYPE "public"."overtime_type" AS ENUM ('WEEKDAY', 'HOLIDAY');

-- CreateEnum
CREATE TYPE "public"."payroll_status" AS ENUM ('DRAFT', 'PROCESSING', 'PROCESSED', 'APPROVED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."batch_status" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."adjustment_type" AS ENUM ('PROMOTION', 'INCREMENT', 'MARKET_ADJUSTMENT', 'COST_OF_LIVING', 'DEMOTION', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."deduction_type" AS ENUM ('LOAN', 'ADVANCE', 'SACCO', 'INSURANCE', 'WELFARE', 'UNION_DUES', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."bonus_type" AS ENUM ('PERFORMANCE', 'ANNUAL', 'COMMISSION', 'OVERTIME_BONUS', 'HOLIDAY_BONUS', 'PROJECT_BONUS', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."rate_type" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'TIERED');

-- CreateTable
CREATE TABLE "public"."employees" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kraPin" TEXT NOT NULL,
    "nationalId" TEXT NOT NULL,
    "employeeNumber" TEXT,
    "basicSalary" DOUBLE PRECISION NOT NULL,
    "allowances" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "contractType" "public"."contract_type" NOT NULL DEFAULT 'PERMANENT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "bankName" TEXT NOT NULL,
    "bankBranch" TEXT NOT NULL,
    "bankAccount" TEXT NOT NULL,
    "swiftCode" TEXT,
    "email" TEXT,
    "phoneNumber" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payroll_runs" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "monthYear" TEXT NOT NULL,
    "basicSalary" DOUBLE PRECISION NOT NULL,
    "allowances" DOUBLE PRECISION NOT NULL,
    "overtime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bonuses" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossPay" DOUBLE PRECISION NOT NULL,
    "overtimeHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overtimeType" "public"."overtime_type" NOT NULL DEFAULT 'WEEKDAY',
    "unpaidDays" INTEGER NOT NULL DEFAULT 0,
    "unpaidDeduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paye" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nssf" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shif" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "housingLevy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "customDeductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalDeductions" DOUBLE PRECISION NOT NULL,
    "netPay" DOUBLE PRECISION NOT NULL,
    "deductions" JSONB,
    "earnings" JSONB,
    "calculations" JSONB,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedBy" TEXT,
    "status" "public"."payroll_status" NOT NULL DEFAULT 'PROCESSED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."salary_adjustments" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "previousBasicSalary" DOUBLE PRECISION NOT NULL,
    "previousAllowances" DOUBLE PRECISION NOT NULL,
    "newBasicSalary" DOUBLE PRECISION NOT NULL,
    "newAllowances" DOUBLE PRECISION NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "adjustmentType" "public"."adjustment_type" NOT NULL,
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."custom_deductions" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "type" "public"."deduction_type" NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "startMonth" TEXT,
    "endMonth" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_deductions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bonuses" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "type" "public"."bonus_type" NOT NULL,
    "paymentMonth" TEXT NOT NULL,
    "isTaxable" BOOLEAN NOT NULL DEFAULT true,
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bonuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payroll_batches" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kraPin" TEXT NOT NULL,
    "nationalId" TEXT NOT NULL,
    "employeeNumber" TEXT,
    "monthYear" TEXT NOT NULL,
    "totalEmployees" INTEGER NOT NULL,
    "successfulRuns" INTEGER NOT NULL,
    "failedRuns" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "processedBy" TEXT,
    "status" "public"."batch_status" NOT NULL DEFAULT 'PROCESSING',
    "errors" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tax_rates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rateType" "public"."rate_type" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "configuration" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_kraPin_key" ON "public"."employees"("kraPin");

-- CreateIndex
CREATE UNIQUE INDEX "employees_nationalId_key" ON "public"."employees"("nationalId");

-- CreateIndex
CREATE UNIQUE INDEX "employees_employeeNumber_key" ON "public"."employees"("employeeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_runs_employeeId_monthYear_key" ON "public"."payroll_runs"("employeeId", "monthYear");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_batches_kraPin_key" ON "public"."payroll_batches"("kraPin");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_batches_nationalId_key" ON "public"."payroll_batches"("nationalId");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_batches_employeeNumber_key" ON "public"."payroll_batches"("employeeNumber");

-- AddForeignKey
ALTER TABLE "public"."payroll_runs" ADD CONSTRAINT "payroll_runs_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."salary_adjustments" ADD CONSTRAINT "salary_adjustments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."custom_deductions" ADD CONSTRAINT "custom_deductions_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bonuses" ADD CONSTRAINT "bonuses_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
