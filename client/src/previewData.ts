// Temporary, precomputed presentation data until the learner API is available.
export const previewLearners = [
  {
    id: 'alex', name: 'Alex Morgan', program: 'Learning Foundations',
    completedLessons: 0, totalLessons: 9, percent: 0, completedModules: 0,
    totalModules: 3, lastActivityAt: null,
  },
  {
    id: 'jordan', name: 'Jordan Lee', program: 'Learning Foundations',
    completedLessons: 2, totalLessons: 9, percent: 22, completedModules: 0,
    totalModules: 3, lastActivityAt: '2026-01-05T00:00:00.000Z',
  },
  {
    id: 'casey', name: 'Casey Patel', program: 'Learning Foundations',
    completedLessons: 5, totalLessons: 9, percent: 56, completedModules: 1,
    totalModules: 3, lastActivityAt: '2026-01-10T00:00:00.000Z',
  },
  {
    id: 'riley', name: 'Riley Chen', program: 'Learning Foundations',
    completedLessons: 8, totalLessons: 9, percent: 89, completedModules: 2,
    totalModules: 3, lastActivityAt: '2026-01-15T00:00:00.000Z',
  },
  {
    id: 'taylor', name: 'Taylor Brooks', program: 'Learning Foundations',
    completedLessons: 9, totalLessons: 9, percent: 100, completedModules: 3,
    totalModules: 3, lastActivityAt: '2026-01-20T00:00:00.000Z',
  },
] as const
