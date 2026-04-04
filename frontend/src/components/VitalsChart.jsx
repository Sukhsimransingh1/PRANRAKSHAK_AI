import React, { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import styles from './VitalsChart.module.css'

const VITALS = [
  { key: 'hr',    label: 'Heart Rate',  unit: 'bpm',   color: '#dc2626' },
  { key: 'sbp',   label: 'Systolic BP', unit: 'mmHg',  color: '#2563eb' },
  { key: 'o2sat', label: 'O₂ Sat',      unit: '%',     color: '#0891b2' },
  { key: 'temp',  label: 'Temperature', unit: '°C',    color: '#d97706' },
  { key: 'resp',  label: 'Resp Rate',   unit: '/min',  color: '#7c3aed' },
]

export default function VitalsChart({ vitals }) {
  const [active, setActive] = useState(['hr', 'sbp', 'o2sat'])

  if (!vitals || vitals.length === 0) {
    return (
      <div className={styles.empty}>No vitals data available.</div>
    )
  }

  const data = vitals.map((row, i) => ({
    reading: `R${i + 1}`,
    hr: row.hr,
    sbp: row.sbp,
    o2sat: row.o2sat,
    temp: row.temp,
    resp: row.resp,
  }))

  const toggle = key =>
    setActive(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    )

  return (
    <div className={styles.wrap}>
      <div className={styles.toggles}>
        {VITALS.map(v => (
          <button
            key={v.key}
            className={`${styles.toggle} ${active.includes(v.key) ? styles.toggleActive : ''}`}
            style={active.includes(v.key) ? { borderColor: v.color, color: v.color } : {}}
            onClick={() => toggle(v.key)}
          >
            {v.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="reading"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 12px rgba(0,0,0,.08)',
            }}
          />
          {VITALS.filter(v => active.includes(v.key)).map(v => (
            <Line
              key={v.key}
              type="monotone"
              dataKey={v.key}
              name={v.label}
              stroke={v.color}
              strokeWidth={2}
              dot={{ r: 3, fill: v.color }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}