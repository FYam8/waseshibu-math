export type Grade = 'A' | 'B' | 'C'
export type AttemptStatus = 'correct' | 'wrong' | 'deferred'
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
  seconds?: number
  at: string
}

export type ExamScore = {
  id: string
  deviceId: string
  resetVersion: number
  year: number
  score: number
  at: string
}
