const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Organizasyonu oluşturan kullanıcı
  members: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Organizasyona dahil olan kullanıcı
      role: { type: String, enum: ['admin', 'member'], default: 'member' }, // Kullanıcının organizasyondaki rolü
    },
  ],
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }], // Organizasyona ait projeler
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Organization', organizationSchema);