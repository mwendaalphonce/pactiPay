import Papa from "papaparse";

export interface P10EmployeeData {
  employeeName: string;
  nationalId: string;
  kraPin: string;
  employeeNumber?: string;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  leavePay: number;
  grossPay: number;
  paye: number;
  nssf: number;
  shif: number;
  housingLevy: number;
  otherDeductions: number;
  totalDeductions: number;
  netPay: number;
  taxableIncome: number;
}

export const P10_CSV_HEADERS = [
  "Employee Name",
  "National ID",
  "KRA PIN",
  "Employee Number",
  "Basic Salary",
  "Housing Allowance",
  "Transport Allowance",
  "Other Allowances",
  "Leave Pay",
  "Gross Pay",
  "PAYE",
  "NSSF",
  "SHIF",
  "Housing Levy",
  "Other Deductions",
  "Total Deductions",
  "Net Pay",
  "Taxable Income",
];

export function formatP10CSV(
  employees: P10EmployeeData[],
  companyName: string,
  kraPin: string,
  monthYear: string
): string {
  const header = [
    `P10 RETURN - ${companyName}`,
    `KRA PIN: ${kraPin}`,
    `TAX PERIOD: ${monthYear}`,
    `SUBMISSION DATE: ${new Date().toISOString().split("T")[0]}`,
    `TOTAL EMPLOYEES: ${employees.length}`,
    "",
  ];

  const formattedRows = employees.map((emp) => ({
    "Employee Name": emp.employeeName,
    "National ID": emp.nationalId,
    "KRA PIN": emp.kraPin,
    "Employee Number": emp.employeeNumber || "",
    "Basic Salary": emp.basicSalary.toFixed(2),
    "Housing Allowance": emp.housingAllowance.toFixed(2),
    "Transport Allowance": emp.transportAllowance.toFixed(2),
    "Other Allowances": emp.otherAllowances.toFixed(2),
    "Leave Pay": emp.leavePay.toFixed(2),
    "Gross Pay": emp.grossPay.toFixed(2),
    PAYE: emp.paye.toFixed(2),
    NSSF: emp.nssf.toFixed(2),
    SHIF: emp.shif.toFixed(2),
    "Housing Levy": emp.housingLevy.toFixed(2),
    "Other Deductions": emp.otherDeductions.toFixed(2),
    "Total Deductions": emp.totalDeductions.toFixed(2),
    "Net Pay": emp.netPay.toFixed(2),
    "Taxable Income": emp.taxableIncome.toFixed(2),
  }));

  const csv = header.join("\n") + "\n" + Papa.unparse(formattedRows);
  return csv;
}

export function validateKraPin(kraPin: string): boolean {
  // Format: Kxxxxxx or Pxxxxxx (9 digits + letter)
  return /^[KP]\d{9}[A-Z]$/.test(kraPin.toUpperCase());
}

export function validateNationalId(id: string): boolean {
  // Kenya national ID: 1-8 digits
  const cleaned = id.replace(/\D/g, "");
  return cleaned.length >= 1 && cleaned.length <= 8;
}

export function getMonthYearString(month: number, year: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function isValidTaxPeriod(month: number, year: number): boolean {
  return month >= 1 && month <= 12 && year >= 2000 && year <= 2100;
}