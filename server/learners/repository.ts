import type Database from 'better-sqlite3'

export interface Learner {
  id: number
  name: string
}

export interface LearnerEnrollment extends Learner {
  programId: number
  program: string
  enrollmentId: number
}

export interface ModuleCounts {
  id: number
  total: number
  completed: number
}

export interface WeeklyCompletion {
  week: string
  count: number
}

export function listLearners(sqlite: Database.Database): Learner[] {
  return sqlite.prepare<[], Learner>('SELECT id, name FROM users ORDER BY name').all()
}

export function findLearner(sqlite: Database.Database, id: number): LearnerEnrollment | undefined {
  return sqlite.prepare<[number], LearnerEnrollment>(`
    SELECT u.id, u.name, p.id AS programId, p.title AS program,
           e.id AS enrollmentId
    FROM users u
    JOIN enrollments e ON e.user_id = u.id
    JOIN programs p ON p.id = e.program_id
    WHERE u.id = ?
    ORDER BY e.id
    LIMIT 1
  `).get(id)
}

export function findModuleCounts(
  sqlite: Database.Database,
  enrollmentId: number,
  programId: number,
): ModuleCounts[] {
  return sqlite.prepare<[number, number], ModuleCounts>(`
    SELECT m.id, COUNT(l.id) AS total,
           COUNT(CASE WHEN lp.status = 'completed' THEN 1 END) AS completed
    FROM modules m
    LEFT JOIN lessons l ON l.module_id = m.id
    LEFT JOIN lesson_progress lp
      ON lp.lesson_id = l.id AND lp.enrollment_id = ?
    WHERE m.program_id = ?
    GROUP BY m.id
  `).all(enrollmentId, programId)
}

export function findWeeklyCompletions(
  sqlite: Database.Database,
  enrollmentId: number,
): WeeklyCompletion[] {
  return sqlite.prepare<[number], WeeklyCompletion>(`
    SELECT date(completed_at, '-6 days', 'weekday 1') AS week,
           COUNT(*) AS count
    FROM lesson_progress
    WHERE enrollment_id = ? AND status = 'completed'
    GROUP BY week
    ORDER BY week
  `).all(enrollmentId)
}

export function findLastActivity(sqlite: Database.Database, learnerId: number): string | null {
  const activity = sqlite.prepare<[number], { lastActivityAt: string | null }>(`
    SELECT MAX(lp.last_accessed_at) AS lastActivityAt
    FROM lesson_progress lp
    JOIN enrollments e ON e.id = lp.enrollment_id
    WHERE e.user_id = ?
  `).get(learnerId)
  if (!activity) throw new Error('Failed to retrieve learner activity')
  return activity.lastActivityAt
}
