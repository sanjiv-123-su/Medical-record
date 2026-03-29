import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react'
import { useWallet, useContract } from '../hooks/useContract.jsx'

const WalletContext = createContext(null)

export function WalletProvider({ children }) {
  const wallet = useWallet()
  const contract = useContract(wallet.signer)

  const [userRole, setUserRole] = useState(null)   // 'patient' | 'doctor' | null
  const [userProfile, setUserProfile] = useState(null)
  const [roleLoading, setRoleLoading] = useState(false)

  const mountedRef = useRef(true)

  // Detect role whenever the connected account changes
  useEffect(() => {
    mountedRef.current = true
    if (!wallet.account) {
      setUserRole(null)
      setUserProfile(null)
      return
    }
    if (!contract.isContractReady) {
      // Wait until contract configuration is available before checking role
      return
    }
    detectRole()
    return () => {
      mountedRef.current = false
    }
  }, [wallet.account, contract.isContractReady])

  async function detectRole() {
    if (!contract.isContractReady) return
    setRoleLoading(true)
    console.log('detectRole start', { account: wallet.account })
    try {
      const isPatient = await contract.isPatientRegistered(wallet.account)
      console.log('detectRole patient', { isPatient })
      if (!mountedRef.current) return
      if (isPatient) {
        const profile = await contract.getPatient(wallet.account)
        if (!mountedRef.current) return
        setUserRole('patient')
        setUserProfile(profile)
        console.log('detectRole result', { userRole: 'patient', profile })
        return
      }
      const isDoctor = await contract.isDoctorRegistered(wallet.account)
      console.log('detectRole doctor', { isDoctor })
      if (!mountedRef.current) return
      if (isDoctor) {
        const profile = await contract.getDoctor(wallet.account)
        if (!mountedRef.current) return
        setUserRole('doctor')
        setUserProfile(profile)
        console.log('detectRole result', { userRole: 'doctor', profile })
        return
      }
      if (!mountedRef.current) return
      setUserRole(null)
      setUserProfile(null)
      console.log('detectRole result', { userRole: null })
    } catch (err) {
      if (!mountedRef.current) return
      console.error('detectRole error', err)
      setUserRole(null)
      setUserProfile(null)
    } finally {
      if (mountedRef.current) {
        setRoleLoading(false)
      }
    }
  }

  const contextValue = useMemo(
    () => ({
      // Wallet state
      ...wallet,
      // Contract methods
      ...contract,
      // Role state
      userRole,
      userProfile,
      roleLoading,
      refreshRole: detectRole,
    }),
    [wallet, contract, userRole, userProfile, roleLoading]
  )

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  )
}

export function useAppContext() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useAppContext must be used within <WalletProvider>')
  return ctx
}