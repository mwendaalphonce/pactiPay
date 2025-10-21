import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Fixed: Changed from session.user.role to session.user.roles
    if (!session || !session.user.roles?.includes("ADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await request.json();

    // Create new company
    const company = await prisma.company.create({
      data: {
        companyName: data.companyName,
        email: data.email,
        kraPin: data.kraPin,
        phone: data.phone || null,
        physicalAddress: data.physicalAddress || null,
        nhifNumber: data.nhifNumber || null,
        nssfNumber: data.nssfNumber || null,
        businessRegNo: data.businessRegNo || null,
        shifNumber: data.shifNumber || null,
        housingLevy: data.housingLevy || null,
      },
    });

    return NextResponse.json(company);
  } catch (error) {
    console.error("Error creating company:", error);
    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Fixed: Changed from session.user.role to session.user.roles
    if (!session || !session.user.roles?.includes("ADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const companies = await prisma.company.findMany({
      orderBy: {
        companyName: "asc",
      },
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}