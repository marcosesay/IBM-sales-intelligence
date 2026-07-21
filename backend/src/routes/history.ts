// history.ts — CRUD endpoints for persisted briefings and prospect results.
// GET    /api/history/briefings              — list all briefings, newest first
// POST   /api/history/briefings              — save a new briefing
// PATCH  /api/history/briefings/:id          — update all fields on an existing briefing
// DELETE /api/history/briefings/:id          — delete a briefing
// GET    /api/history/prospects              — list all prospect results, newest first
// POST   /api/history/prospects              — save a new prospect result
// DELETE /api/history/prospects/:id          — delete a prospect result

import { Router, type IRouter } from "express";
import { db } from "../lib/db";
import { briefings, prospectResults } from "../lib/schema";
import { desc, eq } from "drizzle-orm";

const router: IRouter = Router();

// ── Briefings ────────────────────────────────────────────────────────────────

router.get("/briefings", (_req, res) => {
  const rows = db
    .select()
    .from(briefings)
    .orderBy(desc(briefings.createdAt))
    .all();
  res.json(rows);
});

router.post("/briefings", (req, res) => {
  const { company, contactName, contactTitle, industry, callType, text, logoUrl, contactPhotoUrl, prospectStep1, prospectStep2, architectureDiagram } =
    req.body as {
      company: string;
      contactName?: string;
      contactTitle?: string;
      industry?: string;
      callType?: string;
      text: string;
      logoUrl?: string;
      contactPhotoUrl?: string;
      prospectStep1?: string;
      prospectStep2?: string;
      architectureDiagram?: string;
    };

  if (!company || !text) {
    res.status(400).json({ error: "company and text are required" });
    return;
  }

  const row = db
    .insert(briefings)
    .values({
      company,
      contactName:         contactName         ?? "",
      contactTitle:        contactTitle        ?? "",
      industry:            industry            ?? "",
      callType:            callType            ?? "Discovery",
      text,
      logoUrl:             logoUrl             ?? "",
      contactPhotoUrl:     contactPhotoUrl     ?? "",
      prospectStep1:       prospectStep1       ?? "",
      prospectStep2:       prospectStep2       ?? "",
      architectureDiagram: architectureDiagram ?? "",
      createdAt:           new Date(),
    })
    .returning()
    .get();

  res.status(201).json(row);
});

router.patch("/briefings/:id", (req, res) => {
  const id = Number(req.params["id"]);
  if (!id) { res.status(400).json({ error: "invalid id" }); return; }
  const { logoUrl, contactPhotoUrl, prospectStep1, prospectStep2, architectureDiagram } =
    req.body as {
      logoUrl?: string;
      contactPhotoUrl?: string;
      prospectStep1?: string;
      prospectStep2?: string;
      architectureDiagram?: string;
    };
  // Build a typed partial so Drizzle maps camelCase keys → snake_case columns correctly.
  const patch: Partial<typeof briefings.$inferInsert> = {};
  if (logoUrl             !== undefined) patch.logoUrl             = logoUrl;
  if (contactPhotoUrl     !== undefined) patch.contactPhotoUrl     = contactPhotoUrl;
  if (prospectStep1       !== undefined) patch.prospectStep1       = prospectStep1;
  if (prospectStep2       !== undefined) patch.prospectStep2       = prospectStep2;
  if (architectureDiagram !== undefined) patch.architectureDiagram = architectureDiagram;
  if (Object.keys(patch).length === 0) { res.json({ ok: true }); return; }
  db.update(briefings).set(patch).where(eq(briefings.id, id)).run();
  res.json({ ok: true });
});

router.delete("/briefings/:id", (req, res) => {
  const id = Number(req.params["id"]);
  if (!id) { res.status(400).json({ error: "invalid id" }); return; }
  db.delete(briefings).where(eq(briefings.id, id)).run();
  res.json({ ok: true });
});

// ── Prospect results ─────────────────────────────────────────────────────────

router.get("/prospects", (_req, res) => {
  const rows = db
    .select()
    .from(prospectResults)
    .orderBy(desc(prospectResults.createdAt))
    .all();
  res.json(rows);
});

router.post("/prospects", (req, res) => {
  const { companyName, websiteUrl, step1, step2 } = req.body as {
    companyName: string;
    websiteUrl?: string;
    step1: string;
    step2: string;
  };

  if (!companyName || !step1 || !step2) {
    res.status(400).json({ error: "companyName, step1 and step2 are required" });
    return;
  }

  const row = db
    .insert(prospectResults)
    .values({
      companyName,
      websiteUrl: websiteUrl ?? "",
      step1,
      step2,
      createdAt: new Date(),
    })
    .returning()
    .get();

  res.status(201).json(row);
});

router.delete("/prospects/:id", (req, res) => {
  const id = Number(req.params["id"]);
  if (!id) { res.status(400).json({ error: "invalid id" }); return; }
  db.delete(prospectResults).where(eq(prospectResults.id, id)).run();
  res.json({ ok: true });
});

export default router;
