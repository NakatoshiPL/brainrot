import { useState, useRef, useEffect } from 'react'
import './ChatWidget.css'

const API_BASE = '/api'

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const abortRef = useRef(null)

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  useEffect(() => { scrollToBottom() }, [messages])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    const userMsg = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    const history = messages.map(m => ({ role: m.role, content: m.content }))
    history.push({ role: 'user', content: text })

    const assistantMsg = { role: 'assistant', content: '' }
    setMessages(prev => [...prev, assistantMsg])

    try {
      abortRef.current = new AbortController()
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: messages.map(m => ({ role: m.role, content: m.content })) }),
        signal: abortRef.current.signal
      })
      if (!res.ok) throw new Error(res.statusText)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                setMessages(prev => {
                  const next = [...prev]
                  const last = next[next.length - 1]
                  if (last?.role === 'assistant') {
                    next[next.length - 1] = { ...last, content: last.content + parsed.content }
                  }
                  return next
                })
              }
            } catch (_) {}
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return
      setMessages(prev => {
        const next = [...prev]
        const last = next[next.length - 1]
        if (last?.role === 'assistant') {
          next[next.length - 1] = { ...last, content: last.content || 'Connection error. Please try again.' }
        }
        return next
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className={`chat-widget-panel ${open ? 'open' : ''}`}>
        <div className="chat-widget-header">
          <span>AI Trade Helper</span>
          <button className="chat-widget-close" onClick={() => setOpen(false)} aria-label="Close">×</button>
        </div>
        <div className="chat-widget-messages">
          {messages.length === 0 && (
            <div className="chat-widget-empty">Ask about trade value or a specific brainrot.</div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`chat-msg chat-msg-${m.role}`}>
              {m.content || (loading && i === messages.length - 1 ? (
                <span className="chat-loader">
                  <span></span><span></span><span></span>
                </span>
              ) : null)}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="chat-widget-input-wrap">
          <input
            type="text"
            placeholder="Ask about trade value..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            disabled={loading}
            className="chat-widget-input"
          />
          <button onClick={sendMessage} disabled={loading || !input.trim()} className="chat-widget-send">
            Send
          </button>
        </div>
      </div>
      <button
        className={`chat-widget-fab ${open ? 'open' : ''}`}
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      </button>
    </>
  )
}
