# Aura Study

An AI-powered study companion that turns your lecture notes, textbook chapters, and PDFs into structured study materials — summarised notes, flashcards, quizzes, and a personalised planner — in a single upload.

**Live demo:** [https://aura-study-gray.vercel.app/](https://aura-study-gray.vercel.app/)

---

## About

Aura Study was built around three problems most students will recognise: reading material doesn't stick the first time, revision is rarely structured, and there's never enough time before an exam. The app addresses all three. You upload a document, the AI processes it end-to-end, and you get back everything you need to actually learn from it — saved to your account so you can come back to it later.

## Features

- **Smart Uploads** — Upload a PDF, DOCX, or TXT file. The AI extracts the content, identifies the subject, and generates notes, flashcards, a quiz, and study tasks in a single pass.
- **AI Tutor** — A streaming chat tutor powered by GPT-4 that can optionally read from your most recent uploads, so its answers are grounded in your own materials rather than generic explanations.
- **Flashcards** — Auto-generated decks with question, answer, and an optional explanation field for tricky concepts.
- **Quizzes** — Multiple-choice questions auto-generated from your material, with instant feedback.
- **Planner** — A daily study schedule built from the topics in your uploads, with time estimates per task.
- **Insights** — Track your study streak, topic coverage, and progress over time.
- **Authentication** — Email/password sign-in via Supabase Auth, with row-level security on every table so users only ever see their own data.

## Tech Stack

| Layer    | Technology |
|----------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Backend  | Supabase — Postgres, Auth, Storage, Edge Functions (Deno) |
| AI       | OpenAI API — GPT-4o for vision, GPT-4o-mini for text generation |
| Hosting  | Vercel (frontend) + Supabase (backend) |

## Getting Started

### Prerequisites

- Node.js 18 or higher
- A Supabase project (the free tier is sufficient)
- An OpenAI API key — get one from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

### 1. Install dependencies

```bash
git clone <your-repo-url>
cd aura-study-main
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and replace the placeholders with your real values:

```bash
cp .env.example .env
```

Then edit `.env`:

```
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_PROJECT_ID="your-project-ref"
OPENAI_API_KEY="sk-proj-your-real-key-here"
```

### 3. Set up Supabase

Run the SQL migrations in `supabase/migrations/` against your project (via the Supabase CLI, or by pasting them into the dashboard SQL editor in order).

Then set your OpenAI key as an Edge Function secret so the backend can use it:

```bash
supabase secrets set OPENAI_API_KEY=sk-proj-... --project-ref your-project-ref
```

Or via the dashboard: **Project Settings → Edge Functions → Manage secrets**.

Deploy the two edge functions:

```bash
supabase functions deploy ai-tutor
supabase functions deploy process-upload
```

### 4. Run locally

```bash
npm run dev
```

The app will be available at `http://localhost:8080`.

## Project Structure

```
src/
├── components/      Reusable UI and shadcn primitives
├── contexts/        Auth context
├── hooks/           Custom React hooks
├── integrations/    Supabase client and generated types
├── lib/             Utilities (PDF export, chat streaming)
└── pages/           Routes — Tutor, Notes, Flashcards, Quizzes,
                     Planner, Uploads, Insights, Settings, Auth

supabase/
├── functions/       Edge functions (ai-tutor, process-upload)
└── migrations/      SQL schema (tables, RLS policies, triggers)
```

## How It Works

When a file is uploaded, the frontend writes it to a private Supabase Storage bucket and inserts a row into the `uploads` table with status `pending`. It then invokes the `process-upload` Edge Function, which:

1. Downloads the file from Storage.
2. Extracts the text — either directly (TXT/DOCX) or via the OpenAI vision API for PDFs.
3. Sends the text to GPT-4o-mini with a structured tool-call schema asking for a subject, summary, notes, flashcards, quiz, and planner tasks.
4. Writes the generated materials into the `notes`, `flashcard_decks`, `generated_quizzes`, and `planner_tasks` tables, all keyed to the user's ID.
5. Updates the upload status to `processed`.

The AI Tutor uses a separate `ai-tutor` Edge Function that streams responses from GPT-4o-mini back to the client over Server-Sent Events. When "context awareness" is enabled, it also pulls the user's five most recent notes into the system prompt so the tutor can reference what they're actually studying.

Row-level security policies on every table mean users can only ever read or modify their own rows, even though the frontend talks directly to the Postgres database.

## Author

**Zain Ahmed**
Final Year Project — *Aura Study*
