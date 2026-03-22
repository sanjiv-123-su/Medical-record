import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { WalletProvider } from './components/WalletContext.jsx'
import Navbar from './components/Navbar.jsx'
import LandingPage from './pages/LandingPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import PatientDashboard from './pages/PatientDashboard.jsx'
import DoctorDashboard from './pages/DoctorDashboard.jsx'
import RecordsPage from './pages/RecordsPage.jsx'

export default function App() {
  return (
    <Router>
      <WalletProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
              borderRadius: '12px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            },
            success: { iconTheme: { primary: '#059669', secondary: 'white' } },
            error:   { iconTheme: { primary: '#dc2626', secondary: 'white' } },
          }}
        />
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/"        element={<LandingPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/patient"  element={<PatientDashboard />} />
              <Route path="/doctor"   element={<DoctorDashboard />} />
              <Route path="/records"  element={<RecordsPage />} />
              <Route path="*"         element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </WalletProvider>
    </Router>
  )
}
