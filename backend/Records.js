/**
 * Records Routes
 * POST /api/records/upload  — encrypt & upload a medical file
 * GET  /api/records/:address — fetch all records for a patient
 */

const express = require("express");
const multer = require("multer");
const { encryptAndUpload } = require("../ipfs");
const { getPatientRecords } = require("../blockchain");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// Upload a new medical record
router.post("/upload", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file provided" });

    const { patientAddress, description, recordType } = req.body;
    if (!patientAddress) return res.status(400).json({ error: "patientAddress is required" });

    const result = await encryptAndUpload(
      req.file.buffer,
      req.file.originalname,
      patientAddress
    );

    res.json({
      success: true,
      ipfsHash: result.ipfsHash,
      encryptionKey: result.encryptionKey,
      iv: result.iv,
      authTag: result.authTag,
      originalFileName: result.originalFileName,
    });
  } catch (err) {
    next(err);
  }
});

// Get all records for a patient
router.get("/:address", async (req, res, next) => {
  try {
    const records = await getPatientRecords(req.params.address);
    res.json({ success: true, records });
  } catch (err) {
    next(err);
  }
});

module.exports = router;