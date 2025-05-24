const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  
  // Proje organizasyonu ve kurucusu
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Proje özellikleri
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  
  status: {
    type: String,
    enum: ['planning', 'active', 'completed', 'on-hold'],
    default: 'planning'
  },
  
  // Takım üyeleri (basitleştirilmiş)
  teamMembers: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, default: 'Developer' },
    assignedAt: { type: Date, default: Date.now },
    tasksCount: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 }
  }],
  
  // Görevler
  tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  
  // İstatistikler
  stats: {
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    inProgressTasks: { type: Number, default: 0 },
    teamMemberCount: { type: Number, default: 0 }
  },
  
  // Tarihler
  startDate: { type: Date },
  endDate: { type: Date },
  dueDate: { type: Date },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// İstatistikleri güncelleme middleware
projectSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  this.stats.teamMemberCount = this.teamMembers.length;
  next();
});

module.exports = mongoose.model('Project', projectSchema);