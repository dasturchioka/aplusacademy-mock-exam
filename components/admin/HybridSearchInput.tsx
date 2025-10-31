'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Search, X, Zap } from 'lucide-react'

interface HybridSearchInputProps {
	placeholder?: string
	searchQuery: string
	isSearching: boolean
	isLocalFiltering: boolean
	hasSearchResults: boolean
	localResultsCount: number
	onSearchChange: (query: string) => void
	onClearSearch: () => void
}

export default function HybridSearchInput({
	placeholder = 'Search...',
	searchQuery,
	isSearching,
	isLocalFiltering,
	hasSearchResults,
	localResultsCount,
	onSearchChange,
	onClearSearch,
}: HybridSearchInputProps) {
	return (
		<div className='relative'>
			<div className='relative'>
				<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
				<Input
					type='text'
					placeholder={placeholder}
					value={searchQuery}
					onChange={e => onSearchChange(e.target.value)}
					className='pl-10 pr-20'
				/>

				{/* Loading Indicators */}
				<div className='absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2'>
					{isLocalFiltering && (
						<div className='flex items-center gap-1'>
							<Zap className='h-3 w-3 text-blue-500 animate-pulse' />
							<span className='text-xs text-blue-600'>Filtering...</span>
						</div>
					)}

					{isSearching && (
						<div className='flex items-center gap-1'>
							<Loader2 className='h-3 w-3 text-orange-500 animate-spin' />
							<span className='text-xs text-orange-600'>Searching...</span>
						</div>
					)}

					{searchQuery && (
						<Button
							variant='ghost'
							size='sm'
							onClick={onClearSearch}
							className='h-6 w-6 p-0 hover:bg-gray-100'
							title='Clear search'
						>
							<X className='h-3 w-3' />
						</Button>
					)}
				</div>
			</div>

			{/* Search Status Badges */}
			{hasSearchResults && (
				<div className='flex items-center gap-2 mt-2'>
					{isLocalFiltering && (
						<Badge variant='outline' className='text-xs bg-blue-50 text-blue-700 border-blue-200'>
							<Zap className='h-3 w-3 mr-1' />
							Local filtering...
						</Badge>
					)}

					{isSearching && (
						<Badge
							variant='outline'
							className='text-xs bg-orange-50 text-orange-700 border-orange-200'
						>
							<Loader2 className='h-3 w-3 mr-1 animate-spin' />
							Server search...
						</Badge>
					)}

					{!isSearching && !isLocalFiltering && (
						<Badge variant='secondary' className='text-xs'>
							{localResultsCount} results found
						</Badge>
					)}
				</div>
			)}
		</div>
	)
}
