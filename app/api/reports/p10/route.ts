// src/app/api/reports/p10/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

/**
 * P10 KRA Tax Deduction Card Report Generator
 * Compliant with Kenya Revenue Authority requirements
 * Updated for December 2024 Tax Laws Amendment Act
 */

interface P10EmployeeData {
  // Employee Details
  employeeNumber: string;
  name: string;
  kraPin: string;
  nationalId: string;
  residentialStatus: string;
  employeeType: string;
  
  // Earnings
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  leavePay: number;
  otherAllowances: number;
  overtime: number;
  bonuses: number;
  totalCashPay: number;
  
  // Non-Cash Benefits
  valueOfQuarters: number;
  housingBenefit: string;
  actualRent: number;
  computedRent: number;
  
  // Gross Pay Calculation
  totalTaxableIncome: number;
  
  // Allowable Deductions (NEW: includes SHIF & Housing Levy)
  nssfEmployee: number;
  shifEmployee: number;
  housingLevyEmployee: number;
  ownerOccupierInterest: number;
  pensionContribution: number;
  totalAllowableDeductions: number;
  
  // Taxable Income
  taxableIncome: number;
  
  // Tax Calculation
  grossTax: number;
  personalRelief: number;
  insuranceRelief: number;
  paye: number;
  
  // Employer Contributions
  nssfEmployer: number;
  shifEmployer: number;
  housingLevyEmployer: number;
  
  // Net Pay
  netPay: number;
}

interface P10Report {
  // Company Information
  companyInfo: {
    companyName: string;
    kraPin: string;
    nssfNumber: string;
    shifNumber: string;
    physicalAddress: string;
    postalAddress: string;
    county: string;
  };
  
  // Report Period
  period: {
    month: number;
    year: number;
    monthName: string;
    reportDate: string;
  };
  
  // Employee Data
  employees: P10EmployeeData[];
  
  // Summary Totals
  totals: {
    totalEmployees: number;
    totalBasicSalary: number;
    totalHousingAllowance: number;
    totalTransportAllowance: number;
    totalOtherAllowances: number;
    totalCashPay: number;
    totalValueOfQuarters: number;
    totalGrossPay: number;
    
    // Allowable Deductions Summary
    totalNSSFEmployee: number;
    totalSHIFEmployee: number;
    totalHousingLevyEmployee: number;
    totalOwnerOccupierInterest: number;
    totalPensionContribution: number;
    totalAllowableDeductions: number;
    
    // Tax Summary
    totalTaxableIncome: number;
    totalGrossTax: number;
    totalPersonalRelief: number;
    totalInsuranceRelief: number;
    totalPAYE: number;
    
    // Employer Contributions Summary
    totalNSSFEmployer: number;
    totalSHIFEmployer: number;
    totalHousingLevyEmployer: number;
    totalEmployerContributions: number;
    
    // Net Pay Summary
    totalNetPay: number;
  };
  
  // Compliance Information
  compliance: {
    taxLawVersion: string;
    generatedDate: string;
    generatedBy: string;
    certificationStatement: string;
  };
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["HR", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized. HR or ADMIN role required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const monthYear = searchParams.get("monthYear"); // Format: YYYY-MM
    const format = searchParams.get("format") || "json"; // json, csv, xlsx

    if (!monthYear) {
      return NextResponse.json(
        { error: "monthYear parameter is required (format: YYYY-MM)" },
        { status: 400 }
      );
    }

    // Parse month and year
    const [year, month] = monthYear.split("-").map(Number);
    if (!year || !month || month < 1 || month > 12) {
      return NextResponse.json(
        { error: "Invalid monthYear format. Use YYYY-MM" },
        { status: 400 }
      );
    }

    // Get user's company
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { company: true },
    });

    if (!user?.company) {
      return NextResponse.json(
        { error: "No company associated with user" },
        { status: 400 }
      );
    }

    // Get payroll runs for the specified period
    const payrollRuns = await prisma.payrollRun.findMany({
      where: {
        monthYear: monthYear,
        employee: {
          companyId: user.company.id,
          isActive: true,
        },
      },
      include: {
        employee: {
          include: {
            insurancePremiums: {
              where: {
                isActive: true,
                isTaxRelief: true,
              },
            },
          },
        },
      },
      orderBy: {
        employee: {
          name: "asc",
        },
      },
    });

    if (payrollRuns.length === 0) {
      return NextResponse.json(
        { error: `No payroll data found for ${monthYear}` },
        { status: 404 }
      );
    }

    // Generate P10 report data
    const p10Report = await generateP10Report(
      user.company,
      payrollRuns,
      month,
      year,
      session.user.name || session.user.email
    );

    // Return based on requested format
    if (format === "json") {
      return NextResponse.json(p10Report);
    } else if (format === "csv") {
      const csv = generateP10CSV(p10Report);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="P10_Report_${monthYear}.csv"`,
        },
      });
    }

    return NextResponse.json(p10Report);
  } catch (error) {
    console.error("Error generating P10 report:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate P10 report",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function generateP10Report(
  company: any,
  payrollRuns: any[],
  month: number,
  year: number,
  generatedBy: string
): Promise<P10Report> {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Process each employee's payroll data
  const employees: P10EmployeeData[] = payrollRuns.map(payroll => {
    const employee = payroll.employee;
    
    // Calculate non-cash benefits (Value of Quarters)
    let computedRent = 0;
    if (employee.housingBenefit === "EMPLOYER_OWNED" || employee.housingBenefit === "EMPLOYER_RENTED") {
      // KRA formula: Lower of actual rent or 15% of basic salary
      const maxRent = employee.basicSalary * 0.15;
      computedRent = Math.min(employee.actualRent || 0, maxRent);
    } else if (employee.housingBenefit === "AGRICULTURE_FARM") {
      // Agricultural housing benefit calculation
      computedRent = employee.valueOfQuarters || 0;
    }

    // Calculate total cash pay
    const totalCashPay = 
      payroll.basicSalary + 
      (employee.housingAllowance || 0) +
      (employee.transportAllowance || 0) +
      (employee.leavePay || 0) +
      (employee.otherAllowances || 0) +
      payroll.overtime +
      payroll.bonuses;

    // Total taxable income (cash pay + non-cash benefits)
    const totalTaxableIncome = totalCashPay + computedRent;

    // Calculate insurance relief
    const insurancePremiums = employee.insurancePremiums || [];
    const totalInsurancePremium = insurancePremiums.reduce(
      (sum: number, premium: any) => sum + premium.employeeShare,
      0
    );
    const insuranceRelief = Math.min(totalInsurancePremium * 0.15, 5000);

    return {
      // Employee Details
      employeeNumber: employee.employeeNumber || "N/A",
      name: employee.name,
      kraPin: employee.kraPin,
      nationalId: employee.nationalId,
      residentialStatus: employee.residentialStatus,
      employeeType: employee.employeeType,
      
      // Earnings Breakdown
      basicSalary: payroll.basicSalary,
      housingAllowance: employee.housingAllowance || 0,
      transportAllowance: employee.transportAllowance || 0,
      leavePay: employee.leavePay || 0,
      otherAllowances: employee.otherAllowances || 0,
      overtime: payroll.overtime,
      bonuses: payroll.bonuses,
      totalCashPay,
      
      // Non-Cash Benefits
      valueOfQuarters: employee.valueOfQuarters || 0,
      housingBenefit: employee.housingBenefit,
      actualRent: employee.actualRent || 0,
      computedRent,
      
      // Gross Pay
      totalTaxableIncome,
      
      // Allowable Deductions (NEW: Dec 2024 Tax Law)
      nssfEmployee: payroll.nssf,
      shifEmployee: payroll.shif,
      housingLevyEmployee: payroll.housingLevy,
      ownerOccupierInterest: employee.ownerOccupierInterest || 0,
      pensionContribution: employee.pensionScheme ? payroll.nssf : 0,
      totalAllowableDeductions: 
        payroll.nssf + 
        payroll.shif + 
        payroll.housingLevy + 
        (employee.ownerOccupierInterest || 0),
      
      // Taxable Income (after allowable deductions)
      taxableIncome: payroll.taxableIncome,
      
      // Tax Calculation
      grossTax: typeof payroll.deductions === 'object' && payroll.deductions !== null
        ? (payroll.deductions as any).grossTax || (payroll.paye / 0.9) 
        : (payroll.paye / 0.9),
      personalRelief: 2400, // Standard personal relief
      insuranceRelief,
      paye: payroll.paye,
      
      // Employer Contributions
      nssfEmployer: payroll.nssf, // Employer matches employee
      shifEmployer: payroll.shif, // Employer matches employee
      housingLevyEmployer: payroll.housingLevy, // Employer matches employee
      
      // Net Pay
      netPay: payroll.netPay,
    };
  });

  // Calculate totals
  const totals = employees.reduce(
    (acc, emp) => ({
      totalEmployees: acc.totalEmployees + 1,
      totalBasicSalary: acc.totalBasicSalary + emp.basicSalary,
      totalHousingAllowance: acc.totalHousingAllowance + emp.housingAllowance,
      totalTransportAllowance: acc.totalTransportAllowance + emp.transportAllowance,
      totalOtherAllowances: acc.totalOtherAllowances + (emp.leavePay + emp.otherAllowances),
      totalCashPay: acc.totalCashPay + emp.totalCashPay,
      totalValueOfQuarters: acc.totalValueOfQuarters + emp.computedRent,
      totalGrossPay: acc.totalGrossPay + emp.totalTaxableIncome,
      
      totalNSSFEmployee: acc.totalNSSFEmployee + emp.nssfEmployee,
      totalSHIFEmployee: acc.totalSHIFEmployee + emp.shifEmployee,
      totalHousingLevyEmployee: acc.totalHousingLevyEmployee + emp.housingLevyEmployee,
      totalOwnerOccupierInterest: acc.totalOwnerOccupierInterest + emp.ownerOccupierInterest,
      totalPensionContribution: acc.totalPensionContribution + emp.pensionContribution,
      totalAllowableDeductions: acc.totalAllowableDeductions + emp.totalAllowableDeductions,
      
      totalTaxableIncome: acc.totalTaxableIncome + emp.taxableIncome,
      totalGrossTax: acc.totalGrossTax + emp.grossTax,
      totalPersonalRelief: acc.totalPersonalRelief + emp.personalRelief,
      totalInsuranceRelief: acc.totalInsuranceRelief + emp.insuranceRelief,
      totalPAYE: acc.totalPAYE + emp.paye,
      
      totalNSSFEmployer: acc.totalNSSFEmployer + emp.nssfEmployer,
      totalSHIFEmployer: acc.totalSHIFEmployer + emp.shifEmployer,
      totalHousingLevyEmployer: acc.totalHousingLevyEmployer + emp.housingLevyEmployer,
      totalEmployerContributions: acc.totalEmployerContributions + 
        (emp.nssfEmployer + emp.shifEmployer + emp.housingLevyEmployer),
      
      totalNetPay: acc.totalNetPay + emp.netPay,
    }),
    {
      totalEmployees: 0,
      totalBasicSalary: 0,
      totalHousingAllowance: 0,
      totalTransportAllowance: 0,
      totalOtherAllowances: 0,
      totalCashPay: 0,
      totalValueOfQuarters: 0,
      totalGrossPay: 0,
      totalNSSFEmployee: 0,
      totalSHIFEmployee: 0,
      totalHousingLevyEmployee: 0,
      totalOwnerOccupierInterest: 0,
      totalPensionContribution: 0,
      totalAllowableDeductions: 0,
      totalTaxableIncome: 0,
      totalGrossTax: 0,
      totalPersonalRelief: 0,
      totalInsuranceRelief: 0,
      totalPAYE: 0,
      totalNSSFEmployer: 0,
      totalSHIFEmployer: 0,
      totalHousingLevyEmployer: 0,
      totalEmployerContributions: 0,
      totalNetPay: 0,
    }
  );

  return {
    companyInfo: {
      companyName: company.companyName,
      kraPin: company.kraPin,
      nssfNumber: company.nssfNumber || "N/A",
      shifNumber: company.shifNumber || "N/A",
      physicalAddress: company.physicalAddress || "N/A",
      postalAddress: company.postalAddress || "N/A",
      county: company.county || "N/A",
    },
    period: {
      month,
      year,
      monthName: monthNames[month - 1],
      reportDate: new Date().toISOString().split("T")[0],
    },
    employees,
    totals,
    compliance: {
      taxLawVersion: "December 2024 Tax Laws Amendment Act",
      generatedDate: new Date().toISOString(),
      generatedBy,
      certificationStatement: 
        "I certify that the information provided in this return is true, correct and complete, " +
        "and that the deductions have been made in accordance with the Income Tax Act.",
    },
  };
}

function generateP10CSV(report: P10Report): string {
  const headers = [
    "Employee Number",
    "Name",
    "KRA PIN",
    "National ID",
    "Basic Salary",
    "Housing Allowance",
    "Transport Allowance",
    "Other Allowances",
    "Overtime",
    "Bonuses",
    "Total Cash Pay",
    "Value of Quarters",
    "Total Taxable Income",
    "NSSF Employee",
    "SHIF Employee",
    "Housing Levy Employee",
    "Owner Occupier Interest",
    "Total Allowable Deductions",
    "Taxable Income",
    "Gross Tax",
    "Personal Relief",
    "Insurance Relief",
    "PAYE",
    "Net Pay",
    "NSSF Employer",
    "SHIF Employer",
    "Housing Levy Employer",
  ];

  const rows = report.employees.map(emp => [
    emp.employeeNumber,
    emp.name,
    emp.kraPin,
    emp.nationalId,
    emp.basicSalary.toFixed(2),
    emp.housingAllowance.toFixed(2),
    emp.transportAllowance.toFixed(2),
    (emp.leavePay + emp.otherAllowances).toFixed(2),
    emp.overtime.toFixed(2),
    emp.bonuses.toFixed(2),
    emp.totalCashPay.toFixed(2),
    emp.computedRent.toFixed(2),
    emp.totalTaxableIncome.toFixed(2),
    emp.nssfEmployee.toFixed(2),
    emp.shifEmployee.toFixed(2),
    emp.housingLevyEmployee.toFixed(2),
    emp.ownerOccupierInterest.toFixed(2),
    emp.totalAllowableDeductions.toFixed(2),
    emp.taxableIncome.toFixed(2),
    emp.grossTax.toFixed(2),
    emp.personalRelief.toFixed(2),
    emp.insuranceRelief.toFixed(2),
    emp.paye.toFixed(2),
    emp.netPay.toFixed(2),
    emp.nssfEmployer.toFixed(2),
    emp.shifEmployer.toFixed(2),
    emp.housingLevyEmployer.toFixed(2),
  ]);

  // Add totals row
  const totals = report.totals;
  rows.push([
    "TOTAL",
    `${totals.totalEmployees} Employees`,
    "",
    "",
    totals.totalBasicSalary.toFixed(2),
    totals.totalHousingAllowance.toFixed(2),
    totals.totalTransportAllowance.toFixed(2),
    totals.totalOtherAllowances.toFixed(2),
    "",
    "",
    totals.totalCashPay.toFixed(2),
    totals.totalValueOfQuarters.toFixed(2),
    totals.totalGrossPay.toFixed(2),
    totals.totalNSSFEmployee.toFixed(2),
    totals.totalSHIFEmployee.toFixed(2),
    totals.totalHousingLevyEmployee.toFixed(2),
    totals.totalOwnerOccupierInterest.toFixed(2),
    totals.totalAllowableDeductions.toFixed(2),
    totals.totalTaxableIncome.toFixed(2),
    totals.totalGrossTax.toFixed(2),
    totals.totalPersonalRelief.toFixed(2),
    totals.totalInsuranceRelief.toFixed(2),
    totals.totalPAYE.toFixed(2),
    totals.totalNetPay.toFixed(2),
    totals.totalNSSFEmployer.toFixed(2),
    totals.totalSHIFEmployer.toFixed(2),
    totals.totalHousingLevyEmployer.toFixed(2),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
  ].join("\n");

  return csvContent;
}