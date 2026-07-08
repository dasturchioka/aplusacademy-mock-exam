export type DashboardRange = 'this-year' | 'this-month'

export interface DashboardMetricSet {
	users: number
	tests: number
	results: number
	pendingApprovals: number
}

export interface UserGrowthPoint {
	key: string
	label: string
	value: number
}

export interface PendingApproval {
	id: string
	user_id: string
	status: string
	created_at: string
	users: {
		full_name: string
		email: string
	} | null
}

export interface DashboardSummary {
	success: true
	metrics: DashboardMetricSet
	userGrowth: {
		range: DashboardRange
		points: UserGrowthPoint[]
	}
	pendingApprovals: PendingApproval[]
}
