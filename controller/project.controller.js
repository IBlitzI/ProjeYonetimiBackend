const Project = require("../models/project.model");
const User = require("../models/user.model");
const Organization = require("../models/organization.model");

exports.createProject = async (req, res) => {
  const { name, description, organizationId } = req.body;
  try {
    const project = new Project({
      name,
      description,
      organization: organizationId,
      createdBy: req.user.id,
    });
    await project.save();

    const organization = await Organization.findById(organizationId);
    organization.projects.push(project._id);
    await organization.save();

    res.status(201).json({ message: "Project created successfully", project });
  } catch (error) {
    res.status(400).json({ message: "Error creating project", error });
  }
};

exports.updateProject = async (req, res) => {
  const { projectId } = req.params;
  const updateData = req.body;
  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    if (
      project.createdBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      updateData,
      { new: true }
    );
    res.status(200).json({
      message: "Project updated successfully",
      project: updatedProject,
    });
  } catch (error) {
    res.status(400).json({ message: "Error updating project", error });
  }
};

exports.deleteProject = async (req, res) => {
  const { projectId } = req.params;
  try {
    const project = await Project.findByIdAndDelete(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: "Error deleting project", error });
  }
};

exports.getProjects = async (req, res) => {
  const { organizationId } = req.query;
  try {
    const projects = await Project.find();

    if (!projects) {
      return res.status(404).json({ message: "No projects found" });
    }
    res.status(200).json(projects);
  } catch (error) {
    res.status(400).json({ message: "Error fetching projects", error });
  }
};

exports.getProjectById = async (req, res) => {
  const { projectId } = req.params;
  const { organizationId } = req.query;
  try {
    if (!projectId) {
      return res.status(400).json({ message: "Project ID is required" });
    }
    if (!organizationId) {
      return res.status(400).json({ message: "Organization ID is required" });
    }
    const project = await Project.find({
      _id: projectId,
      organization: organizationId,
    })
      .populate("members", "-password")
      .populate("createdBy", "-password")
      .populate("organization");
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.status(200).json(project);
  } catch (error) {
    res.status(400).json({ message: "Error fetching project", error });
  }
};

exports.addUserToProject = async (req, res) => {
  const { projectId, userId } = req.body;
  try {
    const project = await Project.findById(projectId);
    const user = await User.findById(userId);
    project.members.push(user);
    await project.save();
    res
      .status(200)
      .json({ message: "User added to project successfully", project });
  } catch (error) {
    res.status(400).json({ message: "Error adding user to project", error });
  }
};
