import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAppContext } from '../components/WalletContext.jsx'
import { Alert, Spinner, EmptyState } from '../components/UI.jsx'
import RecordCard from '../components/RecordCard.jsx'
import {
  isValidAddress,
  parseContractError,
  shortenAddress,
  uploadRecordToIPFS,
  RECORD_TYPES,
} from '../utils/helpers.jsx'

export default function DoctorDashboard() {
  const {
    account, userProfile, userRole,
    getRecords, getPatient, checkAccess, addMedicalRecord,
  } = useAppContext()

  const [searchAddr, setSearchAddr]   = useState('')
  const [patientInfo, setPatientInfo] = useState(null)
  const [patientRecords, setPatientRecords] = useState([])
  const [hasAccess, setHasAccess]     = useState(false)
  const [searching, setSearching]     = useState(false)
  const [searchError, setSearchError] = useState(null)
  const [searched, setSearched]       = useState(false)

  // Add record
  const [addFile, setAddFile]     = useState(null)
  const [addDesc, setAddDesc]     = useState('')
  const [addType, setAddType]     = useState(RECORD_TYPES[0])
  const [adding, setAdding]       = useState(false)
  const [addError, setAddError]   = useState(null)
  const [showAdd, setShowAdd]     = useState(false)

  async function handleSearch(e) {
    e.preventDefault()
    if (!isValidAddress(searchAddr)) { setSearchError('Please enter a valid Ethereum wallet address'); return }
    setSearching(true); setSearchError(null); setSearched(false)
    try {
      const [access, patient] = await Promise.all([
        checkAccess(searchAddr, account),
        getPatient(searchAddr).catch(() => null),
      ])
      setHasAccess(access)
      setPatientInfo(patient)
      if (access) {
        setPatientRecords(await getRecords(searchAddr))
      } else {
        setPatientRecords([])
      }
      setSearched(true)
    } catch (err) {
      setSearchError(parseContractError(err))
    } finally {
      setSearching(false)
    }
  }

  async function handleAddRecord(e) {
    e.preventDefault()
    if (!addFile || !addDesc.trim()) return
    setAdding(true); setAddError(null)
    try {
      const result = await uploadRecordToIPFS(addFile, searchAddr, addDesc, addType)
      await addMedicalRecord(searchAddr, result.ipfsHash, addDesc, addType)
      toast.success('Medical record added successfully!')
      setAddFile(null); setAddDesc(''); setShowAdd(false)
      setPatientRecords(await getRecords(searchAddr))
    } catch (err) {
      setAddError(parseContractError(err))
    } finally {
      setAdding(false)
    }
  }

  if (userRole !== 'doctor') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card p-10 text-center max-w-md">
          <p className="text-slate-500 mb-4">This dashboard is for doctors only.</p>
          <Link to="/register" className="btn-primary">Register as Doctor</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="font-display text-2xl font-bold text-slate-800">
            Dr. {userProfile?.name || 'Doctor'} 👨‍⚕️
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {userProfile?.specialization} · Access patient records with their permission
          </p>
        </div>

        {/* Doctor card */}
        <div className="card p-5 mb-8 flex items-center gap-4 animate-fade-in">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800">{userProfile?.name}</p>
            <p className="text-sm text-slate-500">{userProfile?.specialization}</p>
          </div>
          <span className="badge-green">Verified Doctor</span>
        </div>

        {/* Patient Search */}
        <div className="card p-6 mb-8 animate-fade-in">
          <h2 className="section-title">Search Patient</h2>
          <p className="section-subtitle">Enter a patient's wallet address (requires their permission)</p>
          {searchError && <Alert type="error" message={searchError} onClose={() => setSearchError(null)} />}
          <form onSubmit={handleSearch} className="flex gap-3 mt-4">
            <input type="text" className="input-field font-mono text-sm flex-1"
              placeholder="Patient wallet address (0x…)"
              value={searchAddr} onChange={(e) => setSearchAddr(e.target.value)} />
            <button type="submit" disabled={searching} className="btn-primary flex-shrink-0">
              {searching ? <Spinner size="sm" color="white" /> : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
              Search
            </button>
          </form>
        </div>

        {/* Results */}
        {searched && (
          <div className="animate-fade-in">
            {patientInfo && (
              <div className="card p-5 mb-6 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{patientInfo.name}</p>
                    <p className="text-xs text-slate-500">Age: {patientInfo.age} · {shortenAddress(patientInfo.wallet)}</p>
                  </div>
                </div>
                {hasAccess ? <span className="badge-green">✓ Access Granted</span> : <span className="badge-red">✗ No Access</span>}
              </div>
            )}

            {!patientInfo && (
              <Alert type="warning" title="Patient Not Found"
                message="This address is not registered as a patient on MedLedger." />
            )}

            {patientInfo && !hasAccess && (
              <Alert type="warning" title="Access Required"
                message="This patient has not granted you access. Ask them to grant access from their dashboard." />
            )}

            {hasAccess && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-bold text-slate-800">
                    Patient Records ({patientRecords.length})
                  </h2>
                  <button onClick={() => setShowAdd(!showAdd)} className="btn-success text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Record
                  </button>
                </div>

                {showAdd && (
                  <div className="card p-6 mb-6 border-emerald-100 animate-fade-in">
                    <h3 className="section-title">Add Medical Record</h3>
                    {addError && <Alert type="error" message={addError} onClose={() => setAddError(null)} />}
                    <form onSubmit={handleAddRecord} className="space-y-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Medical File</label>
                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center cursor-pointer hover:border-emerald-300 transition-colors"
                          onClick={() => document.getElementById('doc-file-input').click()}>
                          {addFile
                            ? <p className="text-sm font-medium text-slate-700">{addFile.name} ({(addFile.size / 1024).toFixed(1)} KB)</p>
                            : <p className="text-sm text-slate-400">Click to select file (PDF, JPEG, PNG)</p>}
                          <input id="doc-file-input" type="file" className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => setAddFile(e.target.files[0])} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                        <input type="text" className="input-field" placeholder="Diagnosis / findings"
                          value={addDesc} onChange={(e) => setAddDesc(e.target.value)} required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Record Type</label>
                        <select className="input-field" value={addType} onChange={(e) => setAddType(e.target.value)}>
                          {RECORD_TYPES.map((t) => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="flex gap-3">
                        <button type="submit" disabled={adding || !addFile} className="btn-success flex-1 justify-center">
                          {adding ? <Spinner size="sm" color="white" /> : 'Add Record to Blockchain'}
                        </button>
                        <button type="button" onClick={() => setShowAdd(false)} className="btn-ghost">Cancel</button>
                      </div>
                    </form>
                  </div>
                )}

                {patientRecords.length === 0 ? (
                  <EmptyState
                    icon={<svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>}
                    title="No records yet"
                    description="This patient has no medical records on the blockchain yet."
                  />
                ) : (
                  <div className="space-y-4 animate-stagger">
                    {patientRecords.map((rec, i) => <RecordCard key={i} record={rec} />)}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
