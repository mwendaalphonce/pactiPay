// src/app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Get current month for payroll calculations
    const now = new Date()
    const currentMonth = now.toISOString().slice(0, 7) // YYYY-MM format
    
    // Parallel database queries for better performance
    const [
      employees,
      currentMonthPayrolls,
      recentPayrollRuns,
      recentEmployees,
      recentAdjustments,
      allPayrollsThisMonth,
      previousMonthPayrolls,
    ] = await Promise.all([
      // Get all employees
      prisma.employee.findMany({
        select: {
          id: true,
          name: true,
          basicSalary: true,
          allowances: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),

      // Get current month payroll runs
      prisma.payrollRun.findMany({
        where: {
          monthYear: currentMonth
        },
        include: {
          employee: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          processedAt: 'desc'
        }
      }),

      // Get recent payroll runs for activity feed
      prisma.payrollRun.findMany({
        take: 10,
        include: {
          employee: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          processedAt: 'desc'
        }
      }),

      // Get recently added employees
      prisma.employee.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          name: true,
          createdAt: true
        }
      }),

      // Get recent salary adjustments
      prisma.salaryAdjustment.findMany({
        take: 5,
        include: {
          employee: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),

      // Get all payrolls for this month for stats
      prisma.payrollRun.findMany({
        where: {
          monthYear: currentMonth
        },
        select: {
          id: true,
          netPay: true,
          grossPay: true,
          totalDeductions: true,
          processedAt: true,
          status: true
        }
      }),

      // Get previous month payrolls for growth calculation
      prisma.payrollRun.findMany({
        where: {
          monthYear: getPreviousMonth(currentMonth)
        },
        select: {
          netPay: true
        }
      })
    ])

    // Calculate dashboard statistics
    const activeEmployees = employees.filter(emp => emp.isActive)
    const totalEmployees = employees.length
    const activeEmployeesCount = activeEmployees.length

    // Calculate total monthly payroll (based on employee salaries)
    const totalMonthlyPayroll = activeEmployees.reduce((sum, emp) => {
      return sum + emp.basicSalary + emp.allowances
    }, 0)

    // Calculate processed vs pending payrolls
    const processedPayrolls = currentMonthPayrolls.length
    const pendingPayrolls = Math.max(0, activeEmployeesCount - processedPayrolls)

    // Calculate total amounts for current month
    const totalGrossPay = allPayrollsThisMonth.reduce((sum, payroll) => sum + payroll.grossPay, 0)
    const totalNetPay = allPayrollsThisMonth.reduce((sum, payroll) => sum + payroll.netPay, 0)
    const totalDeductions = allPayrollsThisMonth.reduce((sum, payroll) => sum + payroll.totalDeductions, 0)

    // Calculate monthly growth
    const previousMonthTotal = previousMonthPayrolls.reduce((sum, payroll) => sum + payroll.netPay, 0)
    const monthlyGrowth = previousMonthTotal > 0 
      ? ((totalNetPay - previousMonthTotal) / previousMonthTotal) * 100 
      : 0

    // Get last payroll date
    const lastPayrollDate = recentPayrollRuns.length > 0 
      ? recentPayrollRuns[0].processedAt.toLocaleDateString('en-KE', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : null

    // Calculate average salary
    const averageSalary = activeEmployeesCount > 0 
      ? totalMonthlyPayroll / activeEmployeesCount 
      : 0

    // Build recent activities from different sources
    const recentActivities = []

    // Add payroll activities
    recentPayrollRuns.slice(0, 3).forEach(payroll => {
      recentActivities.push({
        id: `payroll_${payroll.id}`,
        type: 'payroll_processed' as const,
        description: `Payroll processed for ${payroll.employee.name} - ${formatMonthYear(payroll.monthYear)}`,
        timestamp: payroll.processedAt.toISOString(),
        user: 'System',
        metadata: { 
          employeeName: payroll.employee.name, 
          amount: payroll.netPay 
        }
      })
    })

    // Add employee activities
    recentEmployees.slice(0, 2).forEach(employee => {
      recentActivities.push({
        id: `employee_${employee.id}`,
        type: 'employee_added' as const,
        description: `New employee added: ${employee.name}`,
        timestamp: employee.createdAt.toISOString(),
        user: 'HR Manager',
        metadata: {}
      })
    })

    // Add salary adjustment activities
    recentAdjustments.slice(0, 2).forEach(adjustment => {
      recentActivities.push({
        id: `adjustment_${adjustment.id}`,
        type: 'employee_edited' as const,
        description: `Updated salary for ${adjustment.employee.name}`,
        timestamp: adjustment.createdAt.toISOString(),
        user: 'HR Manager',
        metadata: {
          oldSalary: adjustment.previousBasicSalary,
          newSalary: adjustment.newBasicSalary
        }
      })
    })

    // Sort activities by timestamp (most recent first)
    recentActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Generate upcoming tasks based on actual data
    const upcomingTasks = []

    // Task: Process pending payrolls
    if (pendingPayrolls > 0) {
      upcomingTasks.push({
        id: 'pending_payrolls',
        title: `Process remaining ${pendingPayrolls} payrolls`,
        description: `Complete ${formatMonthYear(currentMonth)} payroll processing`,
        dueDate: getEndOfMonth(currentMonth).toISOString(),
        priority: pendingPayrolls > 5 ? 'high' as const : 'medium' as const,
        type: 'payroll'
      })
    }

    // Task: Monthly tax report (due 9th of next month)
    const nextMonth = getNextMonth(currentMonth)
    const taxReportDue = new Date(nextMonth + '-09')
    upcomingTasks.push({
      id: 'monthly_tax_report',
      title: 'Generate monthly tax report',
      description: 'Prepare PAYE and statutory deductions report',
      dueDate: taxReportDue.toISOString(),
      priority: 'medium' as const,
      type: 'compliance'
    })

    // Task: Check for expiring contracts (if any employees added in the last 6 months as temp/contract)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    const contractEmployees = await prisma.employee.count({
      where: {
        contractType: {
          in: ['CONTRACT', 'CASUAL']
        },
        createdAt: {
          gte: sixMonthsAgo
        },
        isActive: true
      }
    })

    if (contractEmployees > 0) {
      upcomingTasks.push({
        id: 'contract_review',
        title: 'Review temporary contracts',
        description: `${contractEmployees} contract${contractEmployees > 1 ? 's' : ''} may need renewal`,
        dueDate: getEndOfMonth(currentMonth).toISOString(),
        priority: 'medium' as const,
        type: 'hr'
      })
    }

    // Determine payroll summary status
    let payrollStatus: 'not_started' | 'in_progress' | 'completed' = 'not_started'
    if (processedPayrolls === 0) {
      payrollStatus = 'not_started'
    } else if (processedPayrolls < activeEmployeesCount) {
      payrollStatus = 'in_progress'
    } else {
      payrollStatus = 'completed'
    }

    // Build the response data
    const dashboardData = {
      stats: {
        totalEmployees,
        activeEmployees: activeEmployeesCount,
        totalPayroll: Math.round(totalMonthlyPayroll),
        payslipsGenerated: processedPayrolls,
        pendingPayrolls,
        lastPayrollDate,
        monthlyGrowth: Number(monthlyGrowth.toFixed(1)),
        complianceStatus: 'good' as const // You can implement actual compliance checks
      },

      payrollSummary: {
        currentMonth: formatMonthYear(currentMonth),
        totalEmployees: activeEmployeesCount,
        processedEmployees: processedPayrolls,
        totalGrossPay: Math.round(totalGrossPay),
        totalNetPay: Math.round(totalNetPay),
        totalDeductions: Math.round(totalDeductions),
        status: payrollStatus,
        dueDate: getEndOfMonth(currentMonth).toISOString().split('T')[0],
        lastProcessedDate: recentPayrollRuns.length > 0 
          ? recentPayrollRuns[0].processedAt.toISOString().split('T')[0]
          : null
      },

      recentActivities: recentActivities.slice(0, 8), // Limit to 8 most recent

      upcomingTasks,

      keyMetrics: {
        averageSalary: Math.round(averageSalary),
        totalDeductionsThisMonth: Math.round(totalDeductions),
        payrollAccuracy: 99.8, // You can implement actual accuracy calculation
        employeeSatisfaction: 94.5, // This would come from surveys/feedback
        complianceScore: 98.2 // This would be calculated based on compliance checks
      }
    }

    return NextResponse.json(dashboardData)

  } catch (error) {
    console.error('Dashboard API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard data',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// Helper functions
function getPreviousMonth(monthYear: string): string {
  const date = new Date(monthYear + '-01')
  date.setMonth(date.getMonth() - 1)
  return date.toISOString().slice(0, 7)
}

function getNextMonth(monthYear: string): string {
  const date = new Date(monthYear + '-01')
  date.setMonth(date.getMonth() + 1)
  return date.toISOString().slice(0, 7)
}

function getEndOfMonth(monthYear: string): Date {
  const date = new Date(monthYear + '-01')
  date.setMonth(date.getMonth() + 1)
  date.setDate(0) // Sets to last day of previous month (which is the month we want)
  return date
}

function formatMonthYear(monthYear: string): string {
  const date = new Date(monthYear + '-01')
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long' 
  })
}