const express = require("express");
const router = express.Router();
const controller = require("../controller/task.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.post("/", authMiddleware(), controller.createTask);
router.delete("/:taskId", authMiddleware(), controller.deleteTask);
router.get("/", authMiddleware(), controller.getTasks);
router.put("/:taskId", authMiddleware(), controller.updateTask);

module.exports = router;
