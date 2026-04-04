import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import PatientQueuePage from './pages/PatientQueuePage'
import DashboardPage from './pages/DashboardPage'
import CopilotDrawer from './components/CopilotDrawer'

export default function App() {
  const [copilotOpen, setCopilotOpen] = useState(false)
  const [copilotPatientId, setCopilotPatientId] = useState(null)

  const openCopilot = (patientId = null) => {
    setCopilotPatientId(patientId)
    setCopilotOpen(true)
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/queue"
          element={<PatientQueuePage openCopilot={openCopilot} />}
        />
        <Route
          path="/dashboard/:patientId"
          element={<DashboardPage openCopilot={openCopilot} />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <CopilotDrawer
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        patientId={copilotPatientId}
      />
    </BrowserRouter>
  )
}