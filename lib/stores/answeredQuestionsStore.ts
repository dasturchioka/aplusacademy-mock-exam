// store/questionNumbersStore.ts
import { create } from 'zustand'

interface QuestionNumbersStore {
	questionNumbers: number[]
	pushNumber: (n: number) => void
}

export const useQuestionNumbersStore = create<QuestionNumbersStore>(set => ({
	questionNumbers: [],
	pushNumber: n =>
		set(state => ({
			questionNumbers: [...state.questionNumbers, n],
		})),
}))
