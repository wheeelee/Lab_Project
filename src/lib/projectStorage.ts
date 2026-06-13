import {
  BaseDirectory,
  exists,
  mkdir,
  readTextFile,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import { Shape } from "./shapes/Shape";
import { shapeFromJSON } from "./shapes/shapeFromJSON";

const PROJECTS_DIR = "VectorEngine/projects";
const INDEX_FILE = `${PROJECTS_DIR}/index.json`;

export interface ProjectIndexEntry {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectData {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  lineAlg: "bresenham" | "wu";
  shapes: Record<string, unknown>[];
}

const fsOptions = { baseDir: BaseDirectory.Document };

async function ensureProjectsDir() {
  const dirExists = await exists(PROJECTS_DIR, fsOptions);
  if (!dirExists) {
    await mkdir(PROJECTS_DIR, { ...fsOptions, recursive: true });
  }
}

function projectFilePath(id: number) {
  return `${PROJECTS_DIR}/${id}.json`;
}

export async function loadProjectIndex(): Promise<ProjectIndexEntry[]> {
  try {
    await ensureProjectsDir();
    const raw = await readTextFile(INDEX_FILE, fsOptions);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeProjectIndex(entries: ProjectIndexEntry[]) {
  await ensureProjectsDir();
  await writeTextFile(INDEX_FILE, JSON.stringify(entries, null, 2), fsOptions);
}

export async function addProjectToIndex(
  entry: ProjectIndexEntry
): Promise<void> {
  const index = await loadProjectIndex();
  index.push(entry);
  await writeProjectIndex(index);
}

export async function updateProjectIndexEntry(
  id: number,
  patch: Partial<Pick<ProjectIndexEntry, "name" | "updatedAt">>
): Promise<void> {
  const index = await loadProjectIndex();
  const entry = index.find((p) => p.id === id);
  if (!entry) return;
  if (patch.name !== undefined) entry.name = patch.name;
  if (patch.updatedAt !== undefined) entry.updatedAt = patch.updatedAt;
  await writeProjectIndex(index);
}

export async function saveProject(
  id: number,
  name: string,
  lineAlg: "bresenham" | "wu",
  shapes: Shape[],
  createdAt?: string
): Promise<void> {
  await ensureProjectsDir();

  const now = new Date().toISOString();
  const index = await loadProjectIndex();
  const existing = index.find((p) => p.id === id);

  let projectCreatedAt = createdAt ?? existing?.createdAt ?? now;

  const data: ProjectData = {
    id,
    name,
    createdAt: projectCreatedAt,
    updatedAt: now,
    lineAlg,
    shapes: shapes.map((s) => s.toJSON()),
  };

  await writeTextFile(
    projectFilePath(id),
    JSON.stringify(data, null, 2),
    fsOptions
  );

  if (existing) {
    existing.name = name;
    existing.updatedAt = now;
  } else {
    index.push({
      id,
      name,
      createdAt: projectCreatedAt,
      updatedAt: now,
    });
  }

  await writeProjectIndex(index);
}

export async function loadProject(id: number): Promise<ProjectData | null> {
  try {
    await ensureProjectsDir();
    const fileExists = await exists(projectFilePath(id), fsOptions);
    if (!fileExists) return null;

    const raw = await readTextFile(projectFilePath(id), fsOptions);
    return JSON.parse(raw) as ProjectData;
  } catch {
    return null;
  }
}

export function restoreShapes(data: ProjectData): Shape[] {
  return data.shapes
    .map((json) => shapeFromJSON(json))
    .filter((s): s is Shape => s !== null);
}
