const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value > this.startTime;
      },
      message: 'Bitiş tarihi başlangıç tarihinden sonra olmalıdır'
    }
  },
  location: {
    type: String,
    trim: true
  },
  meetingType: {
    type: String,
    enum: ['online', 'physical', 'hybrid'],
    default: 'physical'
  },
  meetingUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(value) {
        if (this.meetingType === 'online' || this.meetingType === 'hybrid') {
          return value && value.length > 0;
        }
        return true;
      },
      message: 'Online toplantılar için meeting URL gereklidir'
    }
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  attendees: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['invited', 'accepted', 'declined', 'maybe'],
      default: 'invited'
    },
    joinedAt: Date,
    leftAt: Date
  }],
  agenda: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    duration: {
      type: Number, // dakika cinsinden
      default: 10
    },
    presenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  recordingUrl: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  actionItems: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dueDate: Date,
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date
  }],
  reminders: [{
    time: {
      type: Number, // toplantıdan kaç dakika önce (15, 30, 60 gibi)
      required: true
    },
    sent: {
      type: Boolean,
      default: false
    }
  }],
  recurring: {
    enabled: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'weekly'
    },
    interval: {
      type: Number,
      default: 1
    },
    endDate: Date
  }
}, {
  timestamps: true
});

// Index'ler
meetingSchema.index({ organizer: 1, startTime: 1 });
meetingSchema.index({ organization: 1, startTime: 1 });
meetingSchema.index({ project: 1, startTime: 1 });
meetingSchema.index({ 'attendees.user': 1 });
meetingSchema.index({ startTime: 1, endTime: 1 });

// Virtual'lar
meetingSchema.virtual('duration').get(function() {
  return Math.floor((this.endTime - this.startTime) / (1000 * 60)); // dakika cinsinden
});

meetingSchema.virtual('isUpcoming').get(function() {
  return this.startTime > new Date() && this.status === 'scheduled';
});

meetingSchema.virtual('isOngoing').get(function() {
  const now = new Date();
  return this.startTime <= now && this.endTime >= now && this.status === 'ongoing';
});

meetingSchema.virtual('isPast').get(function() {
  return this.endTime < new Date();
});

// Methods
meetingSchema.methods.addAttendee = function(userId, status = 'invited') {
  const existingAttendee = this.attendees.find(a => a.user.toString() === userId.toString());
  if (!existingAttendee) {
    this.attendees.push({ user: userId, status });
    return this.save();
  }
  return this;
};

meetingSchema.methods.updateAttendeeStatus = function(userId, status) {
  const attendee = this.attendees.find(a => a.user.toString() === userId.toString());
  if (attendee) {
    attendee.status = status;
    return this.save();
  }
  throw new Error('Katılımcı bulunamadı');
};

meetingSchema.methods.startMeeting = function() {
  this.status = 'ongoing';
  return this.save();
};

meetingSchema.methods.endMeeting = function() {
  this.status = 'completed';
  return this.save();
};

meetingSchema.methods.cancelMeeting = function() {
  this.status = 'cancelled';
  return this.save();
};

meetingSchema.methods.addActionItem = function(actionItem) {
  this.actionItems.push(actionItem);
  return this.save();
};

// Static methods
meetingSchema.statics.getUpcomingMeetings = function(userId, organizationId) {
  const query = {
    $or: [
      { organizer: userId },
      { 'attendees.user': userId }
    ],
    organization: organizationId,
    startTime: { $gte: new Date() },
    status: 'scheduled'
  };
  
  return this.find(query)
    .populate('organizer', 'name email')
    .populate('project', 'name')
    .populate('attendees.user', 'name email')
    .sort({ startTime: 1 })
    .limit(10);
};

meetingSchema.statics.getTodaysMeetings = function(userId, organizationId) {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  
  const query = {
    $or: [
      { organizer: userId },
      { 'attendees.user': userId }
    ],
    organization: organizationId,
    startTime: { $gte: startOfDay, $lt: endOfDay }
  };
  
  return this.find(query)
    .populate('organizer', 'name email')
    .populate('project', 'name')
    .sort({ startTime: 1 });
};

meetingSchema.statics.getProjectMeetings = function(projectId) {
  return this.find({ project: projectId })
    .populate('organizer', 'name email')
    .populate('attendees.user', 'name email')
    .sort({ startTime: -1 });
};

module.exports = mongoose.model("Meeting", meetingSchema);
