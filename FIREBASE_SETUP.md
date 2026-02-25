# Firebase Setup — Step by Step

Follow these steps to create your Firebase project and connect it to 5toGo.

---

## 1. Create a Firebase Project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project**
3. Name it `5togo` (or anything you like)
4. Disable Google Analytics (optional for this app)
5. Click **Create project**

---

## 2. Enable Email/Password Authentication

1. In the Firebase Console, go to **Authentication** (left sidebar)
2. Click **Get started**
3. Under **Sign-in method**, click **Email/Password**
4. Toggle **Enable** to ON
5. Click **Save**

---

## 3. Create Firestore Database

1. In the Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode** (we'll add rules next)
4. Select a region close to you (e.g. `us-central1`)
5. Click **Enable**

---

## 4. Apply Security Rules

1. In Firestore, click the **Rules** tab
2. Delete the default content
3. Paste the contents of `firestore.rules` from this project
4. Click **Publish**

---

## 5. Register a Web App

1. In Project Overview, click the **</>** (Web) icon
2. Register the app with the nickname `5togo-web`
3. **Do not** enable Firebase Hosting (we use Vercel)
4. Copy the `firebaseConfig` object shown — you'll need these values

---

## 6. Fill in .env.local

Open `.env.local` in this project and paste the values from the config:

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc...
```

---

## 7. Set Your Admin Email (Optional)

Open `src/contexts/AuthContext.jsx` and change:

```js
const ADMIN_EMAIL = 'YOUR_EMAIL@example.com'
```

Replace with your own email. The first time you register with that address,
your account will be created with `role: 'admin'`.

---

## 8. Run the App

```bash
npm install
npm run dev
```

Open http://localhost:5173, register an account, and you're ready to go.

---

## 9. Deploy to Vercel

1. Push this project to a GitHub repo
2. Go to [https://vercel.com](https://vercel.com) and import the repo
3. Under **Environment Variables**, add all 6 `VITE_FIREBASE_*` variables
4. Click **Deploy**

Vercel auto-detects Vite. No extra configuration needed.

---

## Troubleshooting

**"Missing or insufficient permissions"**
→ Your Firestore security rules haven't been published yet. Repeat step 4.

**"Firebase App named '[DEFAULT]' already exists"**
→ Hot-reload issue. Restart the dev server with `npm run dev`.

**Tasks not showing after login**
→ Check that your `.env.local` variables are correct and restart the dev server.
Environment variable changes require a server restart.

**The Admin Panel shows an error**
→ Make sure you published the security rules (step 4). The rules allow any
authenticated user to read the `users` collection.
