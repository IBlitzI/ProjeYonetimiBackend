const Project = require('../models/project.model');
const User = require('../models/user.model');
const Organization = require('../models/organization.model'); 
const authMiddleware = require('../middlewares/auth.middleware');

exports.createProject = async (req, res) => {
  const { name, description, organizationId } = req.body;
  try {
    const project = new Project({ name, description, organization: organizationId, createdBy: req.user.id });
    await project.save();

    const organization = await Organization.findById(organizationId);
    organization.projects.push(project._id);
    await organization.save();

    res.status(201).json({ message: 'Project created successfully', project });
  } catch (error) {
    res.status(400).json({ message: 'Error creating project', error });
  }
};

exports.addUserToProject = async (req, res) => {
  const { projectId, userId } = req.params;
  try {
    const project = await Project.findById(projectId);
    const user = await User.findById(userId);
    project.members.push(user);
    await project.save();
    res.status(200).json({ message: 'User added to project successfully', project });
  } catch (error) {
    res.status(400).json({ message: 'Error adding user to project', error });
  }
};