import { Router } from 'express'
import type Database from 'better-sqlite3'
import { calculateProgress } from '../learners/progress'
import {
  findLastActivity,
  findLearner,
  findModuleCounts,
  findWeeklyCompletions,
  listLearners,
} from '../learners/repository'

export function createLearnerRouter(sqlite: Database.Database): Router {
  const router = Router()

  router.get('/', (_req, res) => {
    res.json(listLearners(sqlite))
  })

  router.get('/:id/progress', (req, res) => {
    const id = Number(req.params.id)

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ error: 'Invalid learner ID' })
    }

    const learner = findLearner(sqlite, id)
    if (!learner) {
      return res.status(404).json({ error: 'Learner or enrollment not found' })
    }

    const modules = findModuleCounts(sqlite, learner.enrollmentId, learner.programId)

    return res.json({
      id: learner.id,
      name: learner.name,
      program: learner.program,
      ...calculateProgress(modules),
      lastActivityAt: findLastActivity(sqlite, id),
      weeklyProgress: findWeeklyCompletions(sqlite, learner.enrollmentId),
    })
  })

  return router
}
