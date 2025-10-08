'use client'

import { useSession, signOut } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building2, AlertTriangle, Mail, Phone, LogOut } from 'lucide-react'

export default function SuspendedPage() {
  const { data: session } = useSession()

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/signin' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 bg-red-600 rounded-2xl shadow-lg">
              <Building2 className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Account Suspended
          </h1>
        </div>

        {/* Suspended Card */}
        <Card className="shadow-lg border-red-200">
          <CardHeader className="bg-red-50 border-b border-red-200">
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-6 h-6" />
              Your Account Has Been Suspended
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Your company account has been temporarily suspended and you cannot access the payroll system at this time.
              </AlertDescription>
            </Alert>

            {session?.user?.company?.suspensionReason && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-medium text-gray-900 mb-2">Reason for Suspension:</h3>
                <p className="text-gray-700">{session.user.company.suspensionReason}</p>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">What to do next:</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2" />
                  <span>Contact our support team to resolve any outstanding issues</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2" />
                  <span>Ensure all pending payments or compliance requirements are met</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2" />
                  <span>Once resolved, your account will be reactivated within 24 hours</span>
                </li>
              </ul>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-900 mb-3">Contact Support</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-blue-700">
                  <Mail className="w-4 h-4" />
                  <a href="mailto:support@kenyapayroll.com" className="hover:underline">
                    support@kenyapayroll.com
                  </a>
                </div>
                <div className="flex items-center gap-2 text-blue-700">
                  <Phone className="w-4 h-4" />
                  <a href="tel:+254700000000" className="hover:underline">
                    +254 700 000 000
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.location.href = 'mailto:support@kenyapayroll.com'}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email Support
              </Button>
              <Button
                variant="outline"
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Company Info */}
        {session?.user?.company && (
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Company: <span className="font-medium">{session.user.company.companyName}</span></p>
            <p className="text-xs text-gray-500 mt-1">
              Suspended on {session.user.company.suspendedAt ? new Date(session.user.company.suspendedAt).toLocaleDateString('en-KE') : 'N/A'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}