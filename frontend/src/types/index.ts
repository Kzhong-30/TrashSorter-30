export type QuestionType = 
  | 'radio' 
  | 'checkbox' 
  | 'dropdown' 
  | 'rating' 
  | 'scale' 
  | 'text' 
  | 'date' 
  | 'matrix'

export interface Option {
  id: string
  text: string
  jumpTo?: number
}

export interface LogicRule {
  condition: string
  action: 'jump' | 'skip'
  target: number | 'end'
}

export interface QuestionSettings {
  placeholder?: string
  rows?: number
  maxLength?: number
  minRating?: number
  maxRating?: number
  minValue?: number
  maxValue?: number
  step?: number
  minSelect?: number
  maxSelect?: number
  format?: string
  matrixRows?: string[]
  matrixCols?: string[]
  ratingLabels?: string[]
}

export interface Question {
  id: string
  type: QuestionType
  title: string
  description?: string
  required: boolean
  options?: Option[]
  settings: QuestionSettings
  logic?: LogicRule[]
}

export interface Survey {
  _id?: string
  title: string
  description: string
  welcomeMessage: string
  endMessage: string
  startTime: string | null
  endTime: string | null
  maxResponses: number | null
  isAnonymous: boolean
  status: 'draft' | 'published' | 'closed'
  questions: Question[]
  createdAt?: string
  updatedAt?: string
}

export type AnswerValue = string | string[] | number | null

export interface Answer {
  questionId: string
  value: AnswerValue
}

export interface SurveyResponse {
  _id?: string
  surveyId: string
  answers: Answer[]
  submittedAt?: string
  ipHash?: string
}

export interface QuestionStatistics {
  questionId: string
  type: QuestionType
  title: string
  totalAnswers: number
  distribution: Array<{ label: string; count: number; percentage: number }>
  textAnswers?: string[]
  average?: number
}

export interface Statistics {
  totalResponses: number
  questionStats: QuestionStatistics[]
}
