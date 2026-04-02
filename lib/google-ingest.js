/**
 * Google Docs Ingestion Library
 * Fetches docs via Google Drive API, extracts text + images,
 * uploads images to Supabase Storage, stores chunks with embeddings.
 */

const { createClient } = require('@supabase/supabase-js')
const OpenAI = require('openai')
const { google } = require('googleapis')
const path = require('path')

const BUCKET = 'doc-images'

function getClients() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return { supabase, openai }
}

function getGoogleAuth() {
  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!credentialsJson) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON environment variable is not set. See README for setup instructions.')
  }
  const credentials = JSON.parse(credentialsJson)
  return new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/drive.readonly',
    ],
  })
}

// ── Fetch Google Doc as HTML ──────────────────────────────────────
async function fetchDocAsHtml(docId, auth) {
  const drive = google.drive({ version: 'v3', auth })
  const res = await drive.files.export(
    { fileId: docId, mimeType: 'text/html' },
    { responseType: 'text' }
  )
  return res.data
}

// ── Download and upload image to Supabase ─────────────────────────
async function uploadImageFromUrl(imageUrl, docName, imageName, auth, supabase) {
  try {
    // Get auth token for downloading Google-hosted images
    const client = await auth.getClient()
    const token = await client.getAccessToken()

    const response = await fetch(imageUrl, {
      headers: { Authorization: `Bearer ${token.token}` }
    })

    if (!response.ok) return null

    const buffer = Buffer.from(await response.arrayBuffer())
    const storagePath = `${docName}/${imageName}`

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: 'image/png', upsert: true })

    if (error) return null

    return supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl
  } catch {
    return null
  }
}

// ── Parse HTML → text with embedded image URLs ────────────────────
async function parseHtml(html, docName, auth, supabase, onProgress) {
  // Dynamic import of cheerio (works in both CJS and the Next.js edge)
  let cheerio
  try { cheerio = require('cheerio') } catch {
    throw new Error('cheerio not installed — run: npm install cheerio')
  }

  const $ = cheerio.load(html)
  const images = $('img').toArray()

  if (images.length > 0) {
    onProgress?.(`  Uploading ${images.length} images...`)
    let uploaded = 0
    for (const el of images) {
      const src = $(el).attr('src') || ''
      if (!src.startsWith('http')) { $(el).replaceWith(''); continue }
      const imgName = `image_${uploaded + 1}.png`
      const url = await uploadImageFromUrl(src, docName, imgName, auth, supabase)
      $(el).replaceWith(url ? `\n[IMAGE:${url}]\n` : '')
      uploaded++
    }
    onProgress?.(`  ✓ ${uploaded} images uploaded`)
  }

  return $('body').text().replace(/\n{3,}/g, '\n\n').trim()
}

// ── Chunk text into searchable pieces ────────────────────────────
function chunkDocument(text, docName) {
  const chunks = []
  const sections = text.split(/\n(?=#{1,3} |[0-9]+\.[0-9]* {1,3}[A-Z])/g)

  for (const section of sections) {
    const trimmed = section.trim()
    if (trimmed.length < 50) continue

    const title = trimmed.split('\n')[0]
      .replace(/^#+\s*/, '')
      .replace(/^[0-9.]+\s*/, '')
      .trim()
      .slice(0, 80)

    if (trimmed.length > 1800) {
      const paragraphs = trimmed.split(/\n\n+/)
      let cur = ''
      for (const para of paragraphs) {
        if ((cur + para).length > 1400 && cur.length > 200) {
          chunks.push({ content: cur.trim(), section: title, source: docName })
          cur = para
        } else {
          cur += (cur ? '\n\n' : '') + para
        }
      }
      if (cur.trim().length > 50) chunks.push({ content: cur.trim(), section: title, source: docName })
    } else {
      chunks.push({ content: trimmed, section: title, source: docName })
    }
  }
  return chunks
}

// ── Embed and store chunks ────────────────────────────────────────
async function embedAndStore(chunks, supabase, openai, onProgress) {
  let stored = 0
  for (let i = 0; i < chunks.length; i += 10) {
    const batch = chunks.slice(i, i + 10)
    const embeddings = await Promise.all(
      batch.map(c => openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: c.content.replace(/\[IMAGE:.*?\]/g, '[image]'),
      }))
    )
    const rows = batch.map((c, idx) => ({
      content: c.content,
      metadata: { section: c.section, source: c.source },
      embedding: embeddings[idx].data[0].embedding,
    }))
    const { error } = await supabase.from('documents').insert(rows)
    if (!error) {
      stored += batch.length
      onProgress?.(`  Stored ${stored}/${chunks.length} chunks...`)
    }
    await new Promise(r => setTimeout(r, 200))
  }
  return stored
}

// ── Ensure storage bucket ─────────────────────────────────────────
async function ensureBucket(supabase) {
  const { data: buckets } = await supabase.storage.listBuckets()
  if (!buckets?.some(b => b.name === BUCKET)) {
    await supabase.storage.createBucket(BUCKET, { public: true })
  }
}

// ── Main export: run full ingestion ──────────────────────────────
async function runIngestion(onProgress) {
  const { supabase, openai } = getClients()
  const auth = getGoogleAuth()

  // Load config — works in both CLI and API route contexts
  const configPath = path.join(process.cwd(), 'docs', 'google-docs.config.js')
  const docs = require(configPath)

  onProgress?.(`Found ${docs.length} document(s) to ingest`)
  await ensureBucket(supabase)

  onProgress?.('Clearing existing knowledge base...')
  await supabase.from('documents').delete().neq('id', 0)
  onProgress?.('✓ Cleared')

  const allChunks = []

  for (const doc of docs) {
    onProgress?.(`\nFetching: ${doc.name}`)
    try {
      const html = await fetchDocAsHtml(doc.id, auth)
      const docSlug = doc.name.toLowerCase().replace(/\s+/g, '-')
      const text = await parseHtml(html, docSlug, auth, supabase, onProgress)
      const chunks = chunkDocument(text, doc.name)
      const imgCount = (text.match(/\[IMAGE:/g) || []).length
      onProgress?.(`  ✓ ${chunks.length} chunks, ${imgCount} images`)
      allChunks.push(...chunks)
    } catch (err) {
      onProgress?.(`  ✗ Failed: ${err.message}`)
    }
  }

  onProgress?.(`\nEmbedding ${allChunks.length} total chunks...`)
  const stored = await embedAndStore(allChunks, supabase, openai, onProgress)
  onProgress?.(`✅ Done — ${stored} chunks stored across ${docs.length} documents`)

  return { stored, docs: docs.length }
}

module.exports = { runIngestion }
