import React from 'react'
import styles from './AlertSection.module.css'

function formatTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function AlertSection({ alerts }) {
  if (!alerts || alerts.length === 0) return null

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.icon}>🔔</span>
          <span className={styles.title}>Active Alerts</span>
          <span className={styles.count}>{alerts.length}</span>
        </div>
      </div>

      <div className={styles.list}>
        {alerts.slice(0, 5).map(alert => (
          <div key={alert.id} className={styles.alert}>
            <div className={styles.alertDot} />
            <div className={styles.alertContent}>
              <span className={styles.alertName}>
                {alert.patient_name} — {alert.bed_number}
              </span>
              <span className={styles.alertMsg}>
                Risk escalated
                {alert.old_risk_level ? ` from ${alert.old_risk_level}` : ''} to{' '}
                <strong>{alert.new_risk_level}</strong>
                {' '}· Probability: {(alert.probability * 100).toFixed(1)}%
              </span>
            </div>
            <span className={styles.alertTime}>
              {formatTime(alert.triggered_at)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}