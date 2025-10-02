"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/app/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StatutoryReport({ data }) {
  const totals = {
    paye: 0,
    nhif: 0,
    nssf: 0,
  };

  // Calculate totals
  data.payslips.forEach((payslip) => {
    totals.paye += payslip.paye;
    totals.nhif += payslip.nhif;
    totals.nssf += payslip.nssf;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total PAYE</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.paye)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total NHIF</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.nhif)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total NSSF</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.nssf)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>KRA PIN</TableHead>
              <TableHead>PAYE</TableHead>
              <TableHead>NHIF</TableHead>
              <TableHead>NSSF</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.payslips.map((payslip) => (
              <TableRow key={payslip.id}>
                <TableCell>{payslip.employee.employeeId}</TableCell>
                <TableCell>
                  {payslip.employee.firstName} {payslip.employee.lastName}
                </TableCell>
                <TableCell>{payslip.employee.kraPin}</TableCell>
                <TableCell>{formatCurrency(payslip.paye)}</TableCell>
                <TableCell>{formatCurrency(payslip.nhif)}</TableCell>
                <TableCell>{formatCurrency(payslip.nssf)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-bold">
              <TableCell colSpan={3}>Totals</TableCell>
              <TableCell>{formatCurrency(totals.paye)}</TableCell>
              <TableCell>{formatCurrency(totals.nhif)}</TableCell>
              <TableCell>{formatCurrency(totals.nssf)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}