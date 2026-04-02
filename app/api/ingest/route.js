import { runIngestion } from '../../../lib/google-ingest'

export const maxDuration = 300 // 5 min timeout for Vercel

export async function POST() {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      function send(message) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ message })}\n\n`)
        )
      }

      try {
        await runIngestion(send)
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
        )
      } catch (err) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`)
        )
      } finally {
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
