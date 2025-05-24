const Task = require("../models/task.model");
const Project = require("../models/project.model");
const User = require("../models/user.model");

// Kullanıcının görevlerini getir
exports.getUserTasks = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || !user.organization) {
      return res.status(404).json({ message: "Kullanıcı veya organizasyon bulunamadı" });
    }

    let tasks;
    
    // Admin ve Manager kullanıcıları organizasyondaki tüm görevleri görebilir
    if (user.role === 'admin' || user.role === 'manager') {
      // Organizasyondaki tüm projeler için görevleri getir
      const projects = await Project.find({ organization: user.organization });
      const projectIds = projects.map(p => p._id);
      
      tasks = await Task.find({ 
        project: { $in: projectIds }
      })
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email')
        .populate('project', 'name organization')
        .sort({ createdAt: -1 });
    } else {
      // Normal kullanıcılar sadece kendi görevlerini görebilir
      tasks = await Task.find({ 
        assignedTo: req.user.userId 
      })
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email')
        .populate('project', 'name organization')
        .sort({ createdAt: -1 });

      // Organizasyon kontrolü
      tasks = tasks.filter(
        task => task.project.organization.toString() === user.organization.toString()
      );
    }

    res.status(200).json({ 
      message: "Kullanıcı görevleri getirildi",
      tasks: tasks 
    });
  } catch (error) {
    console.error("Get user tasks error:", error);
    res.status(400).json({ message: "Görevler getirilirken hata", error: error.message });
  }
};

// Proje görevlerini getir
exports.getProjectTasks = async (req, res) => {
  const { projectId } = req.params;
  try {
    const user = await User.findById(req.user.userId);
    if (!user || !user.organization) {
      return res.status(404).json({ message: "Kullanıcı veya organizasyon bulunamadı" });
    }

    const project = await Project.findOne({
      _id: projectId,
      organization: user.organization
    });

    if (!project) {
      return res.status(404).json({ message: "Proje bulunamadı" });
    }

    const tasks = await Task.find({ project: projectId })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ 
      message: "Görevler getirildi",
      tasks 
    });
  } catch (error) {
    console.error("Get project tasks error:", error);
    res.status(400).json({ message: "Görevler getirilirken hata", error: error.message });
  }
};

// Görev oluştur
exports.createTask = async (req, res) => {
  const { title, description, projectId, assignedTo, priority = 'medium', dueDate, tags = [] } = req.body;
  
  try {
    const user = await User.findById(req.user.userId);
    if (!user || !user.organization) {
      return res.status(404).json({ message: "Kullanıcı veya organizasyon bulunamadı" });
    }

    const project = await Project.findOne({
      _id: projectId,
      organization: user.organization
    });

    if (!project) {
      return res.status(404).json({ message: "Proje bulunamadı" });
    }

    // Yetki kontrolü - admin, manager veya proje sahibi görev oluşturabilir
    const isProjectMember = project.teamMembers.some(
      member => member.user.toString() === req.user.userId
    );
    
    if (
      project.createdBy.toString() !== req.user.userId &&
      !['admin', 'manager'].includes(user.role) &&
      !isProjectMember
    ) {
      return res.status(403).json({ message: "Bu işlem için yetkiniz yok" });
    }

    // Atanan kullanıcı kontrol
    if (assignedTo) {
      const assignedUser = await User.findOne({
        _id: assignedTo,
        organization: user.organization
      });
      
      if (!assignedUser) {
        return res.status(400).json({ message: "Atanan kullanıcı bulunamadı" });
    }
    }

    const task = new Task({
      title,
      description,
      project: projectId,
      assignedTo,
      priority,
      dueDate,
      tags,
      createdBy: req.user.userId,
      status: 'pending'
    });

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json({ 
      message: "Görev başarıyla oluşturuldu", 
      task: populatedTask 
    });
  } catch (error) {
    console.error("Create task error:", error);
    res.status(400).json({ message: "Görev oluşturulurken hata", error: error.message });
  }
};

// Tek görev getir
exports.getTask = async (req, res) => {
  const { taskId } = req.params;
  try {
    const user = await User.findById(req.user.userId);
    if (!user || !user.organization) {
      return res.status(404).json({ message: "Kullanıcı veya organizasyon bulunamadı" });
    }

    const task = await Task.findById(taskId)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name organization');

    if (!task || task.project.organization.toString() !== user.organization.toString()) {
      return res.status(404).json({ message: "Görev bulunamadı" });
    }

    res.status(200).json({ 
      message: "Görev getirildi",
      task 
    });
  } catch (error) {
    console.error("Get task error:", error);
    res.status(400).json({ message: "Görev getirilirken hata", error: error.message });
  }
};

// Görev güncelle
exports.updateTask = async (req, res) => {
  const { taskId } = req.params;
  const updateData = req.body;
  
  try {
    const user = await User.findById(req.user.userId);
    if (!user || !user.organization) {
      return res.status(404).json({ message: "Kullanıcı veya organizasyon bulunamadı" });
    }

    const task = await Task.findById(taskId).populate('project');
    if (!task || task.project.organization.toString() !== user.organization.toString()) {
      return res.status(404).json({ message: "Görev bulunamadı" });
    }

    // Yetki kontrolü - admin, task sahibi, atanan kişi veya proje sahibi güncelleyebilir
    if (
      task.createdBy.toString() !== req.user.userId &&
      task.assignedTo?.toString() !== req.user.userId &&
      task.project.createdBy.toString() !== req.user.userId &&
      !['admin', 'manager'].includes(user.role)
    ) {
      return res.status(403).json({ message: "Bu işlem için yetkiniz yok" });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { ...updateData, updatedAt: Date.now() },
      { new: true }
    )
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    res.status(200).json({
      message: "Görev başarıyla güncellendi",
      task: updatedTask
    });
  } catch (error) {
    console.error("Update task error:", error);
    res.status(400).json({ message: "Görev güncellenirken hata", error: error.message });
  }
};

// Görev durumu güncelle
exports.updateTaskStatus = async (req, res) => {
  const { taskId } = req.params;
  const { status } = req.body;
  
  try {
    const user = await User.findById(req.user.userId);
    const task = await Task.findById(taskId).populate('project');
    
    if (!task || task.project.organization.toString() !== user.organization.toString()) {
      return res.status(404).json({ message: "Görev bulunamadı" });
    }

    // Status güncelleme yetkisi - atanan kişi veya yöneticiler
    if (
      task.assignedTo?.toString() !== req.user.userId &&
      task.createdBy.toString() !== req.user.userId &&
      !['admin', 'manager'].includes(user.role)
    ) {
      return res.status(403).json({ message: "Bu işlem için yetkiniz yok" });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      {
        status, 
        ...(status === 'completed' && { completedAt: Date.now() }),
        updatedAt: Date.now() 
      },
      { new: true }
    )
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    res.status(200).json({
      message: "Görev durumu güncellendi",
      task: updatedTask
    });
  } catch (error) {
    console.error("Update task status error:", error);
    res.status(400).json({ message: "Görev durumu güncellenirken hata", error: error.message });
  }
};

// Görev sil
exports.deleteTask = async (req, res) => {
  const { taskId } = req.params;
  
  try {
    const user = await User.findById(req.user.userId);
    const task = await Task.findById(taskId).populate('project');
    
    if (!task || task.project.organization.toString() !== user.organization.toString()) {
      return res.status(404).json({ message: "Görev bulunamadı" });
    }

    // Yetki kontrolü - sadece admin veya görev sahibi silebilir
    if (
      task.createdBy.toString() !== req.user.userId &&
      user.role !== 'admin'
    ) {
      return res.status(403).json({ message: "Bu işlem için yetkiniz yok" });
    }

    await Task.findByIdAndDelete(taskId);

    res.status(200).json({ message: "Görev başarıyla silindi" });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(400).json({ message: "Görev silinirken hata", error: error.message });
  }
};

// Zaman takibini başlat
exports.startTimeTracking = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.userId;
    
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Görev bulunamadı" });
    }

    // Zaten aktif zaman takibi var mı kontrol et
    if (task.hasActiveTimeTracking(userId)) {
      return res.status(400).json({ message: "Bu görev için zaten aktif zaman takibi var" });
    }

    // Zaman takibini başlat
    task.timeEntries.push({
      user: userId,
      startTime: new Date()
    });

    // Görev durumunu in-progress yap
    if (task.status === 'pending') {
      task.status = 'in-progress';
    }

    await task.save();

    res.status(200).json({
      message: "Zaman takibi başlatıldı",
      task
    });
  } catch (error) {
    console.error("Start time tracking error:", error);
    res.status(400).json({ message: "Zaman takibi başlatılırken hata", error: error.message });
  }
};

// Zaman takibini durdur
exports.stopTimeTracking = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { description } = req.body;
    const userId = req.user.userId;
    
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Görev bulunamadı" });
    }

    // Aktif zaman takibini durdur
    await task.stopTimeTracking(userId, new Date(), description);
    
    await task.populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'project', select: 'name' }
    ]);

    res.status(200).json({
      message: "Zaman takibi durduruldu",
      task,
      totalTimeSpent: task.totalHoursSpent
    });
  } catch (error) {
    console.error("Stop time tracking error:", error);
    res.status(400).json({ message: error.message || "Zaman takibi durdurulurken hata" });
  }
};

// Son görevleri getir (dashboard için)
exports.getRecentTasks = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const tasks = await Task.find({
      $or: [
        { createdBy: userId },
        { assignedTo: userId }
      ]
    })
    .populate('project', 'name')
    .populate('assignedTo', 'name email')
    .sort({ updatedAt: -1 })
    .limit(10);

    // Time spent hesapla
    const tasksWithTimeSpent = tasks.map(task => {
      const taskObj = task.toObject();
      taskObj.timeSpent = task.totalTimeSpent || 0;
      return taskObj;
    });

    res.status(200).json({
      message: "Son görevler getirildi",
      tasks: tasksWithTimeSpent
    });
  } catch (error) {
    console.error("Get recent tasks error:", error);
    res.status(400).json({ message: "Son görevler getirilirken hata", error: error.message });
  }
};

// Kullanıcının aktif zaman takiplerini getir
exports.getActiveTimeTracking = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const tasks = await Task.find({
      'timeEntries': {
        $elemMatch: {
          user: userId,
          endTime: { $exists: false }
        }
      }
    })
    .populate('project', 'name')
    .select('title project timeEntries');

    const activeTasks = tasks.map(task => {
      const activeEntry = task.timeEntries.find(entry => 
        entry.user.toString() === userId && !entry.endTime
      );

      return {
        _id: task._id,
        title: task.title,
        project: task.project,
        startTime: activeEntry.startTime,
        duration: Math.floor((new Date() - activeEntry.startTime) / (1000 * 60)) // dakika
      };
    });

    res.status(200).json({
      message: "Aktif zaman takipleri getirildi",
      activeTasks
    });
  } catch (error) {
    console.error("Get active time tracking error:", error);
    res.status(400).json({ message: "Aktif zaman takipleri getirilirken hata", error: error.message });
  }
};
