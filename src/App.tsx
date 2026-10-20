import { useEffect, useMemo, useState } from 'react';
import { marked } from 'marked';
import {
  Archive, ArrowLeft, ArrowUpRight, Check, ChevronRight, CircleHelp, ClipboardList, Code2, Download, ExternalLink,
  FolderKanban, Github, HardDriveDownload, Image as ImageIcon, LayoutDashboard, Link2, ListFilter, Moon, MoreHorizontal,
  PackageOpen, Pencil, Plus, RefreshCw, Search, Settings, SlidersHorizontal, Sparkles, Sun, Trash2, Upload, Users,
  X, Zap,
} from 'lucide-react';
import { ProjectForm } from './components/ProjectForm';
import { MarkdownPreview } from './components/MarkdownPreview';
import { clearProjects, getProjects, removeProject, saveProject, saveProjects } from './db';
import type { Project, ProjectDraft, ProjectStatus, ProjectType, Task } from './types';
import { PROJECT_STATUSES, PROJECT_TYPES } from './types';
import { createId, createProject, downloadJson, formatBytes, formatDate, statusLabels, typeLabels } from './utils';

type View = 'dashboard' | 'projects' | 'settings';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const statusColors: Record<ProjectStatus, string> = {
  idea: 'status-idea', planning: 'status-planning', active: 'status-active', paused: 'status-paused', completed: 'status-completed', abandoned: 'status-abandoned',
};

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [view, setView] = useState<View>('dashboard');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | ProjectType>('all');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('projectvault-theme') as 'light' | 'dark') || 'light');
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPromptEvent | null>(null);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProjects().then((items) => { setProjects(items); setLoading(false); });
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('projectvault-theme', theme);
  }, [theme]);

  useEffect(() => {
    const capture = (event: Event) => { event.preventDefault(); setDeferredPrompt(event as InstallPromptEvent); };
    window.addEventListener('beforeinstallprompt', capture);
    return () => window.removeEventListener('beforeinstallprompt', capture);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const selectedProject = projects.find((project) => project.id === selectedId);
  const counts = useMemo(() => ({
    total: projects.length,
    active: projects.filter((project) => project.status === 'active').length,
    completed: projects.filter((project) => project.status === 'completed').length,
    tasks: projects.reduce((sum, project) => sum + project.tasks.filter((task) => !task.done).length, 0),
  }), [projects]);

  const filteredProjects = useMemo(() => projects.filter((project) => {
    const text = `${project.title} ${project.description} ${project.technologies.join(' ')}`.toLowerCase();
    return (!query.trim() || text.includes(query.toLowerCase())) && (statusFilter === 'all' || project.status === statusFilter) && (typeFilter === 'all' || project.type === typeFilter);
  }), [projects, query, statusFilter, typeFilter]);

  async function installApp() {
    if (!deferredPrompt) {
      setToast('Use your browser menu and choose “Install ProjectVault” or “Add to Home Screen”.');
      return;
    }
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') setToast('ProjectVault is ready on your device.');
    setDeferredPrompt(null);
  }

  function openView(nextView: View) {
    setView(nextView);
    setSelectedId(null);
  }

  function openNewProject() {
    setEditingProject(undefined);
    setFormOpen(true);
  }

  function openEdit(project: Project) {
    setEditingProject(project);
    setFormOpen(true);
  }

  async function handleSave(draft: ProjectDraft) {
    const nextProject = editingProject ? { ...editingProject, ...draft, updatedAt: new Date().toISOString() } : createProject(draft);
    await saveProject(nextProject);
    setProjects(await getProjects());
    setFormOpen(false);
    setEditingProject(undefined);
    setSelectedId(nextProject.id);
    setView('projects');
    setToast(editingProject ? 'Project updated.' : 'Project created.');
  }

  async function handleDelete(project: Project) {
    if (!window.confirm(`Delete “${project.title}”? This cannot be undone unless you have an export.`)) return;
    await removeProject(project.id);
    setProjects(await getProjects());
    setSelectedId(null);
    setToast('Project deleted.');
  }

  async function toggleTask(project: Project, task: Task) {
    const next = { ...project, updatedAt: new Date().toISOString(), tasks: project.tasks.map((item) => item.id === task.id ? { ...item, done: !item.done } : item) };
    await saveProject(next);
    setProjects((current) => current.map((item) => item.id === next.id ? next : item));
  }

  async function importBackup(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as { projects?: unknown } | unknown[];
      const incoming = Array.isArray(parsed) ? parsed : parsed.projects;
      if (!Array.isArray(incoming) || !incoming.every((item) => item && typeof item === 'object' && typeof (item as Project).id === 'string' && Array.isArray((item as Project).tasks))) throw new Error('Invalid backup');
      await saveProjects(incoming as Project[]);
      setProjects(await getProjects());
      setToast(`${incoming.length} project${incoming.length === 1 ? '' : 's'} imported.`);
    } catch {
      setToast('That file does not look like a ProjectVault backup.');
    }
    event.target.value = '';
  }

  async function wipeData() {
    if (!window.confirm('Clear every local ProjectVault project? Export a backup first if you may need it later.')) return;
    await clearProjects();
    setProjects([]);
    setSelectedId(null);
    setToast('Local project data cleared.');
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><span /></div><div><strong>ProjectVault</strong><small>build / remember / return</small></div></div>
        <div className="workspace-pill"><span className="online-dot" /> Local workspace <span className="workspace-lock">offline-ready</span></div>
        <nav className="main-nav" aria-label="Main navigation">
          <button className={view === 'dashboard' && !selectedId ? 'nav-item active' : 'nav-item'} onClick={() => openView('dashboard')}><LayoutDashboard size={18} /> Overview</button>
          <button className={view === 'projects' && !selectedId ? 'nav-item active' : 'nav-item'} onClick={() => openView('projects')}><FolderKanban size={18} /> Projects <span className="nav-count">{projects.length}</span></button>
          <button className={view === 'settings' ? 'nav-item active' : 'nav-item'} onClick={() => openView('settings')}><Settings size={18} /> Settings</button>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note"><Sparkles size={17} /><div><strong>Make progress visible.</strong><p>ProjectVault keeps your work close, clear, and yours.</p></div></div>
          <button className="theme-switch" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}><span>{theme === 'light' ? <Moon size={16} /> : <Sun size={16} />} {theme === 'light' ? 'Dark mode' : 'Light mode'}</span><span className="switch-indicator" /></button>
          <div className="sidebar-footer"><span>v0.1 local-first</span><span className="footer-key">⌘ K</span></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><ChevronRight size={15} /><strong>{selectedProject ? selectedProject.title : view === 'dashboard' ? 'Overview' : view === 'projects' ? 'Projects' : 'Settings'}</strong></div>
          <div className="topbar-actions"><button className="install-button" onClick={installApp}><Download size={16} /> <span>{deferredPrompt ? 'Install app' : 'Get the app'}</span></button><button className="avatar-button" aria-label="Local workspace">PV</button></div>
        </header>

        {selectedProject ? <ProjectDetail project={selectedProject} onBack={() => setSelectedId(null)} onEdit={() => openEdit(selectedProject)} onDelete={() => handleDelete(selectedProject)} onToggleTask={(task) => toggleTask(selectedProject, task)} /> : view === 'dashboard' ? <Dashboard projects={projects} counts={counts} loading={loading} onNew={openNewProject} onOpen={(project) => setSelectedId(project.id)} onViewProjects={() => openView('projects')} onInstall={installApp} /> : view === 'projects' ? <ProjectsView projects={filteredProjects} allProjectsCount={projects.length} query={query} setQuery={setQuery} statusFilter={statusFilter} setStatusFilter={setStatusFilter} typeFilter={typeFilter} setTypeFilter={setTypeFilter} onNew={openNewProject} onOpen={(project) => setSelectedId(project.id)} /> : <SettingsView projects={projects} onExport={() => downloadJson(projects)} onImport={importBackup} onClear={wipeData} onInstall={installApp} />}
      </main>

      {formOpen && <ProjectForm project={editingProject} onClose={() => { setFormOpen(false); setEditingProject(undefined); }} onSave={handleSave} />}
      {toast && <div className="toast"><Check size={16} /> {toast}</div>}
    </div>
  );
}

type DashboardProps = { projects: Project[]; counts: { total: number; active: number; completed: number; tasks: number }; loading: boolean; onNew: () => void; onOpen: (project: Project) => void; onViewProjects: () => void; onInstall: () => void };
function Dashboard({ projects, counts, loading, onNew, onOpen, onViewProjects, onInstall }: DashboardProps) {
  const recent = projects.slice(0, 4);
  const progress = counts.total ? Math.round((counts.completed / counts.total) * 100) : 0;
  return <div className="page-wrap">
    <section className="page-heading dashboard-heading"><div><span className="eyebrow">Workspace overview</span><h1>Make progress visible.</h1><p className="page-subtitle">A quiet place for every idea, build, and half-finished experiment.</p></div><div className="heading-actions"><button className="secondary-button" onClick={onInstall}><Download size={16} /> Install app</button><button className="primary-button" onClick={onNew}><Plus size={17} /> New project</button></div></section>
    <section className="stats-grid"><StatCard label="All projects" value={counts.total} detail="in your workspace" icon={<Archive size={18} />} tone="lime" /><StatCard label="In progress" value={counts.active} detail="currently moving" icon={<Zap size={18} />} tone="blue" /><StatCard label="Completed" value={counts.completed} detail="shipped or finished" icon={<Check size={18} />} tone="lavender" /><StatCard label="Tasks left" value={counts.tasks} detail="across all projects" icon={<ClipboardList size={18} />} tone="peach" /></section>
    <section className="dashboard-grid"><div className="panel progress-panel"><div className="panel-heading"><div><span className="eyebrow">Your momentum</span><h2>Keep the loop going.</h2></div><span className="panel-icon"><Sparkles size={18} /></span></div><div className="progress-visual"><div className="progress-ring" style={{ '--progress': `${progress * 3.6}deg` } as React.CSSProperties}><div><strong>{progress}%</strong><small>complete</small></div></div><div className="progress-copy"><strong>{counts.total ? `${counts.completed} of ${counts.total} projects shipped` : 'Your first project starts here'}</strong><p>{counts.total ? 'Small, finished projects add up. Keep capturing what you make.' : 'Create a project to turn a loose idea into something you can return to.'}</p><button className="text-button" onClick={onViewProjects}>View all projects <ArrowUpRight size={15} /></button></div></div></div><div className="panel quick-panel"><div className="panel-heading"><div><span className="eyebrow">Quick start</span><h2>Capture the next thing.</h2></div><span className="panel-icon dark"><Plus size={18} /></span></div><div className="quick-actions"><button onClick={onNew}><span className="quick-icon lime"><Plus size={17} /></span><span><strong>Add a project</strong><small>Give an idea a name and a next step.</small></span><ChevronRight size={17} /></button><button onClick={onInstall}><span className="quick-icon blue"><Download size={17} /></span><span><strong>Install the workspace</strong><small>Keep your vault one tap away.</small></span><ChevronRight size={17} /></button></div></div></section>
    <section className="recent-section"><div className="section-heading"><div><span className="eyebrow">Latest activity</span><h2>Recently touched</h2></div><button className="text-button" onClick={onViewProjects}>See everything <ArrowUpRight size={15} /></button></div>{loading ? <div className="empty-panel"><RefreshCw className="spin" size={19} /> Loading your workspace...</div> : recent.length ? <div className="project-list">{recent.map((project) => <ProjectRow key={project.id} project={project} onClick={() => onOpen(project)} />)}</div> : <EmptyState onNew={onNew} />}</section>
  </div>;
}

function StatCard({ label, value, detail, icon, tone }: { label: string; value: number; detail: string; icon: React.ReactNode; tone: string }) { return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></div>; }

function EmptyState({ onNew }: { onNew: () => void }) { return <div className="empty-panel empty-state"><div className="empty-illustration"><FolderKanban size={23} /></div><h3>Nothing in the vault yet.</h3><p>Start with the project you cannot stop thinking about.</p><button className="primary-button" onClick={onNew}><Plus size={17} /> Create your first project</button></div>; }

function ProjectRow({ project, onClick }: { project: Project; onClick: () => void }) { const done = project.tasks.filter((task) => task.done).length; const total = project.tasks.length; return <button className="project-row" onClick={onClick}><div className="row-project-icon"><Code2 size={18} /></div><div className="row-project-main"><strong>{project.title}</strong><span>{project.description || 'No description yet'}</span></div><span className="type-pill">{typeLabels[project.type]}</span><span className={`status-pill ${statusColors[project.status]}`}><i />{statusLabels[project.status]}</span><span className="row-progress">{total ? `${done}/${total}` : '—'}</span><ChevronRight className="row-chevron" size={17} /></button>; }

type ProjectsProps = { projects: Project[]; allProjectsCount: number; query: string; setQuery: (value: string) => void; statusFilter: 'all' | ProjectStatus; setStatusFilter: (value: 'all' | ProjectStatus) => void; typeFilter: 'all' | ProjectType; setTypeFilter: (value: 'all' | ProjectType) => void; onNew: () => void; onOpen: (project: Project) => void };
function ProjectsView({ projects, allProjectsCount, query, setQuery, statusFilter, setStatusFilter, typeFilter, setTypeFilter, onNew, onOpen }: ProjectsProps) { return <div className="page-wrap"><section className="page-heading"><div><span className="eyebrow">Project library</span><h1>Everything you build.</h1><p className="page-subtitle">Keep the context, not just the link.</p></div><button className="primary-button" onClick={onNew}><Plus size={17} /> New project</button></section><section className="library-toolbar"><div className="search-box"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects, technologies, descriptions..." /></div><div className="filter-control"><ListFilter size={16} /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ProjectsProps['statusFilter'])}><option value="all">All statuses</option>{PROJECT_STATUSES.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></div><div className="filter-control"><SlidersHorizontal size={16} /><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as ProjectsProps['typeFilter'])}><option value="all">All types</option>{PROJECT_TYPES.map((type) => <option key={type} value={type}>{typeLabels[type]}</option>)}</select></div></section><div className="results-line"><span>{projects.length} of {allProjectsCount} projects</span>{query || statusFilter !== 'all' || typeFilter !== 'all' ? <span className="filter-active">Filters active</span> : <span>Sorted by recent activity</span>}</div>{projects.length ? <div className="project-card-grid">{projects.map((project) => <ProjectCard key={project.id} project={project} onClick={() => onOpen(project)} />)}</div> : <div className="empty-panel empty-state"><div className="empty-illustration"><Search size={23} /></div><h3>No matching projects.</h3><p>Try a different search or clear one of the filters.</p></div>}</div>; }

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) { const done = project.tasks.filter((task) => task.done).length; const total = project.tasks.length; return <button className="project-card" onClick={onClick}><div className="card-top"><div className="card-icon"><Code2 size={18} /></div><span className={`status-pill ${statusColors[project.status]}`}><i />{statusLabels[project.status]}</span></div><div className="card-title-row"><h3>{project.title}</h3><ArrowUpRight size={17} /></div><p>{project.description || 'No description yet. Open this project to add context.'}</p><div className="card-tags">{project.technologies.slice(0, 3).map((technology) => <span key={technology}>{technology}</span>)}{project.technologies.length > 3 && <span>+{project.technologies.length - 3}</span>}</div><div className="card-footer"><span>{typeLabels[project.type]}</span><span>{total ? `${Math.round((done / total) * 100)}% done` : 'No tasks yet'}</span></div></button>; }

function ProjectDetail({ project, onBack, onEdit, onDelete, onToggleTask }: { project: Project; onBack: () => void; onEdit: () => void; onDelete: () => void; onToggleTask: (task: Task) => void }) { const completed = project.tasks.filter((task) => task.done).length; const percent = project.tasks.length ? Math.round((completed / project.tasks.length) * 100) : 0; return <div className="page-wrap detail-wrap"><button className="back-button" onClick={onBack}><ArrowLeft size={16} /> Back to projects</button><section className="detail-heading"><div><div className="detail-kicker"><span className={`status-pill ${statusColors[project.status]}`}><i />{statusLabels[project.status]}</span><span className="type-pill">{typeLabels[project.type]}</span><span className="muted">Updated {formatDate(project.updatedAt)}</span></div><h1>{project.title}</h1><p className="page-subtitle">{project.description || 'No description yet.'}</p></div><div className="heading-actions"><button className="secondary-button" onClick={onEdit}><Pencil size={16} /> Edit</button><button className="icon-button danger-button" onClick={onDelete} aria-label="Delete project"><Trash2 size={17} /></button></div></section><div className="detail-grid"><div className="detail-main"><section className="panel detail-panel"><div className="panel-heading"><div><span className="eyebrow">Project context</span><h2>What is this becoming?</h2></div><CircleHelp size={18} className="muted" /></div><div className="detail-copy"><p>{project.description || 'Add a one-line description to keep the purpose of this project close.'}</p></div><div className="detail-links">{project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Live project <ArrowUpRight size={14} /></a>}{project.repoUrl && <a href={project.repoUrl} target="_blank" rel="noreferrer"><Github size={16} /> Source code <ArrowUpRight size={14} /></a>}{!project.liveUrl && !project.repoUrl && <span className="muted link-placeholder"><Link2 size={16} /> Add live and source links from Edit</span>}</div>{project.technologies.length > 0 && <div className="detail-tech"><span className="section-label">Built with</span><div className="card-tags">{project.technologies.map((technology) => <span key={technology}>{technology}</span>)}</div></div>}</section><section className="panel detail-panel"><div className="panel-heading"><div><span className="eyebrow">Working notes</span><h2>Keep the thinking.</h2></div><span className="panel-icon"><Pencil size={17} /></span></div><MarkdownPreview value={project.notes} /></section>{project.attachments.length > 0 && <section className="panel detail-panel"><div className="panel-heading"><div><span className="eyebrow">Visual trail</span><h2>Screenshots</h2></div><ImageIcon size={18} className="muted" /></div><div className="attachment-grid">{project.attachments.map((attachment) => <a href={attachment.dataUrl} target="_blank" rel="noreferrer" className="attachment-card" key={attachment.id}><img src={attachment.dataUrl} alt={attachment.name} /><div><strong>{attachment.name}</strong><small>{formatBytes(attachment.size)}</small></div></a>)}</div></section>}</div><aside className="detail-side"><section className="panel task-panel"><div className="panel-heading"><div><span className="eyebrow">Next actions</span><h2>Move it forward.</h2></div><span className="task-count">{completed}/{project.tasks.length}</span></div>{project.tasks.length ? <div className="detail-task-list">{project.tasks.map((task) => <label className="detail-task" key={task.id}><input type="checkbox" checked={task.done} onChange={() => onToggleTask(task)} /><span className={task.done ? 'done-text' : ''}>{task.title}</span></label>)}</div> : <p className="muted empty-copy">No tasks yet. Edit the project to add a next step.</p>}<div className="task-progress"><div><span>Task progress</span><strong>{percent}%</strong></div><div className="progress-bar"><span style={{ width: `${percent}%` }} /></div></div></section><section className="side-callout"><Sparkles size={18} /><strong>Local-first by design.</strong><p>This project stays in your browser. Export a backup any time from Settings.</p></section></aside></div></div>; }

function SettingsView({ projects, onExport, onImport, onClear, onInstall }: { projects: Project[]; onExport: () => void; onImport: (event: React.ChangeEvent<HTMLInputElement>) => void; onClear: () => void; onInstall: () => void }) { return <div className="page-wrap settings-wrap"><section className="page-heading"><div><span className="eyebrow">Workspace settings</span><h1>Keep it yours.</h1><p className="page-subtitle">ProjectVault stores your work locally by default. No account required.</p></div><button className="secondary-button" onClick={onInstall}><Download size={16} /> Install app</button></section><div className="settings-grid"><section className="panel settings-panel"><div className="settings-icon"><HardDriveDownload size={19} /></div><div><span className="eyebrow">Data portability</span><h2>Back up your workspace.</h2><p>Exports include projects, tasks, notes, links, and local image attachments. Keep a copy somewhere safe before clearing browser data.</p><div className="settings-actions"><button className="primary-button" onClick={onExport} disabled={!projects.length}><Download size={16} /> Export JSON</button><label className="secondary-button"><Upload size={16} /> Import JSON<input type="file" accept="application/json,.json" onChange={onImport} /></label></div></div></section><section className="panel settings-panel"><div className="settings-icon blue"><SlidersHorizontal size={19} /></div><div><span className="eyebrow">Your setup</span><h2>{projects.length} project{projects.length === 1 ? '' : 's'} in this browser.</h2><p>That is the current local workspace. Your data is not encrypted automatically, so avoid storing passwords or API keys here.</p><div className="privacy-note"><span className="online-dot" /><span>Local IndexedDB storage · works offline</span></div></div></section><section className="panel settings-panel danger-panel"><div className="settings-icon peach"><Trash2 size={19} /></div><div><span className="eyebrow">Reset</span><h2>Clear local data.</h2><p>Remove every project from this browser. This cannot be undone unless you have an exported backup.</p><button className="danger-text-button" onClick={onClear}><Trash2 size={16} /> Clear all projects</button></div></section></div><section className="settings-footer"><div><strong>ProjectVault</strong><span>v0.1 · local-first workspace</span></div><a href="https://github.com" target="_blank" rel="noreferrer"><Github size={16} /> Open source ready <ArrowUpRight size={14} /></a></section></div>; }

export default App;
