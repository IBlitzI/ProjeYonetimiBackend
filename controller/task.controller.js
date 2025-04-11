const Task = require("../models/task.model");
const Project = require("../models/project.model");
const { getUserRole } = require("../utils/helpers");

exports.createTask = async (req, res) => {
  const {
    title,
    description,
    projectId,
    assignedTo,
    priority,
    dueDate,
    requirements,
  } = req.body;
  try {
    const project = await Project.findById(projectId);
    const userRole = await getUserRole(req.user.id, project.organization);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!project.members.includes(req.user.id) && userRole !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const task = new Task({
      title,
      description,
      project: projectId,
      organizationId: project.organization,
      assignedTo,
      priority,
      dueDate,
      createdBy: req.user.id,
      requirements,
    });

    await task.save();

    project.tasks.push(task);
    await project.save();

    res.status(201).json({ message: "Task created successfully", task });
  } catch (error) {
    res.status(400).json({ message: "Error creating task", error });
  }
};

//TODO: Düzenlenecek
exports.updateTask = async (req, res) => {
  const { taskId } = req.params;
  const updateData = req.body;
  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (
      task.createdBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // update requirements if provided and add new ones if they don't exist
    if (updateData.requirements) {
      const existingRequirements = task.requirements.map((req) => req.text);
      const newRequirements = updateData.requirements.filter(
        (req) => !existingRequirements.includes(req.text)
      );
      task.requirements.push(...newRequirements);
    }

    // Diğer alanları güncellemek için
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      {
        $set: {
          title: updateData.title,
          status: updateData.status,
          dueDate: updateData.dueDate,
          priority: updateData.priority,
          assignedTo: updateData.assignedTo,
        },
      },
      {
        new: true,
      }
    );
    res
      .status(200)
      .json({ message: "Task updated successfully", task: updatedTask });
  } catch (error) {
    res.status(400).json({ message: "Error updating task", error });
  }
};

exports.deleteTask = async (req, res) => {
  const { taskId } = req.params;
  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (
      task.createdBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Remove the task from the associated project
    await Project.findByIdAndUpdate(task.project, {
      $pull: { tasks: taskId },
    });

    await Task.findByIdAndDelete(taskId);
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: "Error deleting task", error });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find();
    if (!tasks) {
      return res.status(404).json({ message: "No tasks found" });
    }

    const tasksWithProgress = tasks.map((task) => {
      const totalReqs = task.requirements.length;
      const doneReqs = task.requirements.filter((req) => req.isDone).length;
      const progress =
        totalReqs > 0 ? Math.round((doneReqs / totalReqs) * 100) : 0;

      return {
        ...task.toObject(),
        progress,
      };
    });

    res.status(200).json({ tasksWithProgress });
  } catch (error) {
    res.status(400).json({ message: "Error fetching tasks", error });
  }
};
