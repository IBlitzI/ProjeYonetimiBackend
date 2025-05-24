const User = require("../models/user.model");
const Organization = require("../models/organization.model");
const Project = require("../models/project.model");
const Task = require("../models/task.model");

// Kullanıcının organizasyon bilgisini getir
exports.getUserOrganization = async (req, res) => {
  const userId = req.user.userId;
  try {
    const user = await User.findById(userId).populate('organization');
    if (!user.organization) {
      return res.status(404).json({ message: "Organizasyon bulunamadı" });
    }
    res.status(200).json(user.organization);
  } catch (error) {
    console.error("Get user organization error:", error);
    res.status(400).json({ message: "Organizasyon bilgisi alınırken hata", error: error.message });
  }
};

// Organizasyondaki tüm takım üyelerini getir
exports.getTeamMembers = async (req, res) => {
  const userId = req.user.userId;
  try {
    const user = await User.findById(userId);
    if (!user || !user.organization) {
      return res.status(400).json({ message: "Organizasyon bulunamadı" });
    }

    const teamMembers = await User.find({ 
      organization: user.organization,
      status: 'active' // Sadece aktif kullanıcılar
    }).select('name email role status createdAt');

    res.status(200).json({
      message: "Takım üyeleri getirildi",
      teamMembers
    });
  } catch (error) {
    console.error("Get team members error:", error);
    res.status(400).json({ message: "Takım üyeleri alınırken hata", error: error.message });
  }
};

// Çalışan davet et
exports.inviteTeamMember = async (req, res) => {
  const { email, role } = req.body;
  const userId = req.user.userId;
  
  try {
    const user = await User.findById(userId).populate('organization');
    if (!user.organization) {
      return res.status(400).json({ message: "Organizasyon bulunamadı" });
    }

    // Admin/manager kontrolü
    if (user.role !== 'admin' && user.role !== 'manager') {
      return res.status(403).json({ message: "Yetkiniz yok" });
    }

    // Zaten üye mi kontrol et
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.organization) {
      return res.status(400).json({ message: "Bu kullanıcı zaten bir organizasyona üye" });
    }

    // Davet listesine ekle
    const organization = user.organization;
    const existingInvite = organization.pendingInvites.find(invite => invite.email === email);
    
    if (existingInvite) {
      return res.status(400).json({ message: "Bu e-posta adresine zaten davet gönderilmiş" });
    }

    organization.pendingInvites.push({
      email,
      role: role || 'employee',
      invitedBy: userId
    });

    await organization.save();

    res.status(200).json({ 
      message: "Davet başarıyla gönderildi",
      inviteCode: organization.inviteCode 
    });
  } catch (error) {
    console.error("Invite team member error:", error);
    res.status(400).json({ message: "Davet gönderilirken hata", error: error.message });
  }
};

// Kullanıcının görevlerini getir
exports.getUserTasks = async (req, res) => {
  const userId = req.user.userId;
  try {
    const user = await User.findById(userId);
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
      tasks = await Task.find({ assignedTo: userId })
        .populate('project', 'name')
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });
    }
    
    res.status(200).json({
      message: "Kullanıcı görevleri getirildi",
      tasks
    });
  } catch (error) {
    console.error("Get user tasks error:", error);
    res.status(400).json({ message: "Görevler alınırken hata", error: error.message });
  }
};

// Kullanıcının projelerini getir
exports.getUserProjects = async (req, res) => {
  const userId = req.user.userId;
  try {
    const projects = await Project.find({ 
      'teamMembers.user': userId 
    }).populate('tasks');
    
    res.status(200).json(projects);
  } catch (error) {
    console.error("Get user projects error:", error);
    res.status(400).json({ message: "Projeler alınırken hata", error: error.message });
  }
};

// Kullanıcı profilini güncelle
exports.updateProfile = async (req, res) => {
  const userId = req.user.userId;
  const { name, email } = req.body;
  
  try {
    // E-posta değişikliği varsa kontrol et
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ message: "Bu e-posta adresi zaten kullanımda" });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      message: "Profil başarıyla güncellendi",
      user: updatedUser
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(400).json({ message: "Profil güncellenirken hata", error: error.message });
  }
};

// Dashboard istatistikleri
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).populate('organization');
    
    if (!user || !user.organization) {
      return res.status(400).json({ message: "Kullanıcı organizasyonu bulunamadı" });
    }

    const Meeting = require("../models/meeting.model");

    // Paralel olarak istatistikleri getir
    const [
      totalProjects,
      activeTasks,
      completedTasks,
      teamMembers,
      pendingTasks,
      totalTimeSpent,
      upcomingMeetings
    ] = await Promise.all([
      Project.countDocuments({ 
        $or: [
          { createdBy: userId },
          { 'teamMembers.user': userId }
        ]
      }),
      Task.countDocuments({ 
        $or: [
          { createdBy: userId },
          { assignedTo: userId }
        ],
        status: 'in-progress'
      }),
      Task.countDocuments({ 
        $or: [
          { createdBy: userId },
          { assignedTo: userId }
        ],
        status: 'completed'
      }),
      User.countDocuments({ organization: user.organization._id }),
      Task.countDocuments({ 
        $or: [
          { createdBy: userId },
          { assignedTo: userId }
        ],
        status: 'pending'
      }),
      // Toplam harcanan zaman hesapla
      Task.aggregate([
        {
          $match: {
            $or: [
              { createdBy: userId },
              { assignedTo: userId }
            ]
          }
        },
        {
          $group: {
            _id: null,
            totalTime: { $sum: '$totalTimeSpent' }
          }
        }
      ]).then(result => result[0]?.totalTime || 0),
      Meeting.countDocuments({
        $or: [
          { organizer: userId },
          { 'attendees.user': userId }
        ],
        organization: user.organization._id,
        startTime: { $gte: new Date() },
        status: 'scheduled'
      })
    ]);

    const stats = {
      totalProjects,
      activeTasks,
      completedTasks,
      teamMembers,
      pendingTasks,
      overdueTasks: 0, // Şimdilik basit tutalım
      totalTimeSpent, // dakika cinsinden
      upcomingMeetings
    };

    res.status(200).json({
      message: "Dashboard istatistikleri getirildi",
      stats
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(400).json({ message: "İstatistikler getirilirken hata", error: error.message });
  }
};

// Kullanıcı rolünü güncelle (sadece admin)
exports.updateUserRole = async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;
  
  try {
    const currentUser = await User.findById(req.user.userId);
    if (currentUser.role !== 'admin') {
      return res.status(403).json({ message: "Bu işlem için yetkiniz yok" });
    }

    const targetUser = await User.findOne({
      _id: userId,
      organization: currentUser.organization
    });

    if (!targetUser) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    if (!['admin', 'manager', 'employee'].includes(role)) {
      return res.status(400).json({ message: "Geçersiz rol" });
    }

    targetUser.role = role;
    await targetUser.save();

    res.status(200).json({
      message: "Kullanıcı rolü güncellendi",
      user: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role
      }
    });
  } catch (error) {
    console.error("Update user role error:", error);
    res.status(400).json({ message: "Rol güncellenirken hata", error: error.message });
  }
};

// Kullanıcıyı organizasyondan çıkar (sadece admin)
exports.removeUserFromOrganization = async (req, res) => {
  const { userId } = req.params;
  
  try {
    const currentUser = await User.findById(req.user.userId);
    if (currentUser.role !== 'admin') {
      return res.status(403).json({ message: "Bu işlem için yetkiniz yok" });
    }

    const targetUser = await User.findOne({
      _id: userId,
      organization: currentUser.organization
    });

    if (!targetUser) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    if (targetUser._id.toString() === currentUser._id.toString()) {
      return res.status(400).json({ message: "Kendinizi organizasyondan çıkaramazsınız" });
    }

    // Kullanıcıyı organizasyondan çıkar
    await Organization.findByIdAndUpdate(
      currentUser.organization,
      { $pull: { members: userId } }
    );

    // Kullanıcının organizasyon bilgisini temizle
    targetUser.organization = null;
    targetUser.role = 'employee';
    targetUser.status = 'pending';
    await targetUser.save();

    res.status(200).json({ message: "Kullanıcı organizasyondan çıkarıldı" });
  } catch (error) {
    console.error("Remove user error:", error);
    res.status(400).json({ message: "Kullanıcı çıkarılırken hata", error: error.message });
  }
};

// Pending inviteleri getir (admin/manager)
exports.getPendingInvites = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate('organization');
    
    if (!['admin', 'manager'].includes(user.role)) {
      return res.status(403).json({ message: "Bu işlem için yetkiniz yok" });
    }

    const organization = await Organization.findById(user.organization._id);
    
    res.status(200).json({
      message: "Bekleyen davetler getirildi",
      invites: organization.pendingInvites
    });
  } catch (error) {
    console.error("Get pending invites error:", error);
    res.status(400).json({ message: "Davetler getirilirken hata", error: error.message });
  }
};

// Daveti iptal et (admin/manager)
exports.cancelInvite = async (req, res) => {
  const { inviteId } = req.params;
  
  try {
    const user = await User.findById(req.user.userId).populate('organization');
    
    if (!['admin', 'manager'].includes(user.role)) {
      return res.status(403).json({ message: "Bu işlem için yetkiniz yok" });
    }

    await Organization.findByIdAndUpdate(
      user.organization._id,
      { $pull: { pendingInvites: { _id: inviteId } } }
    );

    res.status(200).json({ message: "Davet iptal edildi" });
  } catch (error) {
    console.error("Cancel invite error:", error);
    res.status(400).json({ message: "Davet iptal edilirken hata", error: error.message });
  }
};

// Organizasyondaki projeye eklenmemiş üyeleri getir
exports.getAvailableMembersForProject = async (req, res) => {
  const userId = req.user.userId;
  const { projectId } = req.params;
  
  try {
    const user = await User.findById(userId);
    if (!user || !user.organization) {
      return res.status(400).json({ message: "Organizasyon bulunamadı" });
    }

    // Projeyi bul
    const project = await Project.findOne({
      _id: projectId,
      organization: user.organization
    });

    if (!project) {
      return res.status(404).json({ message: "Proje bulunamadı" });
    }

    // Projede olan üyelerin ID'lerini al
    const projectMemberIds = project.teamMembers.map(member => member.user.toString());

    // Organizasyondaki tüm aktif üyeleri getir, projede olmayanları filtrele
    const availableMembers = await User.find({
      organization: user.organization,
      status: 'active',
      _id: { $nin: projectMemberIds }
    }).select('name email role status createdAt');

    res.status(200).json({
      message: "Müsait takım üyeleri getirildi",
      availableMembers
    });
  } catch (error) {
    console.error("Get available members error:", error);
    res.status(400).json({ message: "Müsait üyeler alınırken hata", error: error.message });
  }
};
