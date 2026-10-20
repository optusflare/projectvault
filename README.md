# ProjectVault

A local-first home for everything you build. ProjectVault is a responsive Progressive Web App for tracking websites, apps, games, tools, experiments, and unfinished ideas.

## What is included

- Dashboard with project and task stats
- Project create/edit/detail flow
- Idea, planning, active, paused, completed, and abandoned statuses
- Search and filters
- Tasks and progress tracking
- Markdown notes
- Locally stored image attachments
- IndexedDB persistence through Dexie
- JSON import and export backups
- Light and dark themes
- Installable offline PWA

The first version has no login, backend, cloud database, or account requirement. Data stays in the browser on the device where it was created. Export a JSON backup before clearing browser storage or changing devices.

## Folder structure

```text
projectvault/
├── public/
│   ├── favicon.svg
│   ├── icon.svg
│   ├── manifest.webmanifest
│   └── manus-routes.json
├── src/
│   ├── components/
│   │   ├── MarkdownPreview.tsx
│   │   └── ProjectForm.tsx
│   ├── App.tsx
│   ├── db.ts
│   ├── main.tsx
│   ├── styles.css
│   ├── types.ts
│   └── utils.ts
├── app.config.ts
├── index.html
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── TODO.md
```

## Run locally

Install Node.js, then from the repository root run:

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

To check and build a production bundle:

```bash
pnpm check
pnpm build
```

The deployable files are written to `dist/`.

## Deploy to Vercel

1. Create a GitHub repository named `projectvault`.
2. Push this folder to the repository.
3. In the same Vercel account as AstraSpec, choose **Add New → Project**.
4. Import the `projectvault` GitHub repository.
5. Vercel should detect Vite automatically.
6. Use `pnpm build` as the build command if Vercel does not fill it in.
7. Use `dist` as the output directory.
8. Deploy.

Vercel will give the app a URL such as `projectvault.vercel.app` or another available name.

## Data and privacy

ProjectVault uses IndexedDB, not a cloud database. IndexedDB is browser-local storage and is not encryption. Do not store passwords, API keys, recovery codes, or other secrets in the first version. The JSON export contains your project data and attachments, so treat backup files as private.

## Later ideas

Authentication, optional encrypted synchronization, GitHub repository import, public portfolio pages, and Tauri/Capacitor packaging can be added later without changing the local-first foundation.
