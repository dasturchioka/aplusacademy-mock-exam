'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { defaultInstance } from '@/http'
import {
	AlertCircle,
	ArrowDown,
	ArrowUp,
	CheckCircle2,
	FileText,
	PenTool,
	PlayCircle,
	Plus,
	Save,
	Settings,
	Trash2,
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

// Question type configurations
const QUESTION_TYPES = {
	reading: [
		{ value: 'multiple_choice', label: 'Multiple Choice' },
		{ value: 'multiple_matching', label: 'Multiple Matching' },
		{ value: 'true_false_not_given', label: 'True/False/Not Given' },
		{ value: 'yes_no_not_given', label: 'Yes/No/Not Given' },
		{ value: 'fill_in_blanks', label: 'Fill in the Blanks' },
		{ value: 'sentence_completion', label: 'Sentence Completion' },
		{ value: 'matching_paragraph', label: 'Matching Paragraph Information' },
		{ value: 'matching_features', label: 'Matching Features' },
		{ value: 'matching_sentence_endings', label: 'Matching Sentence Endings' },
	],	
	listening: [
		{ value: 'form_completion', label: 'Form Completion' },
		{ value: 'note_completion', label: 'Note Completion' },
		{ value: 'sentence_completion', label: 'Sentence Completion' },
		{ value: 'multiple_choice', label: 'Multiple Choice' },
		{ value: 'map_diagram_labelling', label: 'Map/Diagram Labelling' },
		{ value: 'matching', label: 'Matching' },
		{ value: 'table_completion', label: 'Table Completion' },
		{ value: 'flowchart_completion', label: 'Flowchart Completion' },
		{ value: 'summary_completion', label: 'Summary Completion' },
		{ value: 'pick_from_box', label: 'Pick from a Box' },
	],
	writing: [
		{ value: 'graph_description', label: 'Graph Description' },
		{ value: 'argumentative', label: 'Argumentative Essay' },
		{ value: 'opinion', label: 'Opinion Essay' },
		{ value: 'discussion', label: 'Discussion Essay' },
		{ value: 'problem_solution', label: 'Problem/Solution Essay' },
		{ value: 'advantages_disadvantages', label: 'Advantages/Disadvantages' },
	],
}

interface TestData {
	id: string
	title: string
	edition: string
	test_number: number
	section: string
	listening?: any
	reading?: any
	writing?: any
	created_at: string
	updated_at: string
}

export default function EditTestPage() {
	const params = useParams()
	const router = useRouter()
	const testId = params?.id as string

	const [testData, setTestData] = useState<TestData | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [isSaving, setIsSaving] = useState(false)
	const [error, setError] = useState('')
	const [activeTab, setActiveTab] = useState('reading')
	const [hasChanges, setHasChanges] = useState(false)

	// Load test data
	useEffect(() => {
		loadTestData()
	}, [testId])

	const loadTestData = async () => {
		try {
			setIsLoading(true)
			setError('')

			// Use defaultInstance here instead of fetch
			const response = await defaultInstance.get(`/api/tests/${testId}`)
			const result = response.data

			if (result.success) {
				setTestData(result.test)
				// Set active tab based on available sections
				if (result.test.listening) setActiveTab('listening')
				else if (result.test.reading) setActiveTab('reading')
				else if (result.test.writing) setActiveTab('writing')
			} else {
				setError(result.error || 'Failed to load test')
			}
		} catch (err: any) {
			setError(err.message || 'Failed to load test data')
			console.error('Error loading test:', err)
		} finally {
			setIsLoading(false)
		}
	}

	const saveTestData = async () => {
		if (!testData) return

		try {
			setIsSaving(true)
			setError('')

			// Use defaultInstance here
			const response = await defaultInstance.put(`/api/tests/${testId}`, testData)
			const result = response.data

			if (result.success) {
				setHasChanges(false)
				alert('Test saved successfully!')
			} else {
				setError(result.error || 'Failed to save test')
			}
		} catch (err) {
			setError('Failed to save test')
			console.error('Error saving test:', err)
		} finally {
			setIsSaving(false)
		}
	}

	// Update test data and mark as changed
	const updateTestData = (updates: Partial<TestData>) => {
		setTestData(prev => (prev ? { ...prev, ...updates } : null))
		setHasChanges(true)
	}

	// Question CRUD operations
	const addQuestion = (section: string, partIndex: number) => {
		if (!testData) return

		const newQuestion = {
			id: Date.now().toString(),
			question_type: 'multiple_choice',
			question_text: '',
			options: section === 'writing' ? undefined : ['A.', 'B.', 'C.'],
			answer: section === 'writing' ? '' : 'A',
			min_words: section === 'writing' ? 150 : undefined,
			max_words: section === 'writing' ? 200 : undefined,
		}

		const sectionData = testData[section as keyof TestData]
		if (sectionData && sectionData.parts) {
			const updatedParts = [...sectionData.parts]
			updatedParts[partIndex].questions.push(newQuestion)

			updateTestData({
				[section]: { ...sectionData, parts: updatedParts },
			})
		}
	}

	const updateQuestion = (
		section: string,
		partIndex: number,
		questionIndex: number,
		updates: any
	) => {
		if (!testData) return

		const sectionData = testData[section as keyof TestData]
		if (sectionData && sectionData.parts) {
			const updatedParts = [...sectionData.parts]
			updatedParts[partIndex].questions[questionIndex] = {
				...updatedParts[partIndex].questions[questionIndex],
				...updates,
			}

			updateTestData({
				[section]: { ...sectionData, parts: updatedParts },
			})
		}
	}

	const deleteQuestion = (section: string, partIndex: number, questionIndex: number) => {
		if (!testData) return

		const sectionData = testData[section as keyof TestData]
		if (sectionData && sectionData.parts) {
			const updatedParts = [...sectionData.parts]
			updatedParts[partIndex].questions.splice(questionIndex, 1)

			updateTestData({
				[section]: { ...sectionData, parts: updatedParts },
			})
		}
	}

	const moveQuestion = (
		section: string,
		partIndex: number,
		questionIndex: number,
		direction: 'up' | 'down'
	) => {
		if (!testData) return

		const sectionData = testData[section as keyof TestData]
		if (sectionData && sectionData.parts) {
			const updatedParts = [...sectionData.parts]
			const questions = updatedParts[partIndex].questions
			const newIndex = direction === 'up' ? questionIndex - 1 : questionIndex + 1

			if (newIndex >= 0 && newIndex < questions.length) {
				;[questions[questionIndex], questions[newIndex]] = [
					questions[newIndex],
					questions[questionIndex],
				]

				updateTestData({
					[section]: { ...sectionData, parts: updatedParts },
				})
			}
		}
	}

	// Render question editor based on type
	const renderQuestionEditor = (
		section: string,
		partIndex: number,
		questionIndex: number,
		question: any
	) => {
		const questionTypes = QUESTION_TYPES[section as keyof typeof QUESTION_TYPES] || []

		return (
			<Card key={question.id || questionIndex} className='mb-4'>
				<CardHeader className='pb-3'>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-2'>
							<Badge variant='outline'>Q{questionIndex + 1}</Badge>
							<Select
								value={question.question_type || 'multiple_choice'}
								onValueChange={value =>
									updateQuestion(section, partIndex, questionIndex, { question_type: value })
								}
							>
								<SelectTrigger className='w-48'>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{questionTypes.map(type => (
										<SelectItem key={type.value} value={type.value}>
											{type.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className='flex items-center gap-1'>
							<Button
								variant='outline'
								size='sm'
								onClick={() => moveQuestion(section, partIndex, questionIndex, 'up')}
								disabled={questionIndex === 0}
							>
								<ArrowUp className='w-4 h-4' />
							</Button>
							<Button
								variant='outline'
								size='sm'
								onClick={() => moveQuestion(section, partIndex, questionIndex, 'down')}
								disabled={
									questionIndex ===
									testData?.[section as keyof TestData]?.parts[partIndex].questions.length - 1
								}
							>
								<ArrowDown className='w-4 h-4' />
							</Button>
							<Button
								variant='outline'
								size='sm'
								onClick={() => deleteQuestion(section, partIndex, questionIndex)}
							>
								<Trash2 className='w-4 h-4' />
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent className='space-y-4'>
					{/* Question Text */}
					<div>
						<Label>Question Text</Label>
						<Textarea
							value={question.question_text || ''}
							onChange={e =>
								updateQuestion(section, partIndex, questionIndex, { question_text: e.target.value })
							}
							placeholder='Enter question text...'
							rows={3}
						/>
					</div>

					{/* Options (for multiple choice questions) */}
					{question.question_type?.includes('multiple_choice') && (
						<div>
							<Label>Options</Label>
							<div className='space-y-2'>
								{(question.options || []).map((option: string, optIndex: number) => (
									<div key={optIndex} className='flex items-center gap-2'>
										<Input
											value={option}
											onChange={e => {
												const newOptions = [...(question.options || [])]
												newOptions[optIndex] = e.target.value
												updateQuestion(section, partIndex, questionIndex, { options: newOptions })
											}}
											placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
										/>
										<Button
											variant='outline'
											size='sm'
											onClick={() => {
												const newOptions = [...(question.options || [])]
												newOptions.splice(optIndex, 1)
												updateQuestion(section, partIndex, questionIndex, { options: newOptions })
											}}
										>
											<Trash2 className='w-4 h-4' />
										</Button>
									</div>
								))}
								<Button
									variant='outline'
									size='sm'
									onClick={() => {
										const newOptions = [...(question.options || []), '']
										updateQuestion(section, partIndex, questionIndex, { options: newOptions })
									}}
								>
									<Plus className='w-4 h-4' />
									Add Option
								</Button>
							</div>
						</div>
					)}

					{/* Answer */}
					<div>
						<Label>Correct Answer</Label>
						{question.question_type?.includes('multiple_choice') ? (
							<Select
								value={question.answer || ''}
								onValueChange={value =>
									updateQuestion(section, partIndex, questionIndex, { answer: value })
								}
							>
								<SelectTrigger>
									<SelectValue placeholder='Select correct answer' />
								</SelectTrigger>
								<SelectContent>
									{(question.options || []).map((option: string, optIndex: number) => (
										<SelectItem key={optIndex} value={String.fromCharCode(65 + optIndex)}>
											{String.fromCharCode(65 + optIndex)}. {option}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						) : (
							<Input
								value={question.answer || ''}
								onChange={e =>
									updateQuestion(section, partIndex, questionIndex, { answer: e.target.value })
								}
								placeholder='Enter correct answer...'
							/>
						)}
					</div>

					{/* Word limits for writing */}
					{section === 'writing' && (
						<div className='grid grid-cols-2 gap-4'>
							<div>
								<Label>Min Words</Label>
								<Input
									type='number'
									value={question.min_words || ''}
									onChange={e =>
										updateQuestion(section, partIndex, questionIndex, {
											min_words: parseInt(e.target.value),
										})
									}
									placeholder='150'
								/>
							</div>
							<div>
								<Label>Max Words</Label>
								<Input
									type='number'
									value={question.max_words || ''}
									onChange={e =>
										updateQuestion(section, partIndex, questionIndex, {
											max_words: parseInt(e.target.value),
										})
									}
									placeholder='200'
								/>
							</div>
						</div>
					)}

					{/* Sample answer for writing */}
					{section === 'writing' && (
						<div>
							<Label>Sample Answer (Optional)</Label>
							<Textarea
								value={question.sample_answer || ''}
								onChange={e =>
									updateQuestion(section, partIndex, questionIndex, {
										sample_answer: e.target.value,
									})
								}
								placeholder='Enter sample answer...'
								rows={6}
							/>
						</div>
					)}
				</CardContent>
			</Card>
		)
	}

	// Render section editor
	const renderSectionEditor = (section: string, data: any) => {
		if (!data || !data.parts) return null

		const sectionIcon =
			section === 'listening' ? PlayCircle : section === 'reading' ? FileText : PenTool
		const Icon = sectionIcon

		return (
			<div className='space-y-6'>
				<div className='flex items-center gap-2 mb-4'>
					<Icon className='w-5 h-5' />
					<h2 className='text-xl font-semibold capitalize'>{section} Section</h2>
					<Badge variant='secondary'>{data.parts.length} parts</Badge>
				</div>

				{data.parts.map((part: any, partIndex: number) => (
					<Card key={partIndex} className='mb-6'>
						<CardHeader>
							<CardTitle className='flex items-center justify-between'>
								<span>
									{section === 'reading'
										? `Passage ${partIndex + 1}`
										: section === 'listening'
										? `Section ${partIndex + 1}`
										: `Task ${partIndex + 1}`}
								</span>
								<Badge variant='outline'>{part.questions?.length || 0} questions</Badge>
							</CardTitle>
						</CardHeader>
						<CardContent className='space-y-4'>
							{/* Part Title */}
							<div>
								<Label>Title</Label>
								<Input
									value={part.title || part.passage_title || part.section_title || ''}
									onChange={e => {
										const updatedParts = [...data.parts]
										updatedParts[partIndex] = {
											...updatedParts[partIndex],
											title: e.target.value,
											passage_title: e.target.value,
											section_title: e.target.value,
										}
										updateTestData({
											[section]: { ...data, parts: updatedParts },
										})
									}}
									placeholder='Enter part title...'
								/>
							</div>

							{/* Passage Text (for reading) */}
							{section === 'reading' && (
								<div>
									<Label>Passage Text</Label>
									<Textarea
										value={part.passage_text || ''}
										onChange={e => {
											const updatedParts = [...data.parts]
											updatedParts[partIndex] = {
												...updatedParts[partIndex],
												passage_text: e.target.value,
											}
											updateTestData({
												[section]: { ...data, parts: updatedParts },
											})
										}}
										placeholder='Enter passage text...'
										rows={8}
									/>
								</div>
							)}

							{/* Audio URL (for listening) */}
							{section === 'listening' && (
								<div>
									<Label>Audio URL</Label>
									<Input
										value={part.audio_url || ''}
										onChange={e => {
											const updatedParts = [...data.parts]
											updatedParts[partIndex] = {
												...updatedParts[partIndex],
												audio_url: e.target.value,
											}
											updateTestData({
												[section]: { ...data, parts: updatedParts },
											})
										}}
										placeholder='https://example.com/audio.mp3'
									/>
								</div>
							)}

							{/* Instructions */}
							<div>
								<Label>Instructions</Label>
								<Textarea
									value={part.instructions || ''}
									onChange={e => {
										const updatedParts = [...data.parts]
										updatedParts[partIndex] = {
											...updatedParts[partIndex],
											instructions: e.target.value,
										}
										updateTestData({
											[section]: { ...data, parts: updatedParts },
										})
									}}
									placeholder='Enter instructions...'
									rows={3}
								/>
							</div>

							{/* Questions */}
							<div>
								<div className='flex items-center justify-between mb-3'>
									<Label>Questions</Label>
									<Button
										variant='outline'
										size='sm'
										onClick={() => addQuestion(section, partIndex)}
									>
										<Plus className='w-4 h-4 mr-1' />
										Add Question
									</Button>
								</div>
								<div className='space-y-4'>
									{(part.questions || []).map((question: any, questionIndex: number) =>
										renderQuestionEditor(section, partIndex, questionIndex, question)
									)}
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		)
	}

	// Loading state
	if (isLoading) {
		return (
			<div className='container mx-auto p-6 max-w-6xl'>
				<div className='text-center py-12'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
					<p className='text-gray-600'>Loading test data...</p>
				</div>
			</div>
		)
	}

	// Error state
	if (error || !testData) {
		return (
			<div className='container mx-auto p-6 max-w-6xl'>
				<Alert variant='destructive'>
					<AlertCircle className='h-4 w-4' />
					<AlertDescription>{error || 'Test not found'}</AlertDescription>
				</Alert>
				<Button onClick={() => router.push('/admin/tests')} className='mt-4'>
					Back to Tests
				</Button>
			</div>
		)
	}

	return (
		<div className='container mx-auto p-6 max-w-6xl'>
			{/* Header */}
			<div className='flex items-center justify-between mb-8'>
				<div>
					<h1 className='text-3xl font-bold mb-2'>Edit Test</h1>
					<p className='text-gray-600'>
						{testData.title} - {testData.edition} (Test {testData.test_number})
					</p>
				</div>
				<div className='flex items-center gap-2'>
					{hasChanges && (
						<Badge variant='destructive'>
							<AlertCircle className='w-3 h-3 mr-1' />
							Unsaved Changes
						</Badge>
					)}
					<Button
						onClick={saveTestData}
						disabled={isSaving || !hasChanges}
						className='bg-green-600 hover:bg-green-700'
					>
						{isSaving ? (
							<>
								<div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
								Saving...
							</>
						) : (
							<>
								<Save className='w-4 h-4 mr-2' />
								Save Test
							</>
						)}
					</Button>
				</div>
			</div>

			{/* Test Metadata */}
			<Card className='mb-8'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Settings className='w-5 h-5' />
						Test Metadata
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
						<div>
							<Label>Test Title</Label>
							<Input
								value={testData.title}
								onChange={e => updateTestData({ title: e.target.value })}
							/>
						</div>
						<div>
							<Label>Edition</Label>
							<Input
								value={testData.edition}
								onChange={e => updateTestData({ edition: e.target.value })}
							/>
						</div>
						<div>
							<Label>Test Number</Label>
							<Input
								type='number'
								value={testData.test_number}
								onChange={e => updateTestData({ test_number: parseInt(e.target.value) })}
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Section Tabs */}
			<Tabs value={activeTab}>
				<TabsList className='grid w-full grid-cols-3'>
					<TabsTrigger value='listening' disabled={!testData.listening}>
						<PlayCircle className='w-4 h-4 mr-2' />
						Listening
						{testData.listening && <CheckCircle2 className='w-4 h-4 ml-2 text-green-500' />}
					</TabsTrigger>
					<TabsTrigger value='reading' disabled={!testData.reading}>
						<FileText className='w-4 h-4 mr-2' />
						Reading
						{testData.reading && <CheckCircle2 className='w-4 h-4 ml-2 text-green-500' />}
					</TabsTrigger>
					<TabsTrigger value='writing' disabled={!testData.writing}>
						<PenTool className='w-4 h-4 mr-2' />
						Writing
						{testData.writing && <CheckCircle2 className='w-4 h-4 ml-2 text-green-500' />}
					</TabsTrigger>
				</TabsList>

				<TabsContent value='listening' className='mt-6'>
					{testData.listening ? (
						renderSectionEditor('listening', testData.listening)
					) : (
						<Alert>
							<AlertCircle className='h-4 w-4' />
							<AlertDescription>
								No listening section data available. Process a listening test first.
							</AlertDescription>
						</Alert>
					)}
				</TabsContent>

				<TabsContent value='reading' className='mt-6'>
					{testData.reading ? (
						renderSectionEditor('reading', testData.reading)
					) : (
						<Alert>
							<AlertCircle className='h-4 w-4' />
							<AlertDescription>
								No reading section data available. Process a reading test first.
							</AlertDescription>
						</Alert>
					)}
				</TabsContent>

				<TabsContent value='writing' className='mt-6'>
					{testData.writing ? (
						renderSectionEditor('writing', testData.writing)
					) : (
						<Alert>
							<AlertCircle className='h-4 w-4' />
							<AlertDescription>
								No writing section data available. Process a writing test first.
							</AlertDescription>
						</Alert>
					)}
				</TabsContent>
			</Tabs>

			{/* Footer */}
			<div className='flex justify-between items-center mt-8 pt-6 border-t'>
				<Button variant='outline' onClick={() => router.push('/admin/tests')}>
					Back to Tests
				</Button>
				<div className='text-sm text-gray-500'>
					Last updated: {new Date(testData.updated_at).toLocaleString()}
				</div>
			</div>
		</div>
	)
}
