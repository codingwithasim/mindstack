import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "path";

const sqlite = new Database(path.join(process.cwd(), "db", "database.db"))
const client = drizzle(sqlite)

export default client