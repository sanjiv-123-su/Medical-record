/**
 * RecordCard Component - Displays a single medical record
 */
import React, { useState } from 'react';
import { formatTimestamp, shortenAddress, getRecordTypeColor, getIPFSUrl, copyToClipboard } from '../utils/helpers.jsx';

export default function RecordCard({ record, doctorName, index }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (text) => {
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const typeIcons = {
    "Lab Report": "🧪", "Prescription": "💊", "X-Ray / Scan": "🩻",
    "Blood Test": "🩸", "Surgery Report": "🔬", "Vaccination Record": "💉",
    "Discharge Summary": "📋", "Consultation Notes": "📝", "Other": "📄",
  };

  const icon = typeIcons[record.recordType] || '📄';

  return (
    <div className="card p-5 animate-fade-in" style={{ animationDelay: `${index * 60}ms` }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          {/* Icon */}
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">{icon}</div>
          {/* Content */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-display font-semibold text-slate-800 text-sm">{record.description}</h3>
              <span className={getRecordTypeColor(record.recordType)}>{record.recordType}</span>
            </div>
            <p className="text-xs text-slate-500 mb-2">{formatTimestamp(record.timestamp)}</p>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Dr. {doctorName || shortenAddress(record.doctorAddress)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => handleCopy(record.ipfsHash)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
            title="Copy IPFS hash"
          >
            {copied ? (
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
          <a
            href={getIPFSUrl(record.ipfsHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            title="View on IPFS"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      {/* IPFS hash */}
      <div className="mt-3 pt-3 border-t border-slate-50">
        <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
          <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span className="text-xs font-mono text-slate-500 truncate">{record.ipfsHash}</span>
        </div>
      </div>
    </div>
  );
}
