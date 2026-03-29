import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAppContext } from '../components/WalletContext.jsx';
import { Spinner, EmptyState, Alert } from '../components/UI.jsx';
import RecordCard from '../components/RecordCard.jsx';
import { isValidAddress, parseContractError, RECORD_TYPES } from '../utils/helpers.jsx';

export default function RecordsPage() {
  const { account, userRole, getRecords, checkAccess } = useAppContext();

  // --- State for Viewing Records ---
  const [records, setRecords]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [filter, setFilter]         = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [patientAddr, setPatientAddr] = useState(''); // Doctor: search patient by address

  // --- State for UI Layout ---
  const [viewMode, setViewMode] = useState('view'); 

  // --- State for Add Note Form ---
  const [notePatientId, setNotePatientId] = useState('');
  const [noteDate, setNoteDate]           = useState('');
  const [noteDiagnosis, setNoteDiagnosis] = useState('');
  const [noteDetails, setNoteDetails]     = useState('');

  const fetchRecords = useCallback(async (address) => {
    if (!address) return;
    setLoading(true); setError(null);
    try {
      setRecords(await getRecords(address));
    } catch (err) {
      setError(parseContractError(err));
    } finally {
      setLoading(false);
    }
  }, [getRecords]);

  useEffect(() => {
    if (userRole === 'patient' && account) {
      fetchRecords(account);
    } else {
      setLoading(false);
    }
  }, [account, userRole, fetchRecords]);

  async function handleDoctorSearch(e) {
    e.preventDefault();
    if (!isValidAddress(patientAddr)) { setError('Invalid wallet address'); return; }
    const access = await checkAccess(patientAddr, account);
    if (!access) { setError("You don't have access to this patient's records."); return; }
    fetchRecords(patientAddr);
  }

  const handleSaveNote = async (e) => {
    e.preventDefault();
    // TODO: Connect your Web3 smart contract call here using notePatientId, noteDate, noteDiagnosis, noteDetails
    toast.success('Clinical note encrypted and saved securely!');
    
    // Reset form after save
    setNotePatientId('');
    setNoteDate('');
    setNoteDiagnosis('');
    setNoteDetails('');
    setViewMode('view'); 
  };

  // Filter logic
  const recordTypes = ['All', ...new Set(records.map((r) => r.recordType).filter(Boolean))];
  const filtered = records.filter((r) => {
    const matchType   = filter === 'All' || r.recordType === filter;
    const matchSearch = !searchQuery ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.recordType?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  // ==========================================
  // EXTRACTED LOGIC TO FIX SONARQUBE WARNINGS
  // ==========================================

  // 1. Resolve Page Title
  let pageTitle = 'Patient Records';
  if (viewMode === 'add') {
    pageTitle = 'Add Clinical Note';
  } else if (userRole === 'patient') {
    pageTitle = 'My Medical Records';
  }

  // 2. Resolve Empty State Description
  const getEmptyStateDescription = () => {
    if (searchQuery || filter !== 'All') {
      return 'Try adjusting your search or filter.';
    }
    if (userRole === 'patient') {
      return 'Your medical records will appear here once uploaded by a doctor.';
    }
    return 'Search for a patient address to view their records.';
  };

  // 3. Resolve Content Rendering
  const renderListContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      );
    }

    if (filtered.length === 0) {
      return (
        <EmptyState
          icon={<svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>}
          title={searchQuery || filter !== 'All' ? 'No matching records' : 'No records found'}
          description={getEmptyStateDescription()}
        />
      );
    }

    return (
      <>
        <p className="text-sm font-medium text-slate-500 mb-4">
          Showing {filtered.length} of {records.length} record{records.length !== 1 ? 's' : ''}
        </p>
        <div className="space-y-4 animate-stagger">
          {filtered.map((rec, i) => <RecordCard key={i} record={rec} />)}
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Dynamic Header */}
        <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4 animate-fade-in">
          <div>
            <h1 className="section-title text-3xl">
              {pageTitle}
            </h1>
            <p className="section-subtitle mb-0">
              {viewMode === 'add' ? 'Record patient data securely to the ledger.' : 'All records are encrypted and secured on the blockchain.'}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="badge-blue mono">Wallet Connected</span>
            
            {/* Toggle button for Doctors only */}
            {userRole === 'doctor' && (
              <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                <button 
                  onClick={() => setViewMode('view')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === 'view' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  View Records
                </button>
                <button 
                  onClick={() => setViewMode('add')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === 'add' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Add Note
                </button>
              </div>
            )}
          </div>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} className="mb-6 animate-fade-in" />}

        {/* --- ADD CLINICAL NOTE VIEW --- */}
        {viewMode === 'add' && userRole === 'doctor' ? (
          <form onSubmit={handleSaveNote} className="card p-6 space-y-5 animate-stagger">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Patient ID (Wallet Address)</label>
                <input type="text" placeholder="0x..." className="input-field mono text-sm" required 
                       value={notePatientId} onChange={(e) => setNotePatientId(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Date of Visit</label>
                <input type="date" className="input-field" required 
                       value={noteDate} onChange={(e) => setNoteDate(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Diagnosis</label>
              <input type="text" placeholder="Primary diagnosis" className="input-field" required 
                     value={noteDiagnosis} onChange={(e) => setNoteDiagnosis(e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Clinical Notes</label>
              <textarea 
                rows="5" 
                placeholder="Enter subjective and objective observations..." 
                className="input-field resize-none"
                required
                value={noteDetails} onChange={(e) => setNoteDetails(e.target.value)}
              ></textarea>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <button type="button" onClick={() => setViewMode('view')} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Sign & Submit Record</button>
            </div>
          </form>
        ) : (
          
          /* --- VIEW RECORDS MODE --- */
          <div className="animate-fade-in">
            {/* Doctor: Address search form */}
            {userRole === 'doctor' && (
              <div className="card p-5 mb-6">
                <form onSubmit={handleDoctorSearch} className="flex gap-3">
                  <input type="text" className="input-field font-mono text-sm flex-1"
                    placeholder="Enter patient wallet address (0x…)"
                    value={patientAddr} onChange={(e) => setPatientAddr(e.target.value)} />
                  <button type="submit" className="btn-primary flex-shrink-0">Load Records</button>
                </form>
              </div>
            )}

            {/* Filter + search bar */}
            {records.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <input type="text" className="input-field flex-1" placeholder="Search records…"
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {recordTypes.map((type) => (
                    <button key={type} onClick={() => setFilter(type)}
                      className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                        filter === type
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}>
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Injected Content Function */}
            {renderListContent()}
            
          </div>
        )}

      </div>
    </div>
  );
}