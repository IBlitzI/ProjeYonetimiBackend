const express = require("express");
const router = express.Router();
const meetingController = require("../controller/meeting.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Toplantı oluştur
router.post("/", authMiddleware(), meetingController.createMeeting);

// Kullanıcının toplantılarını getir
router.get("/", authMiddleware(), meetingController.getUserMeetings);

// Yaklaşan toplantılar (dashboard için)
router.get("/upcoming", authMiddleware(), meetingController.getUpcomingMeetings);

// Toplantı detayı
router.get("/:meetingId", authMiddleware(), meetingController.getMeeting);

// Toplantı güncelle
router.put("/:meetingId", authMiddleware(), meetingController.updateMeeting);

// Toplantı sil
router.delete("/:meetingId", authMiddleware(), meetingController.deleteMeeting);

module.exports = router; 