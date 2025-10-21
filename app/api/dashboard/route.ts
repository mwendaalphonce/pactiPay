// src/app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface Activity {
  id: string
  type: 'payroll_processed' | 'employee_added' | 'employee_edited'
  description: string
  timestamp: string
  user: string
  metadata: Record<string, any>
}

interface Task {
  id: string
  title: string
  description: string
  dueDate: string
  priority: 'high' | 'medium' | 'low'
  type: 'payroll' | 'compliance' | 'hr'
}

export async function GET(request: NextRequest) {
  try {
    // 🔒 SECURITY: Get authenticated user's session
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'You must be associated with a company to view dashboard data'
        },
        { status: 401 }
      )
    }
    
    const companyId = session.user.companyId
    
    // Get current month for payroll calculations
    const now = new Date()
    const currentMonth = now.toISOString().slice(0, 7) // YYYY-MM format
    
    // 🔒 CRITICAL: ALL queries now filter by companyId
    const [
      employees,
      currentMonthPayrolls,
      recentPayrollRuns,
      recentEmployees,
      recentAdjustments,
      allPayrollsThisMonth,
      previousMonthPayrolls,
      contractEmployeesCount,
    ] = await Promise.all([
      // Get all employees FROM THIS COMPANY
      prisma.employee.findMany({
        where: {
          companyId: companyId // 🔒 SECURED
        },
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

      // Get current month payroll runs FROM THIS COMPANY
      prisma.payrollRun.findMany({
        where: {
          monthYear: currentMonth,
          employee: {
            companyId: companyId // 🔒 SECURED through relation
          }
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

      // Get recent payroll runs for activity feed FROM THIS COMPANY
      prisma.payrollRun.findMany({
        where: {
          employee: {
            companyId: companyId // 🔒 SECURED through relation
          }
        },
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

      // Get recently added employees FROM THIS COMPANY
      prisma.employee.findMany({
        where: {
          companyId: companyId // 🔒 SECURED
        },
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

      // Get recent salary adjustments FROM THIS COMPANY
      prisma.salaryAdjustment.findMany({
        where: {
          employee: {
            companyId: companyId // 🔒 SECURED through relation
          }
        },
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

      // Get all payrolls for this month for stats FROM THIS COMPANY
      prisma.payrollRun.findMany({
        where: {
          monthYear: currentMonth,
          employee: {
            companyId: companyId // 🔒 SECURED through relation
          }
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

      // Get previous month payrolls for growth calculation FROM THIS COMPANY
      prisma.payrollRun.findMany({
        where: {
          monthYear: getPreviousMonth(currentMonth),
          employee: {
            companyId: companyId // 🔒 SECURED through relation
          }
        },
        select: {
          netPay: true
        }
      }),

      // Check for expiring contracts FROM THIS COMPANY
      prisma.employee.count({
        where: {
          companyId: companyId, // 🔒 SECURED
          contractType: {
            in: ['CONTRACT', 'CASUAL']
          },
          createdAt: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
          },
          isActive: true
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

    // Build recent activities from different sources - ✅ TYPED
    const recentActivities: Activity[] = []

    // Add payroll activities
    recentPayrollRuns.slice(0, 3).forEach(payroll => {
      recentActivities.push({
        id: `payroll_${payroll.id}`,
        type: 'payroll_processed',
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
        type: 'employee_added',
        description: `New employee added: ${employee.name}`,
        timestamp: employee.createdAt.toISOString(),
        user: session.user.name || 'HR Manager',
        metadata: {}
      })
    })

    // Add salary adjustment activities
    recentAdjustments.slice(0, 2).forEach(adjustment => {
      recentActivities.push({
        id: `adjustment_${adjustment.id}`,
        type: 'employee_edited',
        description: `Updated salary for ${adjustment.employee.name}`,
        timestamp: adjustment.createdAt.toISOString(),
        user: session.user.name || 'HR Manager',
        metadata: {
          oldSalary: adjustment.previousBasicSalary,
          newSalary: adjustment.newBasicSalary
        }
      })
    })

    // Sort activities by timestamp (most recent first)
    recentActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Generate upcoming tasks based on actual data - ✅ TYPED
    const upcomingTasks: Task[] = []

    // Task: Process pending payrolls
    if (pendingPayrolls > 0) {
      upcomingTasks.push({
        id: 'pending_payrolls',
        title: `Process remaining ${pendingPayrolls} payrolls`,
        description: `Complete ${formatMonthYear(currentMonth)} payroll processing`,
        dueDate: getEndOfMonth(currentMonth).toISOString(),
        priority: pendingPayrolls > 5 ? 'high' : 'medium',
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
      priority: 'medium',
      type: 'compliance'
    })

    // Task: Check for expiring contracts
    if (contractEmployeesCount > 0) {
      upcomingTasks.push({
        id: 'contract_review',
        title: 'Review temporary contracts',
        description: `${contractEmployeesCount} contract${contractEmployeesCount > 1 ? 's' : ''} may need renewal`,
        dueDate: getEndOfMonth(currentMonth).toISOString(),
        priority: 'medium',
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
        complianceStatus: 'good' as const
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

      recentActivities: recentActivities.slice(0, 8),

      upcomingTasks,

      keyMetrics: {
        averageSalary: Math.round(averageSalary),
        totalDeductionsThisMonth: Math.round(totalDeductions),
        payrollAccuracy: 99.8,
        employeeSatisfaction: 94.5,
        complianceScore: 98.2
      }
    }

    return NextResponse.json({
      success: true,
      data: dashboardData
    })

  } catch (error) {
    console.error('Dashboard API error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch dashboard data',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
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
  date.setDate(0)
  return date
}

function formatMonthYear(monthYear: string): string {
  const date = new Date(monthYear + '-01')
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long' 
  })
}