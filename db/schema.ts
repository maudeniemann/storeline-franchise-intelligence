import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const tenants = sqliteTable("tenants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const locations = sqliteTable("locations", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  name: text("name").notNull(),
  city: text("city").notNull(),
  externalRef: text("external_ref"),
});

export const evidence = sqliteTable("evidence", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  locationId: text("location_id").references(() => locations.id),
  sourceType: text("source_type").notNull(),
  sourceName: text("source_name").notNull(),
  sourceUrl: text("source_url"),
  title: text("title").notNull(),
  content: text("content").notNull(),
  tags: text("tags").notNull().default(""),
  publishedAt: text("published_at"),
  observedAt: text("observed_at").notNull(),
});

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  name: text("name").notNull(),
  category: text("category").notNull(),
  price: real("price").notNull(),
  weeklyUnits: integer("weekly_units").notNull(),
  grossMarginPct: real("gross_margin_pct").notNull(),
  trendPct: real("trend_pct").notNull(),
  dataStatus: text("data_status").notNull(),
});

export const ingestionRuns = sqliteTable("ingestion_runs", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  sourceType: text("source_type").notNull(),
  recordsLoaded: integer("records_loaded").notNull(),
  recordsSkipped: integer("records_skipped").notNull(),
  status: text("status").notNull(),
  completedAt: text("completed_at").notNull(),
});

export const askRuns = sqliteTable("ask_runs", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  citationsJson: text("citations_json").notNull(),
  mode: text("mode").notNull(),
  model: text("model"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const evaluationCases = sqliteTable("evaluation_cases", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id),
  question: text("question").notNull(),
  requiredSourceTypes: text("required_source_types").notNull(),
  requiredTerms: text("required_terms").notNull(),
});
