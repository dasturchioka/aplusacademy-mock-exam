'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { DashboardRange, UserGrowthPoint } from '../dashboard-types'

interface UsersGrowthChartProps {
	range: DashboardRange
	points: UserGrowthPoint[]
  onRangeChange: (range: DashboardRange) => void
}

export function UsersGrowthChart({ range, points, onRangeChange }: UsersGrowthChartProps) {
	return (
		<Card className='rounded-lg border bg-card shadow-sm'>
			<CardHeader className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
				<div>
					<CardTitle className='font-heading text-lg'>New users</CardTitle>
					<CardDescription>Registered students and admins by selected period.</CardDescription>
				</div>
				<Select value={range} onValueChange={value => onRangeChange(value as DashboardRange)}>
					<SelectTrigger className='w-full sm:w-36'>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='this-year'>This year</SelectItem>
						<SelectItem value='this-month'>This month</SelectItem>
					</SelectContent>
				</Select>
			</CardHeader>
			<CardContent>
				<div className='h-72 w-full'>
					<ResponsiveContainer width='100%' height='100%'>
						<BarChart data={points} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
							<CartesianGrid strokeDasharray='3 3' vertical={false} stroke='var(--border)' />
							<XAxis dataKey='label' tickLine={false} axisLine={false} fontSize={12} />
							<YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
							<Tooltip
								cursor={{ fill: 'var(--muted)' }}
								contentStyle={{
									borderRadius: 8,
									border: '1px solid var(--border)',
									boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
                }}
							/>
							<Bar dataKey='value' name="Users" label={{ position: 'top', fontSize: 14 }}  fill='var(--chart-1)' radius={[6, 6, 0, 0]} />
						</BarChart>
					</ResponsiveContainer>
				</div>
			</CardContent>
		</Card>
	)
}
