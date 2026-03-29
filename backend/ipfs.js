/**
 * IPFS Upload Service using Pinata SDK
 * Handles encryption, upload, and retrieval of medical files
 */

const axios = require("axios");
const FormData = require("form-data");
const crypto = require("crypto");

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;
const PINATA_GATEWAY = process.env.PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs";

const PINATA_BASE_URL = "https://api.pinata.cloud";

if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
  throw new Error(
    "Missing Pinata credentials: set PINATA_API_KEY and PINATA_SECRET_KEY in backend/.env"
  );
}

// ─────────────────────────────────────────────────────────────
//  ENCRYPTION UTILITIES
// ─────────────────────────────────────────────────────────────

const ALGORITHM = "aes-256-gcm";

/**
 * Encrypt a buffer using AES-256-GCM
 * @param {Buffer} buffer - File data to encrypt
 * @param {string} secretKey - 32-byte hex secret key
 * @returns {{ encryptedData: Buffer, iv: string, authTag: string }}
 */
function encryptBuffer(buffer, secretKey) {
  const key = Buffer.from(secretKey, "hex");
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encryptedData: encrypted,
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  };
}

/**
 * Decrypt a buffer using AES-256-GCM
 * @param {Buffer} encryptedBuffer - Encrypted file data
 * @param {string} secretKey - 32-byte hex secret key
 * @param {string} iv - Initialization vector (hex)
 * @param {string} authTag - Authentication tag (hex)
 * @returns {Buffer} Decrypted data
 */
function decryptBuffer(encryptedBuffer, secretKey, iv, authTag) {
  const key = Buffer.from(secretKey, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, "hex"));
  decipher.setAuthTag(Buffer.from(authTag, "hex"));

  return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
}

/**
 * Generate a new encryption key
 * @returns {string} 32-byte hex key
 */
function generateEncryptionKey() {
  return crypto.randomBytes(32).toString("hex");
}

// ─────────────────────────────────────────────────────────────
//  PINATA UPLOAD FUNCTIONS
// ─────────────────────────────────────────────────────────────

/**
 * Upload a file to IPFS via Pinata
 * @param {Buffer} fileBuffer - File data
 * @param {string} fileName - Original file name
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<{ ipfsHash: string, pinSize: number }>}
 */
async function uploadFileToIPFS(fileBuffer, fileName, metadata = {}) {
  try {
    const formData = new FormData();

    formData.append("file", fileBuffer, {
      filename: fileName,
      contentType: "application/octet-stream",
    });

    // Add metadata
    const pinataMetadata = JSON.stringify({
      name: `MedLedger_${fileName}_${Date.now()}`,
      keyvalues: {
        system: "MedLedger",
        ...metadata,
      },
    });
    formData.append("pinataMetadata", pinataMetadata);

    // Pinata options
    const pinataOptions = JSON.stringify({ cidVersion: 1 });
    formData.append("pinataOptions", pinataOptions);

    const response = await axios.post(
      `${PINATA_BASE_URL}/pinning/pinFileToIPFS`,
      formData,
      {
        maxBodyLength: Infinity,
        headers: {
          "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_KEY,
        },
      }
    );

    return {
      ipfsHash: response.data.IpfsHash,
      pinSize: response.data.PinSize,
      timestamp: response.data.Timestamp,
    };
  } catch (error) {
    console.error("IPFS upload error:", error.response?.data || error.message);
    throw new Error(`IPFS upload failed: ${error.message}`);
  }
}

/**
 * Upload JSON metadata to IPFS via Pinata
 * @param {Object} jsonData - JSON data to upload
 * @param {string} name - Name for the pin
 * @returns {Promise<{ ipfsHash: string }>}
 */
async function uploadJSONToIPFS(jsonData, name = "MedLedger_Metadata") {
  try {
    const response = await axios.post(
      `${PINATA_BASE_URL}/pinning/pinJSONToIPFS`,
      {
        pinataContent: jsonData,
        pinataMetadata: { name, keyvalues: { system: "MedLedger" } },
        pinataOptions: { cidVersion: 1 },
      },
      {
        headers: {
          "Content-Type": "application/json",
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_KEY,
        },
      }
    );

    return { ipfsHash: response.data.IpfsHash };
  } catch (error) {
    throw new Error(`JSON upload failed: ${error.message}`);
  }
}

/**
 * Encrypt and upload a medical file to IPFS
 * @param {Buffer} fileBuffer - Raw file data
 * @param {string} fileName - Original file name
 * @param {string} patientAddress - Patient's wallet address
 * @param {string} [encryptionKey] - Optional: use existing key (otherwise generates new)
 * @returns {Promise<{ ipfsHash: string, encryptionKey: string, iv: string, authTag: string }>}
 */
async function encryptAndUpload(fileBuffer, fileName, patientAddress, encryptionKey = null) {
  // Generate encryption key if not provided
  const key = encryptionKey || generateEncryptionKey();

  // Encrypt the file
  const { encryptedData, iv, authTag } = encryptBuffer(fileBuffer, key);

  // Upload encrypted data to IPFS
  const { ipfsHash, pinSize } = await uploadFileToIPFS(
    encryptedData,
    `encrypted_${fileName}`,
    { patientAddress, encrypted: "true" }
  );

  return {
    ipfsHash,
    encryptionKey: key,
    iv,
    authTag,
    pinSize,
    originalFileName: fileName,
  };
}

/**
 * Retrieve and decrypt a file from IPFS
 * @param {string} ipfsHash - IPFS CID
 * @param {string} encryptionKey - 32-byte hex key
 * @param {string} iv - Initialization vector
 * @param {string} authTag - Auth tag
 * @returns {Promise<Buffer>} Decrypted file data
 */
async function retrieveAndDecrypt(ipfsHash, encryptionKey, iv, authTag) {
  try {
    const response = await axios.get(`${PINATA_GATEWAY}/${ipfsHash}`, {
      responseType: "arraybuffer",
    });

    const encryptedBuffer = Buffer.from(response.data);
    return decryptBuffer(encryptedBuffer, encryptionKey, iv, authTag);
  } catch (error) {
    throw new Error(`File retrieval failed: ${error.message}`);
  }
}

/**
 * Verify Pinata API connection
 * @returns {Promise<boolean>}
 */
async function testPinataConnection() {
  try {
    const response = await axios.get(`${PINATA_BASE_URL}/data/testAuthentication`, {
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_KEY,
      },
    });
    return response.data.message === "Congratulations! You are communicating with the Pinata API!";
  } catch {
    return false;
  }
}

/**
 * Get IPFS file URL
 * @param {string} ipfsHash - IPFS CID
 * @returns {string} Gateway URL
 */
function getIPFSUrl(ipfsHash) {
  return `${PINATA_GATEWAY}/${ipfsHash}`;
}

module.exports = {
  encryptAndUpload,
  retrieveAndDecrypt,
  uploadFileToIPFS,
  uploadJSONToIPFS,
  generateEncryptionKey,
  testPinataConnection,
  getIPFSUrl,
};
