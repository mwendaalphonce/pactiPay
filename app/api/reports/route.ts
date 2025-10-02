import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "HR" && session.user.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    if (!month || !year) {
      return NextResponse.json(
        { error: "Month and year are required" },
        { status: 400 }
      );
    }

    // Get the company ID for the current user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { company: true },
    });

    if (!user?.company?.id) {
      return NextResponse.json(
        { error: "No company associated with user" },
        { status: 400 }
      );
    }

    // Find the payroll for the specified month and year
    const payroll = await prisma.payroll.findFirst({
      where: {
        month: parseInt(month),
        year: parseInt(year),
        companyId: user.company.id,
        status: "COMPLETED", // Only completed payrolls can be reported
      },
    });

    if (!payroll) {
      return NextResponse.json(
        { error: "No completed payroll found for the specified period" },
        { status: 404 }
      );
    }

    // Get all payslips for this payroll with employee details
    const payslips = await prisma.payslip.findMany({
      where: {
        payrollId: payroll.id,
      },
      include: {
        employee: {
          include: {
            department: true,
          },
        },
      },
    });

    // Prepare report data
    const reportData = {
      payrollSummary: {
        payroll,
        payslips,
      },
      statutorySummary: {
        payroll,
        payslips,
      },
      employeeCost: {
        payroll,
        payslips,
      },
    };

    return NextResponse.json(reportData);
  } catch (error) {
    console.error("Error generating reports:", error);
    return NextResponse.json(
      { error: "Failed to generate reports" },
      { status: 500 }
    );
  }
}