# Quiz Community

Buat soal pilihan ganda dari Vorlesung-mu, share ke teman, dan belajar bareng.

## Features

- 📝 Create multiple-choice questions with images (in questions AND answers)
- ✅ Support for multiple correct answers
- 📚 Organize by Module → Topic (Vorlesung/Menti/Thema)
- 👥 See what your friends contributed
- 🎯 Interactive quiz mode with scoring
- 📊 Leaderboard per module

## Tech Stack

- **Next.js 14** (React framework)
- **Supabase** (PostgreSQL, Auth, File Storage)
- **Tailwind CSS** (styling)
- **Vercel** (hosting)

---

## Setup Guide

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase (free tier)

1. Go to [supabase.com](https://supabase.com) and create an account
2. Click **New Project** — pick a name and a strong database password
3. Wait ~2 minutes for the project to spin up

### 3. Run the database schema

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **New query**
3. Copy the entire contents of `supabase/schema.sql` and paste it
4. Click **Run** — it creates all tables, security rules, and the image storage bucket

### 4. Get your API keys

1. Go to **Settings → API** in your Supabase dashboard
2. Copy:
   - **Project URL** (starts with `https://`)
   - **anon public** key (the long one under "Project API keys")

### 5. Configure environment

```bash
cp .env.example .env.local
```

Open `.env.local` and paste your URL and anon key.

### 6. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 7. Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repo
3. Add your env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in Settings → Environment Variables
4. Deploy!

### 8. Supabase Auth settings (important!)

In Supabase dashboard → **Authentication → URL Configuration**:
- Set **Site URL** to your Vercel URL (e.g. `https://quiz-community.vercel.app`)
- Add `http://localhost:3000` to **Redirect URLs** for local dev

---

## Project Structure

```
quiz-community/
├── src/
│   ├── app/                  # Pages (Next.js App Router)
│   │   ├── page.tsx          # Home / feed
│   │   ├── login/            # Login page
│   │   ├── register/         # Register page
│   │   └── modules/          # Module browsing
│   │       └── [moduleId]/   # Module detail (topics)
│   │           └── [topicId]/
│   │               ├── page.tsx    # Questions list
│   │               ├── create/     # Create question form
│   │               └── quiz/       # Interactive quiz mode
│   ├── components/           # Reusable components
│   ├── lib/                  # Supabase client setup
│   └── types/                # TypeScript types
├── supabase/
│   └── schema.sql            # Database schema (run in SQL Editor)
└── README.md
```

## Future Ideas

- 🔍 Search across modules/questions
- 📈 Personal stats (accuracy per module)
- 💬 Comments on questions
- 🏷️ Tags/labels for question difficulty
- 📱 PWA support (installable app)
- 🔔 Notifications when friends add questions
