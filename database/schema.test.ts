import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type Database from 'better-sqlite3'
import { applyMigrations, openDatabase } from './connection'

const NOW = '2026-11-07T10:15:30.000Z'

let sqlite: Database.Database

function insertFixtureRows(): void {
  sqlite.exec(`
    INSERT INTO users (id, name, email, created_at, updated_at)
    VALUES (1, 'Ada Learner', 'ada@example.com', '${NOW}', '${NOW}');

    INSERT INTO programs (id, title, description, status, created_at, updated_at)
    VALUES
      (1, 'Intro to TypeScript', NULL, 'published', '${NOW}', '${NOW}'),
      (2, 'Second Program', NULL, 'published', '${NOW}', '${NOW}');

    INSERT INTO modules (id, program_id, title, description, position, created_at, updated_at)
    VALUES
      (1, 1, 'Foundations', NULL, 1, '${NOW}', '${NOW}'),
      (2, 2, 'Elsewhere', NULL, 1, '${NOW}', '${NOW}');

    INSERT INTO lessons (id, module_id, program_id, title, content_type, position, duration_minutes, created_at, updated_at)
    VALUES
      (1, 1, 1, 'First lesson', 'video', 1, 10, '${NOW}', '${NOW}'),
      (2, 2, 2, 'Other program lesson', 'article', 1, 5, '${NOW}', '${NOW}'),
      (3, 1, 1, 'Second lesson', 'quiz', 2, 0, '${NOW}', '${NOW}');

    INSERT INTO enrollments (id, user_id, program_id, enrolled_at, started_at, completed_at, status)
    VALUES (1, 1, 1, '${NOW}', '${NOW}', NULL, 'active');

    INSERT INTO lesson_progress (id, enrollment_id, lesson_id, program_id, status, progress_percent, started_at, completed_at, last_accessed_at)
    VALUES (1, 1, 1, 1, 'not_started', 0, NULL, NULL, NULL);
  `)
}

function expectConstraintError(sql: string): void {
  expect(() => sqlite.exec(sql)).toThrow(/constraint failed/i)
}

beforeEach(() => {
  sqlite = openDatabase(':memory:')
  applyMigrations(sqlite)
  insertFixtureRows()
})

afterEach(() => {
  sqlite.close()
})

describe('migrations', () => {
  it('creates every table in the data model', () => {
    const rows = sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all() as Array<{ name: string }>

    expect(rows.map((row) => row.name)).toEqual(
      expect.arrayContaining([
        'users',
        'programs',
        'modules',
        'lessons',
        'enrollments',
        'lesson_progress',
      ]),
    )
  })

  it('enables foreign key enforcement on the connection', () => {
    expect(sqlite.pragma('foreign_keys', { simple: true })).toBe(1)
  })

  it('is safe to apply more than once', () => {
    expect(() => applyMigrations(sqlite)).not.toThrow()

    const row = sqlite
      .prepare('SELECT COUNT(*) AS count FROM __drizzle_migrations')
      .get() as { count: number }

    expect(row.count).toBe(1)
  })
})

describe('same-program integrity', () => {
  it('rejects progress that pairs an enrollment and lesson from different programs', () => {
    expectConstraintError(`
      INSERT INTO lesson_progress
        (enrollment_id, lesson_id, program_id, status, progress_percent)
      VALUES (1, 2, 2, 'not_started', 0)
    `)
  })

  it('rejects a lesson that points at a module in another program', () => {
    expectConstraintError(`
      INSERT INTO lessons
        (module_id, program_id, title, content_type, position, duration_minutes, created_at, updated_at)
      VALUES (2, 1, 'Mismatched lesson', 'video', 2, 10, '${NOW}', '${NOW}')
    `)
  })
})

describe('progress consistency', () => {
  it('allows a valid in-progress row', () => {
    expect(() =>
      sqlite.exec(`
        INSERT INTO lesson_progress
          (enrollment_id, lesson_id, program_id, status, progress_percent, started_at)
        VALUES (1, 3, 1, 'in_progress', 50, '${NOW}')
      `),
    ).not.toThrow()
  })

  it.each([
    ['not_started with a non-zero percent', "'not_started', 5, NULL"],
    ['in_progress at 0 percent', "'in_progress', 0, NULL"],
    ['in_progress at 100 percent', "'in_progress', 100, NULL"],
    ['completed below 100 percent', "'completed', 99, '${NOW}'"],
    ['completed without a completion date', "'completed', 100, NULL"],
    ['not_started with a completion date', "'not_started', 0, '${NOW}'"],
    ['in_progress with a completion date', "'in_progress', 50, '${NOW}'"],
  ])('rejects %s', (_case, values) => {
    expectConstraintError(`
      INSERT INTO lesson_progress
        (enrollment_id, lesson_id, program_id, status, progress_percent, completed_at)
      VALUES (1, 3, 1, ${values})
    `)
  })

  it('rejects a percent outside 0..100', () => {
    expectConstraintError(`
      INSERT INTO lesson_progress
        (enrollment_id, lesson_id, program_id, status, progress_percent)
      VALUES (1, 3, 1, 'in_progress', -1)
    `)
    expectConstraintError(`
      INSERT INTO lesson_progress
        (enrollment_id, lesson_id, program_id, status, progress_percent)
      VALUES (1, 3, 1, 'in_progress', 101)
    `)
  })
})

describe('uniqueness', () => {
  it('rejects duplicate module positions within a program', () => {
    expectConstraintError(`
      INSERT INTO modules
        (program_id, title, position, created_at, updated_at)
      VALUES (1, 'Duplicate position', 1, '${NOW}', '${NOW}')
    `)
  })

  it('rejects duplicate lesson positions within a module', () => {
    expectConstraintError(`
      INSERT INTO lessons
        (module_id, program_id, title, content_type, position, duration_minutes, created_at, updated_at)
      VALUES (1, 1, 'Duplicate position', 'video', 1, 10, '${NOW}', '${NOW}')
    `)
  })

  it('rejects duplicate enrollments for the same user and program', () => {
    expectConstraintError(`
      INSERT INTO enrollments
        (user_id, program_id, enrolled_at, status)
      VALUES (1, 1, '${NOW}', 'enrolled')
    `)
  })

  it('rejects duplicate progress for the same enrollment and lesson', () => {
    expectConstraintError(`
      INSERT INTO lesson_progress
        (enrollment_id, lesson_id, program_id, status, progress_percent)
      VALUES (1, 1, 1, 'not_started', 0)
    `)
  })

  it('treats email addresses case-insensitively', () => {
    expectConstraintError(`
      INSERT INTO users (name, email, created_at, updated_at)
      VALUES ('Another Ada', 'ADA@example.com', '${NOW}', '${NOW}')
    `)
  })
})

describe('domain checks', () => {
  it('rejects inconsistent enrollment dates', () => {
    expectConstraintError(`
      INSERT INTO enrollments
        (user_id, program_id, enrolled_at, started_at, status)
      VALUES (1, 2, '${NOW}', NULL, 'active')
    `)
  })

  it('rejects invalid lesson values', () => {
    expectConstraintError(`
      INSERT INTO lessons
        (module_id, program_id, title, content_type, position, duration_minutes, created_at, updated_at)
      VALUES (1, 1, 'Bad type', 'podcast', 3, 10, '${NOW}', '${NOW}')
    `)
    expectConstraintError(`
      INSERT INTO lessons
        (module_id, program_id, title, content_type, position, duration_minutes, created_at, updated_at)
      VALUES (1, 1, 'Bad position', 'video', 0, 10, '${NOW}', '${NOW}')
    `)
    expectConstraintError(`
      INSERT INTO lessons
        (module_id, program_id, title, content_type, position, duration_minutes, created_at, updated_at)
      VALUES (1, 1, 'Bad duration', 'video', 3, -1, '${NOW}', '${NOW}')
    `)
  })
})

describe('deletes', () => {
  it('cascades lesson progress when its lesson is deleted', () => {
    sqlite.exec('DELETE FROM lessons WHERE id = 1')

    const row = sqlite
      .prepare('SELECT COUNT(*) AS count FROM lesson_progress WHERE lesson_id = 1')
      .get() as { count: number }

    expect(row.count).toBe(0)
  })

  it('blocks deleting an enrollment that still has progress', () => {
    expectConstraintError('DELETE FROM enrollments WHERE id = 1')
  })
})
