const Meeting = require("../models/meeting.model");

exports.createMeeting = async (req, res) => {
  const { title, description, startTime, endTime, participants } = req.body;
  try {
    const meeting = new Meeting({
      title,
      description,
      startTime,
      endTime,
      participants,
      createdBy: req.user.id,
    });
    await meeting.save();

    res.status(201).json({ message: "Meeting created successfully", meeting });
  } catch (error) {
    res.status(400).json({ message: "Error creating meeting", error });
  }
};

exports.updateMeeting = async (req, res) => {
  const { meetingId } = req.params;
  const updateData = req.body;

  try {
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }
    if (
      meeting.createdBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const updatedMeeting = await Meeting.findByIdAndUpdate(
      meetingId,
      updateData,
      {
        new: true,
      }
    );
    res.status(200).json({
      message: "Meeting updated successfully",
      meeting: updatedMeeting,
    });
  } catch (error) {
    res.status(400).json({ message: "Error updating meeting", error });
  }
};

exports.deleteMeeting = async (req, res) => {
  const { meetingId } = req.params;

  try {
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }
    if (
      meeting.createdBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await Meeting.findByIdAndDelete(meetingId);
    res.status(200).json({ message: "Meeting deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: "Error deleting meeting", error });
  }
};

exports.getMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find();
    res.status(200).json(meetings);
  } catch (error) {
    res.status(400).json({ message: "Error getting meetings", error });
  }
};

exports.getMeetingById = async (req, res) => {
  const { meetingId } = req.params;
  try {
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }
    res.status(200).json({ meeting });
  } catch (error) {
    res.status(400).json({ message: "Error getting meeting", error });
  }
};
