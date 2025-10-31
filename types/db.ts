export type UserRole = 'student' | 'admin'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
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
	overall_score: number | null
	reviewed_by: string | null
	reviewed_at: string | null
	email_sent: boolean | null
	created_at: string
	updated_at: string
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
