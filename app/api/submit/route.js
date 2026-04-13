import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const BUCKET = 'doc-images'

async function uploadScreenshot(base64DataUrl) {
  try {
    const matches = base64DataUrl.match(/^data:([^;]+);base64,(.+)$/)
    if (!matches) { console.log('Screenshot: no base64 match'); return null }
    const [, mimeType, base64Data] = matches
    const ext = mimeType.split('/')[1] || 'jpg'
    const filename = `cs-qa/${Date.now()}.${ext}`
    const buffer = Buffer.from(base64Data, 'base64')
    console.log(`Screenshot: uploading ${filename}, size=${buffer.length} bytes`)
    const { error } = await supabase.storage.from(BUCKET).upload(filename, buffer, { contentType: mimeType, upsert: false })
    if (error) { console.error('Screenshot upload error:', error.message); return null }
    const url = supabase.storage.from(BUCKET).getPublicUrl(filename).data.publicUrl
    console.log('Screenshot uploaded:', url)
    return url
  } catch (err) {
    console.error('Screenshot exception:', err.message)
    return null
  }
}

export async function POST(req) {
  try {
    console.log('Submit API called')
    const body = await req.json()
    const { question, answer, category, screenshot } = body

    console.log('question:', question?.slice(0, 50))
    console.log('answer:', answer?.slice(0, 50))
    console.log('category:', category)
    console.log('screenshot present:', !!screenshot, screenshot ? `~${Math.round(screenshot.length / 1024)}KB` : '')

    if (!question?.trim() || !answer?.trim()) {
      console.log('Missing question or answer')
      return new Response('Question and answer are required', { status: 400 })
    }

    let screenshotUrl = null
    if (screenshot) {
      screenshotUrl = await uploadScreenshot(screenshot)
    }

    const imageMarker = screenshotUrl ? `\n[IMAGE:${screenshotUrl}]\n` : ''
    const content = `## ${question.trim()}\n\n${answer.trim()}${imageMarker}\nCategory: ${category || 'General'}\nSource: CS Email Q&A`

    console.log('Embedding content, length:', content.length)

    const embeddingRes = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: content.replace(/\[IMAGE:.*?\]/g, '[image]'),
    })

    console.log('Embedding created, inserting into Supabase...')

    const { error, data } = await supabase.from('documents').insert({
      content,
      metadata: {
        section: question.trim().slice(0, 80),
        source: 'CS Email Q&A',
        category: category || 'General',
        submitted_at: new Date().toISOString(),
        has_screenshot: !!screenshotUrl,
      },
      embedding: embeddingRes.data[0].embedding,
    }).select('id')

    if (error) {
      console.error('Supabase insert error:', error.message, error.code, error.details)
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }

    console.log('Inserted successfully, id:', data?.[0]?.id)
    return new Response(JSON.stringify({ success: true, id: data?.[0]?.id }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Submit fatal error:', err.message, err.stack)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
