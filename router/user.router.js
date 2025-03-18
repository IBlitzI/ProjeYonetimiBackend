const express = require("express");
const router = express.Router();
const controller = require("../controller/user.controller");
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/verify', controller.verifyUser);
router.get('/:userId/organizations', authMiddleware(), controller.getUserOrganizations);
router.get('/:userId/tasks', authMiddleware(), controller.getUserTasks);

module.exports = router; 