import React, { useState, useEffect, useCallback } from 'react'
import Navbar from '../components/Navbar'
import StatCards from '../components/StatCards'
import AlertSection from '../components/AlertSection'
import PatientCard from '../components/PatientCard'
import AddPatientModal from '../components/AddPatientModal'
import { getPatients, getAlerts } from '../api'
import styles from './PatientQueuePage.module.css'

export default function PatientQueuePage({ openCopilot }) {
  const [patients, setPatients] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      const [pts, alts] = await Promise.all([getPatients(), getAlerts()])
      setPatients(pts)
      setAlerts(alts)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(() => fetchAll(true), 30000)
    return () => clearInterval(interval)
  }, [fetchAll])

  const handlePatientCreated = newPatient => {
    setPatients(prev => {
      const updated = [newPatient, ...prev]
      return updated.sort((a, b) => {
        const order = { HIGH: 0, MEDIUM: 1, LOW: 2 }
        const ao = order[a.latest_risk_level] ?? 3
        const bo = order[b.latest_risk_level] ?? 3
        if (ao !== bo) return ao - bo
        return (b.latest_probability || 0) - (a.latest_probability || 0)
      })
    })
    fetchAll(true)
  }

  const handlePatientDeleted = (deletedId) => {
    setPatients(prev => prev.filter(p => p.id !== deletedId))
    fetchAll(true)
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchAll(true)
  }

  return (
    <div className={styles.page}>
      <Navbar openCopilot={openCopilot} />

      <main className={styles.main}>
        {/* Page header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Patient Queue</h1>
            <p className={styles.pageSubtitle}>
              ICU Ward B · Sorted by risk priority
            </p>
          </div>
          <div className={styles.headerActions}>
            <button
              className={styles.refreshBtn}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : '↻ Refresh'}
            </button>
            <button
              className={styles.addBtn}
              onClick={() => setModalOpen(true)}
            >
              + Add Patient
            </button>
          </div>
        </div>

        {/* Stats */}
        <StatCards patients={patients} />

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className={styles.section}>
            <AlertSection alerts={alerts} />
          </div>
        )}

        {/* Queue */}
        <div className={styles.queueSection}>
          <div className={styles.queueHeader}>
            <h2 className={styles.queueTitle}>
              Priority Queue
              {patients.length > 0 && (
                <span className={styles.queueCount}>{patients.length}</span>
              )}
            </h2>
            <span className={styles.queueNote}>Click any patient to view full dashboard</span>
          </div>

          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <span>Loading patients...</span>
            </div>
          ) : error ? (
            <div className={styles.error}>
              <strong>Could not load patients.</strong>
              <p>{error}</p>
              <button className={styles.retryBtn} onClick={() => fetchAll()}>
                Retry
              </button>
            </div>
          ) : patients.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🏥</div>
              <h3>No patients added yet</h3>
              <p>Click "Add Patient" to add your first patient and run the sepsis prediction.</p>
              <button
                className={styles.addBtn}
                onClick={() => setModalOpen(true)}
              >
                + Add First Patient
              </button>
            </div>
          ) : (
            <div className={styles.list}>
              {patients.map((patient, idx) => (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  rank={idx + 1}
                  onDeleted={handlePatientDeleted}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <AddPatientModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handlePatientCreated}
      />
    </div>
  )
}