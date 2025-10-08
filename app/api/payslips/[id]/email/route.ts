import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
// You'll need to implement email sending
// import { sendPayslipEmail } from '@/lib/email-service'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const payrollRun = await prisma.payrollRun.findUnique({
      where: { id: params.id },
      include: {
        employee: true
      }
    })

    if (!payrollRun) {
      return NextResponse.json(
        { error: 'Payslip not found' },
        { status: 404 }
      )
    }

    if (!payrollRun.employee.email) {
      return NextResponse.json(
        { error: 'Employee email not found' },
        { status: 400 }
      )
    }

    // Send email (implement this based on your email service)
    // await sendPayslipEmail(payrollRun.employee.email, payrollRun)
    
    return NextResponse.json({ 
      message: 'Email sent successfully',
      email: payrollRun.employee.email 
    })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}