import { describe, expect, it } from 'vitest'
import { calculateProgress } from './progress'

describe('calculateProgress', () => {
  it('counts completed lessons and excludes empty modules', () => {
    expect(calculateProgress([
      { id: 1, total: 3, completed: 3 },
      { id: 2, total: 3, completed: 2 },
      { id: 3, total: 0, completed: 0 },
    ])).toEqual({
      totalLessons: 6,
      completedLessons: 5,
      percent: 83,
      totalModules: 2,
      completedModules: 1,
    })
  })

  it('returns zero for no lessons', () => {
    expect(calculateProgress([{ id: 1, total: 0, completed: 0 }])).toEqual({
      totalLessons: 0,
      completedLessons: 0,
      percent: 0,
      totalModules: 0,
      completedModules: 0,
    })
  })
})
