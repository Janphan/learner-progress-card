import { applyMigrations, openDatabase } from './connection'

const databasePath =
  process.env.DATABASE_PATH ?? './database/data/learner-progress.db'

const sqlite = openDatabase(databasePath)

try {
  applyMigrations(sqlite)
  console.log(`Migrations applied to ${databasePath}`)
} finally {
  sqlite.close()
}
