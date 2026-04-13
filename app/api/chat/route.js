import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are the Trader Operations Assistant for Digital Sports Tech. You help traders quickly resolve issues by answering questions about internal procedures, settlement, regrading, voiding, client issues, and trading operations.

You are given relevant excerpts from the Traders Operational Manual as context. Answer based strictly on this context. Be clear, direct, and concise — traders need quick answers during live operations.

Guidelines:
- Give step-by-step answers for procedural questions
- Use numbered lists for sequential steps
- Bold key actions and tool names
- If a specific report or URL is mentioned in the context, include it
- If the context doesn't contain enough information to answer fully, say so clearly and advise escalating to Jason, Matt, or Ari
- Never make up procedures or tools not mentioned in the context
- If a screenshot is provided, analyze what is shown and use it alongside the manual context to give a specific, actionable answer
- IMPORTANT: If the context contains any [IMAGE:https://...] markers, reproduce them exactly as-is in your response at the relevant point in your answer. Do not alter or omit them. They will render as screenshots for the trader.`

export async function POST(req) {
  const { message, history, image } = await req.json()

  const embeddingRes = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: message || 'screenshot question',
  })

  const { data: chunks, error } = await supabase.rpc('match_documents', {
    query_embedding: embeddingRes.data[0].embedding,
    match_threshold: 0.3,
    match_count: 6,
  })

  if (error) return new Response('Database error', { status: 500 })

  const context = chunks?.length > 0
    ? chunks.map(c => c.content).join('\n\n---\n\n')
    : 'No relevant sections found in the manual.'

  const conversationHistory = (history || [])
    .map(m => ({ role: m.role, content: m.content }))
    .filter(m => m.content)

  // Build user content — text + optional pasted image
  const userContent = []

  if (image) {
    const matches = image.match(/^data:([^;]+);base64,(.+)$/)
    if (matches) {
      userContent.push({
        type: 'image',
        source: { type: 'base64', media_type: matches[1], data: matches[2] },
      })
    }
  }

  userContent.push({
    type: 'text',
    text: `RELEVANT MANUAL SECTIONS:\n${context}\n\n---\n\nQUESTION: ${message || 'What is shown in this screenshot and what should I do?'}`,
  })

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claudeStream = await anthropic.messages.stream({
          model: 'claude-sonnet-4-5',
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: [...conversationHistory, { role: 'user', content: userContent }],
        })
        for await (const event of claudeStream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(
              `data: ${JSON.stringify({ type: 'text', text: event.delta.text })}\n\n`
            ))
          }
        }
        controller.close()
      } catch (err) {
        console.error('Stream error:', err)
        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ type: 'text', text: '\n\nAn error occurred. Please try again.' })}\n\n`
        ))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
  })
}
