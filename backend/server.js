/**
 * MedLedger Backend Server
 * Express.js API for IPFS uploads and blockchain interaction
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

// Route imports
const recordRoutes = require("./routes/records");
const patientRoutes = require("./routes/patients");
const accessRoutes = require("./routes/access");
const doctorRoutes = require("./routes/doctors");

const app = express();
const PORT = process.env.PORT || 5000;

// ─────────────────────────────────────────────────────────────
//  MIDDLEWARE
// ─────────────────────────────────────────────────────────────

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Request logging
app.use(morgan("combined"));

// Body parsing
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Rate limiting — protect against abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api/", limiter);

// ─────────────────────────────────────────────────────────────
//  ROUTES
// ─────────────────────────────────────────────────────────────

app.use("/api/records", recordRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/access", accessRoutes);
app.use("/api/doctors", doctorRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "MedLedger API",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// ─────────────────────────────────────────────────────────────
//  ERROR HANDLING
// ─────────────────────────────────────────────────────────────

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ─────────────────────────────────────────────────────────────
//  START SERVER
// ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   MedLedger Backend Server               ║
  ║   Running on http://localhost:${PORT}       ║
  ╚══════════════════════════════════════════╝
  `);
});

module.exports = app;
