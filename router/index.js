const express = require('express');
const router = express.Router();

const userRouter = require('./user.router');
const organizationRouter = require('./organization.router');
const projectRouter = require('./project.router');
const taskRouter = require('./task.router');


router.use('/users', userRouter);

router.use('/organizations', organizationRouter);

router.use('/projects', projectRouter);

router.use('/tasks', taskRouter);

module.exports = router;