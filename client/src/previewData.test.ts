import { describe, expect, it } from 'vitest'
import { previewLearners } from './previewData'

describe('dashboard preview data', () => {
  it('provides unique selectable learners at different stages', () => {
    expect(new Set(previewLearners.map(({ id }) => id)).size).toBe(previewLearners.length)
    expect(previewLearners.map(({ completedLessons }) => completedLessons)).toEqual([0, 2, 5, 8, 9])
    expect(previewLearners[0].lastActivityAt).toBeNull()
    expect(previewLearners[4].lastActivityAt).not.toBeNull()
  })

  it('uses consistent precomputed progress and module totals', () => {
    for (const learner of previewLearners) {
      expect(learner.percent).toBe(Math.round(learner.completedLessons / learner.totalLessons * 100))
      expect(learner.completedModules).toBeLessThanOrEqual(learner.totalModules)
    }
  })
})
