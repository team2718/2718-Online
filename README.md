
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

### 3. Start the Development Server

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
