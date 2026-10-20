export const PROJECT_STATUSES = ['idea', 'planning', 'active', 'paused', 'completed', 'abandoned'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_TYPES = ['website', 'app', 'game', 'tool', 'experiment', 'other'] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export type Task = {
  id: string;
  title: string;
  done: boolean;
};

export type Attachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
};

export type Project = {
  id: string;
  title: string;
  type: ProjectType;
  description: string;
  status: ProjectStatus;
  liveUrl: string;
  repoUrl: string;
  technologies: string[];
  notes: string;
  tasks: Task[];
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
};

export type ProjectDraft = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;
