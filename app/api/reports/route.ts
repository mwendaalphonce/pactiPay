// app/api/payroll/p10/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parse } from "papaparse";
import Papa from 'papaparse'

interface P10EmployeeRow {
  "Employee Name": string;
  "National ID": string;
  "KRA PIN": string;
  "Employee Number": string;
  "Basic Salary": string;
  "Housing Allowance": string;
  "Transport Allowance": string;
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

// Helper: Generate P10 CSV
async function generateP10CSV(
  companyId: string,
  month: number,
  year: number
): Promise<string> {
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

  const rows: P10EmployeeRow[] = payrollRuns.map((run) => ({
    "Employee Name": run.employee.name,
    "National ID": run.employee.nationalId,
    "KRA PIN": run.employee.kraPin,
    "Employee Number": run.employee.employeeNumber || "",
    "Basic Salary": run.basicSalary.toString(),
    "Housing Allowance": (run.employee.housingAllowance || 0).toString(),
    "Transport Allowance": (run.employee.transportAllowance || 0).toString(),
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

  // Add header metadata
  const header = [
    `P10 Return - ${company.companyName}`,
    `KRA PIN: ${company.kraPin}`,
    `Tax Period: ${monthYear}`,
    `Submission Date: ${new Date().toISOString().split("T")[0]}`,
    "",
  ];

  const csv = header.join("\n") + "\n" + Papa.unparse(rows);
  return csv;
}

// Helper: Validate P10 CSV
async function validateP10CSV(csvText: string): Promise<{
  valid: boolean;
  errors: string[];
  data: P10EmployeeRow[];
}> {
  const errors: string[] = [];
  let data: P10EmployeeRow[] = [];

  try {
    const parsed = parse(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
    });

    data = parsed.data as P10EmployeeRow[];

    // Validate required fields
    const requiredFields = [
      "Employee Name",
      "National ID",
      "KRA PIN",
      "Basic Salary",
      "Gross Pay",
      "PAYE",
    ];

    data.forEach((row, idx) => {
      requiredFields.forEach((field) => {
        if (!row[field as keyof P10EmployeeRow]) {
          errors.push(
            `Row ${idx + 1}: Missing required field "${field}"`
          );
        }
      });

      // Validate numeric fields
      const numericFields = [
        "Basic Salary",
        "Gross Pay",
        "PAYE",
        "NSSF",
        "SHIF",
        "Total Deductions",
        "Net Pay",
      ];

      numericFields.forEach((field) => {
        const value = row[field as keyof P10EmployeeRow];
        if (value && isNaN(parseFloat(value))) {
          errors.push(
            `Row ${idx + 1}: "${field}" must be a valid number`
          );
        }
      });

      // Validate National ID format (11 digits for Kenya)
      if (
        row["National ID"] &&
        !/^\d{1,8}$/.test(row["National ID"].replace(/\D/g, ""))
      ) {
        errors.push(`Row ${idx + 1}: Invalid National ID format`);
      }

      // Validate KRA PIN format (Kxxxxxx or Pxxxxxx)
      if (
        row["KRA PIN"] &&
        !/^[KP]\d{9}[A-Z]$/.test(row["KRA PIN"].toUpperCase())
      ) {
        errors.push(`Row ${idx + 1}: Invalid KRA PIN format`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      data,
    };
  } catch (error) {
    errors.push(`CSV parsing error: ${(error as Error).message}`);
    return { valid: false, errors, data: [] };
  }
}

// Helper: Submit to KRA API
async function submitToKRA(
  csv: string,
  kraPin: string,
  apiKey: string
): Promise<{ success: boolean; kraReference?: string; error?: string }> {
  try {
    // Placeholder - Replace with actual KRA API endpoint
    const KRA_API_URL = process.env.KRA_API_URL || "https://api.kra.go.ke/p10/submit";

    const response = await fetch(KRA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/csv",
        Authorization: `Bearer ${apiKey}`,
        "X-KRA-PIN": kraPin,
      },
      body: csv,
    });

    if (!response.ok) {
      throw new Error(`KRA API error: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      kraReference: result.referenceNumber || result.id,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
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
    const { action, month, year, csvData, submitToKRA } = body;

    if (!month || !year) {
      return NextResponse.json(
        { error: "Month and year are required" },
        { status: 400 }
      );
    }

    // Check if P10 submission already exists
    const existing = await prisma.p10Submission.findUnique({
      where: {
        companyId_month_year: {
          companyId: user.companyId,
          month,
          year,
        },
      },
    });

    if (action === "generate") {
      // Generate CSV
      const csv = await generateP10CSV(user.companyId, month, year);

      // Save draft submission
      const submission = await prisma.p10Submission.upsert({
        where: {
          companyId_month_year: {
            companyId: user.companyId,
            month,
            year,
          },
        },
        update: {
          csvData: csv,
          status: "DRAFT",
          updatedAt: new Date(),
        },
        create: {
          companyId: user.companyId,
          month,
          year,
          csvData: csv,
          status: "DRAFT",
          submittedBy: user.id,
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: "P10 CSV generated successfully",
          submission,
          csv,
        },
        { status: 200 }
      );
    }

    if (action === "validate") {
      // Validate uploaded CSV
      if (!csvData) {
        return NextResponse.json(
          { error: "CSV data is required for validation" },
          { status: 400 }
        );
      }

      const validation = await validateP10CSV(csvData);

      if (!validation.valid) {
        return NextResponse.json(
          {
            success: false,
            message: "Validation failed",
            errors: validation.errors,
          },
          { status: 400 }
        );
      }

      // Save validated submission
      const submission = await prisma.p10Submission.upsert({
        where: {
          companyId_month_year: {
            companyId: user.companyId,
            month,
            year,
          },
        },
        update: {
          csvData,
          status: "VALIDATED",
          updatedAt: new Date(),
        },
        create: {
          companyId: user.companyId,
          month,
          year,
          csvData,
          status: "VALIDATED",
          submittedBy: user.id,
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: "CSV validated successfully",
          submission,
          recordCount: validation.data.length,
        },
        { status: 200 }
      );
    }

    if (action === "submit") {
      // Submit to KRA
      const submission = existing || (await generateP10CSV(user.companyId, month, year));

      if (!submission) {
        return NextResponse.json(
          { error: "No P10 submission found" },
          { status: 404 }
        );
      }

      const company = await prisma.company.findUnique({
        where: { id: user.companyId },
      });

      if (!company) {
        return NextResponse.json(
          { error: "Company not found" },
          { status: 404 }
        );
      }

      const kraApiKey = process.env.KRA_API_KEY;
      if (!kraApiKey) {
        return NextResponse.json(
          { error: "KRA API key not configured" },
          { status: 500 }
        );
      }

      const kraResult = await submitToKRA(
        csvData || existing?.csvData || "",
        company.kraPin,
        kraApiKey
      );

      if (!kraResult.success) {
        // Save error
        await prisma.p10Submission.update({
          where: {
            companyId_month_year: {
              companyId: user.companyId,
              month,
              year,
            },
          },
          data: {
            status: "REJECTED",
            errors: { message: kraResult.error },
          },
        });

        return NextResponse.json(
          {
            success: false,
            message: "KRA submission failed",
            error: kraResult.error,
          },
          { status: 400 }
        );
      }

      // Save successful submission
      const updatedSubmission = await prisma.p10Submission.update({
        where: {
          companyId_month_year: {
            companyId: user.companyId,
            month,
            year,
          },
        },
        data: {
          status: "SUBMITTED",
          kraReference: kraResult.kraReference,
          submittedAt: new Date(),
          submittedBy: user.id,
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: "P10 submitted to KRA successfully",
          submission: updatedSubmission,
          kraReference: kraResult.kraReference,
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

// GET: Download CSV or Get submission status
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
      // Generate and download CSV
      const csv = await generateP10CSV(
        user.companyId,
        parseInt(month),
        parseInt(year)
      );

      const company = await prisma.company.findUnique({
        where: { id: user.companyId },
      });

      const filename = `P10_${company?.kraPin}_${year}-${String(parseInt(month)).padStart(2, "0")}.csv`;

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    if (action === "status" && month && year) {
      // Get submission status
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
      // List all submissions
      const submissions = await prisma.p10Submission.findMany({
        where: { companyId: user.companyId },
        orderBy: { createdAt: "desc" },
        take: 12,
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