"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Define proper types for the component props and data
interface Employee {
  id: string;
  employeeId: string;
  name: string;
  position: string;
  grossPay: number;
}

interface DepartmentCost {
  count: number;
  totalGrossPay: number;
  employees: Employee[];
}

interface Payslip {
  id: string;
  grossPay: number;
  employee: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    position?: string;
    department?: {
      name: string;
    };
  };
}

interface EmployeeCostReportProps {
  data: {
    payslips: Payslip[];
  };
}

export function EmployeeCostReport({ data }: EmployeeCostReportProps) {
  // Group by department
  const departmentCosts: Record<string, DepartmentCost> = {};
  let totalCost = 0;

  data.payslips.forEach((payslip) => {
    const departmentName = payslip.employee.department?.name || "Unassigned";
    
    if (!departmentCosts[departmentName]) {
      departmentCosts[departmentName] = {
        count: 0,
        totalGrossPay: 0,
        employees: [],
      };
    }
    
    departmentCosts[departmentName].count++;
    departmentCosts[departmentName].totalGrossPay += payslip.grossPay;
    departmentCosts[departmentName].employees.push({
      id: payslip.employee.id,
      employeeId: payslip.employee.employeeId,
      name: `${payslip.employee.firstName} ${payslip.employee.lastName}`,
      position: payslip.employee.position || "Not specified",
      grossPay: payslip.grossPay,
    });
    
    totalCost += payslip.grossPay;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Employee Cost</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {Object.entries(departmentCosts).map(([department, deptData]) => (
          <div key={department} className="space-y-2">
            <h3 className="text-lg font-semibold">{department}</h3>
            <div className="text-sm text-gray-500">
              {deptData.count} employees | Total: {formatCurrency(deptData.totalGrossPay)}
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Gross Pay</TableHead>
                    <TableHead>% of Dept. Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deptData.employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>{employee.employeeId}</TableCell>
                      <TableCell>{employee.name}</TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell>{formatCurrency(employee.grossPay)}</TableCell>
                      <TableCell>
                        {((employee.grossPay / deptData.totalGrossPay) * 100).toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold">
                    <TableCell colSpan={3}>Department Total</TableCell>
                    <TableCell>{formatCurrency(deptData.totalGrossPay)}</TableCell>
                    <TableCell>
                      {((deptData.totalGrossPay / totalCost) * 100).toFixed(2)}% of total
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}