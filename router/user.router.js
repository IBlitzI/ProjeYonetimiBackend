const express = require('express');
const router = express.Router();
const controller = require('../controller/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Tüm endpoint'ler authentication gerektirir
router.use(authMiddleware());

// Kullanıcı ve organizasyon bilgileri
router.get('/organization', controller.getUserOrganization);
router.get('/team-members', controller.getTeamMembers);
router.get('/available-members/:projectId', controller.getAvailableMembersForProject);
router.post('/invite', controller.inviteTeamMember);

// Kullanıcı verileri
router.get('/tasks', controller.getUserTasks);
router.get('/projects', controller.getUserProjects);
router.get('/dashboard-stats', controller.getDashboardStats);

// Profil yönetimi
router.put('/profile', controller.updateProfile);

// Team Management (Admin/Manager only)
router.put('/:userId/role', controller.updateUserRole);
router.delete('/:userId/remove', controller.removeUserFromOrganization);
router.get('/pending-invites', controller.getPendingInvites);
router.delete('/invites/:inviteId', controller.cancelInvite);

module.exports = router;
