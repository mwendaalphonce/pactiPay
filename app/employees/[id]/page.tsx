"use client"
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Edit, ArrowLeft, User, Briefcase, DollarSign, Calendar, CreditCard, Home, TrendingUp, Shield } from 'lucide-react';
import { Employee } from '@/types';

interface EmployeeWithRelations extends Employee {
  payrollRuns?: any[];
  salaryAdjustments?: any[];
  deductions?: any[];
  bonuses?: any[];
  insurancePremiums?: any[];
}

export default function EmployeeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [employee, setEmployee] = useState<EmployeeWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployee();
  }, [params.id]);

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/employees/${params.id}`);
      const data = await response.json();
      
      if (data.success) {
        setEmployee(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to load employee data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount?: number | null) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount || 0);
  };

  const formatDate = (date?: string | Date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-slate-600 mb-4">{error || 'Employee not found'}</p>
          <button
            onClick={() => router.push('/employees')}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to Employees
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/employees')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        {/* Employee Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 text-xl font-semibold">
              {employee.name?.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-slate-900 mb-1">{employee.name}</h1>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <span>{employee.employeeNumber || 'No employee number'}</span>
                <span className={`px-2 py-0.5 rounded text-xs ${employee.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {employee.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Basic Information */}
          <Section icon={<User className="w-5 h-5" />} title="Basic Information">
            <Field label="KRA PIN" value={employee.kraPin} />
            <Field label="National ID" value={employee.nationalId} />
            <Field label="Employee Number" value={employee.employeeNumber} />
            <Field label="Email" value={employee.email} />
            <Field label="Phone" value={employee.phoneNumber} />
            <Field label="Address" value={employee.address} />
          </Section>

          {/* Employment Details */}
          <Section icon={<Briefcase className="w-5 h-5" />} title="Employment">
            <Field label="Contract Type" value={employee.contractType} />
            <Field label="Employee Type" value={employee.employeeType} />
            <Field label="Residential Status" value={employee.residentialStatus} />
            <Field label="Start Date" value={formatDate(employee.startDate)} />
            <Field label="Status" value={employee.isActive ? 'Active' : 'Inactive'} />
          </Section>

          {/* Compensation */}
          <Section icon={<DollarSign className="w-5 h-5" />} title="Compensation">
            <Field label="Basic Salary" value={formatCurrency(employee.basicSalary)} />
            <Field label="Total Allowances" value={formatCurrency(employee.allowances)} />
            <Field label="Housing Allowance" value={formatCurrency(employee.housingAllowance)} />
            <Field label="Transport Allowance" value={formatCurrency(employee.transportAllowance)} />
            <Field label="Leave Pay" value={formatCurrency(employee.leavePay)} />
            <Field label="Other Allowances" value={formatCurrency(employee.otherAllowances)} />
          </Section>

          {/* Banking Details */}
          <Section icon={<CreditCard className="w-5 h-5" />} title="Banking">
            <Field label="Bank Name" value={employee.bankName} />
            <Field label="Bank Branch" value={employee.bankBranch} />
            <Field label="Account Number" value={employee.bankAccount} />
            <Field label="SWIFT Code" value={employee.swiftCode} />
          </Section>

          {/* Housing Benefits */}
          <Section icon={<Home className="w-5 h-5" />} title="Housing Benefits">
            <Field label="Housing Benefit" value={employee.housingBenefit} />
            <Field label="Value of Quarters" value={formatCurrency(employee.valueOfQuarters)} />
            <Field label="Actual Rent" value={formatCurrency(employee.actualRent)} />
          </Section>

          {/* Pension & Tax */}
          <Section icon={<Shield className="w-5 h-5" />} title="Pension & Tax">
            <Field label="Pension Scheme" value={employee.pensionScheme ? 'Yes' : 'No'} />
            <Field label="Pension Scheme No" value={employee.pensionSchemeNo} />
            <Field label="Owner Occupier Interest" value={formatCurrency(employee.ownerOccupierInterest)} />
          </Section>

          {/* Related Records */}
          <Section icon={<TrendingUp className="w-5 h-5" />} title="Related Records">
            <Field label="Payroll Runs" value={String(employee.payrollRuns?.length || 0)} />
            <Field label="Salary Adjustments" value={String(employee.salaryAdjustments?.length || 0)} />
            <Field label="Active Deductions" value={String(employee.deductions?.length || 0)} />
            <Field label="Pending Bonuses" value={String(employee.bonuses?.length || 0)} />
            <Field label="Insurance Premiums" value={String(employee.insurancePremiums?.length || 0)} />
          </Section>

          {/* Timestamps */}
          <Section icon={<Calendar className="w-5 h-5" />} title="Record Info">
            <Field label="Created At" value={formatDate(employee.createdAt)} />
            <Field label="Updated At" value={formatDate(employee.updatedAt)} />
          </Section>

        </div>
      </div>
    </div>
  );
}

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function Section({ icon, title, children }: SectionProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
        <div className="text-slate-600">{icon}</div>
        <h2 className="font-medium text-slate-900">{title}</h2>
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  value?: string | number | null;
}

function Field({ label, value }: FieldProps) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm text-slate-900 font-medium text-right">
        {value || '—'}
      </span>
    </div>
  );
}