'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SortConfig, SortDirection } from '@/hooks/useSorting'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, X } from 'lucide-react'
import React from 'react'

interface SortOption {
	key: string
	label: string
	icon?: React.ReactNode
}

interface SortingControlsProps<T> {
	sortOptions: SortOption[]
	currentSort: SortConfig<T> | null
	onSort: (key: string, label: string) => void
	onClearSort: () => void
}

export default function SortingControls<T>({
	sortOptions,
	currentSort,
	onSort,
	onClearSort,
}: SortingControlsProps<T>) {
	const getSortIcon = (direction: SortDirection) => {
		switch (direction) {
			case 'asc':
				return <ArrowUp className='h-3 w-3' />
			case 'desc':
				return <ArrowDown className='h-3 w-3' />
			default:
				return <ArrowUpDown className='h-3 w-3' />
		}
	}

	return (
		<div className='flex items-center gap-2'>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant='outline' size='sm' className='h-8'>
						<ArrowUpDown className='h-4 w-4 mr-2' />
						Sort
						<ChevronDown className='h-4 w-4 ml-2' />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end' className='w-48'>
					{sortOptions.map(option => (
						<DropdownMenuItem
							key={option.key}
							onClick={() => onSort(option.key, option.label)}
							className='flex items-center justify-between cursor-pointer'
						>
							<div className='flex items-center gap-2'>
								{option.icon}
								<span>{option.label}</span>
							</div>
							{currentSort?.key === option.key && (
								<div className='flex items-center gap-1'>{getSortIcon(currentSort.direction)}</div>
							)}
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>

			{currentSort && (
				<div className='flex items-center gap-2'>
					<Badge variant='secondary' className='flex items-center gap-1 text-xs'>
						{getSortIcon(currentSort.direction)}
						{currentSort.label}
						{currentSort.direction === 'asc' ? ' (A-Z)' : ' (Z-A)'}
					</Badge>
					<Button
						variant='ghost'
						size='sm'
						onClick={onClearSort}
						className='h-8 w-8 p-0'
						title='Clear sorting'
					>
						<X className='h-4 w-4' />
					</Button>
				</div>
			)}
		</div>
	)
}
