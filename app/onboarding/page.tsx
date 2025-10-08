"use client"

import { useState } from 'react'
import  React  from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Building2, 
  FileText, 
  MapPin, 
  CreditCard, 
  Settings,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

const STEPS = [
  { id: 1, name: 'Company Basics', icon: Building2, description: 'Essential company information' },
  { id: 2, name: 'Registration Details', icon: FileText, description: 'Statutory registration numbers' },
  { id: 3, name: 'Location', icon: MapPin, description: 'Company address details' },
  { id: 4, name: 'Bank Details', icon: CreditCard, description: 'Banking information (optional)' },
  { id: 5, name: 'Preferences', icon: Settings, description: 'Payroll settings' },
]

export default function OnboardingPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Form data state
  const [formData, setFormData] = useState({
    // Step 1: Company Basics
    companyName: '',
    email: '',
    phone: '',

    // Step 2: Registration Details
    businessRegNo: '',
    kraPin: '',
    nssfNumber: '',
    nhifNumber: '',
    shifNumber: '',
    housingLevy: '',

    // Step 3: Location
    physicalAddress: '',
    postalAddress: '',
    city: '',
    county: '',

    // Step 4: Bank Details
    bankName: '',
    bankBranch: '',
    bankAccount: '',
    swiftCode: '',

    // Step 5: Preferences
    payrollDay: 25,
    signatoryName: '',
    signatoryTitle: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 1:
        if (!formData.companyName || formData.companyName.length < 2) {
          newErrors.companyName = 'Company name must be at least 2 characters'
        }
        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Valid email address is required'
        }
        if (formData.phone && formData.phone.length < 10) {
          newErrors.phone = 'Phone number must be at least 10 digits'
        }
        break

      case 2:
        if (!formData.kraPin) {
          newErrors.kraPin = 'KRA PIN is required'
        } else if (!/^[A-Z]\d{9}[A-Z]$/.test(formData.kraPin.toUpperCase())) {
          newErrors.kraPin = 'Invalid KRA PIN format (e.g., A123456789Z)'
        }
        break

      case 3:
        if (!formData.physicalAddress || formData.physicalAddress.length < 5) {
          newErrors.physicalAddress = 'Physical address is required'
        }
        if (!formData.city || formData.city.length < 2) {
          newErrors.city = 'City is required'
        }
        if (!formData.county || formData.county.length < 2) {
          newErrors.county = 'County is required'
        }
        break

      case 4:
        // Bank details are optional, but validate if provided
        if (formData.bankName && !formData.bankAccount) {
          newErrors.bankAccount = 'Bank account is required when bank name is provided'
        }
        break

      case 5:
        if (formData.payrollDay < 1 || formData.payrollDay > 28) {
          newErrors.payrollDay = 'Payroll day must be between 1 and 28'
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length))
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete onboarding')
      }

      // Update session
      await update({
        hasCompletedOnboarding: true,
        companyId: data.companyId,
      })

      toast.success('Onboarding completed successfully!')
      router.push('/dashboard')
    } catch (error) {
      console.error('Onboarding error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to complete onboarding')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                placeholder="Enter your company name"
                className={errors.companyName ? 'border-red-500' : ''}
              />
              {errors.companyName && (
                <p className="text-sm text-red-500 mt-1">{errors.companyName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Company Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="company@example.com"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Company Phone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+254 712 345 678"
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
              )}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Enter your company's statutory registration numbers. KRA PIN is required.
              </AlertDescription>
            </Alert>

            <div>
              <Label htmlFor="kraPin">KRA PIN *</Label>
              <Input
                id="kraPin"
                name="kraPin"
                value={formData.kraPin}
                onChange={handleInputChange}
                placeholder="A123456789Z"
                maxLength={11}
                className={errors.kraPin ? 'border-red-500' : ''}
              />
              {errors.kraPin && (
                <p className="text-sm text-red-500 mt-1">{errors.kraPin}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">Format: A123456789Z</p>
            </div>

            <div>
              <Label htmlFor="businessRegNo">Business Registration Number</Label>
              <Input
                id="businessRegNo"
                name="businessRegNo"
                value={formData.businessRegNo}
                onChange={handleInputChange}
                placeholder="Certificate of Incorporation number"
              />
            </div>

            <div>
              <Label htmlFor="nssfNumber">NSSF Employer Number</Label>
              <Input
                id="nssfNumber"
                name="nssfNumber"
                value={formData.nssfNumber}
                onChange={handleInputChange}
                placeholder="NSSF number"
              />
            </div>

            <div>
              <Label htmlFor="nhifNumber">NHIF Employer Number</Label>
              <Input
                id="nhifNumber"
                name="nhifNumber"
                value={formData.nhifNumber}
                onChange={handleInputChange}
                placeholder="NHIF number (legacy)"
              />
            </div>

            <div>
              <Label htmlFor="shifNumber">SHIF Number</Label>
              <Input
                id="shifNumber"
                name="shifNumber"
                value={formData.shifNumber}
                onChange={handleInputChange}
                placeholder="SHIF number (replaces NHIF)"
              />
            </div>

            <div>
              <Label htmlFor="housingLevy">Housing Levy Number</Label>
              <Input
                id="housingLevy"
                name="housingLevy"
                value={formData.housingLevy}
                onChange={handleInputChange}
                placeholder="Housing Levy number"
              />
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="physicalAddress">Physical Address *</Label>
              <Input
                id="physicalAddress"
                name="physicalAddress"
                value={formData.physicalAddress}
                onChange={handleInputChange}
                placeholder="Building name, street, area"
                className={errors.physicalAddress ? 'border-red-500' : ''}
              />
              {errors.physicalAddress && (
                <p className="text-sm text-red-500 mt-1">{errors.physicalAddress}</p>
              )}
            </div>

            <div>
              <Label htmlFor="postalAddress">Postal Address</Label>
              <Input
                id="postalAddress"
                name="postalAddress"
                value={formData.postalAddress}
                onChange={handleInputChange}
                placeholder="P.O. Box 12345-00100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Nairobi"
                  className={errors.city ? 'border-red-500' : ''}
                />
                {errors.city && (
                  <p className="text-sm text-red-500 mt-1">{errors.city}</p>
                )}
              </div>

              <div>
                <Label htmlFor="county">County *</Label>
                <Input
                  id="county"
                  name="county"
                  value={formData.county}
                  onChange={handleInputChange}
                  placeholder="Nairobi"
                  className={errors.county ? 'border-red-500' : ''}
                />
                {errors.county && (
                  <p className="text-sm text-red-500 mt-1">{errors.county}</p>
                )}
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Bank details are optional but recommended for automated payroll processing.
              </AlertDescription>
            </Alert>

            <div>
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                name="bankName"
                value={formData.bankName}
                onChange={handleInputChange}
                placeholder="e.g., Equity Bank, KCB, Co-operative Bank"
              />
            </div>

            <div>
              <Label htmlFor="bankBranch">Bank Branch</Label>
              <Input
                id="bankBranch"
                name="bankBranch"
                value={formData.bankBranch}
                onChange={handleInputChange}
                placeholder="Branch name or code"
              />
            </div>

            <div>
              <Label htmlFor="bankAccount">Bank Account Number</Label>
              <Input
                id="bankAccount"
                name="bankAccount"
                value={formData.bankAccount}
                onChange={handleInputChange}
                placeholder="Account number"
                className={errors.bankAccount ? 'border-red-500' : ''}
              />
              {errors.bankAccount && (
                <p className="text-sm text-red-500 mt-1">{errors.bankAccount}</p>
              )}
            </div>

            <div>
              <Label htmlFor="swiftCode">SWIFT Code (for international transfers)</Label>
              <Input
                id="swiftCode"
                name="swiftCode"
                value={formData.swiftCode}
                onChange={handleInputChange}
                placeholder="SWIFT/BIC code"
              />
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="payrollDay">Payroll Day of Month *</Label>
              <Input
                id="payrollDay"
                name="payrollDay"
                type="number"
                min="1"
                max="28"
                value={formData.payrollDay}
                onChange={handleInputChange}
                className={errors.payrollDay ? 'border-red-500' : ''}
              />
              {errors.payrollDay && (
                <p className="text-sm text-red-500 mt-1">{errors.payrollDay}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Day of the month when payroll should be processed (1-28)
              </p>
            </div>

            <div>
              <Label htmlFor="signatoryName">Signatory Name</Label>
              <Input
                id="signatoryName"
                name="signatoryName"
                value={formData.signatoryName}
                onChange={handleInputChange}
                placeholder="Name of authorized signatory"
              />
            </div>

            <div>
              <Label htmlFor="signatoryTitle">Signatory Title</Label>
              <Input
                id="signatoryTitle"
                name="signatoryTitle"
                value={formData.signatoryTitle}
                onChange={handleInputChange}
                placeholder="e.g., Managing Director, CEO"
              />
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                You're all set! Click "Complete Setup" to finish onboarding and access your dashboard.
              </AlertDescription>
            </Alert>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Kenya Payroll System
          </h1>
          <p className="text-gray-600">
            Let's set up your company profile in just a few steps
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex-1">
                <div className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                      currentStep > step.id
                        ? 'bg-green-500 border-green-500 text-white'
                        : currentStep === step.id
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 transition-all ${
                        currentStep > step.id ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
                <div className="mt-2 hidden md:block">
                  <p className="text-xs font-medium text-gray-900">{step.name}</p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {React.createElement(STEPS[currentStep - 1].icon, { className: 'w-6 h-6' })}
              {STEPS[currentStep - 1].name}
            </CardTitle>
            <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
          </CardHeader>

          <CardContent>
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1 || isSubmitting}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentStep < STEPS.length ? (
                <Button type="button" onClick={handleNext} disabled={isSubmitting}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Complete Setup
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Step {currentStep} of {STEPS.length} • All data is securely encrypted
        </p>
      </div>
    </div>
  )
}