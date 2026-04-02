const { createClient } = require('@supabase/supabase-js')
const OpenAI = require('openai')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

require('dotenv').config({ path: '.env.local' })

let cheerio
try { cheerio = require('cheerio') } catch {
  execSync('npm install cheerio', { stdio: 'inherit' }); cheerio = require('cheerio')
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const BUCKET = 'doc-images'
const DOCS_DIR = path.join(__dirname, '..', 'docs')

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets()
  if (!buckets?.some(b => b.name === BUCKET)) {
    await supabase.storage.createBucket(BUCKET, { public: true })
  }
}

async function uploadImage(imagePath, docName) {
  const filename = path.basename(imagePath)
  const storagePath = `${docName}/${filename}`
  const fileBuffer = fs.readFileSync(imagePath)
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, fileBuffer, { contentType: 'image/png', upsert: true })
  if (error) return null
  return supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl
}

async function parseHtmlDoc(htmlPath, docName) {
  const html = fs.readFileSync(htmlPath, 'utf-8')
  const $ = cheerio.load(html)

  // Upload images first
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

  // Replace img tags with [IMAGE:url] markers
  $('img').each((_, el) => {
    const src = $(el).attr('src') || ''
    const filename = src.split('/').pop()
    const url = imageMap[filename]
    $(el).replaceWith(url ? `[IMAGE:${url}]` : '')
  })

  // Extract structured text using HTML tags — preserves headings and paragraphs
  const lines = []
  $('h1, h2, h3, h4, p, li, td, img').each((_, el) => {
    const tag = el.tagName || el.name
    const text = $(el).text().trim()
    if (!text && !$(el).html()?.includes('[IMAGE:')) return
    if (['h1','h2','h3','h4'].includes(tag)) {
      lines.push(`\n\n## ${text}\n`)
    } else if (tag === 'li') {
      lines.push(`- ${text}`)
    } else {
      // Check for IMAGE markers in this element's html
      const inner = $(el).html() || ''
      if (inner.includes('[IMAGE:')) {
        const match = inner.match(/\[IMAGE:(https?:\/\/[^\]]+)\]/)
        if (match) lines.push(`\n[IMAGE:${match[1]}]\n`)
      } else if (text) {
        lines.push(text)
      }
    }
  })

  return lines.join('\n').replace(/\n{4,}/g, '\n\n\n').trim()
}

function parseTxtDoc(p) { return fs.readFileSync(p, 'utf-8') }

function chunkDocument(text, filename) {
  const chunks = []
  // Split on ## headings or large paragraph breaks
  const sections = text.split(/\n(?=## )/g)

  for (const section of sections) {
    const trimmed = section.trim()
    if (trimmed.length < 30) continue

    const title = trimmed.startsWith('## ')
      ? trimmed.split('\n')[0].replace('## ', '').trim().slice(0, 80)
      : (trimmed.split('\n')[0] || filename).slice(0, 80)

    if (trimmed.length <= 1400) {
      chunks.push({ content: trimmed, section: title, source: filename })
    } else {
      // Split large sections by paragraph
      const paragraphs = trimmed.split(/\n\n+/)
      let cur = ''
      for (const para of paragraphs) {
        if (!para.trim()) continue
        if ((cur + '\n\n' + para).length > 1200 && cur.length > 100) {
          chunks.push({ content: cur.trim(), section: title, source: filename })
          cur = para
        } else {
          cur += (cur ? '\n\n' : '') + para
        }
      }
      if (cur.trim().length > 30) chunks.push({ content: cur.trim(), section: title, source: filename })
    }
  }
  return chunks
}

async function embedAndStore(chunks) {
  let stored = 0
  for (let i = 0; i < chunks.length; i += 10) {
    const batch = chunks.slice(i, i + 10)
    const embeddings = await Promise.all(batch.map(c =>
      openai.embeddings.create({ model: 'text-embedding-3-small', input: c.content.replace(/\[IMAGE:.*?\]/g, '[image]') })
    ))
    const rows = batch.map((c, idx) => ({ content: c.content, metadata: { section: c.section, source: c.source }, embedding: embeddings[idx].data[0].embedding }))
    const { error } = await supabase.from('documents').insert(rows)
    if (!error) { stored += batch.length; process.stdout.write(`\r  Stored ${stored}/${chunks.length} chunks`) }
    await new Promise(r => setTimeout(r, 200))
  }
  console.log(`\n✓ ${stored} chunks stored`)
}

function getAllDocs(dir, fileList = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) getAllDocs(full, fileList)
    else if (entry.name.endsWith('.html') || entry.name.endsWith('.txt')) fileList.push(full)
  }
  return fileList
}

async function main() {
  const files = getAllDocs(DOCS_DIR)
  console.log(`\n📄 Found ${files.length} document(s)`)
  await ensureBucket()
  console.log('\nClearing existing documents...')
  await supabase.from('documents').delete().neq('id', 0)
  console.log('✓ Cleared')
  const allChunks = []
  for (const filePath of files) {
    const rel = path.relative(DOCS_DIR, filePath)
    console.log(`\nParsing: ${rel}`)
    const text = filePath.endsWith('.html')
      ? await parseHtmlDoc(filePath, path.basename(path.dirname(filePath)))
      : parseTxtDoc(filePath)
    const chunks = chunkDocument(text, rel)
    const imgCount = (text.match(/\[IMAGE:/g) || []).length
    console.log(`  ${chunks.length} chunks, ${imgCount} images embedded`)
    allChunks.push(...chunks)
  }
  console.log(`\nTotal chunks: ${allChunks.length}`)
  await embedAndStore(allChunks)
  console.log('\n✅ Ingestion complete!\n')
}

main().catch(err => { console.error('\n❌ Fatal error:', err.message); process.exit(1) })
