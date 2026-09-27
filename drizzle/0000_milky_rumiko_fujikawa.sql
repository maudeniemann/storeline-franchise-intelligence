CREATE TABLE `ask_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`citations_json` text NOT NULL,
	`mode` text NOT NULL,
	`model` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `evaluation_cases` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`question` text NOT NULL,
	`required_source_types` text NOT NULL,
	`required_terms` text NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `evidence` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`location_id` text,
	`source_type` text NOT NULL,
	`source_name` text NOT NULL,
	`source_url` text,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`tags` text DEFAULT '' NOT NULL,
	`published_at` text,
	`observed_at` text NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ingestion_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`source_type` text NOT NULL,
	`records_loaded` integer NOT NULL,
	`records_skipped` integer NOT NULL,
	`status` text NOT NULL,
	`completed_at` text NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `locations` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`name` text NOT NULL,
	`city` text NOT NULL,
	`external_ref` text,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`price` real NOT NULL,
	`weekly_units` integer NOT NULL,
	`gross_margin_pct` real NOT NULL,
	`trend_pct` real NOT NULL,
	`data_status` text NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
