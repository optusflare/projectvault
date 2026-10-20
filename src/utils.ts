import type { Project, ProjectDraft, ProjectStatus, ProjectType } from './types';

export const statusLabels: Record<ProjectStatus, string> = {
  idea: 'Idea',
  planning: 'Planning',
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  abandoned: 'Abandoned',
};

export const typeLabels: Record<ProjectType, string> = {
  website: 'Website',
  app: 'App',
  game: 'Game',
  tool: 'Tool',
  experiment: 'Experiment',
  other: 'Other',
};

export function createId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function emptyDraft(): ProjectDraft {
  return {
    title: '',
    type: 'website',
    description: '',
    status: 'idea',
    liveUrl: '',
    repoUrl: '',
    technologies: [],
    notes: '',
    tasks: [],
    attachments: [],
  };
}

export function createProject(draft: ProjectDraft): Project {
  const now = new Date().toISOString();
  return { ...draft, id: createId(), createdAt: now, updatedAt: now };
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'project';
}

export function downloadJson(projects: Project[]): void {
  const payload = JSON.stringify({ exportedAt: new Date().toISOString(), version: 1, projects }, null, 2);
  const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `projectvault-backup-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function isProject(value: unknown): value is Project {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<Project>;
  return typeof item.id === 'string' && typeof item.title === 'string' && Array.isArray(item.tasks) && Array.isArray(item.attachments);
}
