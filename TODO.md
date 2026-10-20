# ProjectVault implementation checklist

## Browser-local ProjectVault workspace
- [ ] A user can create, edit, and delete projects with a project type, title, description, status, live URL, GitHub URL, technologies, notes, tasks, and locally stored image attachments.
- [ ] The status workflow supports idea, planning, active, paused, completed, and abandoned projects.
- [ ] The dashboard shows total projects, active work, completed work, tasks remaining, and recent project activity.
- [ ] The projects view supports search, status filtering, type filtering, and project cards that open a detailed view.
- [ ] Project details present overview information, links, progress, tasks, Markdown notes, and attachments in an organized layout.

## Local persistence and portability
- [ ] Project data persists in browser-local IndexedDB without requiring an account, backend, or cloud database.
- [ ] Users can export all project data to JSON, import a JSON backup, and clear local data only after confirmation.
- [ ] The app clearly communicates that data is stored locally and that exports are the user’s responsibility.

## Installable offline PWA
- [ ] The app includes a web app manifest, app icons, service-worker caching, responsive desktop/mobile layouts, and dark/light themes.
- [ ] Supported browsers show an obvious install action, while unsupported browsers receive a useful installation explanation.
- [ ] `/manus-routes.json` is served as valid route metadata and the app is ready for GitHub-to-Vercel deployment.
