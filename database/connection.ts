import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'

export const defaultMigrationsFolder = './database/migrations'

/**
 * Opens a SQLite connection with foreign keys enabled.
 *
 * SQLite enforces foreign keys per connection, so every caller must open the
 * database through this helper rather than constructing `Database` directly.
 */
export function openDatabase(databasePath: string): Database.Database {
  if (databasePath !== ':memory:') {
    mkdirSync(dirname(databasePath), { recursive: true })
  }

  const sqlite = new Database(databasePath)
  sqlite.pragma('foreign_keys = ON')
  return sqlite
}

export function applyMigrations(
  sqlite: Database.Database,
  migrationsFolder = defaultMigrationsFolder,
): void {
  migrate(drizzle(sqlite), { migrationsFolder })
}
