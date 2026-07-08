'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ThemeSelector } from '@/components/ThemeSelector'
import { UserSession, ApprovalResponse } from '@/types/db'
import {
  BookOpen,
  Settings,
  CheckCircle,
  Clock,
  Target,
  AlertTriangle,
  Users,
  FileText,
  BarChart3
} from 'lucide-react'

export default function DemoPage() {
  const [studentId, setStudentId] = useState('12345678')
  const [approvalStatus, setApprovalStatus] = useState<'none' | 'pending' | 'approved'>('none')
  const [userSession, setUserSession] = useState<UserSession | null>(null)

  const handleStudentFlow = () => {
    // Simulate student ID entry
    if (studentId.length === 8) {
      setApprovalStatus('pending')
      setUserSession({
        id: studentId,
        fullName: 'Demo Student',
        email: 'demo@example.com',
        approved: false
      })
    }
  }

  const handleApproval = () => {
    // Simulate admin approval
    setApprovalStatus('approved')
    if (userSession) {
      setUserSession({
        ...userSession,
        approved: true
      })
    }
  }

  const handleStartExam = () => {
    alert('Exam would start now! The system will navigate through:\n1. Listening (32 min)\n2. Reading (60 min)\n3. Writing (60 min)')
  }

  const resetDemo = () => {
    setApprovalStatus('none')
    setUserSession(null)
    setStudentId('12345678')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              IELTS Mock Exam Platform - Demo
            </h1>
            <p className="text-gray-600 mt-2">
              Complete TypeScript implementation with centralized types
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeSelector />
            <Button onClick={resetDemo} variant="outline">
              Reset Demo
            </Button>
          </div>
        </div>

        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                Student Interface
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                <li>• 8-digit ID entry</li>
                <li>• Approval queue system</li>
                <li>• "Are you ready to score 9?" modal</li>
                <li>• 3-section exam flow</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2 text-green-600" />
                Admin Panel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                <li>• User management</li>
                <li>• Test management</li>
                <li>• Approval queue</li>
                <li>• Results & band scoring</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2 text-purple-600" />
                TypeScript Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                <li>• Centralized in /types/db.ts</li>
                <li>• Full Supabase schema</li>
                <li>• Type-safe API responses</li>
                <li>• Helper functions</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Demo Flow */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Student Flow */}
          <Card>
            <CardHeader>
              <CardTitle>Student Flow Demo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Step 1: ID Entry */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <h3 className="font-medium">ID Entry</h3>
                </div>
                <div className="ml-8 space-y-2">
                  <Label htmlFor="student-id">Student ID (8 digits)</Label>
                  <Input
                    id="student-id"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="12345678"
                    maxLength={8}
                    className="font-mono"
                  />
                  <Button
                    onClick={handleStudentFlow}
                    disabled={studentId.length !== 8 || approvalStatus !== 'none'}
                    className="w-full"
                  >
                    Enter Exam
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Step 2: Queue */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                    approvalStatus === 'pending' ? 'bg-yellow-600 text-white' :
                    approvalStatus === 'approved' ? 'bg-green-600 text-white' :
                    'bg-gray-300 text-gray-600'
                  }`}>
                    2
                  </div>
                  <h3 className="font-medium">Approval Queue</h3>
                </div>
                <div className="ml-8">
                  {approvalStatus === 'pending' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-yellow-600 mr-2" />
                        <span className="text-sm text-yellow-800">Waiting for admin approval...</span>
                      </div>
                    </div>
                  )}
                  {approvalStatus === 'approved' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                        <span className="text-sm text-green-800">Approved! Ready to start exam.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Step 3: Exam Start */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                    approvalStatus === 'approved' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    3
                  </div>
                  <h3 className="font-medium">Start Exam</h3>
                </div>
                <div className="ml-8">
                  <Button
                    onClick={handleStartExam}
                    disabled={approvalStatus !== 'approved'}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Are you ready to score 9?
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Flow */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Panel Demo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Admin Actions */}
              <div className="space-y-3">
                <h3 className="font-medium flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  User Management
                </h3>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span>Total Users:</span>
                      <span className="font-mono">2</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Approvals:</span>
                      <span className="font-mono">{approvalStatus === 'pending' ? '1' : '0'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="font-medium flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Approval Queue
                </h3>
                {approvalStatus === 'pending' && userSession && (
                  <div className="bg-white border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-mono text-sm font-medium">{userSession.id}</div>
                        <div className="text-xs text-gray-500">{userSession.fullName}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleApproval}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setApprovalStatus('none')}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                {approvalStatus !== 'pending' && (
                  <div className="text-sm text-gray-500 text-center py-4">
                    No pending approvals
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="font-medium flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Results Management
                </h3>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span>Completed Exams:</span>
                      <span className="font-mono">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending Reviews:</span>
                      <span className="font-mono">0</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>System Implementation Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">TypeScript Types</div>
                  <div className="text-sm text-gray-600">Complete in /types/db.ts</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">Authentication</div>
                  <div className="text-sm text-gray-600">Session-based auth</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">Admin Panel</div>
                  <div className="text-sm text-gray-600">Complete with approvals</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">Exam Interfaces</div>
                  <div className="text-sm text-gray-600">All 3 sections ready</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}