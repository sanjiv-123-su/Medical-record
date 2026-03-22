/**
 * Patient Routes
 * POST /api/patients/register - Register patient info (off-chain metadata)
 * GET  /api/patients/:address  - Get patient info
 */

const express = require("express");
const { getPatientInfo } = require("../blockchain");

const router = express.Router();

router.get("/:address", async (req, res) => {
  try {
    const patient = await getPatientInfo(req.params.address);
    res.json({ success: true, patient });
  } catch (error) {
    res.status(404).json({ error: "Patient not found or not registered" });
  }
});

module.exports = router;
