'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Shield, Users, Calculator, ArrowRight, Loader2 } from 'lucide-react'

export default function OnboardingSuccessPage() {
  const router = useRouter()
  const { data: session, status, update } = useSession()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    // If not onboarded, redirect back
    if (status === 'authenticated' && !session?.user?.hasCompletedOnboarding) {
      router.push('/onboarding')
      return
    }

    // Auto redirect after 5 seconds
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          router.push('/')
          return 0
        }
        return prev - 1
      })
    }, 5000)

    return () => clearInterval(timer)
  }, [status, session, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4 animate-bounce">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎉 Welcome to Pacti, your payroll assistant!
          </h1>
          <p className="text-gray-600">
            Your company has been successfully set up
          </p>
        </div>

        {/* Success Card */}
        <Card className="shadow-lg mb-6">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
            <CardTitle className="text-center">
              Setup Complete!
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Company Info */}
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">
                    Company Profile Created
                  </p>
                  <p className="text-sm text-gray-600">
                    {session?.user?.company?.companyName}
                  </p>
                </div>
              </div>

              {/* Admin Role */}
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <Shield className="w-5 h-5 text-purple-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">
                    Super Admin Role Assigned
                  </p>
                  <p className="text-sm text-gray-600">
                    You have full access to all system features
                  </p>
                </div>
              </div>

              {/* Next Steps */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">
                  What you can do now:
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <Users className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                    <span>Add employees to your company</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Calculator className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                    <span>Set up payroll and process payments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Shield className="w-4 h-4 mt-0.5 text-purple-600 flex-shrink-0" />
                    <span>Invite team members and assign roles</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              <Button
                className="w-full"
                size="lg"
                onClick={() => router.push('/')}
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/employees/add')}
              >
                <Users className="w-4 h-4 mr-2" />
                Add Your First Employee
              </Button>
            </div>

            {/* Auto Redirect */}
            <p className="text-center text-sm text-gray-500 mt-4">
              Redirecting to dashboard in {countdown} seconds...
            </p>
          </CardContent>
        </Card>

        {/* Role Info Card */}
        <Card className="shadow-lg border-purple-200 bg-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-purple-600 mt-1" />
              <div>
                <h3 className="font-medium text-purple-900 mb-1">
                  You're a Super Administrator
                </h3>
                <p className="text-sm text-purple-800">
                  As the first user, you have complete control over the system. 
                  You can manage users, process payroll, and configure all settings.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}