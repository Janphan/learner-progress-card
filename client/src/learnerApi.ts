export interface Learner {
  id: number
  name: string
}

export interface LearnerProgress extends Learner {
  program: string
  totalLessons: number
  completedLessons: number
  percent: number
  totalModules: number
  completedModules: number
  lastActivityAt: string | null
  weeklyProgress: { week: string; count: number }[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function isLearner(value: unknown): value is Learner {
  return isRecord(value) && isCount(value.id) && value.id > 0 &&
    typeof value.name === 'string' && value.name.trim().length > 0
}

function isProgress(value: unknown): value is LearnerProgress {
  if (!isRecord(value) || !isLearner(value)) return false
  const { program, totalLessons, completedLessons, percent, totalModules,
    completedModules, lastActivityAt, weeklyProgress } = value
  return typeof program === 'string' && program.trim().length > 0 &&
    isCount(totalLessons) && isCount(completedLessons) && completedLessons <= totalLessons &&
    isCount(percent) && percent <= 100 &&
    isCount(totalModules) && isCount(completedModules) && completedModules <= totalModules &&
    (lastActivityAt === null ||
      (typeof lastActivityAt === 'string' && !Number.isNaN(Date.parse(lastActivityAt)))) &&
    Array.isArray(weeklyProgress) && weeklyProgress.every((week: unknown) =>
      isRecord(week) && typeof week.week === 'string' &&
      !Number.isNaN(Date.parse(week.week)) && isCount(week.count))
}

async function request(path: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(path, { signal })
  if (!response.ok) throw new Error(`Request failed (${response.status}).`)
  return response.json()
}

export async function fetchLearners(signal: AbortSignal): Promise<Learner[]> {
  const data = await request('/api/learners', signal)
  if (!Array.isArray(data) || !data.every(isLearner)) {
    throw new Error('The server returned an invalid learner list.')
  }
  return data
}

export async function fetchLearnerProgress(id: number, signal: AbortSignal): Promise<LearnerProgress> {
  const data = await request(`/api/learners/${id}/progress`, signal)
  if (!isProgress(data) || data.id !== id) {
    throw new Error('The server returned invalid learner progress.')
  }
  return data
}
