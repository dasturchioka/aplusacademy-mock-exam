export type UserRole = 'student' | 'admin'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'consumed' | 'stale'
export type ApprovalTestSource = 'assigned' | 'global'
export type SectionType = 'Listening' | 'Reading' | 'Writing'
export type SessionStatus = 'active' | 'completed' | 'abandoned'
export type SessionSection = 'listening' | 'reading' | 'writing'

export interface User {
	id: string // varchar(8)
	full_name: string
	email: string
	role: UserRole
	created_at: string // timestamp
	updated_at: string
	password: string | null
	active_test_id: string | null
}

export interface AuthUser {
	id: string
	full_name: string
	email: string
	role: UserRole
}

export interface AuthSession {
	token: string
	user: AuthUser
	expiresIn: '8h'
}

export interface Test {
	id: string
	title: string
	edition: string
	test_number: number
	section: SectionType
	listening: any | null
	reading: any | null
	writing: any | null
	listening_audios: any | null
	correct_answers: any | null
	created_at: string
	updated_at: string
}

export interface ActiveTest {
	id: string
	test_id: string
	is_active: boolean | null
	created_at: string
	created_by: string | null
}

export interface ExamEntryApproval {
  id: string
  user_id: string
  status: ApprovalStatus
  approved_by: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
  test_id: string | null
  test_source: ApprovalTestSource | null
  consumed_at: string | null
  attempt_id: string | null
}

export interface ExamSession {
	id: string
	user_id: string
	test_id: string
	session_data: any | null
	current_section: SessionSection | null
	started_at: string
	last_activity: string
	completed_at: string | null
	status: SessionStatus
}

// New simplified answer format
export interface SectionAnswers {
	Listening?: Record<string, string>
	Reading?: Record<string, string>
	Writing?: { report?: string; essay?: string }
}

export interface Result {
	id: string
	exam_taker_id: string
	test_id: string
	taken_date: string
	results: SectionAnswers[]
	listening_score: number | null
	reading_score: number | null
	writing_score: number | null
	speaking_score: number | null
	overall_score: number | null
	reviewed_by: string | null
	reviewed_at: string | null
	email_sent: boolean | null
	feedback?: string | null
	created_at: string
  updated_at: string
  status: ResultStatus
  completed_at: string | null
  client_attempt_id?: string | null
	is_published: boolean
	published_at: string | null
	is_analysis_published: boolean
	analysis_published_at: string | null
}

export interface ApprovalRequestResponse {
  success?: boolean
  approved: boolean
  status: ApprovalStatus
  approvalId: string
  approval?: {
    id: string
    status: ApprovalStatus
  }
  testId: string
  testTitle: string
  source: ApprovalTestSource
  message?: string
  error?: string
  code?: string
}

export interface UserAssignedTest {
	id: string
	user_id: string
	test_id: string
	assigned_at: string
	assigned_by: string | null
}

// Helper function to create empty result structure
export function createEmptyResult(): SectionAnswers {
	return {
		Listening: {},
		Reading: {},
		Writing: {},
	}
}

// Additional helper types for frontend components
export interface UserSession {
	id: string
	fullName: string
	email: string
	approved: boolean
	currentTestTitle?: string
}

export interface AdminSession {
	id: string
	role: 'admin'
	authenticated: boolean
}

// API Response types
export interface ApiResponse<T = any> {
	success: boolean
	data?: T
	error?: string
	message?: string
}

export interface ApprovalResponse {
	approved: boolean
	message: string
}

export interface TestAnswer {
	questionId: string
	value: string | string[]
	type: string
}

export interface WritingAnswer {
	taskId: string
	content: string
	wordCount: number
}

export type AttemptStatus = 'active' | 'completed' | 'abandoned'
export type ResultStatus = 'draft' | 'completed' | 'abandoned'

export interface ResultPublishingState {
	is_published: boolean
	published_at: string | null
	is_analysis_published: boolean
	analysis_published_at: string | null
}

export interface ExamAttempt {
  id: string
  user_id: string
  test_id: string
  result_id: string
  client_attempt_id: string
  approval_id: string | null
  status: AttemptStatus
  current_section: SectionType
  draft_state: any
  section_status: Record<SectionType, 'not_started' | 'completed'>
  started_at: string
  last_activity_at: string
  completed_at: string | null
  created_at: string
  updated_at: string
}
