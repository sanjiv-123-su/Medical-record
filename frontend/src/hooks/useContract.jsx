/**
 * useContract Hook
 * Central hook for all smart contract interactions via ethers.js + MetaMask
 * Vite/ESM version — uses import.meta.env instead of process.env
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { ethers } from 'ethers'
import contractConfigData from '../contractConfig.json'

const fileConfig = contractConfigData || null

const envContractAddress = import.meta.env.VITE_CONTRACT_ADDRESS ?? ''
const envAbi = (() => {
  const raw = import.meta.env.VITE_CONTRACT_ABI ?? ''
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
})()

const normalizedAbi = (() => {
  const rawAbi = (Array.isArray(fileConfig?.abi) && fileConfig.abi.length > 0)
    ? fileConfig.abi
    : envAbi

  if (!Array.isArray(rawAbi)) return []

  // Some config generators wrap ABI in an extra array level. Flatten if needed.
  if (rawAbi.length > 0 && Array.isArray(rawAbi[0])) {
    return rawAbi[0]
  }

  return rawAbi
})()

const contractConfig = {
  contractAddress:
    fileConfig?.contractAddress || envContractAddress || '',
  abi: normalizedAbi,
  chainId:
    Number(fileConfig?.chainId) || Number(import.meta.env.VITE_CHAIN_ID) || 11155111,
}

export const CONTRACT_ADDRESS = contractConfig.contractAddress
export const CONTRACT_ABI = contractConfig.abi

// ─────────────────────────────────────────────────────────────
//  WALLET CONNECTION
// ─────────────────────────────────────────────────────────────

export function useWallet() {
  const [account, setAccount] = useState(null)
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [chainId, setChainId] = useState(null)
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState(null)

  const mountedRef = useRef(true)

  const isMetaMaskInstalled = () =>
    typeof window !== 'undefined' && Boolean(window.ethereum)

  const connectWallet = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask not installed. Please install MetaMask to continue.')
      return null
    }
    try {
      setIsConnecting(true)
      setError(null)

      const _provider = new ethers.BrowserProvider(window.ethereum)
      await _provider.send('eth_requestAccounts', [])

      // Prefer auto-switching to Sepolia where possible.
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xaa36a7' }], // 11155111
        })
      } catch (switchError) {
        // 4902 = chain not added, request/add then retry
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xaa36a7',
              chainName: 'Sepolia Test Network',
              rpcUrls: ['https://rpc.sepolia.org'],
              blockExplorerUrls: ['https://sepolia.etherscan.io'],
              nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
            }],
          })
        } else {
          setError('Please switch wallet to Sepolia manually. ' + switchError.message)
        }
      }

      const _signer = await _provider.getSigner()
      const _account = await _signer.getAddress()
      const network = await _provider.getNetwork()
      const _chainId = Number(network.chainId)

      setProvider(_provider)
      setSigner(_signer)
      setAccount(_account)
      setChainId(_chainId)
      setIsCorrectNetwork(_chainId === 11155111)
      if (_chainId !== 11155111) {
        setError('Switch wallet to Sepolia network to continue.')
      }

      return { provider: _provider, signer: _signer, account: _account }
    } catch (err) {
      setError(err.message || 'Failed to connect wallet')
      return null
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const disconnectWallet = useCallback(() => {
    setAccount(null)
    setProvider(null)
    setSigner(null)
    setChainId(null)
  }, [])

  useEffect(() => {
    mountedRef.current = true
    if (!isMetaMaskInstalled()) return

    // Only restore session if user already explicitly connected before
    window.ethereum.request({ method: 'eth_accounts' }).then((accounts) => {
      if (!mountedRef.current) return
      if (accounts.length > 0) {
        const _provider = new ethers.BrowserProvider(window.ethereum)
        _provider.getSigner().then(async (_signer) => {
          if (!mountedRef.current) return
          const _account = await _signer.getAddress()
          const network  = await _provider.getNetwork()
          const _chainId = Number(network.chainId)
          setProvider(_provider)
          setSigner(_signer)
          setAccount(_account)
          setChainId(_chainId)
          setIsCorrectNetwork(_chainId === 11155111)
          if (_chainId !== 11155111) {
            setError('Switch wallet to Sepolia network to continue.')
          }
        }).catch(() => {
          // Session expired — stay disconnected
        })
      }
    })

    const handleAccountsChanged = (accounts) => {
      if (!mountedRef.current) return
      if (accounts.length === 0) disconnectWallet()
      else {
        const _provider = new ethers.BrowserProvider(window.ethereum)
        _provider.getSigner().then(async (_signer) => {
          if (!mountedRef.current) return
          const _account = await _signer.getAddress()
          const network  = await _provider.getNetwork()
          const _chainId = Number(network.chainId)
          setProvider(_provider)
          setSigner(_signer)
          setAccount(_account)
          setChainId(_chainId)
          setIsCorrectNetwork(_chainId === 11155111)
          if (_chainId !== 11155111) {
            setError('Switch wallet to Sepolia network to continue.')
          }
        }).catch(() => disconnectWallet())
      }
    }

    const handleChainChanged = async () => {
      if (!mountedRef.current) return
      const _provider = new ethers.BrowserProvider(window.ethereum)
      const network = await _provider.getNetwork()
      const _chainId = Number(network.chainId)
      setChainId(_chainId)
      setIsCorrectNetwork(_chainId === 11155111)
      if (_chainId !== 11155111) {
        setError('Switch wallet to Sepolia network to continue.')
      } else {
        setError(null)
      }
      window.location.reload()
    }

    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', handleChainChanged)

    return () => {
      mountedRef.current = false
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
      window.ethereum.removeListener('chainChanged', handleChainChanged)
    }
  }, [disconnectWallet])

  return {
    account,
    provider,
    signer,
    chainId,
    isCorrectNetwork,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    isConnected: Boolean(account),
    isMetaMaskInstalled: isMetaMaskInstalled(),
  }
}

// ─────────────────────────────────────────────────────────────
//  CONTRACT INTERACTION HOOK
// ─────────────────────────────────────────────────────────────

export function useContract(signer) {
  const getContract = useCallback(
    (readOnly = false) => {
      if (!CONTRACT_ADDRESS || !CONTRACT_ABI.length) {
        throw new Error(
          'Contract not configured. Ensure contractConfig.json has a valid address and ABI, or set VITE_CONTRACT_ADDRESS and VITE_CONTRACT_ABI in .env.'
        )
      }

      if (readOnly) {
        // Prefer using the wallet provider (via signer) when available so CORS is handled by MetaMask
        // This avoids public RPC endpoints like rpc.sepolia.org failing with browser CORS.
        let provider
        if (signer && signer.provider) {
          provider = signer.provider
        } else if (typeof globalThis.ethereum !== 'undefined') {
          provider = new ethers.BrowserProvider(globalThis.ethereum)
        } else {
          provider = new ethers.JsonRpcProvider(
            import.meta.env.VITE_RPC_URL ?? 'http://127.0.0.1:8545'
          )
        }

        return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
      }

      if (!signer) throw new Error('Wallet not connected')
      return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
    },
    [signer]
  )

  const registerPatient = useCallback(
    async (name, age) => {
      const tx = await getContract().registerPatient(name, age)
      return tx.wait()
    },
    [getContract]
  )

  const getPatient = useCallback(
    async (address) => {
      const p = await getContract(true).getPatient(address)
      return {
        wallet: p.wallet,
        name: p.name,
        age: Number(p.age),
        registered: p.registered,
        registeredAt: Number(p.registeredAt),
      }
    },
    [getContract]
  )

  const registerDoctorSelf = useCallback(
    async (name, specialization) => {
      const tx = await getContract().registerDoctorSelf(name, specialization)
      return tx.wait()
    },
    [getContract]
  )

  const getDoctor = useCallback(
    async (address) => {
      const d = await getContract(true).getDoctor(address)
      return {
        wallet: d.wallet,
        name: d.name,
        specialization: d.specialization,
        registered: d.registered,
        registeredAt: Number(d.registeredAt),
      }
    },
    [getContract]
  )

  const grantAccess = useCallback(
    async (doctorAddress) => {
      const tx = await getContract().grantAccess(doctorAddress)
      return tx.wait()
    },
    [getContract]
  )

  const revokeAccess = useCallback(
    async (doctorAddress) => {
      const tx = await getContract().revokeAccess(doctorAddress)
      return tx.wait()
    },
    [getContract]
  )

  const checkAccess = useCallback(
    async (patientAddress, doctorAddress) => {
      return getContract(true).checkAccess(patientAddress, doctorAddress)
    },
    [getContract]
  )

  const addMedicalRecord = useCallback(
    async (patientAddress, ipfsHash, description, recordType) => {
      const tx = await getContract().addMedicalRecord(
        patientAddress,
        ipfsHash,
        description,
        recordType
      )
      return tx.wait()
    },
    [getContract]
  )

  const getRecords = useCallback(
    async (patientAddress) => {
      const records = await getContract(true).getRecords(patientAddress)
      return records.map((r) => ({
        ipfsHash: r.ipfsHash,
        description: r.description,
        doctorAddress: r.doctorAddress,
        timestamp: Number(r.timestamp),
        recordType: r.recordType,
      }))
    },
    [getContract]
  )

  // FIX: getAccessLogs is a view function — use readOnly=true so it works
  // even when the wallet signer is not connected (e.g. on dashboard load)
  const getAccessLogs = useCallback(
    async (patientAddress) => {
      const logs = await getContract(true).getAccessLogs(patientAddress)
      return logs.map((l) => ({
        viewer: l.viewer,
        timestamp: Number(l.timestamp),
        action: l.action,
      }))
    },
    [getContract]
  )

  const isPatientRegistered = useCallback(
    async (address) => {
      try {
        const p = await getContract(true).patients(address)
        return p.registered
      } catch {
        return false
      }
    },
    [getContract]
  )

  const isDoctorRegistered = useCallback(
    async (address) => {
      try {
        const d = await getContract(true).doctors(address)
        return d.registered
      } catch {
        return false
      }
    },
    [getContract]
  )

  return {
    isContractReady: Boolean(CONTRACT_ADDRESS && CONTRACT_ABI.length),
    contractAddress: CONTRACT_ADDRESS,
    contractAbi: CONTRACT_ABI,
    registerPatient,
    getPatient,
    registerDoctorSelf,
    getDoctor,
    grantAccess,
    revokeAccess,
    checkAccess,
    addMedicalRecord,
    getRecords,
    getAccessLogs,
    isPatientRegistered,
    isDoctorRegistered,
  }
}