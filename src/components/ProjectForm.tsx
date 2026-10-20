import { useMemo, useState } from 'react';
import { ImagePlus, Plus, X } from 'lucide-react';
import type { Attachment, Project, ProjectDraft, Task } from '../types';
import { PROJECT_STATUSES, PROJECT_TYPES } from '../types';
import { createId, emptyDraft, formatBytes, statusLabels, typeLabels } from '../utils';

type Props = {
  project?: Project;
  onClose: () => void;
  onSave: (draft: ProjectDraft) => void;
};

export function ProjectForm({ project, onClose, onSave }: Props) {
  const [draft, setDraft] = useState<ProjectDraft>(() => project ? {
    title: project.title,
    type: project.type,
    description: project.description,
    status: project.status,
    liveUrl: project.liveUrl,
    repoUrl: project.repoUrl,
    technologies: project.technologies,
    notes: project.notes,
    tasks: project.tasks,
    attachments: project.attachments,
  } : emptyDraft());
  const [technologyText, setTechnologyText] = useState(project?.technologies.join(', ') ?? '');
  const [taskText, setTaskText] = useState('');
  const [error, setError] = useState('');

  const canSave = useMemo(() => draft.title.trim().length > 0, [draft.title]);

  function patch(values: Partial<ProjectDraft>) {
    setDraft((current) => ({ ...current, ...values }));
  }

  function addTask() {
    const title = taskText.trim();
    if (!title) return;
    const task: Task = { id: createId(), title, done: false };
    patch({ tasks: [...draft.tasks, task] });
    setTaskText('');
  }

  function removeTask(id: string) {
    patch({ tasks: draft.tasks.filter((task) => task.id !== id) });
  }

  async function addAttachments(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith('image/'));
    if (!files.length) return;
    try {
      const additions = await Promise.all(files.map((file) => new Promise<Attachment>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ id: createId(), name: file.name, type: file.type, size: file.size, dataUrl: String(reader.result) });
        reader.onerror = () => reject(new Error('Could not read attachment'));
        reader.readAsDataURL(file);
      })));
      patch({ attachments: [...draft.attachments, ...additions] });
    } catch {
      setError('One of those images could not be added. Try a smaller file.');
    }
    event.target.value = '';
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSave) {
      setError('Give this project a name before saving.');
      return;
    }
    onSave({
      ...draft,
      title: draft.title.trim(),
      description: draft.description.trim(),
      liveUrl: draft.liveUrl.trim(),
      repoUrl: draft.repoUrl.trim(),
      technologies: technologyText.split(',').map((item) => item.trim()).filter(Boolean),
    });
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="modal form-modal" onSubmit={submit}>
        <div className="modal-heading">
          <div>
            <span className="eyebrow">{project ? 'Edit project' : 'New project'}</span>
            <h2>{project ? 'Refine the details.' : 'Give your next idea a home.'}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close dialog"><X size={19} /></button>
        </div>

        <div className="form-grid">
          <label className="field field-wide">
            <span>Project name <b>*</b></span>
            <input autoFocus value={draft.title} onChange={(event) => patch({ title: event.target.value })} placeholder="e.g. AstraSpec" />
          </label>
          <label className="field">
            <span>Type</span>
            <select value={draft.type} onChange={(event) => patch({ type: event.target.value as ProjectDraft['type'] })}>
              {PROJECT_TYPES.map((type) => <option key={type} value={type}>{typeLabels[type]}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Status</span>
            <select value={draft.status} onChange={(event) => patch({ status: event.target.value as ProjectDraft['status'] })}>
              {PROJECT_STATUSES.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
            </select>
          </label>
          <label className="field field-wide">
            <span>One-line description</span>
            <input value={draft.description} onChange={(event) => patch({ description: event.target.value })} placeholder="What is this project trying to do?" />
          </label>
          <label className="field">
            <span>Live URL</span>
            <input type="url" value={draft.liveUrl} onChange={(event) => patch({ liveUrl: event.target.value })} placeholder="https://" />
          </label>
          <label className="field">
            <span>GitHub URL</span>
            <input type="url" value={draft.repoUrl} onChange={(event) => patch({ repoUrl: event.target.value })} placeholder="https://github.com/" />
          </label>
          <label className="field field-wide">
            <span>Technologies <small>separate with commas</small></span>
            <input value={technologyText} onChange={(event) => setTechnologyText(event.target.value)} placeholder="React, TypeScript, Vercel" />
          </label>
        </div>

        <div className="form-section">
          <div className="section-label-row"><span className="section-label">Tasks</span><span className="muted">{draft.tasks.filter((task) => task.done).length}/{draft.tasks.length} complete</span></div>
          <div className="inline-add">
            <input value={taskText} onChange={(event) => setTaskText(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && (event.preventDefault(), addTask())} placeholder="Add a next step" />
            <button className="secondary-button" type="button" onClick={addTask}><Plus size={16} /> Add task</button>
          </div>
          {draft.tasks.length > 0 && <div className="task-editor-list">{draft.tasks.map((task) => <div className="task-editor-row" key={task.id}><input type="checkbox" checked={task.done} onChange={(event) => patch({ tasks: draft.tasks.map((item) => item.id === task.id ? { ...item, done: event.target.checked } : item) })} /><span className={task.done ? 'done-text' : ''}>{task.title}</span><button type="button" className="ghost-icon" onClick={() => removeTask(task.id)} aria-label={`Remove ${task.title}`}><X size={15} /></button></div>)}</div>}
        </div>

        <label className="field">
          <span>Notes <small>Markdown supported</small></span>
          <textarea className="notes-input" rows={6} value={draft.notes} onChange={(event) => patch({ notes: event.target.value })} placeholder="Capture decisions, links, or the next thing you want to try..." />
        </label>

        <div className="form-section">
          <div className="section-label-row"><span className="section-label">Screenshots</span><span className="muted">Stored only on this device</span></div>
          <label className="upload-zone"><ImagePlus size={20} /><span>Add image attachments</span><small>PNG, JPG, GIF, or WebP</small><input type="file" accept="image/*" multiple onChange={addAttachments} /></label>
          {draft.attachments.length > 0 && <div className="attachment-editor-grid">{draft.attachments.map((attachment) => <div className="attachment-editor" key={attachment.id}><img src={attachment.dataUrl} alt={attachment.name} /><div><strong>{attachment.name}</strong><small>{formatBytes(attachment.size)}</small></div><button type="button" className="ghost-icon" onClick={() => patch({ attachments: draft.attachments.filter((item) => item.id !== attachment.id) })} aria-label={`Remove ${attachment.name}`}><X size={15} /></button></div>)}</div>}
        </div>

        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions"><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button className="primary-button" type="submit">{project ? 'Save changes' : 'Create project'}</button></div>
      </form>
    </div>
  );
}
