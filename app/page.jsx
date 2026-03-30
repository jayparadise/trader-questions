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
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '6px 2px' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 7, height: 7, borderRadius: '50%',
          background: 'var(--teal)',
          display: 'block',
          animation: `pulse 1.2s ease-in-out ${i * 0.18}s infinite`,
        }} />
      ))}
    </div>
  )
}

function renderInline(text) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: 'var(--navy)', fontWeight: 700 }}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} style={{
        fontFamily: 'var(--font-mono)', fontSize: 12,
        background: 'var(--teal-mid)', color: 'var(--teal)',
        padding: '1px 6px', borderRadius: 4,
      }}>{part.slice(1, -1)}</code>
    }
    return part
  })
}

function MessageContent({ content }) {
  const lines = content.split('\n')
  const elements = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) { i++; continue }
    if (line.startsWith('### ')) {
      elements.push(
        <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--teal)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 16, marginBottom: 6, fontWeight: 500 }}>
          {line.slice(4)}
        </div>
      )
    } else if (line.startsWith('## ')) {
      elements.push(
        <div key={i} style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginTop: 16, marginBottom: 6 }}>
          {line.slice(3)}
        </div>
      )
    } else if (line.match(/^\d+\. /)) {
      const num = line.match(/^(\d+)/)?.[1]
      const text = line.replace(/^\d+\. /, '')
      elements.push(
        <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 6, alignItems: 'flex-start' }}>
          <span style={{
            minWidth: 22, height: 22, borderRadius: '50%',
            background: 'var(--teal)', color: '#fff',
            fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginTop: 1, flexShrink: 0,
          }}>{num}</span>
          <span style={{ paddingTop: 2 }}>{renderInline(text)}</span>
        </div>
      )
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      elements.push(
        <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 5, alignItems: 'flex-start' }}>
          <span style={{ color: 'var(--teal)', fontSize: 16, lineHeight: 1.4, flexShrink: 0, marginTop: 1 }}>›</span>
          <span>{renderInline(line.slice(2))}</span>
        </div>
      )
    } else if (line.startsWith('> ')) {
      elements.push(
        <div key={i} style={{
          borderLeft: '3px solid var(--teal)', paddingLeft: 12,
          marginBottom: 8, color: 'var(--text-2)', fontStyle: 'italic', fontSize: 13,
          background: 'var(--teal-light)', padding: '8px 12px',
          borderRadius: '0 6px 6px 0',
        }}>
          {line.slice(2)}
        </div>
      )
    } else {
      elements.push(<p key={i} style={{ marginBottom: 6, color: 'var(--text-1)' }}>{renderInline(line)}</p>)
    }
    i++
  }
  return <>{elements}</>
}

function Message({ msg, isLatest }) {
  const isUser = msg.role === 'user'
  return (
    <div className={isLatest ? 'fade-up' : ''} style={{
      display: 'flex',
      flexDirection: isUser ? 'row-reverse' : 'row',
      gap: 12,
      alignItems: 'flex-start',
      padding: '0 28px',
      marginBottom: 20,
    }}>
      {/* Avatar */}
      <div style={{
        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600,
        background: isUser ? 'var(--navy)' : 'var(--teal)',
        color: '#fff',
        boxShadow: isUser ? '0 2px 8px rgba(27,42,74,0.25)' : '0 2px 8px rgba(14,124,134,0.25)',
        marginTop: 2, letterSpacing: '0.03em',
      }}>
        {isUser ? 'YOU' : 'AI'}
      </div>

      {/* Bubble */}
      <div style={{
        maxWidth: '74%',
        background: isUser ? 'var(--navy)' : 'var(--bg-white)',
        border: `1px solid ${isUser ? 'transparent' : 'var(--border)'}`,
        borderRadius: isUser ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
        padding: '13px 17px',
        lineHeight: 1.7,
        fontSize: 14,
        color: isUser ? '#fff' : 'var(--text-1)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        {msg.role === 'assistant' && msg.content === '' ? (
          <TypingDots />
        ) : (
          <MessageContent content={msg.content} />
        )}

        {msg.sources && msg.sources.length > 0 && (
          <div style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', marginBottom: 7, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Source Sections
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {msg.sources.map((s, i) => (
                <span key={i} style={{
                  fontSize: 11, fontFamily: 'var(--font-mono)',
                  background: 'var(--teal-light)', color: 'var(--teal)',
                  border: '1px solid rgba(14,124,134,0.2)',
                  borderRadius: 5, padding: '2px 8px',
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

export default function ChatPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(text) {
    const query = text || input.trim()
    if (!query || loading) return
    setInput('')
    setLoading(true)
    const userMsg = { role: 'user', content: query }
    const placeholder = { role: 'assistant', content: '', sources: [] }
    setMessages(prev => [...prev, userMsg, placeholder])

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
        for (const line of chunk.split('\n')) {
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
              }
            } catch {}
          }
        }
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: 'Something went wrong. Please try again.', sources: [] }
        return updated
      })
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const isEmpty = messages.length === 0

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <div style={{
        width: 272,
        flexShrink: 0,
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '2px 0 12px rgba(0,0,0,0.04)',
      }}>
        {/* Brand header */}
        <div style={{
          padding: '22px 20px 18px',
          background: 'var(--navy)',
        }}>
          <div style={{
            fontSize: 10, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.5)',
            letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6,
          }}>
            Digital Sports Tech
          </div>
          <div style={{
            fontSize: 19,
            fontWeight: 700,
            color: '#fff',
            lineHeight: 1.3,
            fontFamily: 'var(--font-body)',
          }}>
            Trading Operations<br />
            <span style={{ color: 'rgba(14,200,190,0.9)', fontWeight: 400, fontSize: 16 }}>Assistant</span>
          </div>
        </div>

        {/* Status pill */}
        <div style={{ padding: '12px 16px 0' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px',
            background: '#F0FAF0',
            border: '1px solid #B8E6B8',
            borderRadius: 8,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2ECC71', flexShrink: 0, boxShadow: '0 0 0 2px rgba(46,204,113,0.2)' }} />
            <span style={{ fontSize: 12, color: '#1A6B3A', fontWeight: 600 }}>Online & Ready</span>
            <span style={{ fontSize: 11, color: '#888', marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>v1.0</span>
          </div>
        </div>

        {/* Knowledge base */}
        <div style={{ padding: '14px 16px 0' }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
            Knowledge Base
          </div>
          <div style={{
            padding: '10px 12px',
            background: 'var(--teal-light)',
            border: '1px solid rgba(14,124,134,0.2)',
            borderRadius: 8,
            fontSize: 13,
            color: 'var(--teal)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontWeight: 500,
          }}>
            <span style={{ fontSize: 15 }}>📋</span>
            Traders Operational Manual
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--border)', margin: '14px 16px' }} />

        {/* Quick questions */}
        <div style={{ padding: '0 16px', flex: 1, overflowY: 'auto' }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            Common Questions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {SUGGESTED.map((q, i) => (
              <button key={i} onClick={() => send(q)} style={{
                background: 'none',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '8px 11px',
                fontSize: 12.5,
                color: 'var(--text-2)',
                textAlign: 'left',
                cursor: 'pointer',
                lineHeight: 1.45,
                transition: 'all 0.15s',
                fontFamily: 'var(--font-body)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--teal-light)'
                e.currentTarget.style.color = 'var(--teal)'
                e.currentTarget.style.borderColor = 'rgba(14,124,134,0.3)'
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

        {/* Footer note */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border)',
          background: 'var(--amber-light)',
        }}>
          <div style={{ fontSize: 11.5, color: 'var(--amber)', lineHeight: 1.55, fontWeight: 500 }}>
            ⚠️ Always verify critical steps in live reports. Escalate to Jason · Matt · Ari.
          </div>
        </div>
      </div>

      {/* ── Main area ──────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top bar */}
        <div style={{
          padding: '0 28px',
          height: 54,
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-white)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 13.5, color: 'var(--text-2)', fontWeight: 500 }}>
            Ask any question about settlement, regrading, client issues, or trading procedures
          </div>
          <div style={{
            display: 'flex', gap: 6, alignItems: 'center',
          }}>
            <span style={{
              fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)',
              background: 'var(--bg)', border: '1px solid var(--border)',
              padding: '3px 9px', borderRadius: 20,
            }}>Claude Sonnet · RAG</span>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', paddingTop: 28 }}>
          {isEmpty ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: '100%',
              padding: '0 40px', textAlign: 'center',
            }}>
              <div style={{
                width: 68, height: 68, borderRadius: 20,
                background: 'var(--navy)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 30, marginBottom: 20,
                boxShadow: '0 8px 24px rgba(27,42,74,0.2)',
              }}>
                🎯
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--navy)', marginBottom: 10, fontFamily: 'var(--font-body)' }}>
                How can I help?
              </div>
              <div style={{ fontSize: 14.5, color: 'var(--text-2)', maxWidth: 440, lineHeight: 1.75, marginBottom: 32 }}>
                Ask me anything from the Traders Operational Manual — settlement, regrading, client issues, voiding, or trading procedures.
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 580 }}>
                {SUGGESTED.slice(0, 4).map((q, i) => (
                  <button key={i} onClick={() => send(q)} style={{
                    background: 'var(--bg-white)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: '10px 16px',
                    fontSize: 13,
                    color: 'var(--text-2)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    maxWidth: 260,
                    textAlign: 'left',
                    lineHeight: 1.45,
                    fontFamily: 'var(--font-body)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--teal-light)'
                    e.currentTarget.style.color = 'var(--teal)'
                    e.currentTarget.style.borderColor = 'rgba(14,124,134,0.3)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(14,124,134,0.15)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'var(--bg-white)'
                    e.currentTarget.style.color = 'var(--text-2)'
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                  }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <Message key={i} msg={msg} isLatest={i === messages.length - 1 && msg.role === 'assistant'} />
            ))
          )}
          <div ref={bottomRef} style={{ height: 24 }} />
        </div>

        {/* Input bar */}
        <div style={{
          padding: '14px 24px 18px',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-white)',
          flexShrink: 0,
          boxShadow: '0 -2px 12px rgba(0,0,0,0.04)',
        }}>
          <div style={{
            display: 'flex', gap: 10,
            background: 'var(--bg)',
            border: '1.5px solid var(--border-mid)',
            borderRadius: 12,
            padding: '6px 6px 6px 18px',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
          onFocusCapture={e => {
            e.currentTarget.style.borderColor = 'var(--teal)'
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(14,124,134,0.1)'
          }}
          onBlurCapture={e => {
            e.currentTarget.style.borderColor = 'var(--border-mid)'
            e.currentTarget.style.boxShadow = 'none'
          }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
              placeholder="Type your question about any trading procedure…"
              rows={1}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                color: 'var(--text-1)',
                fontSize: 14,
                fontFamily: 'var(--font-body)',
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
                width: 40, height: 40,
                borderRadius: 9,
                border: 'none',
                background: (!input.trim() || loading) ? 'var(--border)' : 'var(--navy)',
                color: (!input.trim() || loading) ? 'var(--text-3)' : '#fff',
                cursor: (!input.trim() || loading) ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 17,
                flexShrink: 0,
                alignSelf: 'flex-end',
                marginBottom: 2,
                transition: 'all 0.15s',
                boxShadow: (!input.trim() || loading) ? 'none' : '0 2px 8px rgba(27,42,74,0.3)',
              }}
              onMouseEnter={e => {
                if (!(!input.trim() || loading)) e.currentTarget.style.background = 'var(--teal)'
              }}
              onMouseLeave={e => {
                if (!(!input.trim() || loading)) e.currentTarget.style.background = 'var(--navy)'
              }}
            >
              {loading ? (
                <span style={{
                  width: 16, height: 16, borderRadius: '50%',
                  border: '2px solid var(--text-3)',
                  borderTopColor: 'transparent',
                  display: 'block',
                  animation: 'spin 0.7s linear infinite',
                }} />
              ) : '↑'}
            </button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8, textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
            Enter to send · Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  )
}
