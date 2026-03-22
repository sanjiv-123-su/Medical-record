/**
 * Doctor Routes
 * GET /api/doctors/:address - Get doctor info
 */

const express = require("express");
const { getDoctorInfo } = require("../blockchain");

const router = express.Router();

router.get("/:address", async (req, res) => {
  try {
    const doctor = await getDoctorInfo(req.params.address);
    res.json({ success: true, doctor });
  } catch (error) {
    res.status(404).json({ error: "Doctor not found or not registered" });
  }
});

module.exports = router;
