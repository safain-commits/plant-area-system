CREATE TABLE `bag_changes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`equipment_code` text NOT NULL,
	`side` text NOT NULL,
	`compartment` integer NOT NULL,
	`column` integer NOT NULL,
	`row` integer NOT NULL,
	`installed_at_hours` integer NOT NULL,
	`reason` text NOT NULL,
	`wo` text,
	`actor` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `equipment` (
	`code` text PRIMARY KEY NOT NULL,
	`runhours` integer NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `materials` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sap_code` text NOT NULL,
	`name` text NOT NULL,
	`unit` text NOT NULL,
	`pack_size` integer NOT NULL,
	`area` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `materials_sap_code_unique` ON `materials` (`sap_code`);--> statement-breakpoint
CREATE TABLE `stock_moves` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`material_id` integer NOT NULL,
	`type` text NOT NULL,
	`quantity` integer NOT NULL,
	`packs` integer,
	`reference` text NOT NULL,
	`wo` text,
	`job` text,
	`area` text NOT NULL,
	`actor` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON UPDATE no action ON DELETE no action
);
