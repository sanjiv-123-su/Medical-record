/**
 * Access Routes
 * GET /api/access/check - Check if doctor has access to patient records
 */

const express = require("express");
const { checkAccess } = require("../blockchain");

const router = express.Router();

router.get("/check", async (req, res) => {
  try {
    const { patientAddress, doctorAddress } = req.query;
    if (!patientAddress || !doctorAddress) {
      return res.status(400).json({ error: "patientAddress and doctorAddress required" });
    }
    const hasAccess = await checkAccess(patientAddress, doctorAddress);
    res.json({ success: true, hasAccess, patientAddress, doctorAddress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
