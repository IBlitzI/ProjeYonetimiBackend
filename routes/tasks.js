const express = require("express");
const router = express.Router();
const taskController = require("../controller/task.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// User tasks
router.get("/user", authMiddleware(), taskController.getUserTasks);

// Recent tasks (spesifik route, önce gelmeli)
router.get("/recent", authMiddleware(), taskController.getRecentTasks);

// Active time tracking (spesifik route, önce gelmeli)
router.get("/active-time-tracking", authMiddleware(), taskController.getActiveTimeTracking);

// Project tasks
router.get("/project/:projectId", authMiddleware(), taskController.getProjectTasks);

// Task CRUD
router.post("/", authMiddleware(), taskController.createTask);
router.get("/:taskId", authMiddleware(), taskController.getTask);
router.put("/:taskId", authMiddleware(), taskController.updateTask);
router.put("/:taskId/status", authMiddleware(), taskController.updateTaskStatus);
router.delete("/:taskId", authMiddleware(), taskController.deleteTask);

// Time tracking routes
router.post("/:taskId/start-time-tracking", authMiddleware(), taskController.startTimeTracking);
router.post("/:taskId/stop-time-tracking", authMiddleware(), taskController.stopTimeTracking);

module.exports = router; 