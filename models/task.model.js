const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  requirements: {
    type: [
      {
        text: { type: String, required: true },
        isDone: { type: Boolean, default: false },
      },
    ],
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  }, // Task'ın bağlı olduğu proje
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Task'ın atandığı kullanıcı
  status: {
    type: String,
    enum: ["todo", "inProgress", "review", "onHold", "cancelled", "completed"],
    default: "todo",
  }, // Task durumu
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  }, // Task önceliği
  dueDate: { type: Date }, // Task'ın bitiş tarihi
  createdAt: { type: Date, default: Date.now },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }, // Task'ı oluşturan kullanıcı
});

module.exports = mongoose.model("Task", taskSchema);
