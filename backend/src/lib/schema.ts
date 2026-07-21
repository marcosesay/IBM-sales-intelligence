// schema.ts — Drizzle ORM table definitions for SQLite persistence.
// Two tables: briefings (pre-call briefs) and prospect_results (account sales plays).

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// ── Briefings ────────────────────────────────────────────────────────────────
// Each row = one generated pre-call briefing from the Briefing page.
export const briefings = sqliteTable("briefings", {
  id:             integer("id").primaryKey({ autoIncrement: true }),
  company:        text("company").notNull(),
  contactName:    text("contact_name").notNull().default(""),
  contactTitle:   text("contact_title").notNull().default(""),
  industry:       text("industry").notNull().default(""),
  callType:       text("call_type").notNull().default("Discovery"),
  text:           text("text").notNull(),              // full markdown output
  logoUrl:        text("logo_url").notNull().default(""),
  contactPhotoUrl:text("contact_photo_url").notNull().default(""),
  prospectStep1:  text("prospect_step1").notNull().default(""),   // sales play research
  prospectStep2:  text("prospect_step2").notNull().default(""),   // sales play sections
  architectureDiagram: text("architecture_diagram").notNull().default(""), // mermaid + upgrade path
  createdAt:      integer("created_at", { mode: "timestamp" }).notNull(),
});

// ── Prospect results ─────────────────────────────────────────────────────────
// Each row = one generated account sales play from the Prospect page.
export const prospectResults = sqliteTable("prospect_results", {
  id:          integer("id").primaryKey({ autoIncrement: true }),
  companyName: text("company_name").notNull(),
  websiteUrl:  text("website_url").notNull().default(""),
  step1:       text("step1").notNull(),   // research brief markdown
  step2:       text("step2").notNull(),   // sales play markdown
  createdAt:   integer("created_at", { mode: "timestamp" }).notNull(),
});

export type Briefing        = typeof briefings.$inferSelect;
export type NewBriefing     = typeof briefings.$inferInsert;
export type ProspectResult  = typeof prospectResults.$inferSelect;
export type NewProspectResult = typeof prospectResults.$inferInsert;
