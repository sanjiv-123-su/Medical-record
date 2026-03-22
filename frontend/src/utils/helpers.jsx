/**
 * Utility functions for MedLedger frontend
 */

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
export const IPFS_GATEWAY = import.meta.env.VITE_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs'

// ─── Address utils ───────────────────────────────────────────

export function shortenAddress(address, chars = 4) {
  if (!address) return ''
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function isValidAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// ─── Date utils ──────────────────────────────────────────────

export function formatTimestamp(ts) {
  if (!ts) return '—';
  const d = new Date(ts * 1000);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(ts) {
  const now = Date.now() / 1000;
  const diff = now - ts;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── IPFS utils ──────────────────────────────────────────────

export function getIPFSUrl(hash) {
  if (!hash) return ''
  return `${IPFS_GATEWAY}/${hash}`;
}

// ─── Record type utils ───────────────────────────────────────

export const RECORD_TYPES = [
  "Lab Report",
  "Prescription",
  "X-Ray / Scan",
  "Blood Test",
  "Surgery Report",
  "Vaccination Record",
  "Discharge Summary",
  "Consultation Notes",
  "Other",
];

export function getRecordTypeColor(type) {
  const map = {
    "Lab Report": "badge-blue",
    "Prescription": "badge-green",
    "X-Ray / Scan": "badge-orange",
    "Blood Test": "badge-red",
    "Surgery Report": "badge-orange",
    "Vaccination Record": "badge-green",
    "Discharge Summary": "badge-blue",
    'Consultation Notes': 'badge-gray',
  };
  return map[type] || 'badge-gray'
}

// ─── API calls ───────────────────────────────────────────────

export async function uploadRecordToIPFS(file, patientAddress, description, recordType) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("patientAddress", patientAddress);
  formData.append("description", description);
  formData.append("recordType", recordType || "Other");

  const response = await axios.post(`${API_BASE}/records/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function getRecordsFromAPI(patientAddress, requesterAddress) {
  const response = await axios.get(`${API_BASE}/records/${patientAddress}`, {
    params: { requesterAddress },
  });
  return response.data;
}

// ─── Chain utils ─────────────────────────────────────────────

export const SUPPORTED_CHAINS = {
  31337: { name: "Localhost", color: "badge-gray" },
  11155111: { name: "Sepolia", color: "badge-blue" },
  1: { name: "Ethereum", color: "badge-green" },
};

export function getChainInfo(chainId) {
  return SUPPORTED_CHAINS[chainId] || { name: `Chain ${chainId}`, color: 'badge-gray' }
}

// ─── Error parsing ───────────────────────────────────────────

export function parseContractError(error) {
  // Extract revert reason from ethers error
  const msg = error?.reason || error?.message || 'Transaction failed';
  // Strip "execution reverted: " prefix
  return msg.replace(/.*execution reverted: /i, "").replace(/.*MedLedger: /i, "");
}

// ─── Copy to clipboard ──────────────────────────────────────

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
