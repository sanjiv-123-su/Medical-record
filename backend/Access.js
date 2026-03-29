/**
 * Access Routes
 * GET /api/access/check?patient=0x...&doctor=0x... — check access
 * GET /api/access/logs/:address                    — get access logs
 */

const express = require("express");
const { checkAccess, getAccessLogs } = require("../blockchain");

const router = express.Router();

// Check if a doctor has access to a patient's records
router.get("/check", async (req, res, next) => {
  try {
    const { patient, doctor } = req.query;
    if (!patient || !doctor) {
      return res.status(400).json({ error: "Both patient and doctor query params are required" });
    }
    const hasAccess = await checkAccess(patient, doctor);
    res.json({ success: true, hasAccess });
  } catch (err) {
    next(err);
  }
});

// Get access logs for a patient
router.get("/logs/:address", async (req, res, next) => {
  try {
    const logs = await getAccessLogs(req.params.address);
    res.json({ success: true, logs });
  } catch (err) {
    next(err);
  }
});

module.exports = router;