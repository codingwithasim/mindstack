import type { Config } from "drizzle-kit";

export default {
  schema: "./db/schema.ts",
  dialect: "sqlite",
  out: "./db/migrations",
  driver: "durable-sqlite",
  dbCredentials: {
    url: "./db/database.db",
  },
} satisfies Config;
