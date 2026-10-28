/**
 * SIP Server — Scanner API Routes
 * POST /api/scans         — Start a new scan
 * GET  /api/scans         — List scan results
 * GET  /api/scans/:id     — Get scan result
 * POST /api/scans/:id/cancel — Cancel a running scan
 * POST /api/scans (Accept: text/event-stream) — live progress stream
 */

import { Router, type Request, type Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { executeScanPipeline, cancelScan } from "../services/scanner";
import { saveScanResult, getScanResults, getScanResult, getProject } from "../services/store";
import { MANIFESTS_BY_ID } from "../plugins/manifests";
import { isSafeSourceValue } from "../plugins/runtime";
import type { ScanConfig } from "../types";

export const scannerRouter = Router();

// ─── Start a new scan ─────────────────────────────────────────────────────

scannerRouter.post("/", async (req: Request, res: Response) => {
  const { projectId, projectName, sourceType, sourceValue, toolIds } = req.body as ScanConfig;

  // Validate
  if (!sourceType || !sourceValue || !Array.isArray(toolIds) || toolIds.length === 0) {
    res.status(400).json({ error: "Missing required fields: sourceType, sourceValue, toolIds" });
    return;
  }

  const VALID_SOURCE_TYPES = ["git", "folder", "website", "api", "docker"];
  if (!VALID_SOURCE_TYPES.includes(sourceType)) {
    res.status(400).json({ error: `Invalid sourceType: ${VALID_SOURCE_TYPES.join(", ")}` });
    return;
  }

  // Validate tool IDs
  const validToolIds = toolIds.filter((id: string) => MANIFESTS_BY_ID[id]);
  if (validToolIds.length === 0) {
    res.status(400).json({ error: "No valid tool IDs provided" });
    return;
  }

  // Validate target — it is embedded into a shell command, so only a safe
  // character set (hostnames, URLs, paths) is accepted.
  if (!isSafeSourceValue(sourceValue)) {
    res.status(400).json({
      error: "Invalid sourceValue: only letters, digits and . _ - : / @ are allowed",
    });
    return;
  }

  const scanId = `SCAN-${uuidv4().slice(0, 8)}`;
  const config: ScanConfig = {
    projectId: projectId || "PRJ-001",
    projectName: projectName || "Default Project",
    sourceType,
    sourceValue,
    toolIds: validToolIds,
  };

  // Store a placeholder right away, so GET /api/scans/:id can report the
  // running scan instead of answering 404 while the pipeline works.
  const startedAt = new Date().toISOString();
  saveScanResult({
    id: scanId,
    projectId: config.projectId,
    projectName: config.projectName,
    sourceType: config.sourceType,
    sourceValue: config.sourceValue,
    tools: config.toolIds,
    status: "running",
    startedAt,
    completedAt: "",
    findings: [],
    riskScore: 0,
    timeline: [],
    stdout: [],
    stderr: [],
    exitCode: 0,
  });

  // Check if request wants SSE stream
  const acceptSSE = req.headers.accept?.includes("text/event-stream");

  if (acceptSSE) {
    // SSE response — stream progress events
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });

    // Send scan ID first
    res.write(`event: init\ndata: ${JSON.stringify({ scanId })}\n\n`);

    // Execute scan pipeline with SSE progress
    try {
      const result = await executeScanPipeline(config, scanId, res);
      saveScanResult(result);
    } catch (err) {
      console.error("[SIP Scanner] Pipeline error:", err);
    } finally {
      if (!res.writableEnded) {
        res.end();
      }
    }
  } else {
    // Regular JSON response — start scan and return scan ID
    // The client will poll for progress via SSE endpoint
    res.json({ scanId, status: "queued", config });

    // Execute in background
    try {
      // We need a fake response object to capture SSE events
      // For non-SSE mode, we'll still run the pipeline and save results
      const fakeRes = {
        writableEnded: false,
        write: () => {},
        end: () => {},
      } as unknown as Response;

      const result = await executeScanPipeline(config, scanId, fakeRes);
      saveScanResult(result);
    } catch (err) {
      console.error("[SIP Scanner] Pipeline error:", err);
    }
  }
});

// ─── List scan results ────────────────────────────────────────────────────

scannerRouter.get("/", (_req: Request, res: Response) => {
  const scans = getScanResults();
  // Return summaries without full findings
  const summaries = scans.map((s) => ({
    id: s.id,
    projectId: s.projectId,
    projectName: s.projectName,
    sourceType: s.sourceType,
    sourceValue: s.sourceValue,
    tools: s.tools,
    status: s.status,
    startedAt: s.startedAt,
    completedAt: s.completedAt,
    findingsCount: s.findings.length,
    riskScore: s.riskScore,
    exitCode: s.exitCode,
  }));
  res.json(summaries);
});

// ─── Get scan result ──────────────────────────────────────────────────────

scannerRouter.get("/:id", (req: Request, res: Response) => {
  const scan = getScanResult(req.params.id);
  if (!scan) {
    res.status(404).json({ error: "Scan not found" });
    return;
  }
  res.json(scan);
});

// ─── Cancel a scan ────────────────────────────────────────────────────────

scannerRouter.post("/:id/cancel", (req: Request, res: Response) => {
  const cancelled = cancelScan(req.params.id);
  if (cancelled) {
    res.json({ message: "Scan cancelled", scanId: req.params.id });
  } else {
    res.status(404).json({ error: "Scan not found or not active" });
  }
});

// ─── Scan status ──────────────────────────────────────────────────────────
//
// There is no separate SSE endpoint for an already running scan: it never
// emitted a single event, so clients had to poll GET /api/scans/:id instead.
// The POST handler itself streams events when the client asks for
// `Accept: text/event-stream`.
