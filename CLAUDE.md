# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pink Gossip backend — a Node.js/Express server that serves as the backend for the **Flutter mobile app** (`../pinkgossip`, MVVM architecture). It also includes an admin panel and a public web frontend. Uses MySQL and EJS for server-side rendering.

## Commands

```bash
# Start the server (port 8000)
node app.js

# Start with auto-reload (dev)
npx nodemon app.js

# Install dependencies
npm install
```

No test suite is configured.

## Architecture

Three modules, each following MVC pattern with their own `controller/`, `model/`, and `routes/Routes.js`:

- **`api/`** — REST API consumed by the Flutter mobile app (auth, users, salons, posts, cron jobs)
- **`admin/`** — Admin dashboard (session-based auth, user/salon/post management, EJS views with Tailwind CSS)
- **`web/`** — Public-facing web app (salon discovery, profiles, QR codes, Firebase auth)

### Routing (app.js)

- `/api` and `/thirdparty` → `api/routes/Routes.js`
- `/admin` → `admin/routes/Routes.js`
- `/` and `/web` → `web/routes/Routes.js`

### Shared utilities

- `common/encrypt.js` — AES-256-CBC encryption/decryption for passwords and data
- `common/file_upload.js` — Multer config, uploads go to `public/upload/`
- `configuration/emailConfiguration.js` — AWS SES via Nodemailer

### Key infrastructure

- **Database**: MySQL via `express-myconnection` (connection pool), configured in `config.js`
- **Sessions**: `express-session` for admin auth
- **Firebase**: Push notifications and web auth (`web/controller/firebase.js`)

### Config files (gitignored)

`config.js`, `app.js`, `serviceAccountKey.json`, and Firebase service account are in `.gitignore` — they contain environment-specific or sensitive settings.

## Git Guidelines

- Ne commit pas avant que je te le demande
- Format : `LIN-XX - Status : Name` (ex: `LIN-15 - Completed : Extension structure finalized`)
- Description : informations pertinentes
- Conventional Commits, en anglais
- Ne jamais mentionner Claude dans les commits
