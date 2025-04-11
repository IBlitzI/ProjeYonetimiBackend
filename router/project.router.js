const express = require("express");
const router = express.Router();
const controller = require("../controller/project.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.post("/", authMiddleware(["admin"]), controller.createProject);
router.put("/:projectId", authMiddleware(), controller.updateProject);
router.delete("/:projectId", authMiddleware(), controller.deleteProject);
router.get("/", authMiddleware(), controller.getProjects);
router.get("/:projectId", authMiddleware(), controller.getProjectById);
router.post("/users", authMiddleware(["admin"]), controller.addUserToProject);

module.exports = router;
