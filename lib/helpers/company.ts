// lib/helpers/company.ts
import { prisma } from '@/lib/prisma'

/**
 * Get company details by ID
 */
export async function getCompanyById(companyId: string) {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        companyName: true,
        email: true,
        phone: true,
        kraPin: true,
        nssfNumber: true,
        nhifNumber: true,
        shifNumber: true,
        housingLevy: true,
        physicalAddress: true,
        postalAddress: true,
        city: true,
        county: true,
        bankName: true,
        bankBranch: true,
        bankAccount: true,
        swiftCode: true,
        payrollDay: true,
        currency: true,
        logo: true,
        primaryColor: true,
        signatoryName: true,
        signatoryTitle: true,
        signatorySignature: true,
        isActive: true,
        plan: true,
      }
    })

    return company
  } catch (error) {
    console.error('Error fetching company:', error)
    return null
  }
}

/**
 * Get formatted company address
 */
export function formatCompanyAddress(company: {
  physicalAddress?: string | null
  city?: string | null
  county?: string | null
  postalAddress?: string | null
}): string {
  const parts = [
    company.physicalAddress,
    company.city,
    company.county,
    company.postalAddress
  ].filter(Boolean)

  return parts.length > 0 ? parts.join(', ') : 'Address not provided'
}

/**
 * Get company details formatted for payslips
 */
export interface PayslipCompanyInfo {
  name: string
  address: string
  phone: string
  email: string
  kraPin: string
  logo?: string | null
  signatoryName?: string | null
  signatoryTitle?: string | null
  signatorySignature?: string | null
}

export async function getCompanyForPayslip(companyId: string): Promise<PayslipCompanyInfo | null> {
  const company = await getCompanyById(companyId)

  if (!company) {
    return null
  }

  return {
    name: company.companyName,
    address: formatCompanyAddress(company),
    phone: company.phone || 'Phone not provided',
    email: company.email,
    kraPin: company.kraPin,
    logo: company.logo,
    signatoryName: company.signatoryName,
    signatoryTitle: company.signatoryTitle,
    signatorySignature: company.signatorySignature,
  }
}

/**
 * Validate if company is active and can process payroll
 */
export async function canProcessPayroll(companyId: string): Promise<{
  canProcess: boolean
  reason?: string
}> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      isActive: true,
      kraPin: true,
      nssfNumber: true,
      shifNumber: true,
      suspendedAt: true,
      suspensionReason: true,
    }
  })

  if (!company) {
    return { canProcess: false, reason: 'Company not found' }
  }

  if (!company.isActive) {
    return {
      canProcess: false,
      reason: company.suspensionReason || 'Company account is suspended'
    }
  }

  if (!company.kraPin) {
    return { canProcess: false, reason: 'KRA PIN not configured' }
  }

  if (!company.nssfNumber) {
    return { canProcess: false, reason: 'NSSF number not configured' }
  }

  if (!company.shifNumber) {
    return { canProcess: false, reason: 'SHIF number not configured' }
  }

  return { canProcess: true }
}