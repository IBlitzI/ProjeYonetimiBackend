const express = require("express");
const router = express.Router();
const controller = require("../controller/user.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.get("/organizations", authMiddleware(), controller.getUserOrganizations);
router.get("/tasks", authMiddleware(), controller.getUserTasks);
router.get("/projects", authMiddleware(), controller.getUserProjects);

module.exports = router;
