import React, { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAppContext } from '../components/WalletContext.jsx'
import { Alert, Spinner } from '../components/UI.jsx'
import { parseContractError } from '../utils/helpers.jsx'

const SPECIALIZATIONS = [
  'General Physician', 'Cardiologist', 'Neurologist', 'Orthopedic',
  'Dermatologist', 'Pediatrician', 'Oncologist', 'Radiologist',
  'Psychiatrist', 'Other',
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const { account, isConnected, connectWallet, registerPatient, registerDoctorSelf, refreshRole, isContractReady, isCorrectNetwork, userRole, roleLoading, error: walletError } = useAppContext()

  const [role, setRole]         = useState(null)   // 'patient' | 'doctor'
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  // Patient form
  const [patientName, setPatientName] = useState('')
  const [patientAge, setPatientAge]   = useState('')
  const [patientWallet, setPatientWallet] = useState('')

  // Doctor form
  const [doctorName, setDoctorName] = useState('')
  const [doctorSpec, setDoctorSpec] = useState('')
  const [doctorWallet, setDoctorWallet] = useState('')

  useEffect(() => {
    if (account) {
      setPatientWallet(account)
      setDoctorWallet(account)
    }
  }, [account])

  useEffect(() => {
    console.log('RegisterPage hook:', {userRole, isConnected, isCorrectNetwork, isContractReady, roleLoading})
    if (!isConnected || !isCorrectNetwork || !isContractReady || roleLoading) return

    if (userRole === 'doctor') {
      navigate('/doctor')
      return
    }
    if (userRole === 'patient') {
      navigate('/patient')
      return
    }
  }, [userRole, isConnected, isContractReady, roleLoading, navigate])

  async function handleRegisterPatient(e) {
    e.preventDefault()
    if (userRole === 'patient') {
      navigate('/patient')
      return
    }
    if (userRole === 'doctor') {
      navigate('/doctor')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await registerPatient(patientName.trim(), Number.parseInt(patientAge, 10))
      await refreshRole()
      toast.success('Patient registered successfully!')
      navigate('/patient')
    } catch (err) {
      setError(parseContractError(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleRegisterDoctor(e) {
    e.preventDefault()
    if (userRole === 'doctor') {
      navigate('/doctor')
      return
    }
    if (userRole === 'patient') {
      navigate('/patient')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await registerDoctorSelf(doctorName.trim(), doctorSpec)
      await refreshRole()
      toast.success('Doctor registered successfully!')
      navigate('/doctor')
    } catch (err) {
      setError(parseContractError(err))
    } finally {
      setLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card p-10 max-w-md w-full text-center">
          {(walletError || error) && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
              {walletError || error}
            </div>
          )}
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="font-display text-xl font-bold text-slate-800 mb-2">Connect Your Wallet</h2>
          <p className="text-slate-500 text-sm mb-6">You need MetaMask to register on MedLedger.</p>
          <button onClick={connectWallet} className="btn-primary w-full justify-center">
            Connect MetaMask
          </button>
        </div>
      </div>
    )
  }

  if (!isCorrectNetwork) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card p-10 max-w-md w-full text-center border-orange-200 bg-orange-50">
          <h2 className="font-display text-xl font-bold text-orange-800 mb-2">Switch to Sepolia</h2>
          <p className="text-orange-700 text-sm mb-6">Please switch your wallet to the Sepolia test network before using MedLedger.</p>
          <button onClick={connectWallet} className="btn-primary w-full justify-center">
            Reconnect Wallet
          </button>
        </div>
      </div>
    )
  }

  if (!isContractReady) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card p-8 max-w-md w-full text-center border-red-200 bg-red-50">
          <h2 className="font-display text-xl font-bold text-red-700 mb-3">Contract not configured</h2>
          <p className="text-sm text-red-700 mb-4">
            Set your contract data in <code>frontend/src/contractConfig.json</code> or add <code>VITE_CONTRACT_ADDRESS</code> + <code>VITE_CONTRACT_ABI</code> in <code>.env</code> and restart.
          </p>
          <p className="text-sm text-slate-500">
            After deployment run <code>npm run deploy:local</code> or <code>npm run deploy:sepolia</code>.
          </p>
        </div>
      </div>
    )
  }

  if (userRole === 'doctor' || userRole === 'patient') {
    const dest = userRole === 'doctor' ? '/doctor' : '/patient'
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card p-10 max-w-md w-full text-center">
          <h2 className="font-display text-2xl font-bold text-slate-800 mb-4">Account already registered</h2>
          <p className="text-slate-500 mb-6">
            You are already registered as <strong>{userRole}</strong>.
            You can go directly to dashboard or switch wallet to register a different account.
          </p>
          <div className="space-y-3">
            <button onClick={() => navigate(dest)} className="btn-primary w-full justify-center py-3">
              Go to Dashboard
            </button>
            <button onClick={() => { connectWallet(); window.location.reload() }} className="btn-secondary w-full justify-center py-3">
              Switch Wallet / Reconnect
            </button>
            <button onClick={() => { window.location.href = '/register'; }} className="btn-ghost w-full justify-center py-3">
              Stay on Registration Page
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">

        <div className="text-center mb-10 animate-fade-in">
          <h1 className="font-display text-3xl font-bold text-slate-800 mb-2">Create Your Account</h1>
          <p className="text-slate-500">Register on the MedLedger blockchain network</p>
        </div>

        {!role ? (
          /* Role selection */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-stagger">
            <button onClick={() => setRole('patient')}
              className="card p-8 text-left hover:border-blue-200 hover:shadow-md transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-5 group-hover:bg-blue-100 transition-colors">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="font-display font-bold text-slate-800 text-lg mb-2">I'm a Patient</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Upload and manage your medical records. Control who can view them.</p>
              <div className="mt-4 text-blue-600 text-sm font-semibold">Register as Patient →</div>
            </button>

            <button onClick={() => setRole('doctor')}
              className="card p-8 text-left hover:border-emerald-200 hover:shadow-md transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5 group-hover:bg-emerald-100 transition-colors">
                <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="font-display font-bold text-slate-800 text-lg mb-2">I'm a Doctor</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Access patient records (with permission) and add medical entries.</p>
              <div className="mt-4 text-emerald-600 text-sm font-semibold">Register as Doctor →</div>
            </button>
          </div>
        ) : (
          /* Registration form */
          <div className="card p-8 animate-fade-in">
            <button onClick={() => { setRole(null); setError(null) }}
              className="btn-ghost text-sm mb-6 -ml-2">← Back</button>

            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${role === 'patient' ? 'bg-blue-50' : 'bg-emerald-50'}`}>
                {role === 'patient' ? (
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                )}
              </div>
              <div>
                <h2 className="font-display font-bold text-slate-800">
                  {role === 'patient' ? 'Patient Registration' : 'Doctor Registration'}
                </h2>
                <p className="text-xs text-slate-400">This transaction will be recorded on-chain</p>
              </div>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

            {role === 'patient' ? (
              <form onSubmit={handleRegisterPatient} className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                  <input type="text" className="input-field" placeholder="Enter your full name"
                    value={patientName} onChange={(e) => setPatientName(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Age</label>
                  <input type="number" className="input-field" placeholder="Enter your age"
                    value={patientAge} onChange={(e) => setPatientAge(e.target.value)}
                    min="1" max="120" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Wallet Address</label>
                  <input type="text" className="input-field" value={patientWallet}
                    onChange={(e) => setPatientWallet(e.target.value)} placeholder="Enter wallet address" required />
                  <p className="text-xs text-slate-400 mt-1">Registration still uses your connected wallet signer.</p>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
                  {loading ? <><Spinner size="sm" color="white" /> Registering on blockchain…</> : 'Register as Patient'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterDoctor} className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                  <input type="text" className="input-field" placeholder="Dr. Jane Smith"
                    value={doctorName} onChange={(e) => setDoctorName(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Specialization</label>
                  <select className="input-field" value={doctorSpec} onChange={(e) => setDoctorSpec(e.target.value)} required>
                    <option value="">Select specialization</option>
                    {SPECIALIZATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Wallet Address</label>
                  <input type="text" className="input-field" value={doctorWallet}
                    onChange={(e) => setDoctorWallet(e.target.value)} placeholder="Enter wallet address" required />
                  <p className="text-xs text-slate-400 mt-1">Registration still uses your connected wallet signer.</p>
                </div>
                <button type="submit" disabled={loading} className="btn-success w-full justify-center py-3 mt-2">
                  {loading ? <><Spinner size="sm" color="white" /> Registering on blockchain…</> : 'Register as Doctor'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
