import React from 'react'
import { Link } from 'react-router-dom'
import { useAppContext } from '../components/WalletContext.jsx'

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: 'End-to-End Encrypted',
    description: 'All medical files are AES-256 encrypted before being stored on IPFS. Your data is always private.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Patient-Controlled Access',
    description: 'Grant and revoke doctor access at any time. You own your health data — nobody else.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    title: 'Immutable Audit Trail',
    description: 'Every access event is recorded permanently on Ethereum. Full transparency, zero tampering.',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
    title: 'Decentralized Storage',
    description: 'Records live on IPFS — no single point of failure, no central authority, available anywhere.',
    color: 'bg-purple-50 text-purple-600',
  },
]

const steps = [
  { step: '01', title: 'Connect Wallet', desc: 'Connect MetaMask to authenticate securely on the blockchain.' },
  { step: '02', title: 'Register Profile', desc: 'Register as a patient or doctor. Identity verified on-chain.' },
  { step: '03', title: 'Upload Records', desc: 'Upload medical files — encrypted and stored on IPFS via Pinata.' },
  { step: '04', title: 'Control Access', desc: 'Grant or revoke doctor access instantly. All actions audited on-chain.' },
]

export default function LandingPage() {
  const { isConnected, connectWallet, isConnecting, userRole } = useAppContext()
  const dashboardLink = userRole === 'patient' ? '/patient' : userRole === 'doctor' ? '/doctor' : '/register'

  return (
    <div className="min-h-screen">

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live on Ethereum Sepolia Testnet
            </div>
            <h1 className="font-display text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Your Medical Records,{' '}
              <span className="text-blue-200">Secured by Blockchain</span>
            </h1>
            <p className="text-xl text-blue-100 mb-10 leading-relaxed">
              MedLedger gives patients full ownership of their health data. Store, share, and control
              access to medical records on a decentralized, tamper-proof blockchain network.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isConnected ? (
                <Link to={dashboardLink} className="btn-primary bg-white text-blue-700 hover:bg-blue-50 text-base px-8 py-3.5 shadow-lg">
                  Go to Dashboard →
                </Link>
              ) : (
                <button
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className="btn-primary bg-white text-blue-700 hover:bg-blue-50 text-base px-8 py-3.5 shadow-lg"
                >
                  {isConnecting ? 'Connecting…' : 'Connect MetaMask'}
                </button>
              )}
              <Link to="/register" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-white/30 text-white hover:bg-white/10 font-semibold text-base transition-all">
                Create Account
              </Link>
            </div>
            <div className="mt-12 flex items-center justify-center gap-8 text-blue-200 text-sm flex-wrap">
              {['Ethereum Blockchain', 'IPFS Storage', 'AES-256 Encryption', 'Open Source'].map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-slate-800 mb-4">Why MedLedger?</h2>
          <p className="text-slate-500 max-w-xl mx-auto">Built on blockchain principles — decentralized, transparent, and patient-first.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-stagger">
          {features.map((f) => (
            <div key={f.title} className="card p-6">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>{f.icon}</div>
              <h3 className="font-display font-bold text-slate-800 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-slate-800 mb-4">How It Works</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Four simple steps to take control of your health data.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <div key={s.step} className="card p-6 relative">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-blue-100 -translate-x-4 z-0" />
                )}
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-display font-bold text-sm flex items-center justify-center mb-4 relative z-10">
                  {s.step}
                </div>
                <h3 className="font-display font-bold text-slate-800 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="font-display text-3xl lg:text-4xl font-bold mb-4">Ready to Take Control?</h2>
          <p className="text-blue-100 mb-8">Join MedLedger and experience the future of healthcare data management.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            {isConnected ? (
              <Link to={dashboardLink} className="btn-primary bg-white text-blue-700 hover:bg-blue-50 px-8 py-3.5 text-base">
                Open Dashboard
              </Link>
            ) : (
              <button onClick={connectWallet} disabled={isConnecting}
                className="btn-primary bg-white text-blue-700 hover:bg-blue-50 px-8 py-3.5 text-base">
                Connect MetaMask
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-white font-display font-semibold">MedLedger</span>
          </div>
          <p>© 2024 MedLedger. Blockchain-secured healthcare records.</p>
          <p className="text-slate-500 text-xs">Deployed on Ethereum Sepolia Testnet</p>
        </div>
      </footer>
    </div>
  )
}
