<<<<<<< HEAD
# Medical-record
=======
# 🏥 MedLedger – Blockchain-Based Medical Records Management System

A decentralized healthcare application that gives patients full ownership of their medical records using Ethereum and IPFS.

---

## 🏗️ Architecture

```
React Frontend (MetaMask + Ethers.js)
        │
Node.js Backend API (Express)
        │
   ┌────┴────┐
   │         │
Ethereum   IPFS
Smart     (Pinata)
Contract
```

- **Medical files** → Encrypted (AES-256-GCM) → Uploaded to IPFS
- **IPFS hash + permissions** → Stored on Ethereum smart contract
- **Access control** → Enforced on-chain via smart contract

---

## 🗂️ Project Structure

```
medledger/
├── contracts/
│   └── MedicalRecords.sol      # Solidity smart contract
├── scripts/
│   └── deploy.js               # Hardhat deployment script
├── backend/
│   ├── server.js               # Express.js API server
│   ├── ipfs.js                 # Pinata IPFS + AES encryption
│   ├── blockchain.js           # Ethers.js contract interaction
│   ├── routes/
│   │   ├── records.js          # POST /uploadRecord, GET /records/:address
│   │   ├── patients.js         # GET /patients/:address
│   │   ├── doctors.js          # GET /doctors/:address
│   │   └── access.js           # GET /access/check
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.js              # Root with routing
│   │   ├── index.js            # React entry point
│   │   ├── index.css           # Global styles + Tailwind
│   │   ├── contractConfig.json # ABI + deployed address
│   │   ├── hooks/
│   │   │   └── useContract.js  # Wallet + contract hooks
│   │   ├── utils/
│   │   │   └── helpers.js      # Shared utilities
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   ├── RecordCard.js
│   │   │   ├── TxModal.js
│   │   │   ├── StatusBanner.js
│   │   │   ├── LoadingSpinner.js
│   │   │   └── EmptyState.js
│   │   └── pages/
│   │       ├── Landing.js         # Home page
│   │       ├── PatientDashboard.js
│   │       ├── DoctorDashboard.js
│   │       ├── RecordsPage.js
│   │       └── NotFound.js
│   └── package.json
├── hardhat.config.js
├── package.json
└── README.md
```

---

## 🚀 Setup & Installation

### Prerequisites

- Node.js v18+
- MetaMask browser extension
- Pinata account → https://pinata.cloud
- Sepolia testnet ETH → https://sepoliafaucet.com

---

### 1. Clone & Install Root Dependencies

```bash
git clone <repo>
cd medledger
npm install
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=5000
RPC_URL=https://rpc.sepolia.org
PRIVATE_KEY=your_private_key
CONTRACT_ADDRESS=         # fill after deploy
PINATA_API_KEY=your_key
PINATA_SECRET_KEY=your_secret
FRONTEND_URL=http://localhost:3000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `frontend/.env`:
```env
REACT_APP_CONTRACT_ADDRESS=   # fill after deploy
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs
```

---

### 4. Compile Smart Contract

```bash
# From project root
npm run compile
```

### 5. Deploy Smart Contract

**Option A: Local Hardhat Network**
```bash
npx hardhat node           # Terminal 1 — starts local chain
npm run deploy:local       # Terminal 2
```

**Option B: Sepolia Testnet**
```bash
# Add to root .env:
# PRIVATE_KEY=your_key
# SEPOLIA_RPC_URL=https://rpc.sepolia.org

npm run deploy:sepolia
```

> After deployment, `contractConfig.json` is auto-written to both `backend/` and `frontend/src/`.

---

### 6. Start Development Servers

```bash
# Backend (Terminal 1)
cd backend && npm run dev

# Frontend (Terminal 2)
cd frontend && npm start
```

Or from root:
```bash
npm run dev
```

App runs at: **http://localhost:3000**

---

## 🔧 MetaMask Setup for Sepolia

1. Open MetaMask → Settings → Networks → Add Network
2. Network Name: `Sepolia Testnet`
3. RPC URL: `https://rpc.sepolia.org`
4. Chain ID: `11155111`
5. Symbol: `ETH`
6. Block Explorer: `https://sepolia.etherscan.io`

Get test ETH: https://sepoliafaucet.com

---

## 📋 Smart Contract Functions

| Function | Access | Description |
|---|---|---|
| `registerPatient(name, age)` | Any wallet | Register as a patient |
| `registerDoctorSelf(name, spec)` | Any wallet | Register as a doctor |
| `grantAccess(doctorAddr)` | Patient only | Give doctor access |
| `revokeAccess(doctorAddr)` | Patient only | Remove doctor access |
| `addMedicalRecord(patient, hash, desc, type)` | Doctor (with access) | Add IPFS record |
| `getRecords(patient)` | Patient or authorized doctor | Fetch all records |
| `getAccessLogs(patient)` | Patient only | View audit trail |
| `checkAccess(patient, doctor)` | Public view | Check permission |

---

## 🔒 Security Model

```
File Upload Flow:
  1. File selected in browser
  2. Sent to backend via multipart POST
  3. AES-256-GCM encrypted with random key + IV
  4. Encrypted blob uploaded to IPFS via Pinata
  5. IPFS CID returned
  6. Patient signs blockchain tx to store CID

Access Flow:
  1. Doctor requests access (off-chain)
  2. Patient calls grantAccess(doctorAddress) on-chain
  3. Smart contract records permission
  4. Doctor can now call getRecords(patientAddress)
  5. All access events logged in AccessLog on-chain
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | Solidity 0.8.20 |
| Blockchain | Ethereum Sepolia Testnet |
| Contract Dev | Hardhat |
| Frontend | React 18, Tailwind CSS |
| Wallet | MetaMask + Ethers.js v6 |
| Backend API | Node.js + Express.js |
| File Storage | IPFS via Pinata SDK |
| Encryption | AES-256-GCM (Node.js crypto) |

---

## 📝 API Reference

### POST `/api/records/upload`
Upload encrypted medical file to IPFS.
```json
Body (multipart/form-data):
  file: <binary>
  patientAddress: "0x..."
  description: "Annual blood panel"
  recordType: "Lab Report"

Response:
  { ipfsHash, encryptionKey, iv, authTag, fileUrl }
```

### GET `/api/records/:patientAddress`
Get all blockchain records for a patient.
```
Query: ?requesterAddress=0x...
Response: { records: [...], count: N }
```

### GET `/api/access/check`
```
Query: ?patientAddress=0x...&doctorAddress=0x...
Response: { hasAccess: true/false }
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

Built with ❤️ for decentralized healthcare.

---

## ⚡ Vite Migration Notes

This project uses **Vite 5** instead of Create React App. Key differences:

| Concern | CRA | Vite |
|---------|-----|------|
| Entry HTML | `public/index.html` | `index.html` in project root |
| Entry JS | `src/index.js` | `src/main.jsx` |
| Dev server | `npm start` | `npm run dev` |
| Build output | `build/` | `dist/` |
| Env prefix | `REACT_APP_` | `VITE_` |
| Env access | `process.env.REACT_APP_X` | `import.meta.env.VITE_X` |
| Config file | none (hidden) | `vite.config.js` |
| Component files | `.js` | `.jsx` |

### Environment Variables
All frontend env vars must be prefixed with `VITE_`:

```bash
# frontend/.env
VITE_API_URL=http://localhost:5000/api
VITE_CONTRACT_ADDRESS=0x...
VITE_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
VITE_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs
```

> **Security:** Only `VITE_`-prefixed variables are exposed to the browser bundle.
> Never put private keys or secrets in `VITE_` variables.

### Dev Server Proxy
`vite.config.js` proxies `/api/*` requests to `http://localhost:5000` during development,
so you don't need CORS configuration for local dev:

```js
server: {
  proxy: {
    '/api': { target: 'http://localhost:5000', changeOrigin: true }
  }
}
```

### ethers.js + Vite
The config includes a `global: 'globalThis'` shim required by ethers.js v6 in the
browser ESM environment:

```js
define: { global: 'globalThis' }
```

### contractConfig.json
After running `npm run deploy:local` or `npm run deploy:sepolia`, the deploy script
automatically writes `frontend/src/contractConfig.json` with the ABI and address.
`useContract.jsx` imports it dynamically with a graceful fallback pre-deployment.

>>>>>>> 1d70610 (initial commit)
