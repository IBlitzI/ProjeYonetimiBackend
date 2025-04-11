const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../utils/auth");
const { isValidEmail } = require("../utils/helpers");

exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    const existingUserByEmail = await User.findOne({ email });
    const existingUserByUsername = await User.findOne({ username });

    if (existingUserByEmail) {
      return res
        .status(400)
        .json({ message: "Email address is already in use" });
    }

    if (existingUserByUsername) {
      return res.status(400).json({ message: "Username is already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    const token = generateToken(user._id, "member"); // Varsayılan rol: member

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(400).json({ message: "Error creating user", error });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id, user.role);
    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    res.status(400).json({ message: "Error logging in", error });
  }
};
