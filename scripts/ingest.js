/**
 * Ingestion Script — supports .txt and .html (Google Doc exports)
 * Images are uploaded to Supabase Storage and embedded inline as [IMAGE:url] markers.
 * Run: npm run ingest
 */

const { createClient } = require('@supabase/supabase-js')
const OpenAI = require('openai')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

require('dotenv').config({ path: '.env.local' })

let cheerio
try { cheerio = require('cheerio') } catch {
  console.log('Installing cheerio...'); execSync('npm install cheerio', { stdio: 'inherit' }); cheerio = require('cheerio')
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const BUCKET = 'doc-images'
const DOCS_DIR = path.join(__dirname, '..', 'docs')

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets()
  if (!buckets?.some(b => b.name === BUCKET)) {
    await supabase.storage.createBucket(BUCKET, { public: true })
    console.log('✓ Created storage bucket: doc-images')
  } else {
    console.log('✓ Storage bucket ready')
  }
}

async function uploadImage(imagePath, docName) {
  const filename = path.basename(imagePath)
  const storagePath = `${docName}/${filename}`
  const fileBuffer = fs.readFileSync(imagePath)
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, fileBuffer, { contentType: 'image/png', upsert: true })
  if (error) { console.warn(`  ⚠ ${filename}: ${error.message}`); return null }
  return supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl
}

async function parseHtmlDoc(htmlPath, docName) {
  const html = fs.readFileSync(htmlPath, 'utf-8')
  const $ = cheerio.load(html)
  const imagesDir = path.join(path.dirname(htmlPath), 'images')
  const imageMap = {}

  if (fs.existsSync(imagesDir)) {
    const imageFiles = fs.readdirSync(imagesDir).filter(f => /\.(png|jpg|jpeg|gif|webp)$/i.test(f))
    console.log(`  Uploading ${imageFiles.length} images...`)
    for (const imgFile of imageFiles) {
      const url = await uploadImage(path.join(imagesDir, imgFile), docName)
      if (url) { imageMap[imgFile] = url; process.stdout.write('.') }
    }
    console.log(' done')
  }

  $('img').each((_, el) => {
    const src = $(el).attr('src') || ''
    const filename = src.split('/').pop()
    const url = imageMap[filename]
    $(el).replaceWith(url ? `\n[IMAGE:${url}]\n` : '')
  })

  return $('body').text().replace(/\n{3,}/g, '\n\n').trim()
}

function parseTxtDoc(p) { return fs.readFileSync(p, 'utf-8') }

function chunkDocument(text, filename) {
  const chunks = []
  const sections = text.split(/\n(?=#{1,3} |[0-9]+\.[0-9]* {1,3}[A-Z])/g)

  // If only one section (no headings found), fall back to paragraph-based chunking
  const effectiveSections = sections.length <= 1
    ? text.split(/\n\n+/).reduce((acc, para) => {
        if (!acc.length) return [para]
        const last = acc[acc.length - 1]
        if ((last + '\n\n' + para).length < 1400) {
          acc[acc.length - 1] = last + '\n\n' + para
        } else {
          acc.push(para)
        }
        return acc
      }, [])
    : sections

  for (const section of effectiveSections) {
    const trimmed = section.trim()
    if (trimmed.length < 50) continue
    if (trimmed.length > 1800) {
      const paragraphs = trimmed.split(/\n\n+/)
      let cur = ''
      const title = trimmed.split('\n')[0].replace(/^#+\s*/, '').replace(/^[0-9.]+\s*/, '').trim().slice(0, 80)
      for (const para of paragraphs) {
        if ((cur + para).length > 1400 && cur.length > 200) {
          chunks.push({ content: cur.trim(), section: title, source: filename })
          cur = para
        } else { cur += (cur ? '\n\n' : '') + para }
      }
      if (cur.trim().length > 50) chunks.push({ content: cur.trim(), section: title, source: filename })
    } else {
      const title = trimmed.split('\n')[0].replace(/^#+\s*/, '').replace(/^[0-9.]+\s*/, '').trim().slice(0, 80)
      chunks.push({ content: trimmed, section: title, source: filename })
    }
  }
  return chunks
}

async function embedAndStore(chunks) {
  console.log(`\nEmbedding ${chunks.length} chunks...`)
  let stored = 0
  for (let i = 0; i < chunks.length; i += 10) {
    const batch = chunks.slice(i, i + 10)
    const embeddings = await Promise.all(batch.map(c =>
      openai.embeddings.create({ model: 'text-embedding-3-small', input: c.content.replace(/\[IMAGE:.*?\]/g, '[image]') })
    ))
    const rows = batch.map((c, idx) => ({
      content: c.content,
      metadata: { section: c.section, source: c.source },
      embedding: embeddings[idx].data[0].embedding,
    }))
    const { error } = await supabase.from('documents').insert(rows)
    if (error) console.error(`\nBatch error: ${error.message}`)
    else { stored += batch.length; process.stdout.write(`\r  Stored ${stored}/${chunks.length} chunks`) }
    await new Promise(r => setTimeout(r, 200))
  }
  console.log(`\n✓ ${stored} chunks stored`)
}


function getAllDocs(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      getAllDocs(fullPath, fileList)
    } else if (entry.name.endsWith('.html') || entry.name.endsWith('.txt')) {
      fileList.push(fullPath)
    }
  }
  return fileList
}

async function main() {
  if (!fs.existsSync(DOCS_DIR)) { console.error('❌ /docs folder not found.'); process.exit(1) }
  const files = getAllDocs(DOCS_DIR)
  if (!files.length) { console.error('❌ No .txt or .html files in /docs.'); process.exit(1) }

  console.log(`\n📄 Found ${files.length} document(s): ${files.join(', ')}`)
  await ensureBucket()
  console.log('\nClearing existing documents...')
  await supabase.from('documents').delete().neq('id', 0)
  console.log('✓ Cleared')

  const allChunks = []
  for (const filePath of files) {
    console.log(`\nParsing: ${path.relative(DOCS_DIR, filePath)}`)
    const text = filePath.endsWith('.html')
      ? await parseHtmlDoc(filePath, path.basename(filePath, '.html').toLowerCase().replace(/\s+/g, '-'))
      : parseTxtDoc(filePath)
    const chunks = chunkDocument(text, path.relative(DOCS_DIR, filePath))
    const imgCount = (text.match(/\[IMAGE:/g) || []).length
    console.log(`  ${chunks.length} chunks, ${imgCount} images embedded`)
    allChunks.push(...chunks)
  }

  console.log(`\nTotal chunks: ${allChunks.length}`)
  await embedAndStore(allChunks)
  console.log('\n✅ Ingestion complete!\n')
}

main().catch(err => { console.error('\n❌ Fatal error:', err.message); process.exit(1) })

// This line intentionally left blank — getAllDocs is injected below