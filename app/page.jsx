'use client'
import { useState, useRef, useEffect } from 'react'

const QUESTION_SECTIONS = [
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
]

const DOCS = [
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
  { label: '❓ FAQ & Betting Rules', query: 'Walk me through the FAQ and betting rules' },
  { label: '🏢 DST Client List', query: 'Show me all DST clients and their integration types' },
]

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '4px 0' }}>
      {[0,1,2].map(i => (
        <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)', display: 'block', animation: `pulse 1.2s ease-in-out ${i*0.18}s infinite` }} />
      ))}
    </div>
  )
}

function renderInline(text) {
  const parts = text.split(/(https?:\/\/[^\s]+|\*\*.*?\*\*|`.*?`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} style={{ fontWeight: 600, color: 'var(--text-1)' }}>{part.slice(2,-2)}</strong>
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, background: 'var(--teal-mid)', color: 'var(--teal)', padding: '1px 5px', borderRadius: 4 }}>{part.slice(1,-1)}</code>
    if (part.startsWith('http://') || part.startsWith('https://'))
      return <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--teal)', textDecoration: 'underline', textDecorationColor: 'rgba(10,143,122,0.35)', wordBreak: 'break-all' }}>{part}</a>
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
    const imageMatch = line.match(/\[IMAGE:(https?:\/\/[^\]]+)\]/)
    if (imageMatch) {
      elements.push(<div key={i} style={{ margin: '12px 0' }}><img src={imageMatch[1]} alt="Reference screenshot" style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid var(--border)', display: 'block' }} onError={e => { e.currentTarget.style.display='none' }} /><div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3, fontFamily: 'var(--font-mono)' }}>Reference screenshot</div></div>)
      i++; continue
    }
    if (line.startsWith('### ')) {
      elements.push(<div key={i} style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginTop: 16, marginBottom: 4 }}>{line.slice(4)}</div>)
    } else if (line.startsWith('## ')) {
      elements.push(<div key={i} style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginTop: 16, marginBottom: 4, lineHeight: 1.4 }}>{line.slice(3)}</div>)
    } else if (line.startsWith('# ')) {
      elements.push(<div key={i} style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginTop: 14, marginBottom: 3 }}>{line.slice(2)}</div>)
    } else if (line.match(/^\d+\. /)) {
      const num = line.match(/^(\d+)/)?.[1]
      elements.push(<div key={i} style={{ display: 'flex', gap: 10, marginBottom: 6, alignItems: 'flex-start' }}><span style={{ minWidth: 20, height: 20, borderRadius: '50%', background: 'var(--teal)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0 }}>{num}</span><span style={{ lineHeight: 1.65 }}>{renderInline(line.replace(/^\d+\. /,''))}</span></div>)
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      elements.push(<div key={i} style={{ display: 'flex', gap: 10, marginBottom: 4, alignItems: 'flex-start' }}><span style={{ color: 'var(--teal)', fontSize: 16, lineHeight: 1.4, flexShrink: 0, marginTop: 1 }}>·</span><span style={{ lineHeight: 1.65 }}>{renderInline(line.slice(2))}</span></div>)
    } else if (line.startsWith('> ')) {
      elements.push(<div key={i} style={{ borderLeft: '3px solid var(--teal)', paddingLeft: 12, marginBottom: 8, marginTop: 4, color: 'var(--text-2)', fontStyle: 'italic', fontSize: 13, lineHeight: 1.6 }}>{line.slice(2)}</div>)
    } else if (line === '---' || line === '- - -') {
      elements.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />)
    } else {
      elements.push(<p key={i} style={{ marginBottom: 6, lineHeight: 1.7 }}>{renderInline(line)}</p>)
    }
    i++
  }
  return <>{elements}</>
}

function Message({ msg, isLatest }) {
  const isUser = msg.role === 'user'
  return (
    <div className={isLatest ? 'fade-up' : ''} style={{ marginBottom: 24, padding: isUser ? '14px 24px' : '0 24px' }}>
      {isUser ? (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ background: 'var(--bg-user)', borderRadius: 18, padding: '10px 16px', maxWidth: '70%', fontSize: 14, lineHeight: 1.6, color: 'var(--text-1)' }}>
            {msg.image && <img src={msg.image} alt="Attached screenshot" style={{ maxHeight: 160, maxWidth: '100%', borderRadius: 8, display: 'block', marginBottom: msg.content ? 8 : 0 }} />}
            {msg.content}
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: 760, fontSize: 14, color: 'var(--text-1)' }}>
          {msg.content === '' ? <TypingDots /> : <MessageContent content={msg.content} />}
        </div>
      )}
    </div>
  )
}

export default function ChatPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pastedImage, setPastedImage] = useState(null)
  const [openSections, setOpenSections] = useState({})
  const [kbOpen, setKbOpen] = useState(true)
  const [recentQuestions, setRecentQuestions] = useState([])
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send(text) {
    const query = text || input.trim()
    if ((!query && !pastedImage) || loading) return
    setInput('')
    const imageToSend = pastedImage
    setPastedImage(null)
    setLoading(true)
    setRecentQuestions(prev => [query, ...prev.filter(q => q !== query)].slice(0, 6))
    setMessages(prev => [...prev, { role: 'user', content: query, image: imageToSend }, { role: 'assistant', content: '' }])
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: query, history: messages, image: imageToSend }) })
      if (!res.ok) throw new Error('Request failed')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        for (const line of decoder.decode(value).split('\n')) {
          if (line.startsWith('data: ')) {
            try { const data = JSON.parse(line.slice(6)); if (data.type === 'text') { fullText += data.text; setMessages(prev => { const u=[...prev]; u[u.length-1]={role:'assistant',content:fullText}; return u }) } } catch {}
          }
        }
      }
    } catch {
      setMessages(prev => { const u=[...prev]; u[u.length-1]={role:'assistant',content:'Something went wrong. Please try again.'}; return u })
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKey(e) { if (e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()} }
  function handlePaste(e) {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.startsWith('image/')) { e.preventDefault(); const reader = new FileReader(); reader.onload = ev => setPastedImage(ev.target.result); reader.readAsDataURL(item.getAsFile()); return }
    }
  }

  const isEmpty = messages.length === 0
  const canSend = (input.trim() || pastedImage) && !loading

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>

      {/* Sidebar */}
      <div style={{ width:248, flexShrink:0, background:'var(--bg-sidebar)', display:'flex', flexDirection:'column', overflowY:'auto' }}>
        <div style={{ padding:'20px 16px 16px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize:10, fontFamily:'var(--font-mono)', color:'rgba(255,255,255,0.4)', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:5 }}>Digital Sports Tech</div>
          <div style={{ fontSize:16, fontWeight:700, color:'#fff', lineHeight:1.3 }}>Trading Operations<br/><span style={{ color:'#5DDDC8', fontWeight:400, fontSize:13 }}>Assistant</span></div>
        </div>
        <div style={{ padding:'10px 12px 0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:7, padding:'6px 10px', background:'rgba(46,204,113,0.1)', border:'1px solid rgba(46,204,113,0.2)', borderRadius:7 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#2ECC71', flexShrink:0 }}/>
            <span style={{ fontSize:11, color:'#2ECC71', fontWeight:600 }}>Online & Ready</span>
            <span style={{ fontSize:10, color:'rgba(255,255,255,0.25)', marginLeft:'auto', fontFamily:'var(--font-mono)' }}>v1.0</span>
          </div>
        </div>
        <div style={{ padding:'10px 12px 0' }}>
          <button onClick={()=>setKbOpen(o=>!o)} style={{ width:'100%', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:6, padding:'4px 0' }}>
            <span style={{ color:'rgba(255,255,255,0.3)', fontSize:9, transition:'transform 0.2s', transform:kbOpen?'rotate(90deg)':'rotate(0deg)', display:'inline-block' }}>▶</span>
            <span style={{ fontSize:10, fontFamily:'var(--font-mono)', color:'rgba(255,255,255,0.35)', letterSpacing:'0.1em', textTransform:'uppercase' }}>Knowledge Base</span>
            <span style={{ marginLeft:'auto', fontSize:10, background:'rgba(93,221,200,0.15)', color:'#5DDDC8', border:'1px solid rgba(93,221,200,0.2)', borderRadius:10, padding:'1px 7px' }}>17 docs</span>
          </button>
          {kbOpen && <div style={{ marginTop:6, display:'flex', flexDirection:'column', gap:2 }}>{DOCS.map((doc,i) => <button key={i} onClick={()=>send(doc.query)} style={{ background:'none', border:'none', padding:'4px 6px', fontSize:11, color:'rgba(255,255,255,0.5)', textAlign:'left', cursor:'pointer', borderRadius:5, transition:'all 0.12s', fontFamily:'var(--font-body)' }} onMouseEnter={e=>{e.currentTarget.style.background='rgba(93,221,200,0.1)';e.currentTarget.style.color='#5DDDC8'}} onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='rgba(255,255,255,0.5)'}}>{doc.label}</button>)}</div>}
        </div>
        <div style={{ height:1, background:'rgba(255,255,255,0.07)', margin:'10px 12px' }}/>
        <div style={{ padding:'0 12px', flex:1, display:'flex', flexDirection:'column', gap:10, paddingBottom:16 }}>
          {QUESTION_SECTIONS.map((section, si) => (
            <div key={si}>
              <button onClick={()=>setOpenSections(o=>({...o,[si]:!o[si]}))} style={{ width:'100%', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:6, padding:'2px 0' }}>
                <span style={{ color:'rgba(255,255,255,0.25)', fontSize:9, transition:'transform 0.2s', transform:openSections[si]?'rotate(90deg)':'rotate(0deg)', display:'inline-block' }}>▶</span>
                <span style={{ fontSize:10, fontFamily:'var(--font-mono)', color:'rgba(255,255,255,0.35)', letterSpacing:'0.08em', textTransform:'uppercase' }}>{section.emoji} {section.label}</span>
              </button>
              {openSections[si] && <div style={{ marginTop:4, display:'flex', flexDirection:'column', gap:1, paddingLeft:4 }}>{section.questions.map((q,i) => <button key={i} onClick={()=>send(q)} style={{ background:'none', border:'none', padding:'5px 8px', fontSize:12, color:'rgba(255,255,255,0.5)', textAlign:'left', cursor:'pointer', borderRadius:6, transition:'all 0.12s', lineHeight:1.4, fontFamily:'var(--font-body)' }} onMouseEnter={e=>{e.currentTarget.style.background='rgba(93,221,200,0.1)';e.currentTarget.style.color='#5DDDC8'}} onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='rgba(255,255,255,0.5)'}}>{q}</button>)}</div>}
            </div>
          ))}
        </div>
        {recentQuestions.length > 0 && <>
          <div style={{ height:1, background:'rgba(255,255,255,0.07)', margin:'0 12px 10px' }}/>
          <div style={{ padding:'0 12px', paddingBottom:16 }}>
            <div style={{ fontSize:10, fontFamily:'var(--font-mono)', color:'rgba(255,255,255,0.35)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:6 }}>🕒 Recent</div>
            <div style={{ display:'flex', flexDirection:'column', gap:1 }}>{recentQuestions.map((q,i) => <button key={i} onClick={()=>send(q)} style={{ background:'none', border:'none', padding:'5px 8px', fontSize:12, color:'rgba(255,255,255,0.45)', textAlign:'left', cursor:'pointer', borderRadius:6, transition:'all 0.12s', lineHeight:1.4, fontFamily:'var(--font-body)' }} onMouseEnter={e=>{e.currentTarget.style.background='rgba(93,221,200,0.1)';e.currentTarget.style.color='#5DDDC8'}} onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='rgba(255,255,255,0.45)'}}>{q}</button>)}</div>
          </div>
        </>}
      </div>

      {/* Main */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'#fff' }}>

        {/* Top nav with tabs */}
        <div style={{ height:48, borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:2, background:'var(--border)', borderRadius:9, padding:3 }}>
            <div style={{ padding:'5px 16px', borderRadius:7, fontSize:13, fontWeight:600, background:'#fff', color:'var(--navy)', boxShadow:'0 1px 3px rgba(0,0,0,0.1)' }}>
              Assistant
            </div>
            <a href="/submit" style={{ padding:'5px 16px', borderRadius:7, fontSize:13, fontWeight:500, color:'var(--text-2)', textDecoration:'none', transition:'all 0.15s' }}
              onMouseEnter={e=>{e.currentTarget.style.color='var(--navy)'}}
              onMouseLeave={e=>{e.currentTarget.style.color='var(--text-2)'}}>
              Add to Knowledge Base
            </a>
          </div>
          <span style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'var(--text-3)', background:'var(--border)', padding:'3px 10px', borderRadius:20 }}>Claude Sonnet · RAG</span>
        </div>

        {/* Messages */}
        <div style={{ flex:1, overflowY:'auto', paddingTop:32 }}>
          {isEmpty ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'80%', padding:'0 40px', textAlign:'center' }}>
              <div style={{ fontSize:28, marginBottom:16 }}>🎯</div>
              <div style={{ fontSize:22, fontWeight:700, color:'var(--navy)', marginBottom:10 }}>How can I help?</div>
              <div style={{ fontSize:14, color:'var(--text-2)', maxWidth:420, lineHeight:1.7, marginBottom:32 }}>Ask me anything from the Traders Operational Manual — settlement, regrading, client issues, voiding, or daily setup. You can also paste a screenshot directly into the chat box.</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center', maxWidth:600 }}>
                {QUESTION_SECTIONS.flatMap(s=>s.questions.slice(0,1)).slice(0,6).map((q,i) => (
                  <button key={i} onClick={()=>send(q)} style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:20, padding:'8px 16px', fontSize:13, color:'var(--text-2)', cursor:'pointer', transition:'all 0.15s', fontFamily:'var(--font-body)' }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--teal)';e.currentTarget.style.color='var(--teal)'}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-2)'}}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : messages.map((msg,i) => <Message key={i} msg={msg} isLatest={i===messages.length-1&&msg.role==='assistant'} />)}
          <div ref={bottomRef} style={{ height:24 }}/>
        </div>

        {/* Input */}
        <div style={{ padding:'12px 24px 20px', borderTop:'1px solid var(--border)', background:'#fff', flexShrink:0 }}>
          {pastedImage && (
            <div style={{ position:'relative', display:'inline-block', marginBottom:8 }}>
              <img src={pastedImage} alt="Pasted screenshot" style={{ maxHeight:120, maxWidth:300, borderRadius:8, border:'1px solid var(--border)', display:'block' }} />
              <button onClick={()=>setPastedImage(null)} style={{ position:'absolute', top:-8, right:-8, width:20, height:20, borderRadius:'50%', background:'#333', color:'#fff', border:'none', cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 }}>×</button>
            </div>
          )}
          <div style={{ display:'flex', gap:10, border:'1px solid var(--border-mid)', borderRadius:12, padding:'8px 8px 8px 16px', transition:'border-color 0.2s, box-shadow 0.2s', background:'#fff' }}
            onFocusCapture={e=>{e.currentTarget.style.borderColor='var(--teal)';e.currentTarget.style.boxShadow='0 0 0 3px rgba(10,143,122,0.08)'}}
            onBlurCapture={e=>{e.currentTarget.style.borderColor='var(--border-mid)';e.currentTarget.style.boxShadow='none'}}>
            <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey} onPaste={handlePaste} disabled={loading}
              placeholder={pastedImage ? 'Add a question about this screenshot, or just hit send…' : 'Type your question or paste a screenshot…'}
              rows={1} style={{ flex:1, background:'none', border:'none', outline:'none', color:'var(--text-1)', fontSize:14, fontFamily:'var(--font-body)', resize:'none', padding:'4px 0', lineHeight:1.5, maxHeight:120, overflowY:'auto' }}
              onInput={e=>{e.target.style.height='auto';e.target.style.height=Math.min(e.target.scrollHeight,120)+'px'}} />
            <button onClick={()=>send()} disabled={!canSend}
              style={{ width:36, height:36, borderRadius:8, border:'none', background:canSend?'var(--navy)':'var(--border)', color:canSend?'#fff':'var(--text-3)', cursor:canSend?'pointer':'default', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0, alignSelf:'flex-end', marginBottom:1, transition:'all 0.15s' }}
              onMouseEnter={e=>{if(canSend)e.currentTarget.style.background='var(--teal)'}}
              onMouseLeave={e=>{if(canSend)e.currentTarget.style.background='var(--navy)'}}>
              {loading ? <span style={{ width:14,height:14,borderRadius:'50%',border:'2px solid var(--text-3)',borderTopColor:'transparent',display:'block',animation:'spin 0.7s linear infinite' }}/> : '↑'}
            </button>
          </div>
          <div style={{ fontSize:11, color:'var(--text-3)', marginTop:8, textAlign:'center', fontFamily:'var(--font-mono)' }}>Enter to send · Shift+Enter for new line · Paste a screenshot directly</div>
        </div>
      </div>
    </div>
  )
}
