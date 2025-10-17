"use client"
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Briefcase, DollarSign, CreditCard, Home, Shield, Save, AlertCircle, CheckCircle2, Info } from 'lucide-react';

type TabId = 'personal' | 'salary' | 'p10' | 'banking';

interface ValidationErrors {
  [key: string]: string;
}

interface TouchedFields {
  [key: string]: boolean;
}

export default function NewEmployeePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('personal');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    // Personal Information
    name: '',
    kraPin: '',
    nationalId: '',
    employeeNumber: '',
    email: '',
    phoneNumber: '',
    address: '',
    startDate: new Date().toISOString().split('T')[0],
    contractType: 'PERMANENT' as const,
    
    // Salary & Allowances
    basicSalary: 0,
    housingAllowance: 0,
    transportAllowance: 0,
    leavePay: 0,
    otherAllowances: 0,
    
    // P10 Tax Information
    residentialStatus: 'RESIDENT' as const,
    employeeType: 'PRIMARY' as const,
    pensionScheme: false,
    pensionSchemeNo: '',
    housingBenefit: 'NOT_PROVIDED' as const,
    valueOfQuarters: 0,
    actualRent: 0,
    ownerOccupierInterest: 0,
    
    // Banking Details
    bankName: '',
    bankBranch: '',
    bankAccount: '',
    swiftCode: '',
  });

  const tabs = [
    { id: 'personal' as TabId, label: 'Personal', icon: User },
    { id: 'salary' as TabId, label: 'Salary', icon: DollarSign },
    { id: 'p10' as TabId, label: 'P10 Tax', icon: Shield },
    { id: 'banking' as TabId, label: 'Banking', icon: CreditCard },
  ];

  const kenyanBanks = [
    'Equity Bank', 'KCB Bank', 'Cooperative Bank', 'NCBA Bank', 
    'Standard Chartered', 'Absa Bank', 'I&M Bank', 'Diamond Trust Bank',
    'NIC Bank', 'Prime Bank', 'Family Bank', 'Stanbic Bank'
  ];

  const contractTypes = ['PERMANENT', 'CONTRACT', 'CASUAL', 'INTERN'];

  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Full name is required';
        if (value.trim().length < 3) return 'Name must be at least 3 characters';
        break;
      case 'kraPin':
        if (!value) return 'KRA PIN is required';
        if (!/^[A-Z]\d{9}[A-Z]$/.test(value.toUpperCase())) {
          return 'Invalid KRA PIN format (e.g., A123456789Z)';
        }
        break;
      case 'nationalId':
        if (!value.trim()) return 'National ID is required';
        if (!/^\d{7,8}$/.test(value)) return 'National ID must be 7-8 digits';
        break;
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Invalid email format';
        }
        break;
      case 'phoneNumber':
        if (value && !/^(\+254|0)[17]\d{8}$/.test(value.replace(/\s/g, ''))) {
          return 'Invalid phone number (use Kenyan format)';
        }
        break;
      case 'startDate':
        if (!value) return 'Start date is required';
        break;
      case 'basicSalary':
        if (!value || value <= 0) return 'Basic salary must be greater than 0';
        if (value < 15201) return 'Below minimum wage (KSh 15,201)';
        if (value > 10000000) return 'Salary seems unusually high';
        break;
      case 'bankName':
        if (!value) return 'Bank name is required';
        break;
      case 'bankBranch':
        if (!value.trim()) return 'Bank branch is required';
        break;
      case 'bankAccount':
        if (!value.trim()) return 'Account number is required';
        if (!/^\d{10,16}$/.test(value.replace(/\s/g, ''))) {
          return 'Account number must be 10-16 digits';
        }
        break;
      case 'pensionSchemeNo':
        if (formData.pensionScheme && !value.trim()) {
          return 'Required when enrolled in pension scheme';
        }
        break;
      case 'valueOfQuarters':
        if (formData.housingBenefit !== 'NOT_PROVIDED' && (!value || value <= 0)) {
          return 'Required when housing benefit is provided';
        }
        break;
    }
    return '';
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors(prev => {
        const newErrors = { ...prev };
        if (error) {
          newErrors[field] = error;
        } else {
          delete newErrors[field];
        }
        return newErrors;
      });
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field as keyof typeof formData]);
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const validateAllFields = (): boolean => {
    const newErrors: ValidationErrors = {};
    const allFields = [
      'name', 'kraPin', 'nationalId', 'email', 'phoneNumber', 'startDate',
      'basicSalary', 'bankName', 'bankBranch', 'bankAccount', 
      'pensionSchemeNo', 'valueOfQuarters'
    ];

    allFields.forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData]);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    setTouched(Object.fromEntries(allFields.map(f => [f, true])));

    if (Object.keys(newErrors).length > 0) {
      // Navigate to first tab with errors
      if (newErrors.name || newErrors.kraPin || newErrors.nationalId || newErrors.email || newErrors.phoneNumber || newErrors.startDate) {
        setActiveTab('personal');
      } else if (newErrors.basicSalary) {
        setActiveTab('salary');
      } else if (newErrors.pensionSchemeNo || newErrors.valueOfQuarters) {
        setActiveTab('p10');
      } else if (newErrors.bankName || newErrors.bankBranch || newErrors.bankAccount) {
        setActiveTab('banking');
      }
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validateAllFields()) {
      setGeneralError('Please fix all validation errors before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      const totalAllowances = 
        (formData.housingAllowance || 0) +
        (formData.transportAllowance || 0) +
        (formData.leavePay || 0) +
        (formData.otherAllowances || 0);

      // Prepare payload matching the API structure
      const payload = {
        name: formData.name.trim(),
        kraPin: formData.kraPin.trim().toUpperCase(),
        nationalId: formData.nationalId.trim(),
        employeeNumber: formData.employeeNumber.trim() || undefined,
        email: formData.email.trim() || undefined,
        phoneNumber: formData.phoneNumber.trim() || undefined,
        address: formData.address.trim() || undefined,
        startDate: formData.startDate,
        contractType: formData.contractType,
        isActive: true,
        
        // Salary
        basicSalary: parseFloat(formData.basicSalary.toString()) || 0,
        allowances: totalAllowances,
        housingAllowance: parseFloat(formData.housingAllowance.toString()) || 0,
        transportAllowance: parseFloat(formData.transportAllowance.toString()) || 0,
        leavePay: parseFloat(formData.leavePay.toString()) || 0,
        otherAllowances: parseFloat(formData.otherAllowances.toString()) || 0,
        
        // P10 Tax Info
        residentialStatus: formData.residentialStatus,
        employeeType: formData.employeeType,
        pensionScheme: formData.pensionScheme,
        pensionSchemeNo: formData.pensionScheme ? formData.pensionSchemeNo.trim() : undefined,
        housingBenefit: formData.housingBenefit,
        valueOfQuarters: parseFloat(formData.valueOfQuarters.toString()) || 0,
        actualRent: parseFloat(formData.actualRent.toString()) || 0,
        ownerOccupierInterest: parseFloat(formData.ownerOccupierInterest.toString()) || 0,
        
        // Banking
        bankName: formData.bankName.trim(),
        bankBranch: formData.bankBranch.trim(),
        bankAccount: formData.bankAccount.trim(),
        swiftCode: formData.swiftCode.trim() || undefined,
      };

      console.log('Submitting payload:', payload);

      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      console.log('API Response:', result);

      if (!response.ok || !result.success) {
        const errorMessage = result.message || result.error || 'Failed to create employee';
        
        // Log full error details for debugging
        console.error('API Error Details:', {
          status: response.status,
          result: result,
          validation: result.validation
        });
        
        // Check for specific field validation errors
        if (result.validation) {
          // If API returns field-specific errors, map them
          const fieldErrors: ValidationErrors = {};
          Object.keys(result.validation).forEach(field => {
            fieldErrors[field] = result.validation[field];
          });
          setErrors(fieldErrors);
          setGeneralError('Please check the highlighted fields and correct the errors.');
          
          // Navigate to first tab with error
          if (fieldErrors.name || fieldErrors.kraPin || fieldErrors.nationalId) {
            setActiveTab('personal');
          } else if (fieldErrors.basicSalary) {
            setActiveTab('salary');
          } else if (fieldErrors.pensionSchemeNo || fieldErrors.valueOfQuarters) {
            setActiveTab('p10');
          } else if (fieldErrors.bankName || fieldErrors.bankBranch || fieldErrors.bankAccount) {
            setActiveTab('banking');
          }
          return;
        }
        
        if (errorMessage.toLowerCase().includes('bank')) {
          setActiveTab('banking');
          setGeneralError('Banking details are invalid. Please review and correct them.');
        } else if (errorMessage.toLowerCase().includes('kra') || errorMessage.toLowerCase().includes('pin')) {
          setActiveTab('personal');
          setGeneralError('KRA PIN is invalid or already exists.');
        } else if (errorMessage.toLowerCase().includes('email')) {
          setActiveTab('personal');
          setGeneralError('Email address is invalid or already in use.');
        } else if (errorMessage.toLowerCase().includes('national id')) {
          setActiveTab('personal');
          setGeneralError('National ID is invalid or already exists.');
        } else {
          setGeneralError(errorMessage);
        }
        
        return;
      }

      router.push('/employees');
    } catch (err: any) {
      console.error('Error creating employee:', err);
      setGeneralError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTabStatus = (tabId: TabId): 'complete' | 'error' | 'default' => {
    const tabFields = {
      personal: ['name', 'kraPin', 'nationalId', 'email', 'phoneNumber', 'startDate'],
      salary: ['basicSalary'],
      p10: ['pensionSchemeNo', 'valueOfQuarters'],
      banking: ['bankName', 'bankBranch', 'bankAccount']
    };

    const fields = tabFields[tabId];
    const hasError = fields.some(f => errors[f]);
    const allTouched = fields.some(f => touched[f]);
    
    if (hasError) return 'error';
    if (allTouched) return 'complete';
    return 'default';
  };

  const totalAllowances = 
    (formData.housingAllowance || 0) +
    (formData.transportAllowance || 0) +
    (formData.leavePay || 0) +
    (formData.otherAllowances || 0);

  const grossSalary = (formData.basicSalary || 0) + totalAllowances;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <InputField 
                  label="Full Name"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  error={touched.name ? errors.name : undefined}
                  placeholder="John Kamau Mwangi"
                />
              </div>
              
              <InputField 
                label="KRA PIN"
                required
                value={formData.kraPin}
                onChange={(e) => handleInputChange('kraPin', e.target.value.toUpperCase())}
                onBlur={() => handleBlur('kraPin')}
                error={touched.kraPin ? errors.kraPin : undefined}
                placeholder="A123456789Z"
                maxLength={11}
              />
              
              <InputField 
                label="National ID"
                required
                value={formData.nationalId}
                onChange={(e) => handleInputChange('nationalId', e.target.value)}
                onBlur={() => handleBlur('nationalId')}
                error={touched.nationalId ? errors.nationalId : undefined}
                placeholder="12345678"
              />
              
              <InputField 
                label="Employee Number"
                value={formData.employeeNumber}
                onChange={(e) => handleInputChange('employeeNumber', e.target.value)}
                placeholder="Optional"
              />
              
              <InputField 
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                error={touched.email ? errors.email : undefined}
                placeholder="employee@example.com"
              />
              
              <InputField 
                label="Phone Number"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                onBlur={() => handleBlur('phoneNumber')}
                error={touched.phoneNumber ? errors.phoneNumber : undefined}
                placeholder="0712345678"
              />
              
              <InputField 
                label="Start Date"
                required
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                onBlur={() => handleBlur('startDate')}
                error={touched.startDate ? errors.startDate : undefined}
              />
              
              <SelectField
                label="Contract Type"
                required
                value={formData.contractType}
                onChange={(e) => handleInputChange('contractType', e.target.value as 'PERMANENT' | 'CONTRACT' | 'CASUAL' | 'INTERN')}
                options={contractTypes.map(t => ({ value: t, label: t.charAt(0) + t.slice(1).toLowerCase() }))}
              />
              
              <div className="col-span-2">
                <InputField 
                  label="Physical Address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>
        );

      case 'salary':
        return (
          <div className="space-y-6">
            <div>
              <InputField 
                label="Basic Monthly Salary (KSh)"
                required
                type="number"
                value={formData.basicSalary}
                onChange={(e) => handleInputChange('basicSalary', parseFloat(e.target.value) || 0)}
                onBlur={() => handleBlur('basicSalary')}
                error={touched.basicSalary ? errors.basicSalary : undefined}
                placeholder="50000"
                min="15201"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum: KSh 15,201 (Nairobi minimum wage)</p>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-blue-500" />
                <h4 className="text-sm font-medium">Allowances Breakdown</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <InputField 
                  label="Housing Allowance (KSh)"
                  type="number"
                  value={formData.housingAllowance}
                  onChange={(e) => handleInputChange('housingAllowance', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                />
                
                <InputField 
                  label="Transport Allowance (KSh)"
                  type="number"
                  value={formData.transportAllowance}
                  onChange={(e) => handleInputChange('transportAllowance', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                />
                
                <InputField 
                  label="Leave Pay (KSh)"
                  type="number"
                  value={formData.leavePay}
                  onChange={(e) => handleInputChange('leavePay', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                />
                
                <InputField 
                  label="Other Allowances (KSh)"
                  type="number"
                  value={formData.otherAllowances}
                  onChange={(e) => handleInputChange('otherAllowances', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-1">
              <p className="text-sm text-blue-800">
                Total Allowances: <span className="font-semibold">KSh {totalAllowances.toLocaleString()}</span>
              </p>
              <p className="text-sm text-blue-900 font-semibold">
                Gross Monthly Salary: KSh {grossSalary.toLocaleString()}
              </p>
            </div>
          </div>
        );

      case 'p10':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <SelectField
                label="Residential Status"
                required
                value={formData.residentialStatus}
                onChange={(e) => handleInputChange('residentialStatus', e.target.value as 'RESIDENT' | 'NON_RESIDENT')}
                options={[
                  { value: 'RESIDENT', label: 'Resident' },
                  { value: 'NON_RESIDENT', label: 'Non-Resident' }
                ]}
                helpText="Resident if staying in Kenya for 183+ days per year"
              />
              
              <SelectField
                label="Employee Type"
                required
                value={formData.employeeType}
                onChange={(e) => handleInputChange('employeeType', e.target.value as 'PRIMARY' | 'SECONDARY')}
                options={[
                  { value: 'PRIMARY', label: 'Primary Employee' },
                  { value: 'SECONDARY', label: 'Secondary Employee' }
                ]}
                helpText="Primary if this is their main employment"
              />
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Pension/Retirement Scheme</h4>
              
              <CheckboxField
                label="Member of registered pension scheme?"
                checked={formData.pensionScheme}
                onChange={(e) => handleInputChange('pensionScheme', e.target.checked)}
              />

              {formData.pensionScheme && (
                <div className="mt-3 ml-6">
                  <InputField 
                    label="Pension Scheme Registration No."
                    required
                    value={formData.pensionSchemeNo}
                    onChange={(e) => handleInputChange('pensionSchemeNo', e.target.value)}
                    onBlur={() => handleBlur('pensionSchemeNo')}
                    error={touched.pensionSchemeNo ? errors.pensionSchemeNo : undefined}
                    placeholder="e.g., KRAPWD123"
                  />
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Housing/Accommodation Benefit</h4>
              
              <SelectField
                label="Housing Benefit Type"
                value={formData.housingBenefit}
                onChange={(e) => handleInputChange('housingBenefit', e.target.value as 'NOT_PROVIDED' | 'EMPLOYER_OWNED' | 'EMPLOYER_RENTED' | 'AGRICULTURE_FARM')}
                options={[
                  { value: 'NOT_PROVIDED', label: 'Benefit not given' },
                  { value: 'EMPLOYER_OWNED', label: "Employer's Owned House" },
                  { value: 'EMPLOYER_RENTED', label: "Employer's Rented House" },
                  { value: 'AGRICULTURE_FARM', label: 'Agriculture Farm' }
                ]}
              />

              {formData.housingBenefit !== 'NOT_PROVIDED' && (
                <div className="grid grid-cols-2 gap-4 mt-3 ml-6">
                  <InputField 
                    label="Value of Quarters (KSh)"
                    type="number"
                    value={formData.valueOfQuarters}
                    onChange={(e) => handleInputChange('valueOfQuarters', parseFloat(e.target.value) || 0)}
                    onBlur={() => handleBlur('valueOfQuarters')}
                    error={touched.valueOfQuarters ? errors.valueOfQuarters : undefined}
                    placeholder="0"
                    min="0"
                  />
                  
                  <InputField 
                    label="Actual Rent/Recovery (KSh)"
                    type="number"
                    value={formData.actualRent}
                    onChange={(e) => handleInputChange('actualRent', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                  />
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Tax Relief</h4>
              
              <InputField 
                label="Owner Occupier Interest (KSh)"
                type="number"
                value={formData.ownerOccupierInterest}
                onChange={(e) => handleInputChange('ownerOccupierInterest', parseFloat(e.target.value) || 0)}
                placeholder="0"
                min="0"
                helpText="Monthly mortgage interest (max relief: KSh 25,000/month)"
              />
            </div>
          </div>
        );

      case 'banking':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <SelectField
                label="Bank Name"
                required
                value={formData.bankName}
                onChange={(e) => handleInputChange('bankName', e.target.value)}
                onBlur={() => handleBlur('bankName')}
                error={touched.bankName ? errors.bankName : undefined}
                options={kenyanBanks.map(b => ({ value: b, label: b }))}
                placeholder="Select bank"
              />
              
              <InputField 
                label="Bank Branch"
                required
                value={formData.bankBranch}
                onChange={(e) => handleInputChange('bankBranch', e.target.value)}
                onBlur={() => handleBlur('bankBranch')}
                error={touched.bankBranch ? errors.bankBranch : undefined}
                placeholder="e.g., Westlands"
              />
              
              <InputField 
                label="Account Number"
                required
                value={formData.bankAccount}
                onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                onBlur={() => handleBlur('bankAccount')}
                error={touched.bankAccount ? errors.bankAccount : undefined}
                placeholder="0123456789012"
              />
              
              <InputField 
                label="SWIFT Code"
                value={formData.swiftCode}
                onChange={(e) => handleInputChange('swiftCode', e.target.value.toUpperCase())}
                placeholder="Optional"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/employees')}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {formData.name || 'New Employee'}
                  </h1>
                  <p className="text-xs text-gray-500">Employee Information</p>
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-6">
          {/* Error Banner */}
          {generalError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800">{generalError}</p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50">
              <div className="flex">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const status = getTabStatus(tab.id);
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                        activeTab === tab.id
                          ? 'border-blue-600 text-blue-600 bg-white'
                          : status === 'error'
                          ? 'border-transparent text-red-600 hover:bg-red-50'
                          : 'border-transparent text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                      {status === 'error' && (
                        <AlertCircle className="w-3 h-3 text-red-500" />
                      )}
                      {status === 'complete' && activeTab !== tab.id && (
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {renderTabContent()}
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-4 flex justify-between items-center">
            <button
              type="button"
              onClick={() => router.push('/employees')}
              className="px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <div className="flex gap-2">
              {activeTab !== 'personal' && (
                <button
                  type="button"
                  onClick={() => {
                    const currentIndex = tabs.findIndex(t => t.id === activeTab);
                    if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1].id);
                  }}
                  className="px-4 py-1.5 text-sm text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Previous
                </button>
              )}
              {activeTab !== 'banking' ? (
                <button
                  type="button"
                  onClick={() => {
                    const currentIndex = tabs.findIndex(t => t.id === activeTab);
                    if (currentIndex < tabs.length - 1) setActiveTab(tabs[currentIndex + 1].id);
                  }}
                  className="px-4 py-1.5 text-sm bg-gray-800 text-white hover:bg-gray-900 rounded-lg transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting ? 'Saving...' : 'Save Employee'}
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

interface InputFieldProps {
  label: string;
  required?: boolean;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  min?: string;
  maxLength?: number;
  helpText?: string;
}

function InputField({ label, required, type = 'text', value, onChange, onBlur, error, placeholder, min, maxLength, helpText }: InputFieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        min={min}
        maxLength={maxLength}
        className={`w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
          error ? 'border-red-300 bg-red-50 focus:ring-red-500' : 'border-gray-300 focus:border-transparent'
        }`}
      />
      {error && (
        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
      {helpText && !error && (
        <p className="mt-1 text-xs text-gray-500">{helpText}</p>
      )}
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  required?: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: () => void;
  error?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  helpText?: string;
}

function SelectField({ label, required, value, onChange, onBlur, error, options, placeholder, helpText }: SelectFieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={`w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
          error ? 'border-red-300 bg-red-50 focus:ring-red-500' : 'border-gray-300 focus:border-transparent'
        }`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
      {helpText && !error && (
        <p className="mt-1 text-xs text-gray-500">{helpText}</p>
      )}
    </div>
  );
}

interface CheckboxFieldProps {
  label: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function CheckboxField({ label, checked, onChange }: CheckboxFieldProps) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 transition-colors"
      />
      <label className="text-sm text-gray-700 cursor-pointer select-none">
        {label}
      </label>
    </div>
  );
}