const express = require("express");
const router = express.Router();
const controller = require("../controller/task.controller");
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/:organizationId', authMiddleware(['admin', 'member']), controller.createTask);
router.put('/:organizationId/:taskId', authMiddleware(['admin', 'member']), controller.updateTask);
router.delete('/:organizationId/:taskId', authMiddleware(['admin', 'member']), controller.deleteTask);
router.get('/:organizationId/:projectId', authMiddleware(['admin', 'member']), controller.getTasks);

module.exports = router; 