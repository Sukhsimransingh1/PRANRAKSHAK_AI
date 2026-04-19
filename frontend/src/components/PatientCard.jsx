import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import RiskBadge from './RiskBadge'
import { deletePatient } from '../api'
import styles from './PatientCard.module.css'

function ProbBar({ value }) {
  if (value === null || value === undefined) return null
  const pct = Math.round(value * 100)
  const color =
    value >= 0.75 ? '#dc2626' :
    value >= 0.40 ? '#d97706' : '#16a34a'
  return (
    <div className={styles.barWrap}>
      <div className={styles.barTrack}>
        <div
          className={styles.barFill}
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className={styles.barVal}>{pct}%</span>
    </div>
  )
}

function formatDate(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleString([], {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function PatientCard({ patient, rank, onDeleted }) {
  const navigate = useNavigate()
  const [deleting, setDeleting] = useState(false)

  const isHigh = patient.latest_risk_level === 'HIGH'

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (!window.confirm(`Delete patient "${patient.name}"?\nThis will remove all their vitals, predictions, and alerts permanently.`)) {
      return
    }
    setDeleting(true)
    try {
      await deletePatient(patient.id)
      onDeleted?.(patient.id)
    } catch (err) {
      alert(`Failed to delete patient: ${err.message}`)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      className={`${styles.card} ${isHigh ? styles.cardHigh : ''}`}
      onClick={() => navigate(`/dashboard/${patient.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/dashboard/${patient.id}`)}
    >
      <div className={styles.rank}>{rank}</div>

      <div className={styles.info}>
        <div className={styles.name}>{patient.name}</div>
        <div className={styles.meta}>
          {patient.bed_number} · Age {patient.age} · {patient.gender}
        </div>
      </div>

      <div className={styles.riskCol}>
        <RiskBadge level={patient.latest_risk_level} />
      </div>

      <div className={styles.probCol}>
        <ProbBar value={patient.latest_probability} />
        {patient.latest_predicted_at && (
          <div className={styles.timestamp}>
            {formatDate(patient.latest_predicted_at)}
          </div>
        )}
      </div>

      <button
        className={styles.deleteBtn}
        onClick={handleDelete}
        disabled={deleting}
        title="Delete patient"
        aria-label={`Delete patient ${patient.name}`}
      >
        {deleting ? (
          <span className={styles.deleteSpinner} />
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        )}
      </button>

      <div className={styles.arrow}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </div>
  )
}