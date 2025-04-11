const express = require("express");
const router = express.Router();
const controller = require("../controller/meeting.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.post("/", authMiddleware(), controller.createMeeting);
router.put("/:meetingId", authMiddleware(), controller.updateMeeting);
router.delete("/:meetingId", authMiddleware(), controller.deleteMeeting);
router.get("/", authMiddleware(), controller.getMeetings);
router.get("/:meetingId", authMiddleware(), controller.getMeetingById);

module.exports = router;
