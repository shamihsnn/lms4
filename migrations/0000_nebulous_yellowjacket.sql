CREATE TABLE `admin_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`last_login` text,
	`password_changed_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_users_username_unique` ON `admin_users` (`username`);--> statement-breakpoint
CREATE TABLE `id_change_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`table_name` text NOT NULL,
	`record_id` integer NOT NULL,
	`old_id` text NOT NULL,
	`new_id` text NOT NULL,
	`changed_by` integer,
	`changed_at` text DEFAULT CURRENT_TIMESTAMP,
	`reason` text,
	FOREIGN KEY (`changed_by`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `patients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`patient_id` text NOT NULL,
	`name` text NOT NULL,
	`age` integer,
	`gender` text,
	`phone` text,
	`address` text,
	`ref_by_doctor` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`created_by` integer,
	`last_modified` text DEFAULT CURRENT_TIMESTAMP,
	`modified_by` integer,
	FOREIGN KEY (`created_by`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`modified_by`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `patients_patient_id_unique` ON `patients` (`patient_id`);--> statement-breakpoint
CREATE TABLE `test_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`test_type` text NOT NULL,
	`parameters` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `tests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`test_id` text NOT NULL,
	`patient_id` integer,
	`test_type` text NOT NULL,
	`test_results` text NOT NULL,
	`normal_ranges` text NOT NULL,
	`flags` text,
	`test_date` text DEFAULT DATE('now'),
	`test_time` text DEFAULT TIME('now'),
	`status` text DEFAULT 'completed',
	`performed_by` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`last_modified` text DEFAULT CURRENT_TIMESTAMP,
	`modified_by` integer,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`performed_by`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`modified_by`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tests_test_id_unique` ON `tests` (`test_id`);