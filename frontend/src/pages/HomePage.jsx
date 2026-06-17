import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getHealth } from '../api'
import styles from './HomePage.module.css'

export default function HomePage() {
  const navigate = useNavigate()
  const [health, setHealth] = useState(null)

  useEffect(() => {
    getHealth()
      .then(setHealth)
      .catch(() => setHealth({ status: 'unreachable' }))
  }, [])

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.badge}>
          <span className={styles.badgeDot} />
          Healthcare AI — ICU Command Center
        </div>

        <h1 className={styles.title}>
          Pran<span className={styles.titleAccent}>Rakshak </span> AI
        </h1>

        <p className={styles.subtitle}>
          Protecting life by identifying risk early<br />
          and helping doctors act first.
        </p>

        <p className={styles.description}>
          An intelligent hospital command center that continuously monitors
          patient data, predicts sepsis risk using validated machine learning,
          and ranks patients by urgency — so no patient deteriorates in silence.
        </p>

        <div className={styles.ctaRow}>
          <button
            className={styles.cta}
            onClick={() => navigate('/queue')}
          >
            Enter Patient Dashboard
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
          <a
            href="https://youtu.be/fSbjZsj-I0Q"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.demoLink}
          >
            Watch Demo
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.752 11.168l-3.197-2.132A1 1 0 0 0 10 9.87v4.263a1 1 0 0 0 1.555.832l3.197-2.132a1 1 0 0 0 0-1.664z" />
              <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
            </svg>
          </a>
        </div>

        {/* Stats row */}
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statNum}>11M+</span>
            <span className={styles.statLabel}>Sepsis deaths/year globally</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statNum}>7%</span>
            <span className={styles.statLabel}>Mortality rise per hour delayed</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statNum}>30–50%</span>
            <span className={styles.statLabel}>ICU sepsis mortality in India</span>
          </div>
        </div>

        {/* Features */}
        <div className={styles.features}>
          {[
            { icon: '⚡', label: 'Real-time risk scoring' },
            { icon: '📊', label: 'Explainable AI (SHAP)' },
            { icon: '🔔', label: 'Automatic escalation alerts' },
            { icon: '🤖', label: 'RAG clinical copilot' },
          ].map(f => (
            <div key={f.label} className={styles.feature}>
              <span className={styles.featureIcon}>{f.icon}</span>
              <span className={styles.featureLabel}>{f.label}</span>
            </div>
          ))}
        </div>

        {/* Backend status */}
        <div className={styles.status}>
          <span className={health?.status === 'ok' ? styles.statusDotGreen : styles.statusDotRed} />
          <span className={styles.statusText}>
            {health === null
              ? 'Connecting to backend...'
              : health.status === 'ok'
              ? `Backend connected · Model ${health.model_loaded ? 'ready' : 'loading'}`
              : 'Backend unreachable — start the FastAPI server'}
          </span>
        </div>
      </div>
    </div>
  )
}