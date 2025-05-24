const express = require("express");
const router = express.Router();
const controller = require("../controller/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Temel auth
router.post("/register", controller.register);
router.post("/login", controller.login);

// Direct registration with organization
router.post("/create-organization", controller.registerWithOrganization);
router.post("/join-organization", controller.registerWithInviteCode);

// Onboarding (authentication gerekli) - eski endpoint'ler
router.post("/onboarding/create-organization", authMiddleware(), controller.createOrganization);
router.post("/onboarding/join-organization", authMiddleware(), controller.joinOrganization);

module.exports = router;
