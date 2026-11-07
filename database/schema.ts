import { sql } from 'drizzle-orm'
import { check, customType, foreignKey, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const programs = sqliteTable(
    'programs',
    {
        id: integer('id').primaryKey({ autoIncrement: true }),
        title: text('title').notNull(),
        description: text('description'),
        status: text('status', {
            enum: ['draft', 'published', 'archived'],
        }).notNull(),
        createdAt: text('created_at').notNull(),
        updatedAt: text('updated_at').notNull(),
    },
    (table) => [
        check(
            'programs_status_check',
            sql`${table.status} IN ('draft', 'published', 'archived')`,
        ),
    ],
)

export const modules = sqliteTable(
    'modules',
    {
        id: integer('id').primaryKey({ autoIncrement: true }),
        programId: integer('program_id')
            .notNull()
            .references(() => programs.id),
        title: text('title').notNull(),
        description: text('description'),
        position: integer('position').notNull(),
        createdAt: text('created_at').notNull(),
        updatedAt: text('updated_at').notNull(),
    },
    (table) => [
        uniqueIndex('modules_program_position_unique').on(
            table.programId,
            table.position,
        ),
        uniqueIndex('modules_id_program_unique').on(table.id, table.programId),
        check('modules_position_check', sql`${table.position} > 0`),
    ],
)

export const lessons = sqliteTable(
    'lessons',
    {
        id: integer('id').primaryKey({ autoIncrement: true }),
        moduleId: integer('module_id').notNull(),
        programId: integer('program_id')
            .notNull()
            .references(() => programs.id),
        title: text('title').notNull(),
        contentType: text('content_type', {
            enum: ['video', 'article', 'quiz'],
        }).notNull(),
        position: integer('position').notNull(),
        durationMinutes: integer('duration_minutes').notNull(),
        createdAt: text('created_at').notNull(),
        updatedAt: text('updated_at').notNull(),
    },
    (table) => [
        uniqueIndex('lessons_module_position_unique').on(
            table.moduleId,
            table.position,
        ),
        uniqueIndex('lessons_id_program_unique').on(table.id, table.programId),
        foreignKey({
            name: 'lessons_module_program_fk',
            columns: [table.moduleId, table.programId],
            foreignColumns: [modules.id, modules.programId],
        }),
        check('lessons_position_check', sql`${table.position} > 0`),
        check('lessons_duration_check', sql`${table.durationMinutes} >= 0`),
        check(
            'lessons_content_type_check',
            sql`${table.contentType} IN ('video', 'article', 'quiz')`,
        ),
    ],
)

const caseInsensitiveText = customType<{ data: string }>({
    dataType() {
        return 'text COLLATE NOCASE'
    },
})

export const users = sqliteTable('users', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    email: caseInsensitiveText('email').notNull().unique(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
})

export const enrollments = sqliteTable(
    'enrollments',
    {
        id: integer('id').primaryKey({ autoIncrement: true }),
        userId: integer('user_id')
            .notNull()
            .references(() => users.id),
        programId: integer('program_id')
            .notNull()
            .references(() => programs.id),
        enrolledAt: text('enrolled_at').notNull(),
        startedAt: text('started_at'),
        completedAt: text('completed_at'),
        status: text('status', {
            enum: ['enrolled', 'active', 'completed', 'withdrawn'],
        }).notNull(),
    },
    (table) => [
        uniqueIndex('enrollments_user_program_unique').on(
            table.userId,
            table.programId,
        ),
        uniqueIndex('enrollments_id_program_unique').on(
            table.id,
            table.programId,
        ),
        check(
            'enrollments_status_check',
            sql`(
                (${table.status} = 'enrolled' AND ${table.startedAt} IS NULL AND ${table.completedAt} IS NULL)
                OR (${table.status} = 'active' AND ${table.startedAt} IS NOT NULL AND ${table.completedAt} IS NULL)
                OR (${table.status} = 'completed' AND ${table.startedAt} IS NOT NULL AND ${table.completedAt} IS NOT NULL)
                OR (${table.status} = 'withdrawn' AND ${table.completedAt} IS NULL)
            )`,
        ),
        check(
            'enrollments_dates_check',
            sql`${table.completedAt} IS NULL OR ${table.startedAt} IS NULL OR ${table.completedAt} >= ${table.startedAt}`,
        ),
    ],
)

export const lessonProgress = sqliteTable(
    'lesson_progress',
    {
        id: integer('id').primaryKey({ autoIncrement: true }),
        enrollmentId: integer('enrollment_id').notNull(),
        lessonId: integer('lesson_id').notNull(),
        programId: integer('program_id').notNull(),
        status: text('status', {
            enum: ['not_started', 'in_progress', 'completed'],
        }).notNull(),
        progressPercent: integer('progress_percent').notNull().default(0),
        startedAt: text('started_at'),
        completedAt: text('completed_at'),
        lastAccessedAt: text('last_accessed_at'),
    },
    (table) => [
        uniqueIndex('lesson_progress_enrollment_lesson_unique').on(
            table.enrollmentId,
            table.lessonId,
        ),
        foreignKey({
            name: 'lesson_progress_enrollment_program_fk',
            columns: [table.enrollmentId, table.programId],
            foreignColumns: [enrollments.id, enrollments.programId],
        }),
        foreignKey({
            name: 'lesson_progress_lesson_program_fk',
            columns: [table.lessonId, table.programId],
            foreignColumns: [lessons.id, lessons.programId],
        }).onDelete('cascade'),
        check(
            'lesson_progress_percent_check',
            sql`${table.progressPercent} BETWEEN 0 AND 100`,
        ),
        check(
            'lesson_progress_status_check',
            sql`(
                (${table.status} = 'not_started' AND ${table.progressPercent} = 0 AND ${table.completedAt} IS NULL)
                OR (${table.status} = 'in_progress' AND ${table.progressPercent} > 0 AND ${table.progressPercent} < 100 AND ${table.completedAt} IS NULL)
                OR (${table.status} = 'completed' AND ${table.progressPercent} = 100 AND ${table.completedAt} IS NOT NULL)
            )`,
        ),
    ],
)