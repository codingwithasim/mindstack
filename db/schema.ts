import { ColumnBaseConfig, ColumnDataType } from "drizzle-orm";
import { integer, numeric, SQLiteColumn, sqliteTable, text } from "drizzle-orm/sqlite-core";

/* ===================== Pages ===================== */
export const pages = sqliteTable("pages", {
    id: integer("id").primaryKey({autoIncrement: true}),
    title: text("title"),
    parentPageId: integer("parent_page_id")
    .references((): SQLiteColumn<ColumnBaseConfig<ColumnDataType, string>> => pages.id, {onDelete: "cascade"}),
    createdAt: integer("created_at", {mode: "timestamp"}).notNull(),
    updatedAt: integer("updated_at", {mode: "timestamp"}).notNull(),
})

/* ===================== Blocks ===================== */
export const blocks = sqliteTable("blocks", {
    pk_id: integer("pk_id").primaryKey({autoIncrement: true}),
    id: text("id").unique().notNull(),
    pageId: integer("page_id").notNull()
        .references(() => pages.id, {onDelete: "cascade"}),
    parentBlockId: text("parent_block_id")
        .references((): SQLiteColumn<ColumnBaseConfig<ColumnDataType, string>> => blocks.id, {onDelete: "cascade"}),
    type: text("type").notNull(),
    blockOrder: numeric("order", {mode: "string"}).notNull(),
    createdAt: integer("created_at", {mode: "timestamp"}).notNull(),
    updatedAt: integer("updated_at", {mode: "timestamp"}).notNull(),
})

/* ===================== Block Data ===================== */
export const blockData = sqliteTable("block_data", {
    blockId: text("block_id").primaryKey().references(() => blocks.id, {onDelete: "cascade"}),
    data: text("data", {mode: "json"}).notNull()
})
