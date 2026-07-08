'use client'

import DeleteConfirmationModal from '@/components/admin/DeleteConfirmationModal'
import HybridSearchInput from '@/components/admin/HybridSearchInput'
import SortingControls from '@/components/admin/SortingControls'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { PageState } from '@/components/ui/page-state'
import { StatusBadge } from '@/components/ui/status-badge'
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from '@/components/ui/pagination'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { useHybridSearch } from '@/hooks/useHybridSearch'
import { useSorting } from '@/hooks/useSorting'
import defaultInstance, { defaultInstance as axios } from '@/http'
import { notify } from '@/lib/app-toast'
import { exportToExcel } from '@/lib/exportToXlsx'
import {
	BarChart3,
	Calendar,
	CheckCircle,
	ClipboardList,
	Eye,
	Mail,
	RefreshCw,
	Trash2,
	Users,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

interface Result {
	id: string
	exam_taker_id: string
	test_id: string
	taken_date: string
	listening_score: number | null
	reading_score: number | null
	writing_score: number | null
	speaking_score: number | null
	overall_score: number | null
	reviewed_by: string | null
	reviewed_at: string | null
	email_sent: boolean
	created_at: string
	updated_at: string
	is_published: boolean
	published_at: string | null
	is_analysis_published: boolean
	analysis_published_at: string | null
	status?: 'draft' | 'completed' | 'abandoned' | string
	attempt?: {
		id: string
		status: string
		current_section?: string | null
		section_status?: Record<string, string> | null
		last_activity_at?: string | null
		completed_at?: string | null
	} | null

	result_id_text: string
	exam_taker_id_text: string
	test_id_text: string

	full_name: string
	email: string
	title: string
	edition?: string

	results: SectionResult[]
}

type SectionResult = ListeningSection | ReadingSection | WritingSection

interface ListeningSection {
	Listening: QuestionAnswer[]
}

interface ReadingSection {
	Reading: QuestionAnswer[]
}

interface WritingSection {
	Writing: WritingAnswer[]
}

interface QuestionAnswer {
	[questionNumber: string]: string
	isCorrect: any
}

interface WritingAnswer {
	report?: string
	essay?: string
}

interface ResultsResponse {
	success: boolean
	results: Result[]
	total: number
	offset: number
	limit: number
	search: string
	visibility: string
	status?: string
}

type VisibilityFilter = 'all' | 'unpublished' | 'scores_published' | 'analysis_published'
type ResultStatusFilter = 'all' | 'draft' | 'completed' | 'abandoned'

function getResultStatus(result: Result) {
	return result.status || 'completed'
}

function getResultStatusBadge(result: Result) {
	const status = getResultStatus(result)
	if (status === 'draft') {
		return (
			<StatusBadge
				status={result.attempt?.status === 'active' ? 'active' : 'draft'}
				label={result.attempt?.status === 'active' ? 'Draft / active' : 'Draft'}
			/>
		)
	}
	if (status === 'abandoned') return <StatusBadge status='abandoned' />
	if (status === 'completed') return <StatusBadge status='completed' />
	return <StatusBadge status='neutral' label={status} />
}

function ResultsTableSkeleton() {
	return (
		<div className='space-y-4' aria-label='Loading exam results'>
			<div className='flex items-center gap-3 border-b p-2'>
				<div className='h-4 w-4 animate-pulse rounded bg-muted' />
				<div className='h-4 w-40 animate-pulse rounded bg-muted' />
			</div>

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className='w-12'>Select</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Exam Taker</TableHead>
						<TableHead>Test</TableHead>
						<TableHead>Date & ID</TableHead>
						<TableHead>Scores</TableHead>
						<TableHead>Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{[...Array(6)].map((_, rowIndex) => (
						<TableRow key={rowIndex}>
							<TableCell>
								<div className='h-4 w-4 animate-pulse rounded bg-muted' />
							</TableCell>
							<TableCell>
								<div className='h-6 w-20 animate-pulse rounded bg-muted' />
							</TableCell>
							<TableCell>
								<div className='space-y-2'>
									<div className='h-4 w-36 animate-pulse rounded bg-muted' />
									<div className='h-3 w-44 animate-pulse rounded bg-muted' />
									<div className='h-3 w-24 animate-pulse rounded bg-muted' />
								</div>
							</TableCell>
							<TableCell>
								<div className='space-y-2'>
									<div className='h-4 w-40 animate-pulse rounded bg-muted' />
									<div className='h-3 w-20 animate-pulse rounded bg-muted' />
								</div>
							</TableCell>
							<TableCell>
								<div className='h-4 w-32 animate-pulse rounded bg-muted' />
							</TableCell>
							<TableCell>
								<div className='grid grid-cols-2 gap-2'>
									{[...Array(4)].map((_, scoreIndex) => (
										<div key={scoreIndex} className='h-3 w-10 animate-pulse rounded bg-muted' />
									))}
								</div>
							</TableCell>
							<TableCell>
								<div className='h-8 w-24 animate-pulse rounded bg-muted' />
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	)
}

export default function AdminResultsPage() {
	const router = useRouter()

	// Modal states
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
	const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false)
	const [deletingResult, setDeletingResult] = useState<Result | null>(null)
	const [isDeletingResult, setIsDeletingResult] = useState(false)
	const [isDeletingBulk, setIsDeletingBulk] = useState(false)
	const [resultsStat, setResultsStat] = useState<Result[]>([])

	// Selection state
	const [selectedResultIds, setSelectedResultIds] = useState<Set<string>>(new Set())

	const [exporting, setExporting] = useState(false)
	const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('all')
	const [resultStatusFilter, setResultStatusFilter] = useState<ResultStatusFilter>('completed')

	const handleExportResults = async () => {
		try {
			setExporting(true)

			const res = await defaultInstance.get('/api/results/stat')
			const data = await res.data

			if (!data) {
				throw new Error('Failed to fetch results')
			}

			const fetchedResults: Result[] = data.results || []

			// Update local state
			setResultsStat(fetchedResults)

			// Prepare columns for export
			const columns: { header: string; key: keyof Result | ((row: Result, index: number) => any) }[] = [
				{ header: 'No', key: (_: Result, index: number) => String(index + 1) },
				{ header: 'ID', key: 'exam_taker_id' },
				{ header: 'Full Name', key: 'full_name' },
				{ header: 'Test Title', key: 'title' },
				{ header: 'Listening Score', key: 'listening_score' },
				{ header: 'Reading Score', key: 'reading_score' },
				{ header: 'Writing Score', key: 'writing_score' },
				{ header: 'Speaking Score', key: 'speaking_score' },
				{ header: 'Overall Score', key: 'overall_score' },
				{ header: 'Status', key: (row: Result) => row.status || 'completed' },
				{
					header: 'Sent to the email',
					key: (row: Result) => (row.email_sent ? 'Yes' : 'No'),
				},
			]

			// Export
			exportToExcel(fetchedResults, columns, 'Exam_Results')
		} catch (err) {
			console.error('Export failed:', err)
		} finally {
			setExporting(false)
		}
	}

	// Search function for server-side search
	const searchResults = useCallback(
		async (query: string, offset: number, limit: number) => {
			const response = await axios.get<ResultsResponse>('/api/results', {
				params: {
					search: query,
					offset,
					limit,
					visibility: visibilityFilter === 'all' ? '' : visibilityFilter,
					status: resultStatusFilter === 'all' ? '' : resultStatusFilter,
				},
			})

			if (!response.data.success) {
				throw new Error('Failed to fetch results')
			}

			return {
				items: response.data.results || [],
				total: response.data.total || 0,
				offset: response.data.offset || 0,
				limit: response.data.limit || limit,
			}
		},
		[visibilityFilter, resultStatusFilter]
	)

	// Local filter function for immediate filtering
	const localFilterResults = useCallback((results: Result[], query: string) => {
		if (!query.trim()) return results

		const searchLower = query.toLowerCase()
		return results.filter(
			result =>
				result.exam_taker_id?.toLowerCase().includes(searchLower) ||
				result?.full_name?.toLowerCase().includes(searchLower) ||
				result?.email?.toLowerCase().includes(searchLower) ||
				result?.title?.toLowerCase().includes(searchLower) ||
				result.test_id?.toLowerCase().includes(searchLower) ||
				result.id?.toLowerCase().includes(searchLower)
		)
	}, [])

	// Use the hybrid search hook
	const {
		items: results,
		localItems: localResults,
		total,
		currentPage,
		totalPages,
		searchQuery,
		isSearching,
		hasSearchResults,
		isLoading,
		isLocalFiltering,
		setSearchQuery,
		setCurrentPage,
		refresh,
		clearSearch,
	} = useHybridSearch({
		searchFn: searchResults,
		localFilterFn: localFilterResults,
		debounceMs: 400,
		itemsPerPage: 10,
	})
	const [hasCompletedInitialLoad, setHasCompletedInitialLoad] = useState(false)

	useEffect(() => {
		if (!isLoading) {
			setHasCompletedInitialLoad(true)
		}
	}, [isLoading])

	// Use local results if searching, otherwise use server results
	const displayResults = hasSearchResults && localResults.length >= 0 ? localResults : results

	// Sorting functionality
	const {
		sortedData: sortedResults,
		sortConfig,
		handleSort,
		clearSort,
	} = useSorting({
		data: displayResults,
		defaultSort: { key: 'created_at', direction: 'desc', label: 'Created Date' },
		sortFunctions: {
			created_at: (a: Result, b: Result, direction) => {
				const aDate = new Date(a.created_at || a.taken_date).getTime()
				const bDate = new Date(b.created_at || b.taken_date).getTime()
				const comparison = aDate - bDate
				return direction === 'asc' ? comparison : -comparison
			},
			taken_date: (a: Result, b: Result, direction) => {
				const aDate = new Date(a.taken_date).getTime()
				const bDate = new Date(b.taken_date).getTime()
				const comparison = aDate - bDate
				return direction === 'asc' ? comparison : -comparison
			},
		},
	})

	const sortOptions = [
		{ key: 'created_at', label: 'Created Date', icon: <Calendar className='h-4 w-4' /> },
		{ key: 'taken_date', label: 'Taken Date', icon: <Calendar className='h-4 w-4' /> },
		{ key: 'users.full_name', label: 'User Name', icon: <Users className='h-4 w-4' /> },
	]

	const handleViewResult = (resultId: string) => {
		router.push(`/admin/results/${resultId}`)
	}

	const handleDeleteResult = (result: Result) => {
		setDeletingResult(result)
		setIsDeleteModalOpen(true)
	}

	const confirmDeleteResult = async () => {
		if (!deletingResult) return

		try {
			setIsDeletingResult(true)
			const res = await axios.delete(`/api/admin/results/${deletingResult.id}`)
			if (res.data.success) {
				notify.success('Result deleted successfully')
				await refresh()
			} else {
				notify.error(res.data.error || 'Failed to delete result')
			}
		} catch (err: any) {
			console.error('Delete result error:', err)
			notify.error('Failed to delete result')
		} finally {
			setIsDeletingResult(false)
			setDeletingResult(null)
		}
	}

	const handleBulkDelete = () => {
		if (selectedResultIds.size === 0) {
			notify.error('Please select results to delete')
			return
		}
		setIsBulkDeleteModalOpen(true)
	}

	const confirmBulkDelete = async () => {
		if (selectedResultIds.size === 0) return

		try {
			setIsDeletingBulk(true)
			const res = await axios.delete('/api/admin/results', {
				data: { resultIds: Array.from(selectedResultIds) },
			})
			if (res.data.success) {
				notify.success(`${selectedResultIds.size} results deleted successfully`)
				setSelectedResultIds(new Set())
				await refresh()
			} else {
				notify.error(res.data.error || 'Failed to delete results')
			}
		} catch (err: any) {
			console.error('Bulk delete results error:', err)
			notify.error('Failed to delete results')
		} finally {
			setIsDeletingBulk(false)
		}
	}

	const handleSelectResult = (resultId: string, selected: boolean) => {
		setSelectedResultIds(prev => {
			const newSet = new Set(prev)
			if (selected) {
				newSet.add(resultId)
			} else {
				newSet.delete(resultId)
			}
			return newSet
		})
	}

	const handleSelectAll = (selected: boolean) => {
		if (selected) {
			setSelectedResultIds(new Set(sortedResults.map(result => result.id)))
		} else {
			setSelectedResultIds(new Set())
		}
	}

	const isResultCompletelyGraded = (result: Result) => {
		return (
			result.listening_score !== null &&
			result.reading_score !== null &&
			result.writing_score !== null &&
			result.speaking_score !== null
		)
	}

	const formatDate = (dateString?: string | null) => {
		if (!dateString) return 'Not available'
		return new Date(dateString).toLocaleString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false, // optional: set to true for AM/PM format
		})
	}

	// Calculate stats
	const allResultsForStats = hasSearchResults ? localResults : results
	const totalResultsForStats = hasSearchResults ? localResults.length : total
	const completedResultsForStats = allResultsForStats.filter(result => getResultStatus(result) === 'completed')
	const draftResultsForStats = allResultsForStats.filter(result => getResultStatus(result) === 'draft')
	const abandonedResultsForStats = allResultsForStats.filter(result => getResultStatus(result) === 'abandoned')
	const gradedResults = completedResultsForStats.filter(isResultCompletelyGraded)
	const emailsSent = completedResultsForStats.filter(result => result.email_sent)
	const isAllSelected =
		sortedResults.length > 0 && sortedResults.every(result => selectedResultIds.has(result.id))
	const isPartiallySelected = selectedResultIds.size > 0 && !isAllSelected
	const shouldShowInitialLoading = isLoading && !hasCompletedInitialLoad
	const shouldShowResultsSkeleton =
		!hasSearchResults && (isSearching || (isLoading && hasCompletedInitialLoad))

	// Keep full-page loading for first load only; later refetches stay inside the table card.
	if (shouldShowInitialLoading) {
		return (
			<div className='container mx-auto py-6'>
				<PageState type='loading' title='Loading results' />
			</div>
		)
	}

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<h1 className='text-3xl font-bold'>Results Management</h1>
				<div className='flex items-center gap-2'>
					{selectedResultIds.size > 0 && (
						<Button
							variant='destructive'
							size='sm'
							onClick={handleBulkDelete}
							disabled={isDeletingBulk}
						>
							<Trash2 className='h-4 w-4 mr-2' />
							Delete Selected ({selectedResultIds.size})
						</Button>
					)}
					<Button onClick={refresh} variant='outline' disabled={isSearching}>
						<RefreshCw className={`h-4 w-4 mr-2 ${isSearching ? 'animate-spin' : ''}`} />
						Refresh
					</Button>
				</div>
			</div>

			{/* Statistics Cards */}
			<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
				<Card>
					<CardContent className='p-4'>
						<div className='flex items-center space-x-2'>
							<ClipboardList className='h-5 w-5 text-blue-600' />
							<div>
								<p className='text-sm font-medium text-gray-600'>
									{hasSearchResults ? 'Search Results' : 'Total Results'}
								</p>
								<p className='text-2xl font-bold'>{totalResultsForStats}</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className='p-4'>
						<div className='flex items-center space-x-2'>
							<CheckCircle className='h-5 w-5 text-muted-foreground' />
							<div>
								<p className='text-sm font-medium text-gray-600'>Graded</p>
								<p className='text-2xl font-bold'>{gradedResults.length}</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className='p-4'>
						<div className='flex items-center space-x-2'>
							<Mail className='h-5 w-5 text-muted-foreground' />
							<div>
								<p className='text-sm font-medium text-gray-600'>Emails Sent</p>
								<p className='text-2xl font-bold'>{emailsSent.length}</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className='p-4'>
						<div className='flex items-center space-x-2'>
							<Users className='h-5 w-5 text-orange-600' />
							<div>
								<p className='text-sm font-medium text-gray-600'>Draft / Abandoned</p>
								<p className='text-2xl font-bold'>
									{draftResultsForStats.length + abandonedResultsForStats.length}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Search and Sorting Controls */}
			<div className='flex flex-col md:flex-row gap-4'>
				<div className='flex-1'>
					<Card>
						<CardContent className='p-4'>
							<HybridSearchInput
								placeholder='Search by ID, name, email, test title, test ID, or result ID...'
								searchQuery={searchQuery}
								isSearching={isSearching}
								isLocalFiltering={isLocalFiltering}
								hasSearchResults={hasSearchResults}
								localResultsCount={localResults.length}
								onSearchChange={setSearchQuery}
								onClearSearch={clearSearch}
							/>
						</CardContent>
					</Card>
				</div>
				<Card>
					<CardContent className='p-4'>
						<SortingControls
							sortOptions={sortOptions}
							currentSort={sortConfig}
							onSort={handleSort}
							onClearSort={clearSort}
						/>
					</CardContent>
				</Card>
			</div>

			<div className='flex flex-wrap gap-2'>
				{[
					{ value: 'all', label: 'All' },
					{ value: 'unpublished', label: 'Unpublished' },
					{ value: 'scores_published', label: 'Scores published' },
					{ value: 'analysis_published', label: 'Analysis published' },
				].map(option => (
					<Button
						key={option.value}
						type='button'
						variant={visibilityFilter === option.value ? 'default' : 'outline'}
						size='sm'
						onClick={() => {
							setVisibilityFilter(option.value as VisibilityFilter)
							setCurrentPage(1)
						}}
					>
						{option.label}
					</Button>
				))}
			</div>

			<div className='flex flex-wrap items-center gap-2'>
				<span className='text-sm font-medium text-muted-foreground'>Result status</span>
				{[
					{ value: 'all', label: 'All statuses' },
					{ value: 'draft', label: 'Draft' },
					{ value: 'completed', label: 'Completed' },
					{ value: 'abandoned', label: 'Abandoned' },
				].map(option => (
					<Button
						key={option.value}
						type='button'
						variant={resultStatusFilter === option.value ? 'default' : 'outline'}
						size='sm'
						onClick={() => {
							setResultStatusFilter(option.value as ResultStatusFilter)
							setCurrentPage(1)
						}}
					>
						{option.label}
					</Button>
				))}
			</div>

			{/* Results Table */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center justify-between gap-2'>
						<div className='flex items-center gap-2'>
							<BarChart3 className='h-5 w-5' />
							Exam Results
							{hasSearchResults && (
								<Badge variant='secondary'>{localResults.length} search results</Badge>
							)}
							{sortConfig && <Badge variant='outline'>Sorted by {sortConfig.label}</Badge>}
						</div>
						<div className='flex items-center justify-between'>
							<Button onClick={handleExportResults} disabled={exporting}>
								{exporting ? 'Exporting...' : 'Export to Excel'}
							</Button>
						</div>
					</CardTitle>
				</CardHeader>
				<CardContent>
					{shouldShowResultsSkeleton ? (
						<ResultsTableSkeleton />
					) : sortedResults.length === 0 ? (
						<div className='text-center py-8'>
							<p className='text-gray-500'>
								{hasSearchResults ? 'No results found for your search.' : 'No results available.'}
							</p>
							{hasSearchResults && (
								<Button variant='outline' onClick={clearSearch} className='mt-2'>
									Clear search
								</Button>
							)}
						</div>
					) : (
						<div className='space-y-4'>
							{/* Select All Checkbox */}
							<div className='flex items-center gap-2 p-2 border-b'>
								<Checkbox
									checked={isAllSelected}
									ref={(el: any) => {
										if (el) el.indeterminate = isPartiallySelected
									}}
									onCheckedChange={handleSelectAll}
								/>
								<span className='text-sm text-gray-600'>
									{isAllSelected ? 'Deselect All' : 'Select All'} ({sortedResults.length} items)
								</span>
							</div>

							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className='w-12'>Select</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Exam Taker</TableHead>
										<TableHead>Test</TableHead>
										<TableHead>Date & ID</TableHead>
										<TableHead>Scores</TableHead>
										<TableHead>Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{sortedResults.map(result => {
										const isGraded = isResultCompletelyGraded(result)
										const isCompletedResult = getResultStatus(result) === 'completed'
										return (
											<TableRow
												key={result.id}
												className={`cursor-pointer transition-colors ${
													isCompletedResult && isGraded ? 'bg-muted/30' : 'hover:bg-muted/40'
												}`}
												onClick={() => handleViewResult(result.id)}
											>
												<TableCell onClick={e => e.stopPropagation()}>
													<Checkbox
														checked={selectedResultIds.has(result.id)}
														onCheckedChange={checked =>
															handleSelectResult(result.id, checked as boolean)
														}
													/>
												</TableCell>
												<TableCell>
													<div className='space-y-2'>
														<div className='flex flex-column flex-wrap items-center gap-2'>
															{getResultStatusBadge(result)}
															{isCompletedResult && isGraded ? <StatusBadge status='saved' label='Graded' /> : null}
															{isCompletedResult && result.email_sent ? (
																<StatusBadge status='info' label='Email sent' />
															) : null}
															{isCompletedResult && !isGraded && !result.email_sent ? <StatusBadge status='pending' label='Needs review' /> : null}
														</div>
													</div>
												</TableCell>
												<TableCell>
													<div>
														<p className='font-medium'>{result.full_name || 'N/A'}</p>
														<p className='text-sm text-gray-600'>{result.email || 'N/A'}</p>
														<p className='text-xs text-gray-500 font-mono'>
															{result.exam_taker_id}
														</p>
														<div className='mt-2 flex flex-wrap gap-1'>
															<StatusBadge
																status={result.is_published ? 'published' : 'unpublished'}
															/>
															<StatusBadge
																status={result.is_analysis_published ? 'analysis-published' : 'neutral'}
																label={result.is_analysis_published ? 'Analysis' : 'Scores only'}
															/>
														</div>
													</div>
												</TableCell>
												<TableCell>
													<div>
														<p className='font-medium'>{result.title || 'N/A'}</p>
														{result?.edition && (
															<p className='text-sm text-gray-600'>{result.edition}</p>
														)}
													</div>
												</TableCell>
												<TableCell>
													<p className='text-sm'>{formatDate(result.created_at)}</p>
												</TableCell>
												<TableCell>
													<div className='grid grid-cols-2 gap-1 text-xs'>
														<div className='flex items-center gap-2'>
															<span>L:</span>
															<span
																className={
																	result.listening_score !== null ? 'font-bold' : 'text-gray-400'
																}
															>
																{result.listening_score ?? 'N/A'}
															</span>
														</div>
														<div className='flex items-center gap-2'>
															<span>R:</span>
															<span
																className={
																	result.reading_score !== null ? 'font-bold' : 'text-gray-400'
																}
															>
																{result.reading_score ?? 'N/A'}
															</span>
														</div>
														<div className='flex items-center gap-2'>
															<span>W:</span>
															<span
																className={
																	result.writing_score !== null ? 'font-bold' : 'text-gray-400'
																}
															>
																{result.writing_score ?? 'N/A'}
															</span>
														</div>
														<div className='flex items-center gap-2'>
															<span>S:</span>
															<span
																className={
																	result.speaking_score !== null ? 'font-bold' : 'text-gray-400'
																}
															>
																{result.speaking_score ?? 'N/A'}
															</span>
														</div>
													</div>
												</TableCell>
												<TableCell>
													<div className='flex gap-1' onClick={e => e.stopPropagation()}>
														<Button
															variant='outline'
															size='sm'
															onClick={() => handleViewResult(result.id)}
														>
															<Eye className='h-4 w-4 mr-1' />
															View
														</Button>
														<Button
															variant='outline'
															size='sm'
															onClick={() => handleDeleteResult(result)}
															className='text-red-600 hover:text-red-700'
														>
															<Trash2 className='h-4 w-4' />
														</Button>
													</div>
												</TableCell>
											</TableRow>
										)
									})}
								</TableBody>
							</Table>

							{/* Pagination - only show for server results, not local search */}
							{!hasSearchResults && totalPages > 1 && (
								<div className='flex justify-center mt-6'>
									<Pagination>
										<PaginationContent>
											<PaginationItem>
												<PaginationPrevious
													onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
													className={
														currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
													}
												/>
											</PaginationItem>

											{[...Array(Math.min(5, totalPages))].map((_, i) => {
												const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
												if (pageNum <= totalPages) {
													return (
														<PaginationItem key={pageNum}>
															<PaginationLink
																onClick={() => setCurrentPage(pageNum)}
																isActive={pageNum === currentPage}
																className='cursor-pointer'
															>
																{pageNum}
															</PaginationLink>
														</PaginationItem>
													)
												}
												return null
											})}

											<PaginationItem>
												<PaginationNext
													onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
													className={
														currentPage === totalPages
															? 'pointer-events-none opacity-50'
															: 'cursor-pointer'
													}
												/>
											</PaginationItem>
										</PaginationContent>
									</Pagination>
								</div>
							)}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Delete Result Modal */}
			<DeleteConfirmationModal
				isOpen={isDeleteModalOpen}
				onClose={() => {
					setIsDeleteModalOpen(false)
					setDeletingResult(null)
				}}
				onConfirm={confirmDeleteResult}
				title='Delete Result'
				description={`Are you sure you want to delete the exam result for "${deletingResult?.full_name}"?`}
				warningMessage='This action will permanently remove the exam result from the database.'
				isLoading={isDeletingResult}
			/>

			{/* Bulk Delete Modal */}
			<DeleteConfirmationModal
				isOpen={isBulkDeleteModalOpen}
				onClose={() => setIsBulkDeleteModalOpen(false)}
				onConfirm={confirmBulkDelete}
				title='Delete Multiple Results'
				description='Are you sure you want to delete the selected exam results?'
				warningMessage='This action will permanently remove all selected exam results from the database.'
				itemCount={selectedResultIds.size}
				isLoading={isDeletingBulk}
			/>
		</div>
	)
}
