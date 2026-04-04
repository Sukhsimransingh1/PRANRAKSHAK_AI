import React, { useState, useRef } from 'react'
import { createPatient } from '../api'
import styles from './AddPatientModal.module.css'

export default function AddPatientModal({ isOpen, onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '', bed_number: '', age: '', gender: 'Male'
  })
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  if (!isOpen) return null

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleFile = e => {
    const f = e.target.files[0]
    if (f && !f.name.endsWith('.csv')) {
      setError('Please upload a .csv file.')
      return
    }
    setFile(f)
    setError('')
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!file) { setError('Please upload a CSV file.'); return }
    if (!form.name.trim()) { setError('Patient name is required.'); return }
    if (!form.age || isNaN(form.age) || +form.age < 0 || +form.age > 120) {
      setError('Please enter a valid age (0–120).')
      return
    }

    setLoading(true)
    setError('')

    const fd = new FormData()
    fd.append('name', form.name.trim())
    fd.append('bed_number', form.bed_number.trim() || 'Unassigned')
    fd.append('age', String(+form.age))
    fd.append('gender', form.gender)
    fd.append('file', file)

    try {
      const patient = await createPatient(fd)
      onCreated(patient)
      setForm({ name: '', bed_number: '', age: '', gender: 'Male' })
      setFile(null)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to create patient.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Add New Patient</h2>
          <button className={styles.close} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <label className={styles.label}>
              Patient Name *
              <input
                className={styles.input}
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Rahul Sharma"
                required
              />
            </label>
            <label className={styles.label}>
              Bed Number
              <input
                className={styles.input}
                name="bed_number"
                value={form.bed_number}
                onChange={handleChange}
                placeholder="e.g. Bed 3"
              />
            </label>
          </div>

          <div className={styles.row}>
            <label className={styles.label}>
              Age *
              <input
                className={styles.input}
                name="age"
                type="number"
                min="0"
                max="120"
                value={form.age}
                onChange={handleChange}
                placeholder="e.g. 62"
                required
              />
            </label>
            <label className={styles.label}>
              Gender *
              <select
                className={styles.input}
                name="gender"
                value={form.gender}
                onChange={handleChange}
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </label>
          </div>

          <div className={styles.uploadArea}>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFile}
              className={styles.hiddenInput}
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className={styles.uploadLabel}>
              <div className={styles.uploadIcon}>📄</div>
              {file
                ? <><strong>{file.name}</strong><span>Click to change</span></>
                : <><strong>Upload Patient CSV</strong><span>Click to browse — .csv files only</span></>
              }
            </label>
          </div>

          <div className={styles.csvNote}>
            CSV must contain columns:{' '}
            <code>Hour, HR, O2Sat, Temp, SBP, MAP, Resp, WBC, Creatinine, Glucose, Age, ICULOS</code>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading
                ? <><span className={styles.spinner} /> Analysing CSV...</>
                : 'Add Patient & Run Prediction'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}