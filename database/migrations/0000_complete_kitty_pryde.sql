CREATE TABLE `enrollments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`program_id` integer NOT NULL,
	`enrolled_at` text NOT NULL,
	`started_at` text,
	`completed_at` text,
	`status` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "enrollments_status_check" CHECK((
                ("enrollments"."status" = 'enrolled' AND "enrollments"."started_at" IS NULL AND "enrollments"."completed_at" IS NULL)
                OR ("enrollments"."status" = 'active' AND "enrollments"."started_at" IS NOT NULL AND "enrollments"."completed_at" IS NULL)
                OR ("enrollments"."status" = 'completed' AND "enrollments"."started_at" IS NOT NULL AND "enrollments"."completed_at" IS NOT NULL)
                OR ("enrollments"."status" = 'withdrawn' AND "enrollments"."completed_at" IS NULL)
            )),
	CONSTRAINT "enrollments_dates_check" CHECK("enrollments"."completed_at" IS NULL OR "enrollments"."started_at" IS NULL OR "enrollments"."completed_at" >= "enrollments"."started_at")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `enrollments_user_program_unique` ON `enrollments` (`user_id`,`program_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `enrollments_id_program_unique` ON `enrollments` (`id`,`program_id`);--> statement-breakpoint
CREATE TABLE `lesson_progress` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`enrollment_id` integer NOT NULL,
	`lesson_id` integer NOT NULL,
	`program_id` integer NOT NULL,
	`status` text NOT NULL,
	`progress_percent` integer DEFAULT 0 NOT NULL,
	`started_at` text,
	`completed_at` text,
	`last_accessed_at` text,
	FOREIGN KEY (`enrollment_id`,`program_id`) REFERENCES `enrollments`(`id`,`program_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lesson_id`,`program_id`) REFERENCES `lessons`(`id`,`program_id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "lesson_progress_percent_check" CHECK("lesson_progress"."progress_percent" BETWEEN 0 AND 100),
	CONSTRAINT "lesson_progress_status_check" CHECK((
                ("lesson_progress"."status" = 'not_started' AND "lesson_progress"."progress_percent" = 0 AND "lesson_progress"."completed_at" IS NULL)
                OR ("lesson_progress"."status" = 'in_progress' AND "lesson_progress"."progress_percent" > 0 AND "lesson_progress"."progress_percent" < 100 AND "lesson_progress"."completed_at" IS NULL)
                OR ("lesson_progress"."status" = 'completed' AND "lesson_progress"."progress_percent" = 100 AND "lesson_progress"."completed_at" IS NOT NULL)
            ))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lesson_progress_enrollment_lesson_unique` ON `lesson_progress` (`enrollment_id`,`lesson_id`);--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`module_id` integer NOT NULL,
	`program_id` integer NOT NULL,
	`title` text NOT NULL,
	`content_type` text NOT NULL,
	`position` integer NOT NULL,
	`duration_minutes` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`module_id`,`program_id`) REFERENCES `modules`(`id`,`program_id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "lessons_position_check" CHECK("lessons"."position" > 0),
	CONSTRAINT "lessons_duration_check" CHECK("lessons"."duration_minutes" >= 0),
	CONSTRAINT "lessons_content_type_check" CHECK("lessons"."content_type" IN ('video', 'article', 'quiz'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lessons_module_position_unique` ON `lessons` (`module_id`,`position`);--> statement-breakpoint
CREATE UNIQUE INDEX `lessons_id_program_unique` ON `lessons` (`id`,`program_id`);--> statement-breakpoint
CREATE TABLE `modules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`program_id` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`position` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "modules_position_check" CHECK("modules"."position" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `modules_program_position_unique` ON `modules` (`program_id`,`position`);--> statement-breakpoint
CREATE UNIQUE INDEX `modules_id_program_unique` ON `modules` (`id`,`program_id`);--> statement-breakpoint
CREATE TABLE `programs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "programs_status_check" CHECK("programs"."status" IN ('draft', 'published', 'archived'))
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text COLLATE NOCASE NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);