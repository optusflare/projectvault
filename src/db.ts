import Dexie, { type Table } from 'dexie';
import type { Project } from './types';

class ProjectVaultDB extends Dexie {
  projects!: Table<Project, string>;

  constructor() {
    super('projectvault');
    this.version(1).stores({
      projects: 'id, status, type, updatedAt, *technologies',
    });
  }
}

export const projectDb = new ProjectVaultDB();

export async function getProjects(): Promise<Project[]> {
  return projectDb.projects.orderBy('updatedAt').reverse().toArray();
}

export async function saveProject(project: Project): Promise<void> {
  await projectDb.projects.put(project);
}

export async function saveProjects(projects: Project[]): Promise<void> {
  await projectDb.transaction('rw', projectDb.projects, async () => {
    await projectDb.projects.clear();
    await projectDb.projects.bulkPut(projects);
  });
}

export async function removeProject(id: string): Promise<void> {
  await projectDb.projects.delete(id);
}

export async function clearProjects(): Promise<void> {
  await projectDb.projects.clear();
}
