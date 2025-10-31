import { useState, useEffect, useCallback, useMemo } from 'react'

interface UseHybridSearchOptions<T> {
	searchFn: (query: string, offset: number, limit: number) => Promise<{
		items: T[]
		total: number
		offset: number
		limit: number
	}>
	localFilterFn: (items: T[], query: string) => T[]
	debounceMs?: number
	itemsPerPage?: number
}

export function useHybridSearch<T>({
	searchFn,
	localFilterFn,
	debounceMs = 300,
	itemsPerPage = 10
}: UseHybridSearchOptions<T>) {
	// Server data state
	const [items, setItems] = useState<T[]>([])
	const [total, setTotal] = useState(0)
	const [currentPage, setCurrentPage] = useState(1)

	// Search state
	const [searchQuery, setSearchQuery] = useState('')
	const [localItems, setLocalItems] = useState<T[]>([])

	// Loading states - SEPARATED FOR DIFFERENT UX
	const [isInitialLoading, setIsInitialLoading] = useState(true)  // Full page skeleton
	const [isSearching, setIsSearching] = useState(false)          // Search indicator only
	const [isLocalFiltering, setIsLocalFiltering] = useState(false) // Local filter indicator

	// Debounce search query
	const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearchQuery(searchQuery)
		}, debounceMs)

		return () => clearTimeout(timer)
	}, [searchQuery, debounceMs])

	// Server search effect
	useEffect(() => {
		const fetchData = async () => {
			try {
				// Only show search loading, not full page loading
				if (debouncedSearchQuery.trim()) {
					setIsSearching(true)
				} else if (currentPage === 1 && items.length === 0) {
					// Only show initial loading for first load
					setIsInitialLoading(true)
				}

				const offset = (currentPage - 1) * itemsPerPage
				const result = await searchFn(debouncedSearchQuery, offset, itemsPerPage)

				setItems(result.items)
				setTotal(result.total)

				// Clear local items when server search completes
				if (debouncedSearchQuery.trim()) {
					setLocalItems([])
				}
			} catch (error) {
				console.error('Search error:', error)
				setItems([])
				setTotal(0)
			} finally {
				setIsInitialLoading(false)
				setIsSearching(false)
			}
		}

		fetchData()
	}, [debouncedSearchQuery, currentPage, itemsPerPage, searchFn])

	// Local filtering effect (immediate)
	useEffect(() => {
		if (searchQuery.trim() && items.length > 0) {
			setIsLocalFiltering(true)

			// Immediate local filtering
			const timer = setTimeout(() => {
				const filtered = localFilterFn(items, searchQuery)
				setLocalItems(filtered)
				setIsLocalFiltering(false)
			}, 50) // Very short delay for smooth UX

			return () => clearTimeout(timer)
		} else {
			setLocalItems([])
			setIsLocalFiltering(false)
		}
	}, [searchQuery, items, localFilterFn])

	// Computed values
	const hasSearchResults = searchQuery.trim().length > 0
	const totalPages = Math.ceil(total / itemsPerPage)

	// Actions
	const refresh = useCallback(async () => {
		try {
			setIsSearching(true)
			const offset = (currentPage - 1) * itemsPerPage
			const result = await searchFn(debouncedSearchQuery, offset, itemsPerPage)
			setItems(result.items)
			setTotal(result.total)
		} catch (error) {
			console.error('Refresh error:', error)
		} finally {
			setIsSearching(false)
		}
	}, [currentPage, debouncedSearchQuery, itemsPerPage, searchFn])

	const clearSearch = useCallback(() => {
		setSearchQuery('')
		setDebouncedSearchQuery('')
		setLocalItems([])
		setCurrentPage(1)
	}, [])

	return {
		// Data
		items,
		localItems,
		total,
		currentPage,
		totalPages,
		searchQuery,

		// Loading states - SEPARATED
		isLoading: isInitialLoading,        // Only for initial page load
		isSearching,                        // Only for search operations
		isLocalFiltering,                   // Only for local filtering
		hasSearchResults,

		// Actions
		setSearchQuery,
		setCurrentPage,
		refresh,
		clearSearch
	}
}
