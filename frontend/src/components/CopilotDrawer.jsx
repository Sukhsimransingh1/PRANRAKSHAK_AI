import React, { useState, useRef, useEffect } from 'react'
import { askCopilot } from '../api'
import styles from './CopilotDrawer.module.css'

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`${styles.msg} ${isUser ? styles.msgUser : styles.msgBot}`}>
      {!isUser && (
        <div className={styles.botAvatar}>PR</div>
      )}
      <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleBot}`}>
        {msg.image && (
          <img src={msg.image} alt="Lab report" className={styles.msgImage} />
        )}
        <p>{msg.content}</p>
        <span className={styles.msgTime}>{msg.time}</span>
      </div>
    </div>
  )
}

function Typing() {
  return (
    <div className={`${styles.msg} ${styles.msgBot}`}>
      <div className={styles.botAvatar}>PR</div>
      <div className={`${styles.bubble} ${styles.bubbleBot} ${styles.typingBubble}`}>
        <span /><span /><span />
      </div>
    </div>
  )
}

export default function CopilotDrawer({ isOpen, onClose, patientId }) {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      content: 'Hello, Dr. Sharma. I\'m the PranRakshak clinical copilot. Ask me anything about your patients, or upload a lab report image for analysis.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ])
  const [question, setQuestion] = useState('')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState(patientId)
  const bottomRef = useRef()
  const fileRef = useRef()
  const inputRef = useRef()

  useEffect(() => {
    setSelectedPatientId(patientId)
  }, [patientId])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleImageSelect = e => {
    const f = e.target.files[0]
    if (!f) return
    setImage(f)
    const reader = new FileReader()
    reader.onload = ev => setImagePreview(ev.target.result)
    reader.readAsDataURL(f)
  }

  const clearImage = () => {
    setImage(null)
    setImagePreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const now = () =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const handleSend = async () => {
    if (!question.trim() && !image) return
    if (!selectedPatientId) {
      setMessages(m => [...m, {
        role: 'bot',
        content: 'Please select a patient first, or navigate to a patient dashboard to ask patient-specific questions.',
        time: now(),
      }])
      return
    }

    const userMsg = {
      role: 'user',
      content: question.trim() || '(Image uploaded — please analyse)',
      image: imagePreview || null,
      time: now(),
    }
    setMessages(m => [...m, userMsg])
    setQuestion('')
    clearImage()
    setLoading(true)

    try {
      const fd = new FormData()
      fd.append('patient_id', String(selectedPatientId))
      fd.append('question', userMsg.content)
      if (image) fd.append('image', image)

      const res = await askCopilot(fd)
      setMessages(m => [...m, {
        role: 'bot',
        content: res.answer,
        time: now(),
      }])
    } catch (err) {
      setMessages(m => [...m, {
        role: 'bot',
        content: `Error: ${err.message}. Please try again.`,
        time: now(),
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {isOpen && <div className={styles.overlay} onClick={onClose} />}
      <div className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''}`}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerAvatar}>PR</div>
            <div>
              <div className={styles.headerTitle}>PranRakshak Copilot</div>
              <div className={styles.headerSub}>
                {selectedPatientId
                  ? `Patient ID: ${selectedPatientId}`
                  : 'No patient selected'}
              </div>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Messages */}
        <div className={styles.messages}>
          {messages.map((m, i) => <Message key={i} msg={m} />)}
          {loading && <Typing />}
          <div ref={bottomRef} />
        </div>

        {/* Image preview */}
        {imagePreview && (
          <div className={styles.imagePreview}>
            <img src={imagePreview} alt="Preview" />
            <button className={styles.clearImage} onClick={clearImage}>✕</button>
            <span>Lab report attached</span>
          </div>
        )}

        {/* Input */}
        <div className={styles.inputArea}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className={styles.hiddenFile}
            id="copilot-img"
            onChange={handleImageSelect}
          />
          <label htmlFor="copilot-img" className={styles.attachBtn} title="Attach lab report image">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </label>

          <textarea
            ref={inputRef}
            className={styles.input}
            placeholder="Ask about this patient..."
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={loading}
          />

          <button
            className={styles.sendBtn}
            onClick={handleSend}
            disabled={loading || (!question.trim() && !image)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

        <div className={styles.disclaimer}>
          For clinical decision support only · Final decisions rest with the treating physician
        </div>
      </div>
    </>
  )
}