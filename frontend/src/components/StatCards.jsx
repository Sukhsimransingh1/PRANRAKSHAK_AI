import React from 'react'
import styles from './StatCards.module.css'

export default function StatCards({ patients }) {
  const total = patients.length
  const high = patients.filter(p => p.latest_risk_level === 'HIGH').length
  const medium = patients.filter(p => p.latest_risk_level === 'MEDIUM').length
  const low = patients.filter(p => p.latest_risk_level === 'LOW').length
  const pending = patients.filter(p => !p.latest_risk_level).length

  const cards = [
    { label: 'Total patients', value: total, color: 'blue' },
    { label: 'HIGH risk', value: high, color: 'red' },
    { label: 'MEDIUM risk', value: medium, color: 'amber' },
    { label: 'LOW risk', value: low, color: 'green' },
  ]

  return (
    <div className={styles.grid}>
      {cards.map(c => (
        <div key={c.label} className={`${styles.card} ${styles[c.color]}`}>
          <div className={styles.value}>{c.value}</div>
          <div className={styles.label}>{c.label}</div>
        </div>
      ))}
    </div>
  )
}