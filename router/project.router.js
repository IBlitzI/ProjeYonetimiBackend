const express = require("express");
const router = express.Router();
const controller = require("../controller/project.controller");
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/', authMiddleware(['admin']), controller.createProject);
router.post('/:organizationId/:projectId/add-user/:userId', authMiddleware(['admin']), controller.addUserToProject);

module.exports = router; 