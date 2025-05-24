const express = require("express");
const router = express.Router();

// Meeting routes dosyasını import et
const meetingRoutes = require("../routes/meetings");

// Tüm meeting routes'ları kullan
router.use("/", meetingRoutes);

module.exports = router;
