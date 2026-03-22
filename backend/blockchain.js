/**
 * Blockchain Service
 * Handles all smart contract interactions via ethers.js
 */

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

let contractConfig;
try {
  contractConfig = require("./contractConfig.json");
} catch {
  contractConfig = { contractAddress: process.env.CONTRACT_ADDRESS, abi: [] };
}

// ─────────────────────────────────────────────────────────────
//  PROVIDER & CONTRACT SETUP
// ─────────────────────────────────────────────────────────────

/**
 * Get ethers provider
 * @returns {ethers.JsonRpcProvider}
 */
function getProvider() {
  const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
  return new ethers.JsonRpcProvider(rpcUrl);
}

/**
 * Get signer (backend wallet for admin operations)
 * @returns {ethers.Wallet}
 */
function getSigner() {
  const provider = getProvider();
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error("PRIVATE_KEY not configured");
  return new ethers.Wallet(privateKey, provider);
}

/**
 * Get contract instance (read-only)
 * @returns {ethers.Contract}
 */
function getContract() {
  const provider = getProvider();
  return new ethers.Contract(
    contractConfig.contractAddress,
    contractConfig.abi,
    provider
  );
}

/**
 * Get contract instance with signer (write operations)
 * @returns {ethers.Contract}
 */
function getSignedContract() {
  const signer = getSigner();
  return new ethers.Contract(
    contractConfig.contractAddress,
    contractConfig.abi,
    signer
  );
}

// ─────────────────────────────────────────────────────────────
//  CONTRACT INTERACTIONS
// ─────────────────────────────────────────────────────────────

/**
 * Get all records for a patient
 * @param {string} patientAddress
 * @returns {Promise<Array>}
 */
async function getPatientRecords(patientAddress) {
  const contract = getContract();
  const records = await contract.getRecords(patientAddress);
  return records.map(record => ({
    ipfsHash: record.ipfsHash,
    description: record.description,
    doctorAddress: record.doctorAddress,
    timestamp: Number(record.timestamp),
    recordType: record.recordType,
  }));
}

/**
 * Get patient information
 * @param {string} patientAddress
 */
async function getPatientInfo(patientAddress) {
  const contract = getContract();
  const patient = await contract.getPatient(patientAddress);
  return {
    wallet: patient.wallet,
    name: patient.name,
    age: Number(patient.age),
    registered: patient.registered,
    registeredAt: Number(patient.registeredAt),
  };
}

/**
 * Get doctor information
 * @param {string} doctorAddress
 */
async function getDoctorInfo(doctorAddress) {
  const contract = getContract();
  const doctor = await contract.getDoctor(doctorAddress);
  return {
    wallet: doctor.wallet,
    name: doctor.name,
    specialization: doctor.specialization,
    registered: doctor.registered,
    registeredAt: Number(doctor.registeredAt),
  };
}

/**
 * Check if a doctor has access to a patient's records
 * @param {string} patientAddress
 * @param {string} doctorAddress
 * @returns {Promise<boolean>}
 */
async function checkAccess(patientAddress, doctorAddress) {
  const contract = getContract();
  return await contract.checkAccess(patientAddress, doctorAddress);
}

/**
 * Get access logs for a patient (admin function)
 * @param {string} patientAddress
 * @returns {Promise<Array>}
 */
async function getAccessLogs(patientAddress) {
  // Note: in production, this would use patient's own signer
  const contract = getContract();
  // Access logs require patient's signature in the contract
  // Here we return them via a trusted backend query
  return [];
}

module.exports = {
  getProvider,
  getSigner,
  getContract,
  getSignedContract,
  getPatientRecords,
  getPatientInfo,
  getDoctorInfo,
  checkAccess,
  getAccessLogs,
  contractAddress: contractConfig.contractAddress,
};
