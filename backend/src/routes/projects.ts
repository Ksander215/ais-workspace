/**
 * SIP Server — Projects API Routes
 * GET    /api/projects       — List projects
 * POST   /api/projects       — Create project
 * GET    /api/projects/:id   — Get project
 * PUT    /api/projects/:id   — Update project
 * DELETE /api/projects/:id   — Delete project
 * GET    /api/projects/:id/scans — Get project scans
 */

import { Router, type Request, type Response } from "express";
import {
  getProjects,
  getProject,
  saveProject,
  createProject,
  deleteProject,
  getProjectScans,
} from "../services/store";
import type { Project } from "../types";

export const projectsRouter = Router();

// ─── List projects ────────────────────────────────────────────────────────

projectsRouter.get("/", (_req: Request, res: Response) => {
  const projects = getProjects();
  res.json(projects);
});

// ─── Create project ───────────────────────────────────────────────────────

projectsRouter.post("/", (req: Request, res: Response) => {
  const { name, description } = req.body;

  if (!name) {
    res.status(400).json({ error: "Project name is required" });
    return;
  }

  const project = createProject(name, description || "");
  res.status(201).json(project);
});

// ─── Get project ──────────────────────────────────────────────────────────

projectsRouter.get("/:id", (req: Request, res: Response) => {
  const project = getProject(req.params.id);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json(project);
});

// ─── Update project ───────────────────────────────────────────────────────

projectsRouter.put("/:id", (req: Request, res: Response) => {
  const project = getProject(req.params.id);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  // Only the user-editable fields are accepted — a blind spread let the
  // client overwrite securityScore, status, scans, findings and settings.
  const body = (req.body || {}) as Partial<Project>;
  const updated: Project = {
    ...project,
    name: typeof body.name === "string" ? body.name : project.name,
    description: typeof body.description === "string" ? body.description : project.description,
    settings: project.settings,
    id: project.id,
    createdAt: project.createdAt,
  };
  if (body.settings && typeof body.settings === "object") {
    updated.settings = { ...project.settings, ...(body.settings as Project["settings"]) };
  }
  saveProject(updated);
  res.json(updated);
});

// ─── Delete project ───────────────────────────────────────────────────────

projectsRouter.delete("/:id", (req: Request, res: Response) => {
  const project = getProject(req.params.id);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  deleteProject(req.params.id);
  res.json({ message: "Project deleted" });
});

// ─── Get project scans ───────────────────────────────────────────────────

projectsRouter.get("/:id/scans", (req: Request, res: Response) => {
  const scans = getProjectScans(req.params.id);
  res.json(scans);
});
