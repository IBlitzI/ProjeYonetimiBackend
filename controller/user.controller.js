const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const { generateToken, verifyToken } = require('../utils/auth');

exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    const token = generateToken(user._id, 'member'); // Varsayılan rol: member
    res.status(201).json({ message: 'User created successfully', token });
  } catch (error) {
    res.status(400).json({ message: 'Error creating user', error });
  }
};
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id, user.role);
    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    res.status(400).json({ message: 'Error logging in', error });
  }
};

exports.verifyUser = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User verified', user });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token', error });
  }
};

exports.getUserOrganizations = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId).populate('organizations.organization');
    res.status(200).json(user.organizations);
  } catch (error) {
    res.status(400).json({ message: 'Error fetching organizations', error });
  }
};

exports.getUserTasks = async (req, res) => {
  const { userId } = req.params;
  try {
    const tasks = await Task.find({ assignedTo: userId }).populate('project');
    res.status(200).json(tasks);
  } catch (error) {
    res.status(400).json({ message: 'Error fetching tasks', error });
  }
};