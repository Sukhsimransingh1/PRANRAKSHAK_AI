import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, ResponsiveContainer, ReferenceLine
} from 'recharts'
import styles from './ShapChart.module.css'

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className={styles.tooltip}>
      <strong>{d.display_name || d.feature}</strong>
      <div>Impact: {d.impact > 0 ? '+' : ''}{d.impact.toFixed(4)}</div>
      <div style={{ color: d.color }}>{d.direction.replace('_', ' ')}</div>
    </div>
  )
}

export default function ShapChart({ shapFactors }) {
  if (!shapFactors || shapFactors.length === 0) {
    return (
      <div className={styles.empty}>
        No SHAP explanation available for this prediction.
      </div>
      
    )
    
  }

  const data = shapFactors.map(f => ({
    ...f,
    display_name: f.display_name || f.feature,
    absImpact: Math.abs(f.impact),
    color: f.direction === 'increases_risk' ? '#dc2626' : '#16a34a',
  }))

  return (
    <div className={styles.wrap}>
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: '#dc2626' }} />
          Increases risk
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: '#16a34a' }} />
          Decreases risk
        </span>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 20, left: 10, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => v.toFixed(2)}
          />
          <YAxis
            dataKey="display_name"
            type="category"
            width={140}
            tick={{ fontSize: 12, fill: '#475569' }}
            tickLine={false}
            axisLine={false}
          />
          <ReferenceLine x={0} stroke="#e2e8f0" strokeWidth={1} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="impact" radius={[0, 4, 4, 0]} maxBarSize={18}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.color} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}