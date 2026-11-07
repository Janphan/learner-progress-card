import { useState } from 'react'
import { previewLearners } from './previewData'

type Theme = 'light' | 'dark'

function initialTheme(): Theme {
  const saved = localStorage.getItem('learner-progress-theme')
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function formatActivity(value: string | null): string {
  if (!value) return 'No activity yet'
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value))
}

function App() {
  const [selectedId, setSelectedId] = useState<string>(previewLearners[0].id)
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const learner = previewLearners.find((item) => item.id === selectedId)

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('learner-progress-theme', next)
  }

  if (!learner) {
    return <p role="alert">The selected learner is unavailable.</p>
  }

  const initials = learner.name.split(' ').map((part) => part[0]).join('')

  return (
    <div className="app min-h-screen bg-dashboard-bg text-dashboard-text" data-theme={theme}>
      <main className="mx-auto max-w-[784px] px-[42px] pt-6 pb-[38px] max-[480px]:px-[18px] max-[480px]:py-6">
        <header className="flex items-center justify-between gap-5">
          <div>
            <p className="mt-0 mr-0 mb-[7px] ml-0 text-[13px] font-[650]">Skillio</p>
            <h1 className="m-0 text-[30px] leading-[1.15] font-bold tracking-[-1.2px] max-[480px]:text-[26px]">Learner progress</h1>
          </div>
          <button
            className="grid size-10 cursor-pointer place-items-center rounded-[9px] border border-dashboard-track bg-dashboard-bg text-dashboard-muted focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-dashboard-accent"
            type="button"
            aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
            onClick={toggleTheme}
          >
            {theme === 'light' ? (
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                <path d="M20.2 15.5A8.2 8.2 0 0 1 8.5 3.8 8.3 8.3 0 1 0 20.2 15.5Z" />
              </svg>
            ) : (
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
              </svg>
            )}
          </button>
        </header>

        <p className="mt-[22px] mb-0 text-[12px] text-dashboard-muted">Preview data · Not connected to the learner API yet</p>
        <div className="my-[15px]">
          <label className="mb-2 block text-[14px] font-semibold text-dashboard-muted" htmlFor="learner">View learner</label>
          <select className="min-h-11 w-full cursor-pointer rounded-[9px] border border-dashboard-track bg-dashboard-surface px-[15px] text-dashboard-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-dashboard-accent" id="learner" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
            {previewLearners.map((item) => (
              <option key={item.id} value={item.id}>{item.name} — {item.program}</option>
            ))}
          </select>
        </div>

        <section className="rounded-xl bg-dashboard-surface p-8 max-[480px]:p-[22px]" aria-label={`${learner.name} progress`}>
          <div className="flex items-center gap-4 border-b border-dashboard-track pb-6">
            <span className="grid h-[46px] flex-[0_0_46px] place-items-center rounded-full text-[14px] font-bold text-dashboard-accent [background:color-mix(in_srgb,var(--color-accent)_10%,var(--color-surface))]" aria-hidden="true">{initials}</span>
            <div>
              <h2 className="mt-0 mb-[5px] text-[17px] font-bold tracking-[-0.3px]">{learner.name}</h2>
              <p className="m-0 text-[14px] text-dashboard-muted">{learner.program}</p>
            </div>
          </div>

          <div className="border-b border-dashboard-track py-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="mt-0 mb-1 text-[14px] font-semibold text-dashboard-muted">Overall progress</h3>
                <p className="m-0 text-[12px] text-dashboard-muted">{learner.completedLessons} of {learner.totalLessons} lessons completed</p>
              </div>
              <strong className="text-[30px] tracking-[-1px]">{learner.percent}%</strong>
            </div>
            <div
              className="h-[10px] overflow-hidden rounded-full bg-dashboard-track"
              role="progressbar"
              aria-label="Overall progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={learner.percent}
              aria-valuetext={`${learner.percent}%, ${learner.completedLessons} of ${learner.totalLessons} lessons completed`}
            >
              <div className="h-full rounded-[inherit] bg-dashboard-accent transition-[width] duration-[180ms] ease-in-out motion-reduce:transition-none" style={{ width: `${learner.percent}%` }} />
            </div>
          </div>

          <div className="border-b border-dashboard-track py-6">
            <h3 className="mt-0 mb-1 text-[14px] font-semibold">Lessons completed</h3>
            <p className="m-0 text-[12px] text-dashboard-muted">Weekly activity chart coming later</p>
            <div className="mt-4 grid min-h-[130px] place-items-center rounded-lg border border-dashed border-dashboard-track text-center text-[13px] text-dashboard-muted">Weekly activity data is not available yet.</div>
          </div>

          <div className="grid grid-cols-2 pt-6 max-[480px]:gap-3">
            <div>
              <p className="m-0 text-[12px] text-dashboard-muted">Modules completed</p>
              <strong className="mt-2 block text-[16px]">{learner.completedModules} of {learner.totalModules}</strong>
            </div>
            <div className="border-l border-dashboard-track pl-4">
              <p className="m-0 text-[12px] text-dashboard-muted">Last activity</p>
              <strong className="mt-2 block text-[16px]">{formatActivity(learner.lastActivityAt)}</strong>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
