const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true }, // Frontend'de kullandığımız name alanı
  
  // Ana organizasyon üyeliği
        organization: {
          type: mongoose.Schema.Types.ObjectId,
    ref: "Organization"
        },
  
  // Organizasyondaki genel rolü
        role: {
          type: String,
    enum: ["admin", "manager", "employee"],
    default: "employee",
        },
  
  // Hesap durumu  
  status: {
    type: String,
    enum: ["active", "pending", "inactive"],
    default: "pending"
  },
  
  // Proje atamaları (çoktan çoğa ilişki için)
  projectAssignments: [{
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    role: { type: String, default: "Developer" }, // Projedeki rolü
    assignedAt: { type: Date, default: Date.now }
  }],
  
  assignedTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
  
  // İstatistikler
  projectsCount: { type: Number, default: 0 },
  completedTasksCount: { type: Number, default: 0 },
  
  joinDate: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
