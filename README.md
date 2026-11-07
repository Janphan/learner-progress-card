# learner-progress-card

## Functions:

1. Show learner's name and program
2. Show overall progress bar with percentage
3. Show modules completed out of total
4. Light and Dark theme

## User flow
Open Learning Platform
        ↓
Open demo learner (no sign-in in v1)
        ↓
Open Learning Progress Dashboard
        ↓
View Learner Name + Enrolled Program
        ↓
View Overall Progress Percentage
        ↓
View Completed Modules / Total Modules
        ↓
Select a Module
        ↓
┌───────────────────────┐
│ Is module completed?  │
└───────────────────────┘
      ↓ Yes       ↓ No
Review module     Continue learning
      ↓                ↓
View results      Complete lessons
      └───────┬────────┘
              ↓
      Progress updates
              ↓
 Return to Progress Dashboard

## v1 scope

v1 is a read-only demo: one seeded learner and program, with no sign-in, registration, or
password reset. The "Continue learning" / "Complete lessons" branch above is the target flow,
not v1. See `docs/decisions/ADR-0002-no-auth-v1.md` and `local.plan.md` for the build plan.
