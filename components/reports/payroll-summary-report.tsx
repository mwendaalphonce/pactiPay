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

interface Employee {
  employeeId: string;
  firstName: string;
  lastName: string;
}

interface Payslip {
  id: string;
  employee: Employee;
  basicSalary: number;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
}

interface PayrollData {
  payslips: Payslip[];
}

interface PayrollSummaryReportProps {
  data: PayrollData;
}

export function PayrollSummaryReport({ data }: PayrollSummaryReportProps) {
  const totals = {
    basicSalary: 0,
    grossPay: 0,
    totalDeductions: 0,
    netPay: 0,
  };

  // Calculate totals
  data.payslips.forEach((payslip) => {
    totals.basicSalary += payslip.basicSalary;
    totals.grossPay += payslip.grossPay;
    totals.totalDeductions += payslip.totalDeductions;
    totals.netPay += payslip.netPay;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.payslips.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Net Pay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.netPay)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Basic Salary</TableHead>
              <TableHead>Gross Pay</TableHead>
              <TableHead>Total Deductions</TableHead>
              <TableHead>Net Pay</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.payslips.map((payslip) => (
              <TableRow key={payslip.id}>
                <TableCell>{payslip.employee.employeeId}</TableCell>
                <TableCell>
                  {payslip.employee.firstName} {payslip.employee.lastName}
                </TableCell>
                <TableCell>{formatCurrency(payslip.basicSalary)}</TableCell>
                <TableCell>{formatCurrency(payslip.grossPay)}</TableCell>
                <TableCell>{formatCurrency(payslip.totalDeductions)}</TableCell>
                <TableCell>{formatCurrency(payslip.netPay)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-bold">
              <TableCell colSpan={2}>Totals</TableCell>
              <TableCell>{formatCurrency(totals.basicSalary)}</TableCell>
              <TableCell>{formatCurrency(totals.grossPay)}</TableCell>
              <TableCell>{formatCurrency(totals.totalDeductions)}</TableCell>
              <TableCell>{formatCurrency(totals.netPay)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}