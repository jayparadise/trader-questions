/**
 * Ingestion Script — loads documents from /docs folder into Supabase
 * Run once: npm run ingest
 * To add more documents later: drop a .txt file in /docs and run again
 */

const { createClient } = require('@supabase/supabase-js')
const OpenAI = require('openai')
const fs = require('fs')
const path = require('path')

require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ── Chunking ─────────────────────────────────────────────────────
function chunkDocument(text, filename) {
  const chunks = []
  // Split on section headings (lines starting with # or numbered like "1." "2.1")
  const sections = text.split(/\n(?=#{1,3} |[0-9]+\.[0-9]* {1,3}[A-Z])/g)

  for (const section of sections) {
    const trimmed = section.trim()
    if (trimmed.length < 50) continue // skip tiny fragments

    // If section is large, sub-chunk by paragraphs
    if (trimmed.length > 1800) {
      const paragraphs = trimmed.split(/\n\n+/)
      let currentChunk = ''
      let sectionTitle = trimmed.split('\n')[0].replace(/^#+\s*/, '').replace(/^[0-9.]+\s*/, '').trim()

      for (const para of paragraphs) {
        if ((currentChunk + para).length > 1400 && currentChunk.length > 200) {
          chunks.push({ content: currentChunk.trim(), section: sectionTitle, source: filename })
          currentChunk = para
        } else {
          currentChunk += (currentChunk ? '\n\n' : '') + para
        }
      }
      if (currentChunk.trim().length > 50) {
        chunks.push({ content: currentChunk.trim(), section: sectionTitle, source: filename })
      }
    } else {
      const title = trimmed.split('\n')[0].replace(/^#+\s*/, '').replace(/^[0-9.]+\s*/, '').trim()
      chunks.push({ content: trimmed, section: title, source: filename })
    }
  }

  return chunks
}

// ── Embed & Store ─────────────────────────────────────────────────
async function embedAndStore(chunks) {
  console.log(`\nEmbedding ${chunks.length} chunks...`)
  let stored = 0

  // Process in batches of 10 to avoid rate limits
  for (let i = 0; i < chunks.length; i += 10) {
    const batch = chunks.slice(i, i + 10)

    const embeddings = await Promise.all(
      batch.map(chunk =>
        openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: chunk.content,
        })
      )
    )

    const rows = batch.map((chunk, idx) => ({
      content: chunk.content,
      metadata: { section: chunk.section, source: chunk.source },
      embedding: embeddings[idx].data[0].embedding,
    }))

    const { error } = await supabase.from('documents').insert(rows)
    if (error) {
      console.error(`Error storing batch ${i}-${i + 10}:`, error.message)
    } else {
      stored += batch.length
      process.stdout.write(`\r  Stored ${stored}/${chunks.length} chunks`)
    }

    // Small delay to respect rate limits
    await new Promise(r => setTimeout(r, 200))
  }

  console.log(`\n✓ Done — ${stored} chunks stored`)
}

// ── Main ──────────────────────────────────────────────────────────
async function main() {
  const docsDir = path.join(__dirname, '..', 'docs')

  if (!fs.existsSync(docsDir)) {
    console.error('❌ /docs folder not found. Create it and add your .txt files.')
    process.exit(1)
  }

  const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.txt'))

  if (files.length === 0) {
    console.error('❌ No .txt files found in /docs folder.')
    process.exit(1)
  }

  console.log(`\n📄 Found ${files.length} document(s): ${files.join(', ')}`)

  // Optional: clear existing docs before re-ingesting (comment out to append)
  console.log('\nClearing existing documents from database...')
  await supabase.from('documents').delete().neq('id', 0)
  console.log('✓ Cleared')

  const allChunks = []

  for (const file of files) {
    const text = fs.readFileSync(path.join(docsDir, file), 'utf-8')
    const chunks = chunkDocument(text, file)
    console.log(`\n${file}: ${chunks.length} chunks`)
    allChunks.push(...chunks)
  }

  console.log(`\nTotal chunks to embed: ${allChunks.length}`)

  await embedAndStore(allChunks)

  console.log('\n✅ Ingestion complete! Your bot is ready.\n')
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message)
  process.exit(1)
})
