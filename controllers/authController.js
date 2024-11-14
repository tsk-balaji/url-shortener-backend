const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.register = async (req, res) => {
  const { username, firstName, lastName, password } = req.body;
  try {
    let user = await User.findOne({ username });
    if (user) return res.status(400).json({ message: "User already exists" });

    user = new User({ username, firstName, lastName, password });
    await user.save();

    // Generate activation token
    const activationToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    const url = `http://localhost:5000/api/auth/activate/${activationToken}`;
    await transporter.sendMail({
      to: username,
      subject: "Account Activation",
      html: `<h4>Activate your account</h4><p>Click this <a href="${url}">link</a> to activate your account.</p>`,
    });

    res.status(201).json({
      message: "Registration successful! Check your email for activation link.",
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.activateAccount = async (req, res) => {
  const { token } = req.params;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user)
      return res.status(400).json({ message: "Invalid activation link" });

    user.isActive = true;
    await user.save();
    res.json({ message: "Account activated successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || !user.isActive)
      return res
        .status(400)
        .json({ message: "Invalid credentials or account not activated" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
