const express = require("express");
const router = express.Router();
const controller = require("../controller/project.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Tüm endpoint'ler authentication gerektirir
router.use(authMiddleware());

// Proje CRUD işlemleri
router.get("/", controller.getProjects);
router.post("/", controller.createProject);
router.get("/:projectId", controller.getProjectById);
router.put("/:projectId", controller.updateProject);
router.delete("/:projectId", controller.deleteProject);

// Proje takım yönetimi
router.get("/:projectId/team", controller.getProjectTeam);
router.post("/:projectId/assign-member", controller.assignMemberToProject);
router.delete("/:projectId/remove-member/:memberId", controller.removeMemberFromProject);

module.exports = router;
