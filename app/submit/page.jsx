'use client'
import { useState, useRef } from 'react'

const CATEGORIES = [
  'Settlement & Regrading',
  'Client Issues',
  'Trading',
  'Voiding',
  'Data Feed',
  'Technical Issue',
  'Other',
]

// Compress image to max 800px wide and JPEG quality 0.7 before sending
function compressImage(dataUrl, maxWidth = 800, quality = 0.7) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const scale = Math.min(1, maxWidth / img.width)
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.src = dataUrl
  })
}

export default function SubmitPage() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [category, setCategory] = useState('Client Issues')
  const [screenshot, setScreenshot] = useState(null)
  const [status, setStatus] = useState(null)
  const [recentSubmissions, setRecentSubmissions] = useState([])
  const [errorMsg, setErrorMsg] = useState('')
  const fileInputRef = useRef(null)

  async function handleImageFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const compressed = await compressImage(ev.target.result)
      setScreenshot(compressed)
    }
    reader.readAsDataURL(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    handleImageFile(e.dataTransfer.files[0])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!question.trim() || !answer.trim()) return
    setStatus('loading')

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), answer: answer.trim(), category, screenshot }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
      setRecentSubmissions(prev => [{ question, category, time: new Date().toLocaleTimeString() }, ...prev.slice(0, 4)])
      setQuestion('')
      setAnswer('')
      setScreenshot(null)
      setStatus('success')
      setTimeout(() => setStatus(null), 4000)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.message)
      setTimeout(() => setStatus(null), 6000)
    }
  }

  const canSubmit = question.trim() && answer.trim() && status !== 'loading'

  return (
    <div style={{ minHeight: '100vh', background: '#F7F6F3', fontFamily: '"Plus Jakarta Sans", sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: '#1C2333', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 9, fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Digital Sports Tech</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Training Submission</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(255,255,255,0.1)', borderRadius: 9, padding: 3 }}>
          <a href="/" style={{ padding: '5px 16px', borderRadius: 7, fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}>
            Assistant
          </a>
          <div style={{ padding: '5px 16px', borderRadius: 7, fontSize: 13, fontWeight: 600, background: 'rgba(255,255,255,0.15)', color: '#5DDDC8' }}>
            Add to Knowledge Base
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', gap: 24, padding: '32px', maxWidth: 1100, width: '100%', margin: '0 auto', alignItems: 'flex-start' }}>

        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1C2333', marginBottom: 24 }}>Add to Knowledge Base</h1>

          <form onSubmit={handleSubmit}>
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E5E5', overflow: 'hidden' }}>

              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E5E5' }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  style={{ border: 'none', outline: 'none', fontSize: 14, color: '#1C2333', background: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E5E5' }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
                  Question / Problem <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <textarea value={question} onChange={e => setQuestion(e.target.value)}
                  placeholder="Describe the question or problem…" required rows={3}
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: 14, color: '#1C2333', background: 'none', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.6, minHeight: 80 }} />
              </div>

              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E5E5' }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
                  Answer / Resolution <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <textarea value={answer} onChange={e => setAnswer(e.target.value)}
                  placeholder="Describe the answer or how it was resolved…" required rows={6}
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: 14, color: '#1C2333', background: 'none', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.6, minHeight: 140 }} />
              </div>

              <div style={{ padding: '16px 20px' }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 10 }}>
                  Screenshot <span style={{ color: '#ccc', fontWeight: 400 }}>(optional)</span>
                </label>
                {screenshot ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={screenshot} alt="Attached screenshot"
                      style={{ maxHeight: 200, maxWidth: '100%', borderRadius: 8, border: '1px solid #E5E5E5', display: 'block' }} />
                    <button type="button" onClick={() => setScreenshot(null)}
                      style={{ position: 'absolute', top: -10, right: -10, width: 24, height: 24, borderRadius: '50%', background: '#333', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      ×
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={e => e.preventDefault()}
                    onDragEnter={e => { e.currentTarget.style.borderColor = '#0A8F7A'; e.currentTarget.style.background = '#EEF9F6' }}
                    onDragLeave={e => { e.currentTarget.style.borderColor = '#D5D5D5'; e.currentTarget.style.background = '#FAFAFA' }}
                    style={{ border: '2px dashed #D5D5D5', borderRadius: 8, padding: '20px 24px', background: '#FAFAFA', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 12 }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#0A8F7A'; e.currentTarget.style.background = '#EEF9F6' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#D5D5D5'; e.currentTarget.style.background = '#FAFAFA' }}
                  >
                    <span style={{ fontSize: 24 }}>📎</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 2 }}>Attach a screenshot</div>
                      <div style={{ fontSize: 12, color: '#999' }}>Click to browse or drag & drop — PNG, JPG, GIF</div>
                    </div>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => handleImageFile(e.target.files?.[0])} />
              </div>
            </div>

            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
              <button type="submit" disabled={!canSubmit}
                style={{
                  padding: '11px 28px', background: canSubmit ? '#1C2333' : '#ccc',
                  color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
                  cursor: canSubmit ? 'pointer' : 'default', transition: 'all 0.15s', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
                onMouseEnter={e => { if (canSubmit) e.currentTarget.style.background = '#0A8F7A' }}
                onMouseLeave={e => { if (canSubmit) e.currentTarget.style.background = '#1C2333' }}
              >
                {status === 'loading' ? (
                  <><span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', display: 'block', animation: 'spin 0.7s linear infinite' }} />Adding…</>
                ) : '+ Add to Knowledge Base'}
              </button>
              {status === 'success' && <div style={{ fontSize: 13, color: '#2ECC71', fontWeight: 600 }}>✓ Added — available to traders immediately</div>}
              {status === 'error' && <div style={{ fontSize: 13, color: '#e74c3c', fontWeight: 600 }}>✗ {errorMsg || 'Something went wrong. Please try again.'}</div>}
            </div>
          </form>
        </div>

        {recentSubmissions.length > 0 && (
          <div style={{ width: 280, flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Added This Session</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentSubmissions.map((s, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 8, padding: '10px 14px', border: '1px solid #E5E5E5' }}>
                  <div style={{ fontSize: 10, color: '#0A8F7A', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{s.category} · {s.time}</div>
                  <div style={{ fontSize: 12, color: '#333', lineHeight: 1.5 }}>{s.question.slice(0, 80)}{s.question.length > 80 ? '…' : ''}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } * { box-sizing: border-box; }`}</style>
    </div>
  )
}
