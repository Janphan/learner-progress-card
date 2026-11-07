import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import Database from 'better-sqlite3'
import express from 'express'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createLearnerRouter } from './learners'

let sqlite: Database.Database
let server: Server
let baseUrl: string

beforeEach(async () => {
  sqlite = new Database(':memory:')
  sqlite.pragma('foreign_keys = ON')
  sqlite.exec(readFileSync(
    resolve(process.cwd(), '../database/migrations/0000_complete_kitty_pryde.sql'),
    'utf8',
  ))
  sqlite.exec(`
    INSERT INTO users (id, name, email, created_at, updated_at)
      VALUES (1, 'Alex', 'alex@example.test', '2026-01-01', '2026-01-01');
    INSERT INTO programs (id, title, status, created_at, updated_at)
      VALUES (1, 'Program', 'published', '2026-01-01', '2026-01-01');
    INSERT INTO enrollments (id, user_id, program_id, enrolled_at, started_at, status)
      VALUES (1, 1, 1, '2026-01-01', '2026-01-01', 'active');
    INSERT INTO modules (id, program_id, title, position, created_at, updated_at)
      VALUES (1, 1, 'Module', 1, '2026-01-01', '2026-01-01'),
             (2, 1, 'Empty module', 2, '2026-01-01', '2026-01-01');
    INSERT INTO lessons (id, module_id, program_id, title, content_type, position, duration_minutes, created_at, updated_at)
      VALUES (1, 1, 1, 'First', 'video', 1, 10, '2026-01-01', '2026-01-01'),
             (2, 1, 1, 'Second', 'article', 2, 10, '2026-01-01', '2026-01-01');
    INSERT INTO lesson_progress (enrollment_id, lesson_id, program_id, status, progress_percent, completed_at, last_accessed_at)
      VALUES (1, 1, 1, 'completed', 100, '2026-01-07T10:00:00.000Z', '2026-01-08T10:00:00.000Z');
  `)

  const app = express()
  app.use('/api/learners', createLearnerRouter(sqlite))
  server = await new Promise<Server>((resolveServer) => {
    const listener = app.listen(0, '127.0.0.1', () => resolveServer(listener))
  })
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/learners`
})

afterEach(async () => {
  await new Promise<void>((resolveClose, reject) => {
    server.close((error) => error ? reject(error) : resolveClose())
  })
  sqlite.close()
})

describe('learner routes', () => {
  it('lists learners and returns the progress response', async () => {
    const listResponse = await fetch(baseUrl)
    expect(await listResponse.json()).toEqual([{ id: 1, name: 'Alex' }])

    const response = await fetch(`${baseUrl}/1/progress`)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      id: 1,
      name: 'Alex',
      program: 'Program',
      totalLessons: 2,
      completedLessons: 1,
      percent: 50,
      totalModules: 1,
      completedModules: 0,
      lastActivityAt: '2026-01-08T10:00:00.000Z',
      weeklyProgress: [{ week: '2026-01-05', count: 1 }],
    })
  })

  it('handles invalid and missing learner IDs', async () => {
    const invalid = await fetch(`${baseUrl}/abc/progress`)
    expect(invalid.status).toBe(400)
    expect(await invalid.json()).toEqual({ error: 'Invalid learner ID' })
    const missing = await fetch(`${baseUrl}/999/progress`)
    expect(missing.status).toBe(404)
    expect(await missing.json()).toEqual({ error: 'Learner or enrollment not found' })
  })

  it('returns zero progress and null activity for an unstarted learner', async () => {
    sqlite.exec('DELETE FROM lesson_progress')
    const response = await fetch(`${baseUrl}/1/progress`)
    expect(await response.json()).toMatchObject({
      percent: 0,
      totalLessons: 2,
      completedLessons: 0,
      lastActivityAt: null,
      weeklyProgress: [],
    })
  })
})
