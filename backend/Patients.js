/**
 * Patients Routes
 * GET /api/patients/:address — get patient info
 * GET /api/patients           — get full patient list
 */

const express = require("express");
const { getPatientInfo, getContract } = require("../blockchain");

const router = express.Router();

// Get a single patient's info
router.get("/:address", async (req, res, next) => {
  try {
    const patient = await getPatientInfo(req.params.address);
    res.json({ success: true, patient });
  } catch (err) {
    next(err);
  }
});

// Get all registered patients
router.get("/", async (req, res, next) => {
  try {
    const contract = getContract();
    const addresses = await contract.getPatientList();
    res.json({ success: true, patients: addresses });
  } catch (err) {
    next(err);
  }
});

module.exports = router;