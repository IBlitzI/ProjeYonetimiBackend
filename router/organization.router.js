const express = require("express");
const router = express.Router();
const controller = require("../controller/organization.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.post("/", authMiddleware(), controller.createOrganization);
router.post(
  "/users",
  authMiddleware(["admin"]),
  controller.addUserToOrganization
);
router.get(
  "/:organizationId",
  authMiddleware(["admin"]),
  controller.getOrganizations
);

module.exports = router;
