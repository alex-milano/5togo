# 5toGo Fullstack

Gamified daily task tracker — React + Vite + Firebase.

## Prerequisites

- Node.js 18+
- A Firebase project (see `FIREBASE_SETUP.md` for step-by-step)

## Quick Start

```bash
cd 5togo-fullstack

# 1. Install dependencies
npm install

# 2. Fill in Firebase credentials
cp .env.example .env.local
# then edit .env.local with your values

# 3. Start dev server
npm run dev
```

Open http://localhost:5173

## Stack

| Layer       | Tech                         |
|-------------|------------------------------|
| Frontend    | React 18 + Vite              |
| Routing     | React Router v6              |
| Database    | Firebase Firestore (real-time) |
| Auth        | Firebase Authentication      |
| Icons       | Lucide React                 |
| Deploy      | Vercel (see below)           |

## Project Structure

```
src/
  components/
    AdminPanel.jsx      — Admin-only user list
    KanbanColumn.jsx    — Board column with drag & drop
    Navbar.jsx          — Top nav with score display
    ProtectedRoute.jsx  — Auth guard
    Settings.jsx        — Theme picker modal
    TaskCard.jsx        — Individual task with actions
  contexts/
    AuthContext.jsx     — Firebase Auth + user role
  firebase/
    firebaseConfig.js   — Firebase initialization
  pages/
    Dashboard.jsx       — Main Kanban board
    Login.jsx           — Sign in / register
  utils/
    dateUtils.js        — Date helpers
  App.jsx               — Router setup
  index.css             — Global styles
```

## Environment Variables

Copy `.env.example` → `.env.local` and fill in your Firebase project values.
**Never commit `.env.local` to version control.**

## Admin User

To make yourself an admin, open `src/contexts/AuthContext.jsx` and set:

```js
const ADMIN_EMAIL = 'your@email.com'
```

When you register with that email, your account will be created with `role: 'admin'`.
Admin users see an **Admin** button in the nav that links to the user management panel.

## Firebase Security Rules

Copy the contents of `firestore.rules` into your Firestore rules in the Firebase Console.

## Deploy to Vercel

```bash
npm run build          # produces dist/
vercel --prod          # or connect your repo in the Vercel dashboard
```

Set the same environment variables in your Vercel project settings.

## Firestore Data Structure

```
users/{uid}
  uid, email, role, createdAt

tasks/{taskId}
  userId, text, mode, status, difficulty, tags,
  createdAt, completedAt, weekNumber, year, dateStr

userSettings/{uid}
  userId, theme, streak, lastPeakDay, createdAt, updatedAt
```

## Scoring (Worker Mode only)

| Completed today | Result        | Points |
|-----------------|---------------|--------|
| 5 / 5           | 🏆 PEAK DAY   | 100    |
| 4 / 5           | ✅ SOLID DAY  | 80     |
| 3 / 5           | 💪 GOOD EFFORT| 60     |
| < 3             | 😐 OFF DAY    | 0      |

Consecutive PEAK DAYs build a 🔥 streak, persisted in Firestore.
