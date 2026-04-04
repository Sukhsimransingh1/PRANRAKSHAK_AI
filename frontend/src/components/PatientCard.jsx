import React from 'react'
import { useNavigate } from 'react-router-dom'
import RiskBadge from './RiskBadge'
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

export default function PatientCard({ patient, rank }) {
  const navigate = useNavigate()

  const isHigh = patient.latest_risk_level === 'HIGH'

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

      <div className={styles.arrow}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </div>
  )
}