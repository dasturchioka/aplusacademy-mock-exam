'use client'
import MatchHeadingAdmin from '@/components/admin/reading/MatchHeading'
import SummaryCompletionAdmin from '@/components/admin/reading/SummaryCompletion'
import SummarySelectCompletionAdmin from '@/components/admin/reading/SummarySelectCompletion'
import TrueFalseNotGivenAdmin from '@/components/admin/reading/TrueFalseNotGiven'
import ReadingMatchingExam from '@/components/exam/reading/Matching'
import SummaryCompletionExam from '@/components/exam/reading/SummaryCompletion'
import SummarySelectCompletionExam from '@/components/exam/reading/SummarySelectCompletion'
import TrueFalseNotGivenExam from '@/components/exam/reading/TrueFalseNotGiven'
import MatchingSentenceEndingsAdmin from '@/components/admin/reading/MatchingSentenceEnding'
import MatchingSentenceEndingsExam from '@/components/exam/reading/MatchingSentenceEnding'

export default function DebugReading() {
	return (
		<div className='container mx-auto py-8'>
			<h1 className='text-6xl font-bold'>Match heading</h1>
			<h1 className='text-3xl font-bold mb-5'>Admin</h1>
			<MatchHeadingAdmin
				data={{
					id: "",
					isInteractive: true,
					questionStart: 12,
					questionEnd: 18,
					questionId: 'reading-1-1-1',
					type: 'match-heading',
					instructions: [
						'Choose the correct heading for each paragraph.',
						'Write the correct number (i–ix) in boxes 1–5.',
					],
					options: [
						{ variant: 'i', text: 'Origins of the policy' },
						{ variant: 'ii', text: 'Environmental concerns' },
						{ variant: 'iii', text: 'Historical background' },
						{ variant: 'iv', text: 'Economic arguments' },
					],
					questions: [
						{ number: 1, paragraph: 'Paragraph A', answer: 'i', questionId: '' },
						{ number: 2, paragraph: 'Paragraph B', answer: 'ii', questionId: '' },
						{ number: 3, paragraph: 'Paragraph C', answer: 'iii', questionId: '' },
					],
				}}
				onChange={updated => console.log(updated)}
			/>

			<h1 className='text-6xl font-bold my-5'>Exam</h1>


			<h1 className='text-6xl font-bold'>Sentence completion</h1>
			<h1 className='text-3xl font-bold mb-5'>Admin</h1>
			<SummaryCompletionAdmin
				questionBlock={{
					id: "",
					isInteractive: true,
					questionId: 'reading-2-33',
					type: 'summary-completion',
					questionStart: 11,
					questionEnd: 14,
					instructions: ['Complete the sentence below'],
					text: 'No way ____ did that', // contains sentence with ____ placeholders,
					answers: [{ number: 11, correctAnswer: 'he' }],
				}}
				onChange={updated => console.log(updated)}
			/>
			<h1 className='text-3xl font-bold mb-5'>Exam</h1>
			<SummaryCompletionExam
				questionBlock={{
					questionId: 'reading-2-33',
					type: 'summary-completion',
					instructions: [
						'Complete the summary below.',
						'Choose ONE WORD ONLY from the passage for each answer.',
					],
					questionStart: 1,
					questionEnd: 3,
					text: 'Piracy was an issue ancient Rome had to deal with, but it also brought some ____ for Rome. For example, pirates supplied slaves that were important for ____. However, attacks on vessels ____ resulted in calls for punishment.',
					answers: [
						{ number: 1, correctAnswer: 'benefits' },
						{ number: 2, correctAnswer: 'industries' },
						{ number: 3, correctAnswer: 'transporting' },
					],
				}}
				onAnswerChange={answers => console.log(answers)}
			/>
			<h1 className='text-6xl font-bold'>True False Not Given</h1>
			<h1 className='text-3xl font-bold mb-5'>Admin</h1>
			<TrueFalseNotGivenAdmin
				question={{
					type: 'true-false-not-given',
					instructions: [
						'Do the following statements agree with the information in the passage?',
						'Write TRUE, FALSE, or NOT GIVEN.',
					],
					questionStart: 1,
					questionEnd: 3,
					inputType: 'radio',
					isInteractive: true,
					questions: [
						{
							questionId: 'reading-1-1',
							questionNumber: 1,
							questionText: 'The Eiffel Tower was constructed in 1889.',
							options: [
								{ text: 'TRUE', isInteractive: true },
								{ text: 'FALSE', isInteractive: true },
								{ text: 'NOT GIVEN', isInteractive: true },
							],
							answer: {
								correct: 'TRUE',
							},
						},
						{
							questionId: 'reading-1-2',
							questionNumber: 2,
							questionText: 'It is the tallest structure in the world.',
							options: [
								{ text: 'TRUE', isInteractive: true },
								{ text: 'FALSE', isInteractive: true },
								{ text: 'NOT GIVEN', isInteractive: true },
							],
							answer: {
								correct: 'FALSE',
							},
						},
						{
							questionId: 'reading-1-3',
							questionNumber: 3,
							questionText: 'Millions of people visit the Eiffel Tower every year.',
							options: [
								{ text: 'TRUE', isInteractive: true },
								{ text: 'FALSE', isInteractive: true },
								{ text: 'NOT GIVEN', isInteractive: true },
							],
							answer: {
								correct: 'TRUE',
							},
						},
					],
				}}
				onChange={updated => console.log(updated)}
			/>
			<h1 className='text-3xl font-bold mb-5'>Exam</h1>
			<TrueFalseNotGivenExam
				question={{
					type: 'true-false-not-given',
					instructions: [
						'Do the following statements agree with the information in the passage?',
						'Write TRUE, FALSE, or NOT GIVEN.',
					],
					questionStart: 1,
					questionEnd: 3,
					inputType: 'radio',
					isInteractive: true,
					questions: [
						{
							questionId: 'reading-1-1',
							questionNumber: 1,
							questionText: 'The Eiffel Tower was constructed in 1889.',
							options: [
								{ text: 'TRUE', isInteractive: true },
								{ text: 'FALSE', isInteractive: true },
								{ text: 'NOT GIVEN', isInteractive: true },
							],
							answer: {
								correct: 'TRUE',
							},
						},
						{
							questionId: 'reading-1-2',
							questionNumber: 2,
							questionText: 'It is the tallest structure in the world.',
							options: [
								{ text: 'TRUE', isInteractive: true },
								{ text: 'FALSE', isInteractive: true },
								{ text: 'NOT GIVEN', isInteractive: true },
							],
							answer: {
								correct: 'FALSE',
							},
						},
						{
							questionId: 'reading-1-3',
							questionNumber: 3,
							questionText: 'Millions of people visit the Eiffel Tower every year.',
							options: [
								{ text: 'TRUE', isInteractive: true },
								{ text: 'FALSE', isInteractive: true },
								{ text: 'NOT GIVEN', isInteractive: true },
							],
							answer: {
								correct: 'TRUE',
							},
						},
					],
				}}
				onAnswerChange={answers => console.log(answers)}
			/>

			<SummarySelectCompletionAdmin
				questionBlock={{
					questionId: 'mock-summary-01',
					type: 'summary-select-completion',
					questionStart: 31,
					questionEnd: 36,
					instructions: [
						'Complete the summary using the list of phrases, A–J, below.',
						'Write the correct letter, A–J, in boxes on your answer sheet.',
					],
					text: 'Although people have ____ to misinformation, there is debate about precisely how and when we label something as true or untrue. The philosophers Descartes and Spinoza had ____ about how people engage with information. While Descartes believed that people accept or reject information after considering whether it is true or not, Spinoza argued that people accepted all information they encountered (and by default misinformation) and did not verify or reject it until afterwards. Moreover, Spinoza believed that a distinct ____ is involved in these stages. Recent research has provided ____ for Spinoza’s theory and it would appear that people accept all encountered information as if it were true, even if this is for an extremely ____ , and do not label the information as true or false until later. This is consistent with the fact that the resources for scepticism and the resources for perceiving and encoding are in ____ in the brain.',
					options: [
						'constant conflict',
						'additional evidence',
						'different locations',
						'experimental subjects',
						'short period',
						'extreme distrust',
						'frequent exposure',
						'mental operation',
						'dubious reason',
						'different ideas',
					],
					answers: [
						{ number: 31, correctAnswer: 'G' },
						{ number: 32, correctAnswer: 'J' },
						{ number: 33, correctAnswer: 'H' },
						{ number: 34, correctAnswer: 'B' },
						{ number: 35, correctAnswer: 'E' },
						{ number: 36, correctAnswer: 'C' },
					],
				}}
				onChange={updated => console.log(updated)}
			/>

			<SummarySelectCompletionExam
				questionBlock={{
					questionId: 'mock-summary-01',
					type: 'summary-select-completion' as const,
					questionStart: 31,
					questionEnd: 36,
					instructions: [
						'Complete the summary using the list of phrases, A–J, below.',
						'Write the correct letter, A–J, in boxes on your answer sheet.',
					],
					text: 'Although people have ____ to misinformation, there is debate about precisely how and when we label something as true or untrue. The philosophers Descartes and Spinoza had ____ about how people engage with information. While Descartes believed that people accept or reject information after considering whether it is true or not, Spinoza argued that people accepted all information they encountered (and by default misinformation) and did not verify or reject it until afterwards. Moreover, Spinoza believed that a distinct ____ is involved in these stages. Recent research has provided ____ for Spinoza’s theory and it would appear that people accept all encountered information as if it were true, even if this is for an extremely ____ , and do not label the information as true or false until later. This is consistent with the fact that the resources for scepticism and the resources for perceiving and encoding are in ____ in the brain.',
					options: [
						'constant conflict',
						'additional evidence',
						'different locations',
						'experimental subjects',
						'short period',
						'extreme distrust',
						'frequent exposure',
						'mental operation',
						'dubious reason',
						'different ideas',
					],
					answers: [], // not needed on exam side
				}}
				onAnswerChange={answers => console.log(answers)}
			/>

			<ReadingMatchingExam
				onAnswerChange={answers => console.log(answers)}
				data={{
					questionStart: '21',
					questionEnd: '23',
					type: 'matching',
					instructions: ['Instructions'],
					pairs: [
						{ number: 21, item: 'Anna', match: 'Mountain hiking', isInteractive: true },
						{ number: 22, item: 'Ben', match: 'City tour', isInteractive: true },
						{ number: 23, item: 'Clara', match: 'Museum visit', isInteractive: true },
					],
					
					options: [
						{ label: 'A', text: 'City tour' },
						{ label: 'B', text: 'Mountain hiking' },
						{ label: 'C', text: 'Museum visit' },
						{ label: 'D', text: 'Beach day' },
					],
					optionsAtATime: '3',
				}}
				userAnswers={{}}
			/>
		</div>
	)
}
