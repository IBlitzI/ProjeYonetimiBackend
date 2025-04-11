const express = require("express");
const router = express.Router();

const userRouter = require("./user.router");
const organizationRouter = require("./organization.router");
const projectRouter = require("./project.router");
const taskRouter = require("./task.router");
const meetingRouter = require("./meeting.router");
const authRouter = require("./auth.router");

router.use("/auth", authRouter);

router.use("/users", userRouter);

router.use("/organizations", organizationRouter);

router.use("/projects", projectRouter);

router.use("/tasks", taskRouter);

router.use("/meetings", meetingRouter);

module.exports = router;
