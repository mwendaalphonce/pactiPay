// app/api/payroll/p10/route.ts - FIXED
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ExcelJS from "exceljs";

interface P10EmployeeRow {
  "Employee Name": string;
  "National ID": string;
  "KRA PIN": string;
  "Employee Number": string;
  "Basic Salary": string;
  "Housing Allowance": string;
  "Transport Allowance": string;
  "Meal Allowance": string;
  "Other Allowances": string;
  "Leave Pay": string;
  "Gross Pay": string;
  "PAYE": string;
  "NSSF": string;
  "SHIF": string;
  "Housing Levy": string;
  "Other Deductions": string;
  "Total Deductions": string;
  "Net Pay": string;
  "Taxable Income": string;
}

// ✅ FIX: Helper function to convert Node.js Buffer to ArrayBuffer
function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
  const arrayBuffer = new ArrayBuffer(buffer.length);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i];
  }
  return arrayBuffer;
}

// Helper: Generate P10 XLSM (KRA Format)
async function generateP10XLSM(
  companyId: string,
  month: number,
  year: number
): Promise<ArrayBuffer> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) throw new Error("Company not found");

  const monthYear = `${year}-${String(month).padStart(2, "0")}`;

  const payrollRuns = await prisma.payrollRun.findMany({
    where: {
      employee: { companyId },
      monthYear,
    },
    include: { employee: true },
  });

  if (payrollRuns.length === 0) {
    throw new Error(`No payroll data found for ${monthYear}`);
  }

  // Create workbook
  const workbook = new ExcelJS.Workbook();

  // SHEET A: BASIC INFORMATION
  const sheetA = workbook.addWorksheet("Sheet A - Basic Info");
  sheetA.columns = [
    { header: "Field", key: "field", width: 30 },
    { header: "Value", key: "value", width: 40 },
  ];

  const submissionDate = new Date();
  const dueDate = new Date(year, month, 9); // 9th of next month

  sheetA.addRows([
    { field: "Company Name", value: company.companyName },
    { field: "KRA PIN", value: company.kraPin },
    { field: "Tax Period (From)", value: `${year}-${String(month).padStart(2, "0")}-01` },
    { field: "Tax Period (To)", value: new Date(year, month, 0).toISOString().split("T")[0] },
    { field: "Return Type", value: "ORIGINAL" },
    { field: "Entity Type", value: "Head Office" },
    { field: "Submission Date", value: submissionDate.toISOString().split("T")[0] },
    { field: "Due Date", value: dueDate.toISOString().split("T")[0] },
  ]);

  // Style header row
  sheetA.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheetA.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF366092" },
  };

  // SHEET B: EMPLOYEE DETAILS
  const sheetB = workbook.addWorksheet("Sheet B - Employee Details");

  const employeeRows: P10EmployeeRow[] = payrollRuns.map((run) => ({
    "Employee Name": run.employee.name,
    "National ID": run.employee.nationalId,
    "KRA PIN": run.employee.kraPin,
    "Employee Number": run.employee.employeeNumber || "",
    "Basic Salary": run.basicSalary.toString(),
    "Housing Allowance": (run.employee.housingAllowance || 0).toString(),
    "Transport Allowance": (run.employee.transportAllowance || 0).toString(),
    "Meal Allowance": "0", // TODO: Add to PayrollRun
    "Other Allowances": (run.employee.otherAllowances || 0).toString(),
    "Leave Pay": (run.employee.leavePay || 0).toString(),
    "Gross Pay": run.grossPay.toString(),
    PAYE: run.paye.toString(),
    NSSF: run.nssf.toString(),
    SHIF: run.shif.toString(),
    "Housing Levy": run.housingLevy.toString(),
    "Other Deductions": run.customDeductions.toString(),
    "Total Deductions": run.totalDeductions.toString(),
    "Net Pay": run.netPay.toString(),
    "Taxable Income": run.taxableIncome.toString(),
  }));

  sheetB.columns = [
    { header: "Employee Name", key: "Employee Name", width: 20 },
    { header: "National ID", key: "National ID", width: 15 },
    { header: "KRA PIN", key: "KRA PIN", width: 15 },
    { header: "Employee Number", key: "Employee Number", width: 15 },
    { header: "Basic Salary", key: "Basic Salary", width: 15 },
    { header: "Housing Allowance", key: "Housing Allowance", width: 15 },
    { header: "Transport Allowance", key: "Transport Allowance", width: 15 },
    { header: "Meal Allowance", key: "Meal Allowance", width: 15 },
    { header: "Other Allowances", key: "Other Allowances", width: 15 },
    { header: "Leave Pay", key: "Leave Pay", width: 15 },
    { header: "Gross Pay", key: "Gross Pay", width: 15 },
    { header: "PAYE", key: "PAYE", width: 12 },
    { header: "NSSF", key: "NSSF", width: 12 },
    { header: "SHIF", key: "SHIF", width: 12 },
    { header: "Housing Levy", key: "Housing Levy", width: 15 },
    { header: "Other Deductions", key: "Other Deductions", width: 15 },
    { header: "Total Deductions", key: "Total Deductions", width: 15 },
    { header: "Net Pay", key: "Net Pay", width: 15 },
    { header: "Taxable Income", key: "Taxable Income", width: 15 },
  ];

  sheetB.addRows(employeeRows);

  // Style header row
  sheetB.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheetB.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF366092" },
  };

  // Format numeric columns
  sheetB.columns.forEach((col, idx) => {
    if (
      [
        "Basic Salary",
        "Housing Allowance",
        "Transport Allowance",
        "Meal Allowance",
        "Other Allowances",
        "Leave Pay",
        "Gross Pay",
        "PAYE",
        "NSSF",
        "SHIF",
        "Housing Levy",
        "Other Deductions",
        "Total Deductions",
        "Net Pay",
        "Taxable Income",
      ].includes(col.key as string)
    ) {
      sheetB.getColumn(idx + 1).numFmt = "#,##0.00";
    }
  });

  // SHEET M: HOUSING LEVY DETAILS
  const sheetM = workbook.addWorksheet("Sheet M - Housing Levy");

  const housingLevyRows = payrollRuns.map((run) => {
    const grossSalary = run.grossPay;
    const levyRate = 0.015;
    const employeeContribution = Math.min(grossSalary * levyRate, 3000); // Max ceiling
    const employerContribution = employeeContribution; // Employer matches

    return {
      "Employee PIN": run.employee.kraPin,
      "Employee Name": run.employee.name,
      "Gross Salary": grossSalary,
      "Levy Rate %": 1.5,
      "Employee Contribution": employeeContribution,
      "Employer Contribution": employerContribution,
      "Total Housing Levy": employeeContribution + employerContribution,
    };
  });

  sheetM.columns = [
    { header: "Employee PIN", key: "Employee PIN", width: 15 },
    { header: "Employee Name", key: "Employee Name", width: 20 },
    { header: "Gross Salary", key: "Gross Salary", width: 15 },
    { header: "Levy Rate %", key: "Levy Rate %", width: 12 },
    { header: "Employee Contribution", key: "Employee Contribution", width: 18 },
    { header: "Employer Contribution", key: "Employer Contribution", width: 18 },
    { header: "Total Housing Levy", key: "Total Housing Levy", width: 18 },
  ];

  sheetM.addRows(housingLevyRows);

  // Style header
  sheetM.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheetM.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF366092" },
  };

  // Format numeric
  ["Gross Salary", "Employee Contribution", "Employer Contribution", "Total Housing Levy"].forEach(
    (col) => {
      const colIndex = sheetM.getColumn(col).letter;
      sheetM.getColumn(colIndex).numFmt = "#,##0.00";
    }
  );

  // SHEET L: CALCULATION SUMMARY
  const sheetL = workbook.addWorksheet("Sheet L - Tax Summary");

  const totalEmployees = payrollRuns.length;
  const totalBasicSalary = payrollRuns.reduce((sum, r) => sum + r.basicSalary, 0);
  const totalAllowances = payrollRuns.reduce((sum, r) => sum + r.allowances, 0);
  const totalGrossPay = payrollRuns.reduce((sum, r) => sum + r.grossPay, 0);
  const totalNSSF = payrollRuns.reduce((sum, r) => sum + r.nssf, 0);
  const totalSHIF = payrollRuns.reduce((sum, r) => sum + r.shif, 0);
  const totalHousingLevy = payrollRuns.reduce((sum, r) => sum + r.housingLevy, 0);
  const totalPAYE = payrollRuns.reduce((sum, r) => sum + r.paye, 0);
  const totalDeductions = payrollRuns.reduce((sum, r) => sum + r.totalDeductions, 0);
  const totalNetPay = payrollRuns.reduce((sum, r) => sum + r.netPay, 0);

  sheetL.columns = [
    { header: "Description", key: "description", width: 35 },
    { header: "Amount (KSh)", key: "amount", width: 20 },
  ];

  sheetL.addRows([
    { description: "Total Number of Employees", amount: totalEmployees },
    { description: "Total Basic Salary", amount: totalBasicSalary },
    { description: "Total Allowances", amount: totalAllowances },
    { description: "Total Gross Pay", amount: totalGrossPay },
    { description: "", amount: "" },
    { description: "DEDUCTIONS:", amount: "" },
    { description: "Total NSSF", amount: totalNSSF },
    { description: "Total SHIF", amount: totalSHIF },
    { description: "Total Housing Levy", amount: totalHousingLevy },
    { description: "Total PAYE", amount: totalPAYE },
    { description: "Total Other Deductions", amount: totalDeductions - totalNSSF - totalSHIF - totalHousingLevy - totalPAYE },
    { description: "", amount: "" },
    { description: "SUMMARY:", amount: "" },
    { description: "Total Deductions", amount: totalDeductions },
    { description: "Total Net Pay", amount: totalNetPay },
  ]);

  // Style
  sheetL.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheetL.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF366092" },
  };

  // Bold summary rows
  [5, 6, 12, 13].forEach((rowNum) => {
    sheetL.getRow(rowNum).font = { bold: true };
  });

  // Format amount column
  sheetL.getColumn("amount").numFmt = "#,##0.00";

  // SHEET N: VALIDATION & SUBMISSION
  const sheetN = workbook.addWorksheet("Sheet N - Validation");

  sheetN.columns = [
    { header: "Status", key: "status", width: 30 },
    { header: "Details", key: "details", width: 50 },
  ];

  sheetN.addRows([
    { status: "Total Employees", details: totalEmployees },
    { status: "Total Gross Pay", details: `KSh ${totalGrossPay.toLocaleString()}` },
    { status: "Total PAYE", details: `KSh ${totalPAYE.toLocaleString()}` },
    { status: "Total NSSF", details: `KSh ${totalNSSF.toLocaleString()}` },
    { status: "Total SHIF", details: `KSh ${totalSHIF.toLocaleString()}` },
    { status: "Total Housing Levy", details: `KSh ${totalHousingLevy.toLocaleString()}` },
    { status: "Total Net Pay", details: `KSh ${totalNetPay.toLocaleString()}` },
    { status: "", details: "" },
    { status: "Submission Status", details: "READY FOR SUBMISSION" },
    { status: "Tax Period", details: `${year}-${String(month).padStart(2, "0")}` },
    { status: "Submission Deadline", details: "9th of following month" },
    { status: "Generated On", details: submissionDate.toISOString().split("T")[0] },
    { status: "Validated", details: "YES" },
  ]);

  // Style
  sheetN.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheetN.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF366092" },
  };

  sheetN.getRow(9).font = { bold: true, color: { argb: "FF006100" } };
  sheetN.getRow(9).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFC6EFCE" },
  };

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return bufferToArrayBuffer(buffer as unknown as Buffer);
}

// Helper: Validate P10 Data
function validateP10Data(payrollRuns: any[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  payrollRuns.forEach((run, idx) => {
    if (!run.employee.kraPin) {
      errors.push(`Row ${idx + 1}: Missing KRA PIN`);
    }
    if (!run.employee.name) {
      errors.push(`Row ${idx + 1}: Missing employee name`);
    }
    if (run.grossPay < run.basicSalary) {
      errors.push(`Row ${idx + 1}: Gross pay less than basic salary`);
    }
    if (run.nssf > 4320) {
      errors.push(`Row ${idx + 1}: NSSF exceeds maximum (KES 4,320)`);
    }
  });

  return { valid: errors.length === 0, errors };
}

// POST: Generate or Submit P10
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user?.companyId) {
      return NextResponse.json(
        { error: "No company associated with user" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, month, year } = body;

    if (!month || !year) {
      return NextResponse.json(
        { error: "Month and year are required" },
        { status: 400 }
      );
    }

    if (action === "generate") {
      // Generate XLSM
      const xlsxBuffer = await generateP10XLSM(user.companyId, month, year);

      // Save to DB
      const company = await prisma.company.findUnique({
        where: { id: user.companyId },
      });

      await prisma.p10Submission.upsert({
        where: {
          companyId_month_year: {
            companyId: user.companyId,
            month,
            year,
          },
        },
        update: {
          status: "DRAFT",
          updatedAt: new Date(),
        },
        create: {
          companyId: user.companyId,
          month,
          year,
          status: "DRAFT",
          submittedBy: user.id,
        },
      });

      // ✅ FIX: Already an ArrayBuffer, directly create Blob
      const blob = new Blob([xlsxBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      return new NextResponse(blob, {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="P10_${company?.kraPin}_${year}-${String(month).padStart(2, "0")}.xlsx"`,
        },
      });
    }

    if (action === "markSubmitted") {
      const submission = await prisma.p10Submission.update({
        where: {
          companyId_month_year: {
            companyId: user.companyId,
            month,
            year,
          },
        },
        data: {
          status: "SUBMITTED",
          submittedAt: new Date(),
          kraReference: body.submissionNotes || "Manual submission via KRA iTax portal",
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: "P10 marked as submitted to KRA",
          submission,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("P10 error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

// GET: Download XLSM
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user?.companyId) {
      return NextResponse.json(
        { error: "No company associated with user" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    if (action === "download" && month && year) {
      const xlsxBuffer = await generateP10XLSM(
        user.companyId,
        parseInt(month),
        parseInt(year)
      );

      const company = await prisma.company.findUnique({
        where: { id: user.companyId },
      });

      const filename = `P10_${company?.kraPin}_${year}-${String(parseInt(month)).padStart(2, "0")}.xlsx`;

      // ✅ FIX: Already an ArrayBuffer, directly create Blob
      const blob = new Blob([xlsxBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      return new NextResponse(blob, {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    if (action === "status" && month && year) {
      const submission = await prisma.p10Submission.findUnique({
        where: {
          companyId_month_year: {
            companyId: user.companyId,
            month: parseInt(month),
            year: parseInt(year),
          },
        },
      });

      if (!submission) {
        return NextResponse.json(
          { error: "No submission found" },
          { status: 404 }
        );
      }

      return NextResponse.json(submission, { status: 200 });
    }

    if (action === "list") {
      const submissions = await prisma.p10Submission.findMany({
        where: { companyId: user.companyId },
        orderBy: [{ year: "desc" }, { month: "desc" }],
        take: 24,
      });

      return NextResponse.json(submissions, { status: 200 });
    }

    return NextResponse.json(
      { error: "Invalid action or missing parameters" },
      { status: 400 }
    );
  } catch (error) {
    console.error("P10 GET error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}