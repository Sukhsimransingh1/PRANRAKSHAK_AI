import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import styles from './Navbar.module.css'

export default function Navbar({ openCopilot, patientId }) {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav className={styles.nav}>
      <div className={styles.left}>
        <button className={styles.logo} onClick={() => navigate('/')}>
          <div className={styles.logoIcon}>PR</div>
          <span className={styles.logoText}>PranRakshak AI</span>
        </button>
        <div className={styles.breadcrumb}>
          {location.pathname.includes('dashboard') ? (
            <>
              <button
                className={styles.breadcrumbLink}
                onClick={() => navigate('/queue')}
              >
                Patient Queue
              </button>
              <span className={styles.breadcrumbSep}>/</span>
              <span className={styles.breadcrumbCurrent}>Dashboard</span>
            </>
          ) : (
            <span className={styles.breadcrumbCurrent}>Patient Queue</span>
          )}
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.userBadge}>
          <div className={styles.avatar}>DS</div>
          <div>
            <div className={styles.userName}>Dr. Sharma</div>
            <div className={styles.userRole}>ICU Attending</div>
          </div>
        </div>

        <button
          className={styles.copilotBtn}
          onClick={() => openCopilot(patientId || null)}
          title="Open AI Copilot"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          AI Copilot
        </button>
      </div>
    </nav>
  )
}