// src/app/employees/new/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import EmployeeForm from '@/components/employees/EmployeeForm'
import { EmployeeFormData } from '@/types'

export default function NewEmployeePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = async (formData: EmployeeFormData) => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || result.error || 'Failed to create employee')
      }

      // Success - redirect to employees list
      router.push('/employees')
    } catch (error: any) {
      console.error('Error creating employee:', error)
      // Re-throw to let the form handle the error
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/employees')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors"
                disabled={isSubmitting}
              >
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </button>
              
              <div>
                <h1 className="text-base font-semibold text-gray-900">
                  Add New Employee
                </h1>
              </div>
            </div>

            {isSubmitting && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                <span className="text-xs font-medium text-blue-900">Saving...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-[calc(100vh-10rem)]">
          {/* Decorative header accent */}
          <div className="h-1 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600"></div>
          
          {/* Form Container with Scroll */}
          <div className="h-full overflow-y-auto">
            <div className="p-6">
              <EmployeeForm
                onSave={handleSave}
                onCancel={handleCancel}
                isLoading={isSubmitting}
              />
            </div>
          </div>
        </div>

        {/* Helper Info Card */}
        <div className="mt-4 bg-blue-50/50 rounded-lg border border-blue-100/50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-xs font-semibold text-gray-900 mb-1.5">
                Important Information
              </h3>
              <ul className="space-y-1 text-xs text-gray-600">
                <li className="flex items-start gap-1.5">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>All fields marked with (*) are required for compliance</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>KRA PIN format: A123456789Z (letter, 9 digits, letter)</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>P10 tax information required for statutory compliance</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}