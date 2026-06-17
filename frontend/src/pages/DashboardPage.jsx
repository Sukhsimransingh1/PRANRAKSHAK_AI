import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import RiskBadge from '../components/RiskBadge'
import ShapChart from '../components/ShapChart'
import VitalsChart from '../components/VitalsChart'
import { getPatient, rerunPrediction, deletePatient } from '../api'
import demoPatients from '../data/demoPatients.json'
import styles from './DashboardPage.module.css'

function InfoRow({ label, value }) {
  return (
    <div className={styles.infoRow}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue}>{value ?? '—'}</span>
    </div>
  )
}

function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString([], {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function DashboardPage({ openCopilot }) {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const fileRef = useRef()

  const cachedPatient = demoPatients.find(p => p.id === parseInt(patientId))
  const [patient, setPatient] = useState(cachedPatient || null)
  const [loading, setLoading] = useState(!cachedPatient)
  const [error, setError] = useState('')
  const [rerunning, setRerunning] = useState(false)
  const [rerunError, setRerunError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    if (!cachedPatient) setLoading(true)
    setError('')
    try {
      const data = await getPatient(patientId)
      setPatient(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [patientId])

  const handleRerun = async e => {
    const f = e.target.files[0]
    if (!f) return
    setRerunning(true)
    setRerunError('')
    const fd = new FormData()
    fd.append('file', f)
    try {
      await rerunPrediction(patientId, fd)
      await load()
    } catch (err) {
      setRerunError(err.message)
    } finally {
      setRerunning(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete patient "${patient?.name}"?\nThis will permanently remove all their vitals, predictions, and alerts.`)) {
      return
    }
    setDeleting(true)
    try {
      await deletePatient(patientId)
      navigate('/queue')
    } catch (err) {
      alert(`Failed to delete patient: ${err.message}`)
    } finally {
      setDeleting(false)
    }
  }

  const shapSummary = () => {
    if (!patient?.shap_factors?.length) return null
    const top3 = patient.shap_factors.slice(0, 3)
    const increasing = top3.filter(f => f.direction === 'increases_risk')
    if (!increasing.length) return null
    const names = increasing.map(f => f.display_name || f.feature).join(', ')
    return `Risk primarily driven by: ${names}.`
  }

  if (loading) return (
    <div className={styles.page}>
      <Navbar openCopilot={openCopilot} patientId={+patientId} />
      <div className={styles.loadingCenter}>
        <div className={styles.spinner} />
        <span>Loading patient data...</span>
      </div>
    </div>
  )

  if (error && !patient) return (
    <div className={styles.page}>
      <Navbar openCopilot={openCopilot} patientId={+patientId} />
      <div className={styles.errorCenter}>
        <p>{error}</p>
        <button className={styles.backBtn} onClick={() => navigate('/queue')}>
          ← Back to Queue
        </button>
      </div>
    </div>
  )

  const prob = patient.latest_probability
  const pct = prob !== null && prob !== undefined ? Math.round(prob * 100) : null

  return (
    <div className={styles.page}>
      <Navbar openCopilot={openCopilot} patientId={+patientId} />

      <main className={styles.main}>
        {/* Patient header card */}
        <div className={styles.headerCard}>
          <div className={styles.headerLeft}>
            <div className={styles.avatar}>
              {patient.name?.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className={styles.patientName}>{patient.name}</h1>
              <div className={styles.patientMeta}>
                {patient.bed_number} · Age {patient.age} · {patient.gender}
              </div>
              <div className={styles.patientAdmit}>
                Added: {formatDateTime(patient.created_at)}
              </div>
            </div>
          </div>

          <div className={styles.headerRight}>
            {patient.latest_risk_level ? (
              <div className={styles.riskDisplay}>
                <RiskBadge level={patient.latest_risk_level} size="lg" />
                {pct !== null && (
                  <div className={styles.probDisplay}>
                    <span className={styles.probNum}>{pct}%</span>
                    <span className={styles.probLabel}>Sepsis probability</span>
                  </div>
                )}
                <div className={styles.assessedAt}>
                  Assessed: {formatDateTime(patient.latest_predicted_at)}
                </div>
              </div>
            ) : (
              <div className={styles.noPred}>No prediction yet</div>
            )}

            <div className={styles.actions}>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className={styles.hiddenInput}
                id="rerun-csv"
                onChange={handleRerun}
              />
              <label
                htmlFor="rerun-csv"
                className={`${styles.rerunBtn} ${rerunning ? styles.rerunBtnDisabled : ''}`}
              >
                {rerunning
                  ? <><span className={styles.smallSpinner} /> Re-running...</>
                  : '↻ Re-run Prediction'}
              </label>

              <button
                className={styles.copilotBtn}
                onClick={() => openCopilot(+patientId)}
              >
                Ask Copilot
              </button>

              <button
                className={styles.deleteBtn}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <><span className={styles.smallSpinner} /> Deleting...</>
                ) : (
                  '🗑 Delete Patient'
                )}
              </button>
            </div>

            {rerunError && (
              <div className={styles.rerunError}>{rerunError}</div>
            )}
          </div>
        </div>

        {/* SHAP plain-english summary */}
        {shapSummary() && (
          <div className={styles.summaryBanner}>
            <span className={styles.summaryIcon}>🔍</span>
            {shapSummary()}
          </div>
        )}

        {/* Charts row */}
        <div className={styles.chartsRow}>

          <div className={styles.chartCard}>
            <h2 className={styles.cardTitle}>
              Vitals Trend
              <span className={styles.cardSubtitle}>Click legend items to toggle</span>
            </h2>
            <VitalsChart vitals={patient.vitals} />
          </div>

          <div className={styles.chartCard}>
            <h2 className={styles.cardTitle}>
              SHAP Explainability
              <span className={styles.cardSubtitle}>Top factors influencing sepsis risk</span>
            </h2>
            <ShapChart shapFactors={patient.shap_factors} />
          </div>
        </div>

        {/* Latest vitals table */}
        {patient.vitals?.length > 0 && (
          <div className={styles.vitalsCard}>
            <h2 className={styles.cardTitle}>Latest Vitals Snapshot</h2>
            <div className={styles.vitalsGrid}>
              {[
                { label: 'Heart Rate', key: 'hr', unit: 'bpm', normal: '60–100' },
                { label: 'Systolic BP', key: 'sbp', unit: 'mmHg', normal: '90–120' },
                { label: 'MAP', key: 'map_val', unit: 'mmHg', normal: '70–100' },
                { label: 'O₂ Sat', key: 'o2sat', unit: '%', normal: '>95' },
                { label: 'Temperature', key: 'temp', unit: '°C', normal: '36.5–37.5' },
                { label: 'Resp Rate', key: 'resp', unit: '/min', normal: '12–20' },
                { label: 'WBC', key: 'wbc', unit: 'x10⁹/L', normal: '4–11' },
                { label: 'Creatinine', key: 'creatinine', unit: 'mg/dL', normal: '0.6–1.2' },
                { label: 'Glucose', key: 'glucose', unit: 'mg/dL', normal: '70–140' },
              ].map(({ label, key, unit, normal }) => {
                const latest = patient.vitals[patient.vitals.length - 1]
                const val = latest?.[key]
                return (
                  <div key={key} className={styles.vitalTile}>
                    <div className={styles.vitalLabel}>{label}</div>
                    <div className={styles.vitalValue}>
                      {val !== null && val !== undefined
                        ? Number(val).toFixed(1)
                        : '—'}
                      <span className={styles.vitalUnit}> {unit}</span>
                    </div>
                    <div className={styles.vitalNormal}>Normal: {normal}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Clinical disclaimer */}
        <div className={styles.disclaimer}>
          ⚠️ This system provides clinical decision support only.
          All treatment decisions must be made by the treating physician.
        </div>
      </main>
    </div>
  )
}