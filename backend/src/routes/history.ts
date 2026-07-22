// history.ts — CRUD endpoints for persisted briefings and prospect results.
// GET    /api/history/briefings              — list all briefings, newest first
// POST   /api/history/briefings              — save a new briefing
// PATCH  /api/history/briefings/:id          — update fields on an existing briefing (404 if missing)
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

router.get("/briefings", async (_req, res) => {
  const rows = await db
    .select()
    .from(briefings)
    .orderBy(desc(briefings.createdAt));
  res.json(rows);
});

router.post("/briefings", async (req, res) => {
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

  const [row] = await db
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
    .returning();

  res.status(201).json(row);
});

router.patch("/briefings/:id", async (req, res) => {
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
  const patch: Partial<typeof briefings.$inferInsert> = {};
  if (logoUrl             !== undefined) patch.logoUrl             = logoUrl;
  if (contactPhotoUrl     !== undefined) patch.contactPhotoUrl     = contactPhotoUrl;
  if (prospectStep1       !== undefined) patch.prospectStep1       = prospectStep1;
  if (prospectStep2       !== undefined) patch.prospectStep2       = prospectStep2;
  if (architectureDiagram !== undefined) patch.architectureDiagram = architectureDiagram;
  if (Object.keys(patch).length === 0) { res.json({ ok: true }); return; }
  const updated = await db.update(briefings).set(patch).where(eq(briefings.id, id)).returning();
  if (updated.length === 0) { res.status(404).json({ error: "not found" }); return; }
  res.json({ ok: true });
});

router.delete("/briefings/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  if (!id) { res.status(400).json({ error: "invalid id" }); return; }
  await db.delete(briefings).where(eq(briefings.id, id));
  res.json({ ok: true });
});

// ── Prospect results ─────────────────────────────────────────────────────────

router.get("/prospects", async (_req, res) => {
  const rows = await db
    .select()
    .from(prospectResults)
    .orderBy(desc(prospectResults.createdAt));
  res.json(rows);
});

router.post("/prospects", async (req, res) => {
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

  const [row] = await db
    .insert(prospectResults)
    .values({
      companyName,
      websiteUrl: websiteUrl ?? "",
      step1,
      step2,
      createdAt: new Date(),
    })
    .returning();

  res.status(201).json(row);
});

router.delete("/prospects/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  if (!id) { res.status(400).json({ error: "invalid id" }); return; }
  await db.delete(prospectResults).where(eq(prospectResults.id, id));
  res.json({ ok: true });
});

export default router;
