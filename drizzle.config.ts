import { defineConfig } from 'drizzle-kit'

export default defineConfig({
    dialect: 'sqlite',
    schema: './database/schema.ts',
    out: './database/migrations',
    dbCredentials: {
        url: './database/data/learner-progress.db',
    },
})