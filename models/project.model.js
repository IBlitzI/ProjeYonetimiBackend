const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true }, // Projenin bağlı olduğu organizasyon
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Projeyi oluşturan kullanıcı
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Projeye dahil olan kullanıcılar
  tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }], // Projeye ait task'lar
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Project', projectSchema);