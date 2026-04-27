
# 2718-online

2718 Online is a scouting web app for FRC team 2718 (and friends). It helps teams record and analyze data during competitions.

## Features

- Record scouting reports for individual robots during a match
- Record pit scouting
- View combined data from scouting, TBA, Statbotics, etc.
- Create pick lists

---

## Getting Started

### 1. Prerequisites

You need the following installed on your computer:

- **Node.js**
- **pnpm**
- **Git**

#### How to Install Prerequisites

**On Ubuntu/Linux:**

```sh
# Install Node.js (LTS version)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm
```

**On Windows/Mac:**
- Download and install Node.js from [nodejs.org](https://nodejs.org/)
- Install pnpm: Open a terminal and run `npm install -g pnpm`

---

### 2. Install Dependencies

In the project folder, run:

```sh
pnpm install
```

---

### 3. Set Up the Database

The app uses SQLite via Drizzle ORM. On first run, push the schema to create the database:

```sh
DATABASE_URL=file:local.db pnpm run db:push
```

If you modify the schema in `src/lib/server/db/schema.ts`, run the same command again to apply the changes. See [Database Commands](#database-commands) for more detail.

---

### 4. Start the Development Server

This will run the app locally so you can see changes as you code:

```sh
pnpm run dev
```

Open the link shown in the terminal (usually http://localhost:5173) in your web browser.

---

## Building for Production

To create a production build (for deployment):

```sh
pnpm run build
```

To preview the production build locally:

```sh
pnpm run preview
```

---

## Database Commands

The project uses [Drizzle ORM](https://orm.drizzle.team/) with SQLite. The schema lives in `src/lib/server/db/schema.ts`.

All commands need `DATABASE_URL` set, either via `.env` or as a prefix:

```sh
DATABASE_URL=file:local.db pnpm run <command>
```

| Command | When to use |
|---|---|
| `pnpm run db:push` | **Most common.** Apply schema changes directly to the local database without generating migration files. Use this during development when you change the schema and want to update `local.db` immediately. |
| `pnpm run db:generate` | Generate SQL migration files in `drizzle/` from your schema changes. Use this when you want a versioned migration record (e.g., before deploying to production or sharing schema changes with teammates). |
| `pnpm run db:migrate` | Apply the generated migration files in `drizzle/` to the database. Run this after `db:generate` to execute the migrations. |
| `pnpm run db:studio` | Open Drizzle Studio, a visual browser-based database editor, to inspect and edit data. |

### Typical workflow for schema changes

**During development (quick iteration):**
1. Edit `src/lib/server/db/schema.ts`
2. Run `DATABASE_URL=file:local.db pnpm run db:push`

**When creating a versioned migration (e.g., for production):**
1. Edit `src/lib/server/db/schema.ts`
2. Run `DATABASE_URL=file:local.db pnpm run db:generate` — creates a `.sql` file in `drizzle/`
3. Run `DATABASE_URL=file:local.db pnpm run db:migrate` — applies it to the database
4. Commit both the schema change and the generated migration file

> **Note:** `db:push` is convenient but bypasses migration history. Prefer `db:generate` + `db:migrate` for any schema change that needs to run on a shared or production database.

---

## Troubleshooting & Tips

- If you see errors about missing packages, make sure you ran `pnpm install`.
- If you get a 'command not found' error for pnpm, try closing and reopening your terminal, or check your installation.
- If you change code and don't see updates, refresh your browser or restart the dev server.

---

## Useful Commands

- `pnpm run dev` – Start the development server
- `pnpm run build` – Build the app for production
- `pnpm run preview` – Preview the production build
- `pnpm run lint` – Check code for style issues
- `pnpm run format` – Format code automatically
- `pnpm run db:push` – Apply schema changes to the local database
- `pnpm run db:generate` – Generate migration files from schema changes
- `pnpm run db:migrate` – Apply generated migration files
- `pnpm run db:studio` – Open Drizzle Studio to browse/edit the database
