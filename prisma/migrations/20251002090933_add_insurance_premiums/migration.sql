-- CreateTable
CREATE TABLE "public"."insurance_premiums" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "insuranceType" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "policyNumber" TEXT,
    "monthlyPremium" DOUBLE PRECISION NOT NULL,
    "employeeShare" DOUBLE PRECISION NOT NULL,
    "employerShare" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isTaxRelief" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_premiums_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."insurance_premiums" ADD CONSTRAINT "insurance_premiums_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
