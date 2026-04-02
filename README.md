# Trader Operations Assistant

An AI chatbot that answers questions about trading procedures, sourced directly from your operational manuals.

---

## Before You Start — Accounts You Need

You'll need free/existing accounts at:
- **GitHub** — github.com (stores your code)
- **Vercel** — vercel.com (hosts the live app, sign up with GitHub)
- **Supabase** — supabase.com (your existing database)
- **OpenAI** — platform.openai.com (for AI embeddings, ~$1 total to run)
- **Anthropic** — console.anthropic.com (for Claude AI responses)

---

## Step 1 — Set Up Your Database (Supabase)

You only do this once.

1. Go to your Supabase project at **supabase.com**
2. Click **SQL Editor** in the left sidebar
3. Paste and run this entire block:

```sql
-- Enable vector extension
create extension if not exists vector;

-- Create documents table
create table if not exists documents (
  id bigserial primary key,
  content text,
  metadata jsonb,
  embedding vector(1536)
);

-- Create search index
create index if not exists documents_embedding_idx
  on documents using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Create search function
create or replace function match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    id,
    content,
    metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by documents.embedding <=> query_embedding
  limit match_count;
$$;
```

4. Click **Run**. You should see "Success".

---

## Step 2 — Get Your API Keys

You need 4 keys total. Copy each one somewhere safe.

**Supabase keys** (Project Settings > API):
- `NEXT_PUBLIC_SUPABASE_URL` — looks like `https://xxxxx.supabase.co`
- `SUPABASE_SERVICE_KEY` — the `service_role` key (keep this secret)

**OpenAI key** (platform.openai.com > API Keys):
- `OPENAI_API_KEY` — starts with `sk-`
- Add a small amount of credit ($5 is plenty — ingestion costs cents)

**Anthropic key** (console.anthropic.com > API Keys):
- `ANTHROPIC_API_KEY` — starts with `sk-ant-`

---

## Step 3 — Put the App on GitHub

1. Go to **github.com** and create a new repository called `trader-bot` (set to Private)
2. Download **GitHub Desktop** from desktop.github.com and sign in
3. In GitHub Desktop: File > Clone Repository > find `trader-bot` > choose where to save it on your computer
4. Copy all the files from this folder into that cloned folder
5. In GitHub Desktop you'll see all the files listed — type "initial upload" in the Summary box at the bottom left, click **Commit to main**, then click **Push origin**

Your code is now on GitHub. ✓

---

## Step 4 — Load Your Documents into the Database

This is a one-time step that reads your manual and stores it in Supabase so the AI can search it.

1. Make sure you have **Node.js** installed — download from nodejs.org if not (just click through the installer)
2. Open **Terminal** (Mac) or **Command Prompt** (Windows)
3. Navigate to your project folder:
   ```
   cd Desktop/trader-bot
   ```
4. Copy the env example file and fill it in:
   ```
   cp .env.example .env.local
   ```
   Open `.env.local` in any text editor and paste in your 4 API keys from Step 2.

5. Install dependencies:
   ```
   npm install
   ```
6. Run the ingestion script:
   ```
   npm run ingest
   ```

You'll see it counting chunks being stored. Takes about 1-2 minutes. When it says "✅ Ingestion complete!" you're done.

**To add more documents later:** Drop a new `.txt` file into the `/docs` folder and run `npm run ingest` again. That's it.

---

## Step 5 — Deploy to Vercel

1. Go to **vercel.com** and sign in with your GitHub account
2. Click **Add New Project**
3. Find `trader-bot` in your repository list and click **Import**
4. Before clicking Deploy, scroll down to **Environment Variables**
5. Add each of your 4 keys one by one (Name + Value):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `OPENAI_API_KEY`
   - `ANTHROPIC_API_KEY`
6. Click **Deploy**

Vercel builds the app (takes ~2 minutes) and gives you a live URL like:
`https://trader-bot-yourname.vercel.app`

Share that URL with your traders. Done. ✓

---

## Updating the App

**To update documents:** Add/edit `.txt` files in `/docs`, run `npm run ingest` from your terminal.

**To update the app code:** Make changes, then in GitHub Desktop commit and push. Vercel auto-redeploys in ~2 minutes.

**To add more documents to the knowledge base:**
1. Export any Google Doc or Word doc as plain text (.txt)
2. Drop the file in the `/docs` folder
3. Run `npm run ingest`

---

## How It Works (Plain English)

1. Your manuals are split into sections and converted into numerical "fingerprints" (embeddings) stored in Supabase
2. When a trader asks a question, their question gets the same treatment
3. Supabase finds the manual sections whose fingerprints are most similar to the question
4. Those sections are handed to Claude along with the question
5. Claude reads only those relevant sections and answers based on them
6. The answer streams back to the trader in real time

The AI never makes things up — it can only answer based on what's in your documents.

---

## Troubleshooting

**"npm: command not found"** → Install Node.js from nodejs.org

**Ingestion fails with "permission denied"** → Make sure your Supabase key is the `service_role` key, not the `anon` key

**App deploys but returns errors** → Double-check all 4 environment variables are set in Vercel (Project Settings > Environment Variables)

**AI says it doesn't know something that's in the manual** → The document may not have ingested correctly. Run `npm run ingest` again.

---

## Questions

Escalate to Jason / Matt / Ari.

---

## Setting Up Google Docs Integration

This allows the bot to pull directly from your live Google Docs — no manual exporting.

### Step 1 — Create a Google Cloud Project

1. Go to **console.cloud.google.com**
2. Click **Select a project** (top left) → **New Project**
3. Name it `trader-bot` → click **Create**
4. Make sure your new project is selected in the top bar

### Step 2 — Enable the Google Drive API

1. In the left menu: **APIs & Services** → **Library**
2. Search for **Google Drive API** → click it → click **Enable**

### Step 3 — Create a Service Account

1. In the left menu: **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **Service Account**
3. Name: `trader-bot-reader` → click **Create and Continue** → click **Done**
4. Click on the service account you just created
5. Go to the **Keys** tab → **Add Key** → **Create new key** → **JSON** → **Create**
6. A `.json` file downloads to your computer — keep this safe

### Step 4 — Add the Credential to Vercel

1. Open the downloaded `.json` file in TextEdit
2. Select all (Cmd+A) and copy the entire contents
3. Go to **vercel.com** → your project → **Settings** → **Environment Variables**
4. Add a new variable:
   - Name: `GOOGLE_SERVICE_ACCOUNT_JSON`
   - Value: paste the entire JSON content
5. Click **Save**
6. Also add it to your local `.env.local` file:
   ```
   GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...paste the whole thing...}
   ```

### Step 5 — Share Your Docs with the Service Account

1. Open the `.json` file and find the `client_email` field — it looks like:
   `trader-bot-reader@trader-bot-xxxxx.iam.gserviceaccount.com`
2. Open each Google Doc you want the bot to learn from
3. Click **Share** → paste the service account email → set to **Viewer** → **Send**

### Step 6 — Add Your Doc IDs to the Config

1. Open `docs/google-docs.config.js`
2. For each doc, get the ID from the URL:
   `https://docs.google.com/document/d/THIS_IS_THE_ID/edit`
3. Add it to the config:
   ```js
   { id: 'YOUR_DOC_ID', name: 'Your Doc Name' },
   ```

### Step 7 — Deploy and Update

Push to GitHub → Vercel redeploys → click **Update Knowledge Base** in the app.

From now on, whenever a doc changes: click **Update Knowledge Base**. Done.
