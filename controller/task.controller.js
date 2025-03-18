const Task = require('../models/task.model');
const Project = require('../models/project.model');
const User = require('../models/user.model');
const authMiddleware = require('../middlewares/auth.middleware');

exports.createTask = async (req, res) => {
  const { title, description, projectId, assignedTo, priority, dueDate } = req.body;
  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const task = new Task({
      title,
      description,
      project: projectId,
      assignedTo,
      priority,
      dueDate,
      createdBy: req.user.id,
    });
    await task.save();

    project.tasks.push(task);
    await project.save();

    res.status(201).json({ message: 'Task created successfully', task });
  } catch (error) {
    res.status(400).json({ message: 'Error creating task', error });
  }
};

exports.updateTask = async (req, res) => {
  const { taskId } = req.params;
  const updateData = req.body;
  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const updatedTask = await Task.findByIdAndUpdate(taskId, updateData, { new: true });
    res.status(200).json({ message: 'Task updated successfully', task: updatedTask });
  } catch (error) {
    res.status(400).json({ message: 'Error updating task', error });
  }
};

exports.deleteTask = async (req, res) => {
  const { taskId } = req.params;
  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Task.findByIdAndDelete(taskId);
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Error deleting task', error });
  }
};

exports.getTasks = async (req, res) => {
  const { projectId } = req.params;
  try {
    const tasks = await Task.find({ project: projectId })
      .populate('project')
      .populate('assignedTo');
    res.status(200).json(tasks);
  } catch (error) {
    res.status(400).json({ message: 'Error fetching tasks', error });
  }
};