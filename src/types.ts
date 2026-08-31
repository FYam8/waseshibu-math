export type Grade = 'A' | 'B' | 'C'
export type AttemptStatus = 'correct' | 'wrong' | 'deferred'
export type Approach = 'immediate' | 'thought' | 'none'
export type Diagnosis = 'correct' | 'recoverable' | 'difficult' | 'time'
export type PracticeMode = 'q1' | 'multi'

export type Subquestion = {
  no: string
  topic: string
  grade: Grade
}

export type MajorQuestion = {
  id: string
  year: number
  major: number
  title: string
  domain: string
  subquestions: Subquestion[]
  core_ideas: string[]
  strategy_grade: Grade
  similar_question_template: string
  notes: string[]
}

export type Attempt = {
  id: string
  deviceId: string
  resetVersion: number
  questionId: string
  mode: PracticeMode
  topic: string
  status: AttemptStatus
  mistakeTag?: string
  approach?: Approach
  diagnosis?: Diagnosis
  answer?: string
  flagged?: boolean
  seconds?: number
  at: string
}

export type ExamScore = {
  id: string
  deviceId: string
  resetVersion: number
  year: number
  score: number
  reproducibleScore?: number
  recoverableScore?: number
  timeCandidateScore?: number
  correctCount?: number
  wrongCount?: number
  unansweredCount?: number
  completed?: boolean
  attemptKind?: 'first' | 'retake'
  scoreValidity?: 'first-look' | 'reference'
  weakFields?: string[]
  at: string
}
