import type Database from 'better-sqlite3'

const createdAt = '2026-01-01T00:00:00.000Z'
const updatedAt = createdAt

const programSeed = {
  title: 'Demo: Learning Foundations',
  description: 'A sample program for previewing learner progress.',
  status: 'published',
} as const

const moduleSeeds = [
  { title: 'Getting Started', lessons: ['Welcome', 'Learning Goals', 'Study Plan'] },
  { title: 'Core Skills', lessons: ['First Principles', 'Practice', 'Knowledge Check'] },
  { title: 'Next Steps', lessons: ['Apply Your Skills', 'Review', 'Final Assessment'] },
] as const

const lessonContentTypes = ['article', 'video', 'quiz'] as const

const learnerSeeds = [
  {
    name: 'Alex Morgan',
    email: 'alex.morgan@example.test',
    enrollmentStatus: 'enrolled',
    startedAt: null,
    completedAt: null,
    completedLessons: 0,
    inProgressLesson: null,
    enrolledAt: '2026-01-02T00:00:00.000Z',
  },
  {
    name: 'Jordan Lee',
    email: 'jordan.lee@example.test',
    enrollmentStatus: 'active',
    startedAt: '2026-01-05T00:00:00.000Z',
    completedAt: null,
    completedLessons: 2,
    inProgressLesson: { position: 3, percent: 40 },
    enrolledAt: '2026-01-04T00:00:00.000Z',
  },
  {
    name: 'Casey Patel',
    email: 'casey.patel@example.test',
    enrollmentStatus: 'active',
    startedAt: '2026-01-10T00:00:00.000Z',
    completedAt: null,
    completedLessons: 5,
    inProgressLesson: { position: 6, percent: 60 },
    enrolledAt: '2026-01-09T00:00:00.000Z',
  },
  {
    name: 'Riley Chen',
    email: 'riley.chen@example.test',
    enrollmentStatus: 'active',
    startedAt: '2026-01-15T00:00:00.000Z',
    completedAt: null,
    completedLessons: 8,
    inProgressLesson: { position: 9, percent: 80 },
    enrolledAt: '2026-01-14T00:00:00.000Z',
  },
  {
    name: 'Taylor Brooks',
    email: 'taylor.brooks@example.test',
    enrollmentStatus: 'completed',
    startedAt: '2026-01-20T00:00:00.000Z',
    completedAt: '2026-02-01T00:00:00.000Z',
    completedLessons: 9,
    inProgressLesson: null,
    enrolledAt: '2026-01-19T00:00:00.000Z',
  },
] as const

type LearnerSeed = (typeof learnerSeeds)[number]

function seedProgram(sqlite: Database.Database): number {
  const existing = sqlite
    .prepare('SELECT id FROM programs WHERE title = ? LIMIT 1')
    .get(programSeed.title) as { id: number } | undefined

  if (existing) {
    sqlite
      .prepare(
        'UPDATE programs SET description = ?, status = ?, updated_at = ? WHERE id = ?',
      )
      .run(programSeed.description, programSeed.status, updatedAt, existing.id)
    return existing.id
  }

  const result = sqlite
    .prepare(
      'INSERT INTO programs (title, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    )
    .run(programSeed.title, programSeed.description, programSeed.status, createdAt, updatedAt)

  return Number(result.lastInsertRowid)
}

function seedCurriculum(sqlite: Database.Database, programId: number): number[] {
  const moduleStatement = sqlite.prepare(`
    INSERT INTO modules (program_id, title, description, position, created_at, updated_at)
    VALUES (?, ?, NULL, ?, ?, ?)
    ON CONFLICT (program_id, position)
    DO UPDATE SET title = excluded.title, updated_at = excluded.updated_at
  `)
  const findModule = sqlite.prepare(
    'SELECT id FROM modules WHERE program_id = ? AND position = ?',
  )
  const lessonStatement = sqlite.prepare(`
    INSERT INTO lessons (
      module_id, program_id, title, content_type, position, duration_minutes, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (module_id, position)
    DO UPDATE SET
      title = excluded.title,
      content_type = excluded.content_type,
      duration_minutes = excluded.duration_minutes,
      updated_at = excluded.updated_at
  `)
  const findLessons = sqlite.prepare(
    'SELECT id FROM lessons WHERE program_id = ? ORDER BY (SELECT position FROM modules WHERE modules.id = lessons.module_id), position',
  )

  moduleSeeds.forEach((moduleSeed, moduleIndex) => {
    const modulePosition = moduleIndex + 1
    moduleStatement.run(programId, moduleSeed.title, modulePosition, createdAt, updatedAt)

    const module = findModule.get(programId, modulePosition) as { id: number }
    moduleSeed.lessons.forEach((title, lessonIndex) => {
      const lessonPosition = lessonIndex + 1
      const contentType = lessonContentTypes[lessonIndex % lessonContentTypes.length]
      lessonStatement.run(
        module.id,
        programId,
        title,
        contentType,
        lessonPosition,
        10 + lessonIndex * 5,
        createdAt,
        updatedAt,
      )
    })
  })

  return (findLessons.all(programId) as Array<{ id: number }>).map(({ id }) => id)
}

function seedLearner(
  sqlite: Database.Database,
  learner: LearnerSeed,
  programId: number,
  lessonIds: number[],
): void {
  sqlite
    .prepare(`
      INSERT INTO users (name, email, created_at, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT (email) DO UPDATE SET name = excluded.name, updated_at = excluded.updated_at
    `)
    .run(learner.name, learner.email, createdAt, updatedAt)

  const user = sqlite
    .prepare('SELECT id FROM users WHERE email = ?')
    .get(learner.email) as { id: number }

  sqlite
    .prepare(`
      INSERT INTO enrollments (
        user_id, program_id, enrolled_at, started_at, completed_at, status
      )
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT (user_id, program_id) DO UPDATE SET
        enrolled_at = excluded.enrolled_at,
        started_at = excluded.started_at,
        completed_at = excluded.completed_at,
        status = excluded.status
    `)
    .run(
      user.id,
      programId,
      learner.enrolledAt,
      learner.startedAt,
      learner.completedAt,
      learner.enrollmentStatus,
    )

  const enrollment = sqlite
    .prepare('SELECT id FROM enrollments WHERE user_id = ? AND program_id = ?')
    .get(user.id, programId) as { id: number }

  const progressStatement = sqlite.prepare(`
    INSERT INTO lesson_progress (
      enrollment_id, lesson_id, program_id, status, progress_percent,
      started_at, completed_at, last_accessed_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (enrollment_id, lesson_id) DO UPDATE SET
      program_id = excluded.program_id,
      status = excluded.status,
      progress_percent = excluded.progress_percent,
      started_at = excluded.started_at,
      completed_at = excluded.completed_at,
      last_accessed_at = excluded.last_accessed_at
  `)

  lessonIds.forEach((lessonId, index) => {
    const lessonNumber = index + 1
    const isCompleted = lessonNumber <= learner.completedLessons
    const isInProgress = learner.inProgressLesson?.position === lessonNumber
    const status = isCompleted
      ? 'completed'
      : isInProgress
        ? 'in_progress'
        : 'not_started'
    const progressPercent = isCompleted
      ? 100
      : isInProgress
        ? learner.inProgressLesson.percent
        : 0
    const startedAt =
      status === 'not_started' ? null : learner.startedAt
    const completedAt = isCompleted ? learner.completedAt ?? learner.startedAt : null
    const lastAccessedAt = status === 'not_started' ? null : learner.startedAt

    progressStatement.run(
      enrollment.id,
      lessonId,
      programId,
      status,
      progressPercent,
      startedAt,
      completedAt,
      lastAccessedAt,
    )
  })
}

export function seedDatabase(sqlite: Database.Database): void {
  sqlite.transaction(() => {
    const programId = seedProgram(sqlite)
    const lessonIds = seedCurriculum(sqlite, programId)

    for (const learner of learnerSeeds) {
      seedLearner(sqlite, learner, programId, lessonIds)
    }
  })()
}
