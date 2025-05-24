const Meeting = require("../models/meeting.model");
const User = require("../models/user.model");
const Project = require("../models/project.model");

// Toplantı oluştur
exports.createMeeting = async (req, res) => {
  try {
    const { title, description, startTime, endTime, meetingType, location, meetingUrl, projectId } = req.body;
    const userId = req.user.userId;
    
    const user = await User.findById(userId);
    if (!user || !user.organization) {
      return res.status(400).json({ message: "Kullanıcı organizasyonu bulunamadı" });
    }

    const meetingData = {
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      meetingType: meetingType || 'physical',
      organizer: userId,
      organization: user.organization,
      attendees: [{ user: userId, status: 'accepted' }] // Organizatör otomatik katılımcı
    };

    // Opsiyonel alanlar
    if (location) meetingData.location = location;
    if (meetingUrl) meetingData.meetingUrl = meetingUrl;
    if (projectId) meetingData.project = projectId;

    const meeting = new Meeting(meetingData);
    await meeting.save();

    await meeting.populate([
      { path: 'organizer', select: 'name email' },
      { path: 'project', select: 'name' }
    ]);

    res.status(201).json({
      message: "Toplantı başarıyla oluşturuldu",
      meeting
    });
  } catch (error) {
    console.error("Meeting creation error:", error);
    res.status(400).json({ message: "Toplantı oluşturulurken hata", error: error.message });
  }
};

// Kullanıcının toplantılarını getir
exports.getUserMeetings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    
    if (!user || !user.organization) {
      return res.status(400).json({ message: "Kullanıcı organizasyonu bulunamadı" });
    }

    let meetings;

    // Employee kullanıcıları organizasyondaki tüm toplantıları görebilir
    if (user.role === 'employee') {
      meetings = await Meeting.find({
        organization: user.organization
      })
      .populate('organizer', 'name email')
      .populate('project', 'name')
      .sort({ startTime: 1 })
      .limit(50);
    } else {
      // Admin ve Manager sadece kendi toplantılarını görsün
      meetings = await Meeting.find({
        $or: [
          { organizer: userId },
          { 'attendees.user': userId }
        ],
        organization: user.organization
      })
      .populate('organizer', 'name email')
      .populate('project', 'name')
      .sort({ startTime: 1 })
      .limit(50);
    }

    // Durum hesapla
    const now = new Date();
    const meetingsWithStatus = meetings.map(meeting => {
      const meetingObj = meeting.toObject();
      
      if (meeting.status === 'cancelled') {
        meetingObj.displayStatus = 'İptal Edildi';
        meetingObj.statusColor = '#6b7280';
      } else if (meeting.endTime < now) {
        meetingObj.displayStatus = 'Tamamlandı';
        meetingObj.statusColor = '#22c55e';
      } else if (meeting.startTime <= now && meeting.endTime >= now) {
        meetingObj.displayStatus = 'Devam Ediyor';
        meetingObj.statusColor = '#f59e0b';
      } else if (meeting.startTime > now) {
        meetingObj.displayStatus = 'Yaklaşan';
        meetingObj.statusColor = '#3b82f6';
      }
      
      return meetingObj;
    });

    res.status(200).json({
      message: "Toplantılar başarıyla getirildi",
      meetings: meetingsWithStatus
    });
  } catch (error) {
    console.error("Get meetings error:", error);
    res.status(400).json({ message: "Toplantılar getirilirken hata", error: error.message });
  }
};

// Yaklaşan toplantılar (dashboard için)
exports.getUpcomingMeetings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    
    if (!user || !user.organization) {
      return res.status(400).json({ message: "Kullanıcı organizasyonu bulunamadı" });
    }

    const now = new Date();
    const meetings = await Meeting.find({
      $or: [
        { organizer: userId },
        { 'attendees.user': userId }
      ],
      organization: user.organization,
      startTime: { $gte: now },
      status: 'scheduled'
    })
    .populate('organizer', 'name email')
    .populate('project', 'name')
    .sort({ startTime: 1 })
    .limit(5);

    res.status(200).json({
      message: "Yaklaşan toplantılar getirildi",
      meetings
    });
  } catch (error) {
    console.error("Get upcoming meetings error:", error);
    res.status(400).json({ message: "Yaklaşan toplantılar getirilirken hata", error: error.message });
  }
};

// Toplantı detayı
exports.getMeeting = async (req, res) => {
  try {
  const { meetingId } = req.params;
    const userId = req.user.userId;

    const meeting = await Meeting.findById(meetingId)
      .populate('organizer', 'name email')
      .populate('project', 'name')
      .populate('attendees.user', 'name email');

    if (!meeting) {
      return res.status(404).json({ message: "Toplantı bulunamadı" });
    }

    // Erişim kontrolü
    const hasAccess = meeting.organizer._id.toString() === userId || 
                     meeting.attendees.some(a => a.user._id.toString() === userId);
    
    if (!hasAccess) {
      return res.status(403).json({ message: "Bu toplantıya erişim yetkiniz yok" });
    }

    const now = new Date();
    const meetingObj = meeting.toObject();
    
    // Durum hesapla
    if (meeting.status === 'cancelled') {
      meetingObj.displayStatus = 'İptal Edildi';
      meetingObj.statusColor = '#6b7280';
    } else if (meeting.endTime < now) {
      meetingObj.displayStatus = 'Tamamlandı';
      meetingObj.statusColor = '#22c55e';
    } else if (meeting.startTime <= now && meeting.endTime >= now) {
      meetingObj.displayStatus = 'Devam Ediyor';
      meetingObj.statusColor = '#f59e0b';
    } else if (meeting.startTime > now) {
      meetingObj.displayStatus = 'Yaklaşan';
      meetingObj.statusColor = '#3b82f6';
    }

    res.status(200).json({
      message: "Toplantı detayı getirildi",
      meeting: meetingObj
    });
  } catch (error) {
    console.error("Get meeting error:", error);
    res.status(400).json({ message: "Toplantı getirilirken hata", error: error.message });
  }
};

// Toplantı güncelle
exports.updateMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.user.userId;
    const updates = req.body;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ message: "Toplantı bulunamadı" });
    }

    // Sadece organizatör güncelleyebilir
    if (meeting.organizer.toString() !== userId) {
      return res.status(403).json({ message: "Sadece organizatör toplantıyı güncelleyebilir" });
    }

    // Güncelleme
    Object.keys(updates).forEach(key => {
      if (key === 'startTime' || key === 'endTime') {
        meeting[key] = new Date(updates[key]);
      } else {
        meeting[key] = updates[key];
      }
    });

    await meeting.save();
    await meeting.populate([
      { path: 'organizer', select: 'name email' },
      { path: 'project', select: 'name' }
    ]);

    res.status(200).json({
      message: "Toplantı başarıyla güncellendi",
      meeting
    });
  } catch (error) {
    console.error("Update meeting error:", error);
    res.status(400).json({ message: "Toplantı güncellenirken hata", error: error.message });
  }
};

// Toplantı sil
exports.deleteMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.user.userId;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ message: "Toplantı bulunamadı" });
    }

    // Sadece organizatör silebilir
    if (meeting.organizer.toString() !== userId) {
      return res.status(403).json({ message: "Sadece organizatör toplantıyı silebilir" });
    }

    await Meeting.findByIdAndDelete(meetingId);

    res.status(200).json({
      message: "Toplantı başarıyla silindi"
    });
  } catch (error) {
    console.error("Delete meeting error:", error);
    res.status(400).json({ message: "Toplantı silinirken hata", error: error.message });
  }
};
