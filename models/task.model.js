const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true }, // Task'ın bağlı olduğu proje
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Task'ın atandığı kullanıcı
  status: { type: String, enum: ['todo', 'inProgress', 'done'], default: 'todo' }, // Task durumu
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }, // Task önceliği
  dueDate: { type: Date }, // Task'ın bitiş tarihi
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Task', taskSchema);