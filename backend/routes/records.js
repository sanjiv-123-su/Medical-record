/**
 * Records Routes
 * POST /api/records/upload - Upload and encrypt medical record to IPFS
 * GET  /api/records/:patientAddress - Get records for a patient
 */

const express = require("express");
const multer = require("multer");
const { encryptAndUpload, getIPFSUrl } = require("../ipfs");
const { getPatientRecords, checkAccess } = require("../blockchain");

const router = express.Router();

// Multer: in-memory storage (no disk writes)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/dicom",
      "application/dicom",
      "text/plain",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed. Accepted: PDF, JPEG, PNG, DICOM, TXT"));
    }
  },
});

// ─────────────────────────────────────────────────────────────
//  POST /api/records/upload
// ─────────────────────────────────────────────────────────────

/**
 * @route   POST /api/records/upload
 * @desc    Encrypt and upload medical record to IPFS
 * @body    file (multipart), patientAddress, description, recordType
 * @returns { ipfsHash, encryptionKey, iv, authTag, fileUrl }
 */
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { patientAddress, description, recordType } = req.body;

    // Validate inputs
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    if (!patientAddress) {
      return res.status(400).json({ error: "patientAddress is required" });
    }
    if (!description) {
      return res.status(400).json({ error: "description is required" });
    }

    console.log(`📤 Uploading record for patient: ${patientAddress}`);
    console.log(`   File: ${req.file.originalname} (${req.file.size} bytes)`);

    // Encrypt and upload to IPFS
    const result = await encryptAndUpload(
      req.file.buffer,
      req.file.originalname,
      patientAddress
    );

    console.log(`✅ Uploaded to IPFS: ${result.ipfsHash}`);

    res.json({
      success: true,
      ipfsHash: result.ipfsHash,
      encryptionKey: result.encryptionKey, // Store this securely!
      iv: result.iv,
      authTag: result.authTag,
      fileUrl: getIPFSUrl(result.ipfsHash),
      originalFileName: req.file.originalname,
      pinSize: result.pinSize,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
//  GET /api/records/:patientAddress
// ─────────────────────────────────────────────────────────────

/**
 * @route   GET /api/records/:patientAddress
 * @desc    Get all records for a patient
 * @returns Array of medical records
 */
router.get("/:patientAddress", async (req, res) => {
  try {
    const { patientAddress } = req.params;
    const { requesterAddress } = req.query;

    if (!patientAddress) {
      return res.status(400).json({ error: "patientAddress is required" });
    }

    // Optionally check access if requester is provided
    if (requesterAddress && requesterAddress !== patientAddress) {
      const hasAccess = await checkAccess(patientAddress, requesterAddress);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    const records = await getPatientRecords(patientAddress);

    res.json({
      success: true,
      patientAddress,
      records,
      count: records.length,
    });
  } catch (error) {
    console.error("Get records error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
