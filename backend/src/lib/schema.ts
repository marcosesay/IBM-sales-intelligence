// schema.ts — Drizzle ORM table definitions for PostgreSQL persistence.
// Two tables: briefings (pre-call briefs) and prospect_results (account sales plays).

import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

// ── Briefings ────────────────────────────────────────────────────────────────
export const briefings = pgTable("briefings", {
  id:             serial("id").primaryKey(),
  company:        text("company").notNull(),
  contactName:    text("contact_name").notNull().default(""),
  contactTitle:   text("contact_title").notNull().default(""),
  industry:       text("industry").notNull().default(""),
  callType:       text("call_type").notNull().default("Discovery"),
  text:           text("text").notNull(),
  logoUrl:        text("logo_url").notNull().default(""),
  contactPhotoUrl:text("contact_photo_url").notNull().default(""),
  prospectStep1:  text("prospect_step1").notNull().default(""),
  prospectStep2:  text("prospect_step2").notNull().default(""),
  architectureDiagram: text("architecture_diagram").notNull().default(""),
  createdAt:      timestamp("created_at", { withTimezone: true }).notNull(),
});

// ── Prospect results ─────────────────────────────────────────────────────────
export const prospectResults = pgTable("prospect_results", {
  id:          serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  websiteUrl:  text("website_url").notNull().default(""),
  step1:       text("step1").notNull(),
  step2:       text("step2").notNull(),
  createdAt:   timestamp("created_at", { withTimezone: true }).notNull(),
});

export type Briefing        = typeof briefings.$inferSelect;
export type NewBriefing     = typeof briefings.$inferInsert;
export type ProspectResult  = typeof prospectResults.$inferSelect;
export type NewProspectResult = typeof prospectResults.$inferInsert;
