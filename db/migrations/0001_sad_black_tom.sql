PRAGMA foreign_keys=OFF;
--> statement-breakpoint

/* ===================== block_data ===================== */

CREATE TABLE `__new_block_data` (
  `block_id` text PRIMARY KEY NOT NULL,
  `data` text NOT NULL,
  FOREIGN KEY (`block_id`) REFERENCES `blocks`(`id`) ON DELETE cascade
);
--> statement-breakpoint

INSERT INTO `__new_block_data` (`block_id`, `data`)
SELECT `block_id`, `data` FROM `block_data`;
--> statement-breakpoint

DROP TABLE `block_data`;
--> statement-breakpoint

ALTER TABLE `__new_block_data` RENAME TO `block_data`;
--> statement-breakpoint


/* ===================== blocks ===================== */

CREATE TABLE `__new_blocks` (
  `pk_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `id` text NOT NULL,
  `page_id` integer NOT NULL,
  `parent_block_id` text,
  `type` text NOT NULL,
  `order` numeric NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`page_id`) REFERENCES `pages`(`id`) ON DELETE cascade
);
--> statement-breakpoint

INSERT INTO `__new_blocks`
(`id`, `page_id`, `parent_block_id`, `type`, `order`, `created_at`, `updated_at`)
SELECT
  `id`, `page_id`, `parent_block_id`, `type`, `order`, `created_at`, `updated_at`
FROM `blocks`;
--> statement-breakpoint

DROP TABLE `blocks`;
--> statement-breakpoint

ALTER TABLE `__new_blocks` RENAME TO `blocks`;
--> statement-breakpoint

CREATE UNIQUE INDEX `blocks_id_unique` ON `blocks` (`id`);
--> statement-breakpoint

PRAGMA foreign_keys=ON;
