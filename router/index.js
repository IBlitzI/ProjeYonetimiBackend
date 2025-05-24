const express = require("express");
const router = express.Router();

const userRouter = require("./user.router");
const organizationRouter = require("./organization.router");
const projectRouter = require("./project.router");
const tasksRouter = require("../routes/tasks");
const meetingRouter = require("./meeting.router");
const authRouter = require("./auth.router");

// Ana route
router.get("/", (req, res) => {
  res.json({ 
    message: "WINX Project Management API çalışıyor", 
    status: "success",
    timestamp: new Date().toISOString()
  });
});

router.use("/auth", authRouter);

router.use("/users", userRouter);

router.use("/organizations", organizationRouter);

router.use("/projects", projectRouter);

router.use("/tasks", tasksRouter);

router.use("/meetings", meetingRouter);

module.exports = router;
