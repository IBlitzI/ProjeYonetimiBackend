const User = require("../models/user.model");
const Task = require("../models/task.model");
const Project = require("../models/project.model");

exports.getUserOrganizations = async (req, res) => {
  const userId = req.user.id;
  console.log(userId);
  try {
    const user = await User.findById(userId).populate(
      "organizations.organization"
    );
    res.status(200).json(user.organizations);
  } catch (error) {
    res.status(400).json({ message: "Error fetching organizations", error });
  }
};

exports.getUserTasks = async (req, res) => {
  const userId = req.user.id;
  try {
    const tasks = await Task.find({ assignedTo: userId }).populate("project");
    res.status(200).json(tasks);
  } catch (error) {
    res.status(400).json({ message: "Error fetching tasks", error });
  }
};

exports.getUserProjects = async (req, res) => {
  const userId = req.user.id;
  try {
    const projects = await Project.find({ members: userId }).populate("tasks");
    res.status(200).json(projects);
  } catch (error) {
    res.status(400).json({ message: "Error fetching projects", error });
  }
};
