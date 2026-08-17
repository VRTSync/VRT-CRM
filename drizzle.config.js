import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "drizzle-kit";

const root = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

export default defineConfig({
  dialect: "postgresql",
  schema: path.join(root, "server/db/schema.js"),
  out: path.join(root, "server/db/migrations"),
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
