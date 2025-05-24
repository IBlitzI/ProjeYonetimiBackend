const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String }, // Açıklama alanı
  
  // Requirements sistemi
  requirements: {
    type: [
      {
        text: { type: String, required: true },
        isDone: { type: Boolean, default: false },
      },
    ],
  },
  
  // İlişkiler
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  
  // Durum (frontend ile uyumlu)
  status: {
    type: String,
    enum: ["pending", "in-progress", "completed"],
    default: "pending",
  },
  
  // Öncelik
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  
  // Tarihler
  dueDate: { type: Date },
  startDate: { type: Date },
  completedAt: { type: Date },
  
  // Time Tracking
  timeEntries: [{
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    duration: { type: Number }, // dakika cinsinden
    description: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // İstatistikler
  estimatedHours: { type: Number },
  actualHours: { type: Number },
  totalTimeSpent: { type: Number, default: 0 }, // dakika cinsinden toplam harcanan süre
  progressPercentage: { type: Number, default: 0 },
  
  // Meta
  tags: [{ type: String }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Toplam zamanı hesapla
taskSchema.methods.calculateTotalTime = function() {
  this.totalTimeSpent = this.timeEntries.reduce((total, entry) => {
    return total + (entry.duration || 0);
  }, 0);
  return this.totalTimeSpent;
};

// Zaman girişi ekle
taskSchema.methods.addTimeEntry = function(userId, startTime, endTime, description) {
  const duration = endTime ? Math.floor((endTime - startTime) / (1000 * 60)) : 0;
  
  this.timeEntries.push({
    user: userId,
    startTime,
    endTime,
    duration,
    description
  });
  
  this.calculateTotalTime();
  return this.save();
};

// Aktif zaman girişini bitir
taskSchema.methods.stopTimeTracking = function(userId, endTime, description) {
  const activeEntry = this.timeEntries.find(entry => 
    entry.user.toString() === userId.toString() && !entry.endTime
  );
  
  if (activeEntry) {
    activeEntry.endTime = endTime;
    activeEntry.duration = Math.floor((endTime - activeEntry.startTime) / (1000 * 60));
    if (description) {
      activeEntry.description = description;
    }
    this.calculateTotalTime();
    return this.save();
  }
  
  throw new Error('Aktif zaman girişi bulunamadı');
};

// Aktif zaman takibi var mı kontrol et
taskSchema.methods.hasActiveTimeTracking = function(userId) {
  return this.timeEntries.some(entry => 
    entry.user.toString() === userId.toString() && !entry.endTime
  );
};

// Virtual - saatlere çevir
taskSchema.virtual('totalHoursSpent').get(function() {
  return Math.round((this.totalTimeSpent / 60) * 100) / 100;
});

// Progress hesaplama
taskSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Durum değiştikçe ilerleme yüzdesi güncelleme
  if (this.status === 'pending') {
    this.progressPercentage = 0;
  } else if (this.status === 'in-progress') {
    this.progressPercentage = 50;
  } else if (this.status === 'completed') {
    this.progressPercentage = 100;
    if (!this.completedAt) {
      this.completedAt = new Date();
    }
  }
  
  next();
});

module.exports = mongoose.model("Task", taskSchema);
