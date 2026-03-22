import React, { createContext, useContext, useState, useEffect } from 'react'
import { useWallet, useContract } from '../hooks/useContract.jsx'

const WalletContext = createContext(null)

export function WalletProvider({ children }) {
  const wallet = useWallet()
  const contract = useContract(wallet.signer)

  const [userRole, setUserRole] = useState(null)   // 'patient' | 'doctor' | null
  const [userProfile, setUserProfile] = useState(null)
  const [roleLoading, setRoleLoading] = useState(false)

  // Detect role whenever the connected account changes
  useEffect(() => {
    if (!wallet.account) {
      setUserRole(null)
      setUserProfile(null)
      return
    }
    detectRole()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.account])

  async function detectRole() {
    setRoleLoading(true)
    try {
      const isPatient = await contract.isPatientRegistered(wallet.account)
      if (isPatient) {
        const profile = await contract.getPatient(wallet.account)
        setUserRole('patient')
        setUserProfile(profile)
        return
      }
      const isDoctor = await contract.isDoctorRegistered(wallet.account)
      if (isDoctor) {
        const profile = await contract.getDoctor(wallet.account)
        setUserRole('doctor')
        setUserProfile(profile)
        return
      }
      setUserRole(null)
      setUserProfile(null)
    } catch {
      setUserRole(null)
      setUserProfile(null)
    } finally {
      setRoleLoading(false)
    }
  }

  return (
    <WalletContext.Provider
      value={{
        // Wallet state
        ...wallet,
        // Contract methods
        ...contract,
        // Role state
        userRole,
        userProfile,
        roleLoading,
        refreshRole: detectRole,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useAppContext() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useAppContext must be used within <WalletProvider>')
  return ctx
}
