import { applyMigrations, openDatabase } from './connection'
import { seedDatabase } from './seed'

const databasePath =
  process.env.DATABASE_PATH ?? './database/data/learner-progress.db'

const sqlite = openDatabase(databasePath)

try {
  applyMigrations(sqlite)
  seedDatabase(sqlite)
  console.log(`Seed data applied to ${databasePath}`)
} finally {
  sqlite.close()
}
