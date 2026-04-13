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
- IMPORTANT: If the context contains any [IMAGE:https://...] markers, reproduce them exactly as-is in your response at the relevant point in your answer. Do not alter or omit them. They will render as screenshots for the trader.`

export async function POST(req) {
  const { message, history } = await req.json()

  // 1. Embed the user's query
  const embeddingRes = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: message,
  })
  const queryEmbedding = embeddingRes.data[0].embedding

  // 2. Find relevant chunks from Supabase
  const { data: chunks, error } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_threshold: 0.3,
    match_count: 6,
  })

  if (error) {
    console.error('Supabase error:', error)
    return new Response('Database error', { status: 500 })
  }

  // 3. Build context from chunks
  const context = chunks?.length > 0
    ? chunks.map(c => c.content).join('\n\n---\n\n')
    : 'No relevant sections found in the manual.'

  // 4. Build conversation history for Claude
  const conversationHistory = (history || []).map(m => ({
    role: m.role,
    content: m.content,
  })).filter(m => m.content)

  // 5. Stream response from Claude
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claudeStream = await anthropic.messages.stream({
          model: 'claude-sonnet-4-5',
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: [
            ...conversationHistory,
            {
              role: 'user',
              content: `RELEVANT MANUAL SECTIONS:\n${context}\n\n---\n\nQUESTION: ${message}`,
            },
          ],
        })

        for await (const event of claudeStream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            const textEvent = `data: ${JSON.stringify({ type: 'text', text: event.delta.text })}\n\n`
            controller.enqueue(encoder.encode(textEvent))
          }
        }

        controller.close()
      } catch (err) {
        console.error('Stream error:', err)
        const errorEvent = `data: ${JSON.stringify({ type: 'text', text: '\n\nAn error occurred. Please try again.' })}\n\n`
        controller.enqueue(encoder.encode(errorEvent))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
