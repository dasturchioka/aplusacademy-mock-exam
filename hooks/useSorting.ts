import { useMemo, useState } from 'react'

export type SortDirection = 'asc' | 'desc'

export interface SortConfig<T> {
	key: keyof T | string
	direction: SortDirection
	label: string
}

interface UseSortingOptions<T> {
	data: T[]
	defaultSort?: SortConfig<T>
	sortFunctions?: {
		[key: string]: (a: T, b: T, direction: SortDirection) => number
	}
}

export function useSorting<T>({ data, defaultSort, sortFunctions = {} }: UseSortingOptions<T>) {
	const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(defaultSort || null)

	const sortedData = useMemo(() => {
		if (!sortConfig) return data

		const { key, direction } = sortConfig

		return [...data].sort((a, b) => {
			// Use custom sort function if provided
			if (sortFunctions[key as string]) {
				return sortFunctions[key as string](a, b, direction)
			}

			// Default sorting logic
			let aValue = a[key as keyof T]
			let bValue = b[key as keyof T]

			// Handle nested properties (e.g., 'user.name')
			if (typeof key === 'string' && key.includes('.')) {
				const keys = key.split('.')
				aValue = keys.reduce((obj: any, k) => obj?.[k], a)
				bValue = keys.reduce((obj: any, k) => obj?.[k], b)
			}

			// Handle null/undefined values
			if (aValue == null && bValue == null) return 0
			if (aValue == null) return direction === 'asc' ? 1 : -1
			if (bValue == null) return direction === 'asc' ? -1 : 1

			// String comparison (case-insensitive)
			if (typeof aValue === 'string' && typeof bValue === 'string') {
				const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase())
				return direction === 'asc' ? comparison : -comparison
			}

			// Date comparison
			if (aValue instanceof Date && bValue instanceof Date) {
				const comparison = aValue.getTime() - bValue.getTime()
				return direction === 'asc' ? comparison : -comparison
			}

			// Number comparison
			if (typeof aValue === 'number' && typeof bValue === 'number') {
				const comparison = aValue - bValue
				return direction === 'asc' ? comparison : -comparison
			}

			// Default string conversion
			const aStr = String(aValue).toLowerCase()
			const bStr = String(bValue).toLowerCase()
			const comparison = aStr.localeCompare(bStr)
			return direction === 'asc' ? comparison : -comparison
		})
	}, [data, sortConfig, sortFunctions])

	const handleSort = (key: keyof T | string, label: string) => {
		setSortConfig(prevConfig => {
			if (prevConfig?.key === key) {
				// Toggle direction if same key
				return {
					key,
					direction: prevConfig.direction === 'asc' ? 'desc' : 'asc',
					label,
				}
			} else {
				// New key, default to ascending
				return { key, direction: 'asc', label }
			}
		})
	}

	const clearSort = () => {
		setSortConfig(null)
	}

	return {
		sortedData,
		sortConfig,
		handleSort,
		clearSort,
	}
}
