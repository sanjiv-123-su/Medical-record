import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAppContext } from '../components/WalletContext.jsx'
import { StatCard, Alert, Spinner, Modal, EmptyState } from '../components/UI.jsx'
import RecordCard from '../components/RecordCard.jsx'
import {
  uploadRecordToIPFS,
  RECORD_TYPES,
  parseContractError,
  isValidAddress,
  formatTimestamp,
} from '../utils/helpers.jsx'

export default function PatientDashboard() {
  const {
    account, userProfile, userRole,
    getRecords, addMedicalRecord,
    grantAccess, revokeAccess, getAccessLogs,
  } = useAppContext()

  const [records, setRecords]       = useState([])
  const [accessLogs, setAccessLogs] = useState([])
  const [loading, setLoading]       = useState(true)
  const [activeTab, setActiveTab]   = useState('records') // records | access | logs

  // Upload state
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadDesc, setUploadDesc] = useState('')
  const [uploadType, setUploadType] = useState(RECORD_TYPES[0])
  const [uploading, setUploading]   = useState(false)
  const [uploadError, setUploadError] = useState(null)

  // Access control state
  const [grantAddr, setGrantAddr]   = useState('')
  const [revokeAddr, setRevokeAddr] = useState('')
  const [accessLoading, setAccessLoading] = useState(false)
  const [accessError, setAccessError]     = useState(null)

  const fetchData = useCallback(async () => {
    if (!account || userRole !== 'patient') return
    setLoading(true)
    try {
      const [recs, logs] = await Promise.all([
        getRecords(account),
        getAccessLogs(account).catch(() => []),
      ])
      setRecords(recs)
      setAccessLogs(logs)
    } catch (err) {
      console.error('fetchData error:', err)
    } finally {
      setLoading(false)
    }
  }, [account, userRole, getRecords, getAccessLogs])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleUpload(e) {
    e.preventDefault()
    if (!uploadFile || !uploadDesc.trim()) return
    setUploading(true)
    setUploadError(null)
    try {
      const result = await uploadRecordToIPFS(uploadFile, account, uploadDesc, uploadType)
      await addMedicalRecord(account, result.ipfsHash, uploadDesc, uploadType)
      toast.success('Record uploaded and secured on blockchain!')
      setUploadOpen(false)
      setUploadFile(null)
      setUploadDesc('')
      fetchData()
    } catch (err) {
      setUploadError(parseContractError(err))
    } finally {
      setUploading(false)
    }
  }

  async function handleGrant(e) {
    e.preventDefault()
    if (!isValidAddress(grantAddr)) { setAccessError('Invalid wallet address'); return }
    setAccessLoading(true); setAccessError(null)
    try {
      await grantAccess(grantAddr)
      toast.success('Access granted!')
      setGrantAddr('')
      fetchData()
    } catch (err) {
      setAccessError(parseContractError(err))
    } finally {
      setAccessLoading(false)
    }
  }

  async function handleRevoke(e) {
    e.preventDefault()
    if (!isValidAddress(revokeAddr)) { setAccessError('Invalid wallet address'); return }
    setAccessLoading(true); setAccessError(null)
    try {
      await revokeAccess(revokeAddr)
      toast.success('Access revoked!')
      setRevokeAddr('')
      fetchData()
    } catch (err) {
      setAccessError(parseContractError(err))
    } finally {
      setAccessLoading(false)
    }
  }

  if (userRole !== 'patient') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card p-10 text-center max-w-md">
          <p className="text-slate-500 mb-4">This dashboard is for patients only.</p>
          <Link to="/register" className="btn-primary">Register as Patient</Link>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'records', label: 'My Records',    count: records.length },
    { id: 'access',  label: 'Access Control' },
    { id: 'logs',    label: 'Audit Logs',    count: accessLogs.length },
  ]

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-800">
              Welcome, {userProfile?.name || 'Patient'} 👋
            </h1>
            <p className="text-slate-500 text-sm mt-1">Manage your medical records securely</p>
          </div>
          <button onClick={() => setUploadOpen(true)} className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload Record
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-stagger">
          <StatCard label="Total Records"   value={records.length}          color="blue"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>}
          />
          <StatCard label="Access Logs"     value={accessLogs.length}       color="green"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>}
          />
          <StatCard label="Your Age"        value={userProfile?.age ?? '—'} color="orange"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>}
          />
          <StatCard label="Blockchain" value="Secured" color="green"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>
              {tab.label}
              {tab.count !== undefined && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'
                }`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Records tab */}
        {activeTab === 'records' && (
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
            ) : records.length === 0 ? (
              <EmptyState
                icon={<svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>}
                title="No records yet"
                description="Upload your first medical record to get started."
                action={<button onClick={() => setUploadOpen(true)} className="btn-primary">Upload First Record</button>}
              />
            ) : (
              <div className="space-y-4 animate-stagger">
                {records.map((rec, i) => <RecordCard key={i} record={rec} />)}
              </div>
            )}
          </div>
        )}

        {/* Access Control tab */}
        {activeTab === 'access' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-stagger">
            <div className="card p-6">
              <h3 className="section-title">Grant Access</h3>
              <p className="section-subtitle">Allow a doctor to view your records</p>
              {accessError && <Alert type="error" message={accessError} onClose={() => setAccessError(null)} />}
              <form onSubmit={handleGrant} className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Doctor Wallet Address</label>
                  <input type="text" className="input-field font-mono text-sm" placeholder="0x…"
                    value={grantAddr} onChange={(e) => setGrantAddr(e.target.value)} required />
                </div>
                <button type="submit" disabled={accessLoading} className="btn-success w-full justify-center">
                  {accessLoading ? <Spinner size="sm" color="white" /> : 'Grant Access'}
                </button>
              </form>
            </div>
            <div className="card p-6">
              <h3 className="section-title">Revoke Access</h3>
              <p className="section-subtitle">Remove a doctor's access to your records</p>
              <form onSubmit={handleRevoke} className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Doctor Wallet Address</label>
                  <input type="text" className="input-field font-mono text-sm" placeholder="0x…"
                    value={revokeAddr} onChange={(e) => setRevokeAddr(e.target.value)} required />
                </div>
                <button type="submit" disabled={accessLoading} className="btn-danger w-full justify-center">
                  {accessLoading ? <Spinner size="sm" color="white" /> : 'Revoke Access'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Audit Logs tab */}
        {activeTab === 'logs' && (
          <div>
            {accessLogs.length === 0 ? (
              <EmptyState
                icon={<svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>}
                title="No audit logs yet"
                description="Access events will appear here once doctors interact with your records."
              />
            ) : (
              <div className="card overflow-hidden animate-fade-in">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="text-left px-5 py-3.5 font-semibold text-slate-600">Viewer</th>
                        <th className="text-left px-5 py-3.5 font-semibold text-slate-600">Action</th>
                        <th className="text-left px-5 py-3.5 font-semibold text-slate-600">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {accessLogs.map((log, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{log.viewer}</td>
                          <td className="px-5 py-3.5">
                            <span className={
                              log.action === 'GRANT'  ? 'badge-green' :
                              log.action === 'REVOKE' ? 'badge-red'   : 'badge-blue'
                            }>{log.action}</span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-500">{formatTimestamp(log.timestamp)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Modal open={uploadOpen} onClose={() => { setUploadOpen(false); setUploadError(null) }} title="Upload Medical Record">
        {uploadError && <Alert type="error" message={uploadError} onClose={() => setUploadError(null)} />}
        <form onSubmit={handleUpload} className="space-y-4 mt-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Medical File</label>
            <div
              className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-blue-300 transition-colors cursor-pointer"
              onClick={() => document.getElementById('file-input').click()}
            >
              {uploadFile ? (
                <div className="flex items-center gap-3 justify-center">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-slate-700">{uploadFile.name}</span>
                  <span className="text-xs text-slate-400">({(uploadFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              ) : (
                <>
                  <svg className="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <p className="text-sm text-slate-500">Click to select file</p>
                  <p className="text-xs text-slate-400 mt-1">PDF, JPEG, PNG — up to 50 MB</p>
                </>
              )}
              <input id="file-input" type="file" className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.txt"
                onChange={(e) => setUploadFile(e.target.files[0])} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <input type="text" className="input-field" placeholder="e.g. Blood test results from City Hospital"
              value={uploadDesc} onChange={(e) => setUploadDesc(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Record Type</label>
            <select className="input-field" value={uploadType} onChange={(e) => setUploadType(e.target.value)}>
              {RECORD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <button type="submit" disabled={uploading || !uploadFile} className="btn-primary w-full justify-center py-3">
            {uploading ? (
              <><Spinner size="sm" color="white" /> Encrypting &amp; uploading to IPFS…</>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload &amp; Secure on Blockchain
              </>
            )}
          </button>
        </form>
      </Modal>
    </div>
  )
}
