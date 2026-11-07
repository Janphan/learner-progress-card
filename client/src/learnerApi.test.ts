import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchLearnerProgress, fetchLearners } from './learnerApi'

const signal = new AbortController().signal
const progress = {
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
}

afterEach(() => vi.unstubAllGlobals())

describe('learner API', () => {
  it('loads learner options and allows an empty list', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json([{ id: 1, name: 'Alex' }]))
      .mockResolvedValueOnce(Response.json([]))
    vi.stubGlobal('fetch', fetchMock)
    await expect(fetchLearners(signal)).resolves.toEqual([{ id: 1, name: 'Alex' }])
    await expect(fetchLearners(signal)).resolves.toEqual([])
    expect(fetchMock).toHaveBeenCalledWith('/api/learners', { signal })
  })

  it('loads the selected learner using the server response shape', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(progress))
    vi.stubGlobal('fetch', fetchMock)
    await expect(fetchLearnerProgress(1, signal)).resolves.toEqual(progress)
    expect(fetchMock).toHaveBeenCalledWith('/api/learners/1/progress', { signal })
  })

  it('reports failed requests and malformed responses', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(Response.json([{ id: '1', name: 'Alex' }]))
      .mockResolvedValueOnce(Response.json({ ...progress, lastActivityAt: 'bad date' }))
      .mockResolvedValueOnce(Response.json({ ...progress, id: 2 }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(fetchLearners(signal)).rejects.toThrow('503')
    await expect(fetchLearners(signal)).rejects.toThrow('invalid learner list')
    await expect(fetchLearnerProgress(1, signal)).rejects.toThrow('invalid learner progress')
    await expect(fetchLearnerProgress(1, signal)).rejects.toThrow('invalid learner progress')
  })
})
