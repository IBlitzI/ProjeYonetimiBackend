const express = require("express");
const router = express.Router();
const controller = require("../controller/task.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Proje görevlerini getir
router.get("/project/:projectId", authMiddleware(), controller.getProjectTasks);

// Son görevler (dashboard için)
router.get("/recent", authMiddleware(), controller.getRecentTasks);

// Aktif zaman takipleri
router.get("/time/active", authMiddleware(), controller.getActiveTimeTracking);

// Görev CRUD
router.post("/", authMiddleware(), controller.createTask);
router.put("/:taskId", authMiddleware(), controller.updateTask);
router.put("/:taskId/status", authMiddleware(), controller.updateTaskStatus);
router.delete("/:taskId", authMiddleware(), controller.deleteTask);

// Time tracking
router.post("/:taskId/time/start", authMiddleware(), controller.startTimeTracking);
router.post("/:taskId/time/stop", authMiddleware(), controller.stopTimeTracking);

module.exports = router;

module.exports = router;
