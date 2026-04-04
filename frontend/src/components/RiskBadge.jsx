import React from 'react'
import styles from './RiskBadge.module.css'

export default function RiskBadge({ level, size = 'md', showDot = true }) {
  if (!level) return <span className={styles.unknown}>No prediction</span>

  const cls = {
    HIGH: styles.high,
    MEDIUM: styles.medium,
    LOW: styles.low,
  }[level] || styles.unknown

  const sizeCls = size === 'lg' ? styles.lg : size === 'sm' ? styles.sm : ''

  return (
    <span className={`${styles.badge} ${cls} ${sizeCls}`}>
      {showDot && <span className={styles.dot} />}
      {level}
    </span>
  )
}