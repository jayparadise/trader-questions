'use client'

import { useState, useRef, useEffect } from 'react'

const QUESTION_SECTIONS = [
  {
    label: 'Daily Setup',
    emoji: '🚀',
    questions: [
      'Walk me through the MLB daily setup process.',
      'How do I set up NBA games for today?',
      'How do I set up NHL games?',
      'How do I set up NCAAB games?',
      'How do I handle a doubleheader in MLB setup?',
      'What is the market release schedule for each sport?',
    ],
  },
  {
    label: 'Settlement & Regrading',
    emoji: '⚖️',
    questions: [
      'How do I regrade a single bet for a client?',
      'What steps do I take when player markets haven\'t settled?',
      'How do I manually settle game markets for an event?',
      'Walk me through SST settlement steps for soccer.',
      'What do I do if a soccer match is suspended mid-game?',
      'Walk me through the MLB postponed game void process.',
    ],
  },
  {
    label: 'Trading',
    emoji: '📊',
    questions: [
      'What are the O/U trading principles I should follow?',
      'How does in-play trading work?',
      'What do I do if comps are lagging or missing?',
      'How do I pull and reactivate NBA teams?',
      'How does the global basketball projection system work?',
      'What do I do if soccer goal or card prices are missing?',
    ],
  },
  {
    label: 'Client Issues',
    emoji: '🤝',
    questions: [
      'How do I handle a client reporting missing settlements?',
      'A client bet is still pending on their side — what do I do?',
      'How do I check why a user is hitting risk limits?',
      'A data feed client says they are missing markets — how do I fix it?',
      'A client is getting error messages on bet placement — what do I check?',
      'Widgets are not loading for a client — what is the fix?',
    ],
  },
  {
    label: 'NFL & NCAAF',
    emoji: '🏈',
    questions: [
      'Walk me through the NFL and NCAAF setup guide.',
      'How do I settle a first touchdown market?',
      'How do I settle a first touchdown if an unlisted player scores?',
    ],
  },
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
  // Split on bold, code, and URLs
  const parts = text.split(/(https?:\/\/[^\s]+|\*\*.*?\*\*|`.*?`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ fontWeight: 700 }}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} style={{
        fontFamily: 'var(--font-mono)', fontSize: 12,
        background: 'var(--teal-mid)', color: 'var(--teal)',
        padding: '1px 6px', borderRadius: 4,
      }}>{part.slice(1, -1)}</code>
    }
    if (part.startsWith('http://') || part.startsWith('https://')) {
      return <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{
        color: 'var(--teal)', textDecoration: 'underline',
        textDecorationColor: 'rgba(14,124,134,0.4)',
        wordBreak: 'break-all',
      }}>{part}</a>
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

    // Inline image from RAG context
    const imageMatch = line.match(/\[IMAGE:(https?:\/\/[^\]]+)\]/)
    if (imageMatch) {
      elements.push(
        <div key={i} style={{ margin: '6px 0' }}>
          <img src={imageMatch[1]} alt="Reference screenshot" style={{ maxWidth: '100%', borderRadius: 6, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', display: 'block' }} onError={e => { e.currentTarget.style.display = 'none' }} />
          <div style={{ fontSize: 9, color: 'var(--text-3)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>Reference screenshot</div>
        </div>
      )
      i++; continue
    }

    if (line.startsWith('### ')) {
      elements.push(<div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--teal)', letterSpacing: '0.07em', textTransform: 'uppercase', marginTop: 10, marginBottom: 3, fontWeight: 500 }}>{line.slice(4)}</div>)
    } else if (line.startsWith('## ')) {
      elements.push(<div key={i} style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', marginTop: 10, marginBottom: 3 }}>{line.slice(3)}</div>)
    } else if (line.match(/^\d+\. /)) {
      const num = line.match(/^(\d+)/)?.[1]
      const text = line.replace(/^\d+\. /, '')
      elements.push(
        <div key={i} style={{ display: 'flex', gap: 7, marginBottom: 3, alignItems: 'flex-start' }}>
          <span style={{ minWidth: 17, height: 17, borderRadius: '50%', background: 'var(--teal)', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 }}>{num}</span>
          <span>{renderInline(text)}</span>
        </div>
      )
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      elements.push(
        <div key={i} style={{ display: 'flex', gap: 7, marginBottom: 2, alignItems: 'flex-start' }}>
          <span style={{ color: 'var(--teal)', fontSize: 13, lineHeight: 1.3, flexShrink: 0 }}>›</span>
          <span>{renderInline(line.slice(2))}</span>
        </div>
      )
    } else if (line.startsWith('> ')) {
      elements.push(<div key={i} style={{ borderLeft: '3px solid var(--teal)', background: 'var(--teal-light)', padding: '5px 10px', borderRadius: '0 5px 5px 0', marginBottom: 5, color: 'var(--text-2)', fontStyle: 'italic', fontSize: 12 }}>{line.slice(2)}</div>)
    } else {
      elements.push(<p key={i} style={{ marginBottom: 3 }}>{renderInline(line)}</p>)
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
      gap: 8,
      alignItems: 'flex-start',
      padding: '0 20px',
      marginBottom: 12,
    }}>
      {/* Avatar */}
      <div style={{
        width: 26, height: 26, borderRadius: 7, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 600,
        background: isUser ? 'var(--navy)' : 'var(--teal)',
        color: '#fff',
        boxShadow: isUser ? '0 2px 8px rgba(27,42,74,0.25)' : '0 2px 8px rgba(14,124,134,0.25)',
        marginTop: 2, letterSpacing: '0.03em',
      }}>
        {isUser ? 'YOU' : 'AI'}
      </div>

      {/* Bubble */}
      <div style={{
        maxWidth: '76%',
        background: isUser ? 'var(--navy)' : 'var(--bg-white)',
        border: `1px solid ${isUser ? 'transparent' : 'var(--border)'}`,
        borderRadius: isUser ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
        padding: '9px 13px',
        lineHeight: 1.55,
        fontSize: 13,
        color: isUser ? '#fff' : 'var(--text-1)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        {msg.role === 'assistant' && msg.content === '' ? (
          <TypingDots />
        ) : (
          <MessageContent content={msg.content} />
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
        width: 240,
        flexShrink: 0,
        background: 'var(--navy)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '2px 0 16px rgba(0,0,0,0.15)',
      }}>
        {/* Brand header */}
        <div style={{
          padding: '22px 16px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{
            fontSize: 10, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.4)',
            letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6,
          }}>
            Digital Sports Tech
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
            Trading Operations
            <br />
            <span style={{ color: '#5DDDC8', fontWeight: 400, fontSize: 15 }}>Assistant</span>
          </div>
        </div>

        {/* Status pill */}
        <div style={{ padding: '12px 12px 0' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 11px',
            background: 'rgba(46,204,113,0.1)',
            border: '1px solid rgba(46,204,113,0.2)',
            borderRadius: 7,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2ECC71', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#2ECC71', fontWeight: 600 }}>Online & Ready</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>v1.0</span>
          </div>
        </div>

        {/* Knowledge base */}
        <div style={{ padding: '12px 12px 0' }}>
          <details style={{ cursor: 'pointer' }} onToggle={e => {
            const arrow = e.currentTarget.querySelector('.kb-arrow')
            if (arrow) arrow.style.transform = e.currentTarget.open ? 'rotate(90deg)' : 'rotate(0deg)'
          }}>
            <summary style={{
              fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.4)',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              listStyle: 'none', display: 'flex', alignItems: 'center', gap: 6,
              userSelect: 'none',
            }}>
              <span className="kb-arrow" style={{ color: 'rgba(255,255,255,0.25)', transition: 'transform 0.2s', display: 'inline-block' }}>▶</span>
              Knowledge Base
              <span style={{
                marginLeft: 'auto', fontSize: 10,
                background: 'rgba(93,221,200,0.15)', color: '#5DDDC8',
                border: '1px solid rgba(93,221,200,0.2)',
                borderRadius: 10, padding: '1px 7px',
              }}>15 docs</span>
            </summary>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 8 }}>
              {[
                { label: '📋 Traders Operational Manual', query: 'Give me an overview of the Traders Operational Manual' },
                { label: '🎧 Customer Service Guidelines', query: 'Walk me through the Customer Service Guidelines' },
                { label: '⚾ MLB Setup', query: 'Walk me through the full MLB daily setup process' },
                { label: '🏀 NBA Setup', query: 'Walk me through the full NBA setup process' },
                { label: '🏒 NHL Setup', query: 'Walk me through the full NHL setup process' },
                { label: '🏈 NFL & NCAAF Guide', query: 'Walk me through the NFL and NCAAF guide' },
                { label: '🏀 NCAAB Setup', query: 'Walk me through the full NCAAB setup process' },
                { label: '📈 In-Play Trading', query: 'Walk me through the in-play trading process' },
                { label: '📊 O/U Trading Principles', query: 'What are the O/U trading principles?' },
                { label: '🌍 IP Trader Manual', query: 'Walk me through the IP Trader Manual' },
                { label: '🔄 SST Settlement Steps', query: 'Walk me through the SST settlement steps' },
                { label: '🏀 Global Basketball Projections', query: 'How does the global basketball projection system work?' },
                { label: '📅 Release Schedule', query: 'What is the market release schedule for all sports?' },
                { label: '🔁 NBA Pulling & Reactivating', query: 'How do I pull and reactivate NBA teams?' },
                { label: '📚 Trading Resource', query: 'What is in the Trading Resource guide?' },
              ].map((doc, i) => (
                <button key={i} onClick={() => send(doc.query)} style={{
                  padding: '6px 10px', fontSize: 11,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 5, color: 'rgba(255,255,255,0.55)',
                  textAlign: 'left', cursor: 'pointer',
                  transition: 'all 0.15s', fontFamily: 'var(--font-body)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(93,221,200,0.12)'
                  e.currentTarget.style.color = '#5DDDC8'
                  e.currentTarget.style.borderColor = 'rgba(93,221,200,0.25)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  e.currentTarget.style.color = 'rgba(255,255,255,0.55)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                }}>
                  {doc.label}
                </button>
              ))}
            </div>
          </details>
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '14px 12px' }} />

        {/* Quick questions by section */}
        <div style={{ padding: '0 12px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {QUESTION_SECTIONS.map((section, si) => (
            <div key={si}>
              <div style={{
                fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em',
                textTransform: 'uppercase', marginBottom: 6,
                color: 'rgba(255,255,255,0.35)',
                display: 'flex', alignItems: 'center', gap: 6, padding: '0 4px',
              }}>
                <span>{section.emoji}</span> {section.label}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {section.questions.map((q, i) => (
                  <button key={i} onClick={() => send(q)} style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 7,
                    padding: '7px 10px',
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.6)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    lineHeight: 1.4,
                    transition: 'all 0.15s',
                    fontFamily: 'var(--font-body)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(10,143,122,0.2)'
                    e.currentTarget.style.color = '#5DDDC8'
                    e.currentTarget.style.borderColor = 'rgba(10,143,122,0.4)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                  }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* ── Main area ──────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top bar */}
        <div style={{
          padding: '0 20px',
          height: 44,
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
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 620 }}>
                {QUESTION_SECTIONS.map((section, si) => (
                  <div key={si} style={{ width: '100%', maxWidth: 580 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, textAlign: 'left', paddingLeft: 4 }}>
                      {section.emoji} {section.label}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {section.questions.slice(0, 2).map((q, i) => (
                        <button key={i} onClick={() => send(q)} style={{
                          background: 'var(--bg-white)',
                          border: '1px solid var(--border)',
                          borderRadius: 10,
                          padding: '9px 14px',
                          fontSize: 13,
                          color: 'var(--text-2)',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          flex: 1,
                          minWidth: 200,
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
          padding: '10px 16px 14px',
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
