import type { Config } from "drizzle-kit";

export default {
  schema: "./drizzle/schema.ts", // 出力先ファイル
  out: "./drizzle/migrations",   // マイグレーション出力先
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://postgres:password@0.0.0.0:15432/development", // .envから読む
  },
} satisfies Config;
