'use client'

import { useState, useRef, useEffect } from 'react'

const SUGGESTED = [
  'What do I do if a soccer match is suspended mid-game?',
  'How do I regrade a single bet for a client?',
  'Walk me through the MLB postponed game void process.',
  'What steps do I take when player markets haven\'t settled?',
  'How do I handle a client reporting missing settlements?',
  'What do I do if comps are lagging or missing?',
  'How do I check why a user is hitting risk limits?',
  'What is the market release schedule for NBA games?',
]

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '4px 0' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--accent)',
          animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          display: 'block',
        }} />
      ))}
    </div>
  )
}

function Message({ msg, isLatest }) {
  const isUser = msg.role === 'user'
  return (
    <div className={isLatest ? 'fade-up' : ''} style={{
      display: 'flex',
      flexDirection: isUser ? 'row-reverse' : 'row',
      gap: 12,
      alignItems: 'flex-start',
      padding: '0 24px',
      marginBottom: 24,
    }}>
      {/* Avatar */}
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 700,
        background: isUser ? 'var(--user-bubble)' : 'var(--accent-dim)',
        border: `1px solid ${isUser ? 'var(--border-mid)' : 'rgba(0,200,190,0.3)'}`,
        color: isUser ? 'var(--text-2)' : 'var(--accent)',
        marginTop: 2,
      }}>
        {isUser ? 'YOU' : 'AI'}
      </div>

      {/* Bubble */}
      <div style={{
        maxWidth: '72%',
        background: isUser ? 'var(--user-bubble)' : 'var(--bg-panel)',
        border: `1px solid ${isUser ? 'var(--border-mid)' : 'var(--border)'}`,
        borderRadius: isUser ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
        padding: '12px 16px',
        lineHeight: 1.7,
        fontSize: 14,
        color: 'var(--text-1)',
      }}>
        {msg.role === 'assistant' && msg.content === '' ? (
          <TypingDots />
        ) : (
          <MessageContent content={msg.content} />
        )}

        {msg.sources && msg.sources.length > 0 && (
          <div style={{
            marginTop: 12,
            paddingTop: 10,
            borderTop: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Source Sections
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {msg.sources.map((s, i) => (
                <span key={i} style={{
                  fontSize: 11, fontFamily: 'var(--font-mono)',
                  background: 'var(--accent-glow)', color: 'var(--accent)',
                  border: '1px solid rgba(0,200,190,0.2)',
                  borderRadius: 4, padding: '2px 8px',
                }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function MessageContent({ content }) {
  // Basic markdown-lite rendering
  const lines = content.split('\n')
  const elements = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) { i++; continue }

    if (line.startsWith('### ')) {
      elements.push(<div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)', letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: 12, marginBottom: 4 }}>{line.slice(4)}</div>)
    } else if (line.startsWith('## ')) {
      elements.push(<div key={i} style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-1)', marginTop: 12, marginBottom: 4 }}>{line.slice(3)}</div>)
    } else if (line.match(/^\d+\. /)) {
      const text = line.replace(/^\d+\. /, '').replace(/\*\*(.*?)\*\*/g, '$1')
      const num = line.match(/^(\d+)/)?.[1]
      elements.push(
        <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 4, paddingLeft: 4 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)', minWidth: 20, marginTop: 2 }}>{num}.</span>
          <span>{renderInline(text)}</span>
        </div>
      )
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      const text = line.slice(2).replace(/\*\*(.*?)\*\*/g, '$1')
      elements.push(
        <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 4, paddingLeft: 4 }}>
          <span style={{ color: 'var(--accent)', marginTop: 2 }}>›</span>
          <span>{renderInline(text)}</span>
        </div>
      )
    } else if (line.startsWith('> ')) {
      elements.push(
        <div key={i} style={{ borderLeft: '2px solid var(--accent)', paddingLeft: 10, marginBottom: 8, color: 'var(--text-2)', fontStyle: 'italic', fontSize: 13 }}>
          {line.slice(2)}
        </div>
      )
    } else {
      elements.push(<p key={i} style={{ marginBottom: 6 }}>{renderInline(line)}</p>)
    }
    i++
  }
  return <>{elements}</>
}

function renderInline(text) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: 'var(--text-1)', fontWeight: 600 }}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, background: 'rgba(0,200,190,0.1)', color: 'var(--accent)', padding: '1px 5px', borderRadius: 3 }}>{part.slice(1, -1)}</code>
    }
    return part
  })
}

export default function ChatPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuggested, setShowSuggested] = useState(true)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(text) {
    const query = text || input.trim()
    if (!query || loading) return

    setInput('')
    setShowSuggested(false)
    setLoading(true)

    const userMsg = { role: 'user', content: query }
    const placeholderMsg = { role: 'assistant', content: '', sources: [] }
    setMessages(prev => [...prev, userMsg, placeholderMsg])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, history: messages }),
      })

      if (!res.ok) throw new Error('Request failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      let sources = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'text') {
                fullText += data.text
                setMessages(prev => {
                  const updated = [...prev]
                  updated[updated.length - 1] = { role: 'assistant', content: fullText, sources }
                  return updated
                })
              } else if (data.type === 'sources') {
                sources = data.sources
                setMessages(prev => {
                  const updated = [...prev]
                  updated[updated.length - 1] = { ...updated[updated.length - 1], sources }
                  return updated
                })
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Something went wrong. Please try again or check the manual directly.',
          sources: [],
        }
        return updated
      })
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: 'var(--bg)',
      overflow: 'hidden',
    }}>
      {/* ── Sidebar ───────────────────────────────────────────── */}
      <div style={{
        width: 260,
        flexShrink: 0,
        background: 'var(--bg-panel)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '0 0 20px',
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--accent)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: 4,
          }}>
            ◈ DST TRADING
          </div>
          <div style={{
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--text-1)',
            lineHeight: 1.3,
          }}>
            Operations<br />Assistant
          </div>
        </div>

        {/* Status */}
        <div style={{
          margin: '12px 16px',
          padding: '8px 12px',
          background: 'var(--accent-glow)',
          border: '1px solid rgba(0,200,190,0.2)',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, boxShadow: '0 0 6px var(--accent)' }} />
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>ONLINE</span>
          <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 'auto' }}>v1.0</span>
        </div>

        {/* Knowledge base */}
        <div style={{ padding: '0 16px', marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
            Knowledge Base
          </div>
          <div style={{
            padding: '8px 10px',
            background: 'var(--bg-raised)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            fontSize: 12,
            color: 'var(--text-2)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span style={{ color: 'var(--accent)', fontSize: 14 }}>📄</span>
            Traders Operational Manual
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border)', margin: '0 16px 12px' }} />

        {/* Suggested questions */}
        <div style={{ padding: '0 16px', flex: 1, overflow: 'auto' }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
            Quick Questions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {SUGGESTED.map((q, i) => (
              <button key={i} onClick={() => send(q)} style={{
                background: 'none',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '7px 10px',
                fontSize: 12,
                color: 'var(--text-2)',
                textAlign: 'left',
                cursor: 'pointer',
                lineHeight: 1.4,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--accent-dim)'
                e.currentTarget.style.color = 'var(--accent)'
                e.currentTarget.style.borderColor = 'rgba(0,200,190,0.3)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'none'
                e.currentTarget.style.color = 'var(--text-2)'
                e.currentTarget.style.borderColor = 'var(--border)'
              }}>
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 16px 0', borderTop: '1px solid var(--border)', marginTop: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5 }}>
            Always verify in live reports.<br />
            Escalate to Jason · Matt · Ari.
          </div>
        </div>
      </div>

      {/* ── Main Chat Area ──────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top bar */}
        <div style={{
          padding: '0 24px',
          height: 52,
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          background: 'var(--bg-panel)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)' }}>
              Ask anything about trading procedures
            </span>
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-3)',
            display: 'flex',
            gap: 16,
          }}>
            <span>Claude Sonnet</span>
            <span style={{ color: 'var(--border-mid)' }}>|</span>
            <span>RAG · pgvector</span>
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '28px 0 0',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {isEmpty ? (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 40px',
              textAlign: 'center',
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: 16,
                background: 'var(--accent-dim)',
                border: '1px solid rgba(0,200,190,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, marginBottom: 20,
              }}>
                ◈
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', marginBottom: 10 }}>
                Trader Operations Assistant
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-2)', maxWidth: 420, lineHeight: 1.7 }}>
                Ask any question about settlement, regrading, voiding, client issues, or trading procedures. I&apos;ll find the right answer from the manual.
              </div>
              <div style={{
                marginTop: 24, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 560,
              }}>
                {SUGGESTED.slice(0, 4).map((q, i) => (
                  <button key={i} onClick={() => send(q)} style={{
                    background: 'var(--bg-panel)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '8px 14px',
                    fontSize: 12,
                    color: 'var(--text-2)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    maxWidth: 260,
                    textAlign: 'left',
                    lineHeight: 1.4,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--accent-dim)'
                    e.currentTarget.style.color = 'var(--accent)'
                    e.currentTarget.style.borderColor = 'rgba(0,200,190,0.3)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'var(--bg-panel)'
                    e.currentTarget.style.color = 'var(--text-2)'
                    e.currentTarget.style.borderColor = 'var(--border)'
                  }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <Message key={i} msg={msg} isLatest={i === messages.length - 1 && msg.role === 'assistant'} />
              ))}
            </>
          )}
          <div ref={bottomRef} style={{ height: 20 }} />
        </div>

        {/* Input */}
        <div style={{
          padding: '16px 24px 20px',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-panel)',
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex',
            gap: 10,
            background: 'var(--bg-input)',
            border: '1px solid var(--border-mid)',
            borderRadius: 10,
            padding: '4px 4px 4px 16px',
            transition: 'border-color 0.2s',
          }}
          onFocus={() => {}}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
              placeholder="Ask about any trading procedure, settlement issue, or client problem…"
              rows={1}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                color: 'var(--text-1)',
                fontSize: 14,
                fontFamily: 'var(--font-sans)',
                resize: 'none',
                padding: '8px 0',
                lineHeight: 1.5,
                maxHeight: 120,
                overflowY: 'auto',
              }}
              onInput={e => {
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
              }}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              style={{
                width: 38, height: 38,
                borderRadius: 7,
                border: 'none',
                background: (!input.trim() || loading) ? 'var(--bg-raised)' : 'var(--accent)',
                color: (!input.trim() || loading) ? 'var(--text-3)' : '#000',
                cursor: (!input.trim() || loading) ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16,
                flexShrink: 0,
                alignSelf: 'flex-end',
                marginBottom: 2,
                transition: 'all 0.15s',
              }}
            >
              {loading ? (
                <span style={{
                  width: 14, height: 14, borderRadius: '50%',
                  border: '2px solid var(--text-3)',
                  borderTopColor: 'transparent',
                  display: 'block',
                  animation: 'spin 0.7s linear infinite',
                }} />
              ) : '↑'}
            </button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8, textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
            Enter to send · Shift+Enter for new line · Always verify critical steps in live reports
          </div>
        </div>
      </div>
    </div>
  )
}
