const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  
  // Organizasyon kurucusu
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Üye listesi (basitleştirilmiş)
  members: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  
  // Projeler
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  
  // Davet sistemi
  inviteCode: { type: String, unique: true },
  pendingInvites: [{
    email: String,
    role: { type: String, enum: ['manager', 'employee'], default: 'employee' },
    invitedAt: { type: Date, default: Date.now },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  
  // İstatistikler
  stats: {
    totalMembers: { type: Number, default: 0 },
    activeMembers: { type: Number, default: 0 },
    totalProjects: { type: Number, default: 0 },
    completedProjects: { type: Number, default: 0 }
  },
  
  // Ayarlar
  settings: {
    allowPublicJoin: { type: Boolean, default: false },
    requireApproval: { type: Boolean, default: true }
  },
  
  createdAt: { type: Date, default: Date.now },
});

// Davet kodu oluşturma
organizationSchema.pre('save', function(next) {
  if (!this.inviteCode) {
    this.inviteCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
  next();
});

module.exports = mongoose.model('Organization', organizationSchema);