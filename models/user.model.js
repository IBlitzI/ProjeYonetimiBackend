const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  organizations: [
    {
      organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }, // Kullanıcının üye olduğu organizasyon
      role: { type: String, enum: ['admin', 'member'], default: 'member' }, // Kullanıcının organizasyondaki rolü
    },
  ],
  assignedTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }], // Kullanıcıya atanmış task'lar
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);