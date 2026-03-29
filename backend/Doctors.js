/**
 * Doctors Routes
 * GET /api/doctors/:address — get doctor info
 * GET /api/doctors          — get full doctor list
 */

const express = require("express");
const { getDoctorInfo, getContract } = require("../blockchain");

const router = express.Router();

// Get a single doctor's info
router.get("/:address", async (req, res, next) => {
  try {
    const doctor = await getDoctorInfo(req.params.address);
    res.json({ success: true, doctor });
  } catch (err) {
    next(err);
  }
});

// Get all registered doctors
router.get("/", async (req, res, next) => {
  try {
    const contract = getContract();
    const addresses = await contract.getDoctorList();
    res.json({ success: true, doctors: addresses });
  } catch (err) {
    next(err);
  }
});

module.exports = router;