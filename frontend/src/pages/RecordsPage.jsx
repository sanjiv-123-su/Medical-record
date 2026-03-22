import React, { useState, useEffect, useCallback } from 'react'
import { useAppContext } from '../components/WalletContext.jsx'
import { Spinner, EmptyState, Alert } from '../components/UI.jsx'
import RecordCard from '../components/RecordCard.jsx'
import { isValidAddress, parseContractError, RECORD_TYPES } from '../utils/helpers.jsx'

export default function RecordsPage() {
  const { account, userRole, getRecords, checkAccess } = useAppContext()

  const [records, setRecords]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [filter, setFilter]         = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  // Doctor: search patient by address
  const [patientAddr, setPatientAddr] = useState('')

  const fetchRecords = useCallback(async (address) => {
    if (!address) return
    setLoading(true); setError(null)
    try {
      setRecords(await getRecords(address))
    } catch (err) {
      setError(parseContractError(err))
    } finally {
      setLoading(false)
    }
  }, [getRecords])

  useEffect(() => {
    if (userRole === 'patient' && account) {
      fetchRecords(account)
    } else {
      setLoading(false)
    }
  }, [account, userRole, fetchRecords])

  async function handleDoctorSearch(e) {
    e.preventDefault()
    if (!isValidAddress(patientAddr)) { setError('Invalid wallet address'); return }
    const access = await checkAccess(patientAddr, account)
    if (!access) { setError("You don't have access to this patient's records."); return }
    fetchRecords(patientAddr)
  }

  const recordTypes = ['All', ...new Set(records.map((r) => r.recordType).filter(Boolean))]

  const filtered = records.filter((r) => {
    const matchType  = filter === 'All' || r.recordType === filter
    const matchSearch = !searchQuery ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.recordType?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchType && matchSearch
  })

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="font-display text-2xl font-bold text-slate-800">
            {userRole === 'patient' ? 'My Medical Records' : 'Patient Records'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            All records are encrypted on IPFS with hashes secured on Ethereum.
          </p>
        </div>

        {/* Doctor: address search */}
        {userRole === 'doctor' && (
          <div className="card p-5 mb-6 animate-fade-in">
            <form onSubmit={handleDoctorSearch} className="flex gap-3">
              <input type="text" className="input-field font-mono text-sm flex-1"
                placeholder="Enter patient wallet address (0x…)"
                value={patientAddr} onChange={(e) => setPatientAddr(e.target.value)} />
              <button type="submit" className="btn-primary flex-shrink-0">Load Records</button>
            </form>
          </div>
        )}

        {error && <Alert type="error" message={error} onClose={() => setError(null)} className="mb-6" />}

        {/* Filter + search */}
        {records.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-fade-in">
            <input type="text" className="input-field flex-1" placeholder="Search records…"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <div className="flex gap-2 overflow-x-auto pb-1">
              {recordTypes.map((type) => (
                <button key={type} onClick={() => setFilter(type)}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    filter === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}>
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>}
            title={searchQuery || filter !== 'All' ? 'No matching records' : 'No records found'}
            description={
              searchQuery || filter !== 'All'
                ? 'Try adjusting your search or filter.'
                : userRole === 'patient'
                ? 'Upload your first medical record from the patient dashboard.'
                : 'Search for a patient address to view their records.'
            }
          />
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-4">
              Showing {filtered.length} of {records.length} record{records.length !== 1 ? 's' : ''}
            </p>
            <div className="space-y-4 animate-stagger">
              {filtered.map((rec, i) => <RecordCard key={i} record={rec} />)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
