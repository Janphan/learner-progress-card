import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type Database from 'better-sqlite3'
import { applyMigrations, openDatabase } from './connection'
import { seedDatabase } from './seed'

let sqlite: Database.Database

beforeEach(() => {
  sqlite = openDatabase(':memory:')
  applyMigrations(sqlite)
})

afterEach(() => {
  sqlite.close()
})

describe('seedDatabase', () => {
  it('creates five learners at distinct progress stages', () => {
    seedDatabase(sqlite)

    const learners = sqlite
      .prepare(`
        SELECT users.email, enrollments.status,
          SUM(CASE WHEN lesson_progress.status = 'completed' THEN 1 ELSE 0 END) AS completed_lessons
        FROM users
        JOIN enrollments ON enrollments.user_id = users.id
        JOIN lesson_progress ON lesson_progress.enrollment_id = enrollments.id
        GROUP BY users.id
        ORDER BY users.email
      `)
      .all() as Array<{
      email: string
      status: string
      completed_lessons: number
    }>

    expect(learners).toHaveLength(5)
    expect(learners).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: 'enrolled', completed_lessons: 0 }),
        expect.objectContaining({ status: 'active', completed_lessons: 2 }),
        expect.objectContaining({ status: 'active', completed_lessons: 5 }),
        expect.objectContaining({ status: 'active', completed_lessons: 8 }),
        expect.objectContaining({ status: 'completed', completed_lessons: 9 }),
      ]),
    )
  })

  it('is idempotent', () => {
    seedDatabase(sqlite)
    seedDatabase(sqlite)

    const counts = sqlite
      .prepare(`
        SELECT
          (SELECT COUNT(*) FROM users) AS users,
          (SELECT COUNT(*) FROM programs) AS programs,
          (SELECT COUNT(*) FROM modules) AS modules,
          (SELECT COUNT(*) FROM lessons) AS lessons,
          (SELECT COUNT(*) FROM enrollments) AS enrollments,
          (SELECT COUNT(*) FROM lesson_progress) AS lesson_progress
      `)
      .get() as Record<string, number>

    expect(counts).toEqual({
      users: 5,
      programs: 1,
      modules: 3,
      lessons: 9,
      enrollments: 5,
      lesson_progress: 45,
    })
  })
})
