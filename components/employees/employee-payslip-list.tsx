"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Download, FileText, Loader2 } from "lucide-react";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface Payroll {
  month: number;
  year: number;
}

interface Payslip {
  id: string;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  payroll: Payroll;
}

interface EmployeePayslipListProps {
  payslips: Payslip[];
}

export function EmployeePayslipList({ payslips }: EmployeePayslipListProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (payslipId: string) => {
    setDownloadingId(payslipId);
    
    try {
      const response = await fetch(`/api/payslip/${payslipId}`);
      
      if (!response.ok) {
        throw new Error("Failed to download payslip");
      }
      
      // Create a blob from the PDF Stream
      const blob = await response.blob();
      
      // Create a link element
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      
      // Get payslip details for filename
      const payslip = payslips.find(p => p.id === payslipId);
      const month = payslip ? monthNames[payslip.payroll.month - 1] : "Unknown";
      const year = payslip ? payslip.payroll.year : "Unknown";
      
      // Set the download attribute with filename
      link.download = `payslip-${month}-${year}.pdf`;
      
      // Append to the body
      document.body.appendChild(link);
      
      // Trigger download
      link.click();
      
      // Clean up
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading payslip:", error);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Period</TableHead>
            <TableHead>Gross Pay</TableHead>
            <TableHead>Total Deductions</TableHead>
            <TableHead>Net Pay</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payslips.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                No payslips found
              </TableCell>
            </TableRow>
          ) : (
            payslips.map((payslip) => (
              <TableRow key={payslip.id}>
                <TableCell>
                  {monthNames[payslip.payroll.month - 1]} {payslip.payroll.year}
                </TableCell>
                <TableCell>{formatCurrency(payslip.grossPay)}</TableCell>
                <TableCell>{formatCurrency(payslip.totalDeductions)}</TableCell>
                <TableCell>{formatCurrency(payslip.netPay)}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDownload(payslip.id)}
                    disabled={downloadingId === payslip.id}
                  >
                    {downloadingId === payslip.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}