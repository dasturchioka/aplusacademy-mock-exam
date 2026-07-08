import { Progress } from '@/components/ui/progress'

interface QuestionIndicatorProps {
  currentPart: number
  totalParts: number
  answeredQuestions: number
  totalQuestions: number
}

export function QuestionIndicator({
  currentPart,
  totalParts,
  answeredQuestions,
  totalQuestions
}: QuestionIndicatorProps) {
  const progressPercentage = (answeredQuestions / totalQuestions) * 100

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-700">
          Progress
        </h4>
        <span className="text-sm text-gray-600">
          {answeredQuestions} / {totalQuestions} answered
        </span>
      </div>

      <Progress
        value={progressPercentage}
        className="h-2 mb-3"
      />

      <div className="flex items-center justify-center space-x-4">
        {[1, 2, 3, 4].map((partNum) => (
          <div
            key={partNum}
            className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${currentPart === partNum
                ? 'bg-[#D32F2F] text-white'
                : currentPart > partNum
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500'
              }
            `}
          >
            {partNum}
          </div>
        ))}
      </div>
    </div>
  )
}