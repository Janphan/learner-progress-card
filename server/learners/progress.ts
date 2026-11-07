import type { ModuleCounts } from './repository'

export function calculateProgress(modules: ModuleCounts[]) {
  const totalLessons = modules.reduce((sum, module) => sum + module.total, 0)
  const completedLessons = modules.reduce((sum, module) => sum + module.completed, 0)
  const nonEmptyModules = modules.filter((module) => module.total > 0)

  return {
    totalLessons,
    completedLessons,
    percent: totalLessons === 0
      ? 0
      : Math.round(completedLessons / totalLessons * 100),
    totalModules: nonEmptyModules.length,
    completedModules: nonEmptyModules.filter(
      (module) => module.completed === module.total,
    ).length,
  }
}
