const Project = require("../models/project.model");
const User = require("../models/user.model");
const Organization = require("../models/organization.model");

// Kullanıcının organizasyonundaki projeleri getir
exports.getProjects = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate('organization');
    if (!user || !user.organization) {
      return res.status(404).json({ message: "Kullanıcı veya organizasyon bulunamadı" });
    }

    const projects = await Project.find({ organization: user.organization._id })
      .populate('createdBy', 'name username')
      .populate('teamMembers.user', 'name username email')
      .sort({ createdAt: -1 });

    res.status(200).json({ 
      message: "Projeler başarıyla getirildi",
      projects 
    });
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(400).json({ message: "Projeler getirilirken hata", error: error.message });
  }
};

// Proje oluştur
exports.createProject = async (req, res) => {
  const { name, description, priority = 'medium', teamMembers = [] } = req.body;
  try {
    const user = await User.findById(req.user.userId).populate('organization');
    if (!user || !user.organization) {
      return res.status(404).json({ message: "Kullanıcı veya organizasyon bulunamadı" });
    }

    const project = new Project({
      name,
      description,
      priority,
      organization: user.organization._id,
      createdBy: req.user.userId,
      teamMembers: teamMembers.map(member => ({
        user: member.userId,
        role: member.role || 'member'
      })),
      status: 'planning'
    });

    await project.save();

    // Organizasyonun proje sayısını güncelle
    await Organization.findByIdAndUpdate(
      user.organization._id,
      { $inc: { 'stats.projectCount': 1 } }
    );

    const populatedProject = await Project.findById(project._id)
      .populate('createdBy', 'name username')
      .populate('teamMembers.user', 'name username email');

    res.status(201).json({ 
      message: "Proje başarıyla oluşturuldu", 
      project: populatedProject 
    });
  } catch (error) {
    console.error("Create project error:", error);
    res.status(400).json({ message: "Proje oluşturulurken hata", error: error.message });
  }
};

// Proje detayını getir
exports.getProjectById = async (req, res) => {
  const { projectId } = req.params;
  try {
    const user = await User.findById(req.user.userId);
    if (!user || !user.organization) {
      return res.status(404).json({ message: "Kullanıcı veya organizasyon bulunamadı" });
    }

    const project = await Project.findOne({
      _id: projectId,
      organization: user.organization
    })
      .populate('createdBy', 'name username email')
      .populate('teamMembers.user', 'name username email role')
      .populate('organization', 'name');

    if (!project) {
      return res.status(404).json({ message: "Proje bulunamadı" });
    }

    res.status(200).json({ 
      message: "Proje detayı getirildi",
      project 
    });
  } catch (error) {
    console.error("Get project error:", error);
    res.status(400).json({ message: "Proje getirilirken hata", error: error.message });
  }
};

// Proje güncelle
exports.updateProject = async (req, res) => {
  const { projectId } = req.params;
  const updateData = req.body;
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

    // Yetki kontrolü - sadece admin, manager veya proje sahibi güncelleyebilir
    if (
      project.createdBy.toString() !== req.user.userId &&
      !['admin', 'manager'].includes(user.role)
    ) {
      return res.status(403).json({ message: "Bu işlem için yetkiniz yok" });
    }

    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { ...updateData, updatedAt: Date.now() },
      { new: true }
    )
      .populate('createdBy', 'name username')
      .populate('teamMembers.user', 'name username email');

    res.status(200).json({
      message: "Proje başarıyla güncellendi",
      project: updatedProject,
    });
  } catch (error) {
    console.error("Update project error:", error);
    res.status(400).json({ message: "Proje güncellenirken hata", error: error.message });
  }
};

// Proje sil
exports.deleteProject = async (req, res) => {
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

    // Yetki kontrolü - sadece admin veya proje sahibi silebilir
    if (
      project.createdBy.toString() !== req.user.userId &&
      user.role !== 'admin'
    ) {
      return res.status(403).json({ message: "Bu işlem için yetkiniz yok" });
    }

    await Project.findByIdAndDelete(projectId);

    // Organizasyonun proje sayısını güncelle
    await Organization.findByIdAndUpdate(
      user.organization,
      { $inc: { 'stats.projectCount': -1 } }
    );

    res.status(200).json({ message: "Proje başarıyla silindi" });
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(400).json({ message: "Proje silinirken hata", error: error.message });
  }
};

// Projeye takım üyesi ekle
exports.assignMemberToProject = async (req, res) => {
  const { projectId } = req.params;
  const { userId, role = 'member' } = req.body;
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

    // Yetki kontrolü
    if (
      project.createdBy.toString() !== req.user.userId &&
      !['admin', 'manager'].includes(user.role)
    ) {
      return res.status(403).json({ message: "Bu işlem için yetkiniz yok" });
    }

    // Kullanıcı zaten projede mi kontrol et
    const existingMember = project.teamMembers.find(
      member => member.user.toString() === userId
    );

    if (existingMember) {
      return res.status(400).json({ message: "Kullanıcı zaten bu projede" });
    }

    // Üyeyi ekle
    project.teamMembers.push({ user: userId, role });
    await project.save();

    const updatedProject = await Project.findById(projectId)
      .populate('teamMembers.user', 'name username email');

    res.status(200).json({
      message: "Takım üyesi başarıyla eklendi",
      project: updatedProject
    });
  } catch (error) {
    console.error("Assign member error:", error);
    res.status(400).json({ message: "Takım üyesi eklenirken hata", error: error.message });
  }
};

// Projeden takım üyesi çıkar
exports.removeMemberFromProject = async (req, res) => {
  const { projectId, memberId } = req.params;
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

    // Yetki kontrolü
    if (
      project.createdBy.toString() !== req.user.userId &&
      !['admin', 'manager'].includes(user.role)
    ) {
      return res.status(403).json({ message: "Bu işlem için yetkiniz yok" });
    }

    // Üyeyi çıkar
    project.teamMembers = project.teamMembers.filter(
      member => member.user.toString() !== memberId
    );
    await project.save();

    const updatedProject = await Project.findById(projectId)
      .populate('teamMembers.user', 'name username email');

    res.status(200).json({
      message: "Takım üyesi başarıyla çıkarıldı",
      project: updatedProject
    });
  } catch (error) {
    console.error("Remove member error:", error);
    res.status(400).json({ message: "Takım üyesi çıkarılırken hata", error: error.message });
  }
};

// Proje takımını getir
exports.getProjectTeam = async (req, res) => {
  const { projectId } = req.params;
  try {
    const user = await User.findById(req.user.userId);
    if (!user || !user.organization) {
      return res.status(404).json({ message: "Kullanıcı veya organizasyon bulunamadı" });
    }

    const project = await Project.findOne({
      _id: projectId,
      organization: user.organization
    }).populate('teamMembers.user', 'name username email role');

    if (!project) {
      return res.status(404).json({ message: "Proje bulunamadı" });
    }

    res.status(200).json({
      message: "Proje takımı getirildi",
      teamMembers: project.teamMembers
    });
  } catch (error) {
    console.error("Get project team error:", error);
    res.status(400).json({ message: "Proje takımı getirilirken hata", error: error.message });
  }
};

