import { pgTable, uuid, text, integer, numeric, boolean, jsonb, timestamp, doublePrecision } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const defaultPatterns = pgTable("default_patterns", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	currency: text().default('JPY').notNull(),
	quantity: integer().default(0).notNull(),
	price: numeric().default('123.45').notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	description: text(),
	jsonData: jsonb("json_data").default({}).notNull(),
	tags: text().array().default([""]).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).default(sql`(now() + '30 days'::interval)`),
	randomValue: doublePrecision("random_value").default(sql`random()`).notNull(),
	discount: numeric().default('sql`(100 - 10)`').notNull(),
	specialNote: text("special_note").default(
CASE
    WHEN (EXTRACT(dow FROM now()) = (0)::numeric) THEN \'Sunday\'::text
    ELSE \'Not Sunday\'::text
END),
	lowerName: text("lower_name").default(lower(\'DEFAULT_NAME\'::text)),
	recordTime: timestamp("record_time", { withTimezone: true, mode: 'string' }).default(sql`statement_timestamp()`),
	appUser: text("app_user").default(CURRENT_USER),
	greeting: text().default(default_greeting()),
	expiryDate: timestamp("expiry_date", { withTimezone: true, mode: 'string' }).default(sql`default_expiry()`),
});
