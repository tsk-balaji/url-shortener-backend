const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail", // or your email service provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Generate JWT Token
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" });

// Register User
exports.registerUser = async (req, res) => {
  try {
    const { username, firstName, lastName, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      firstName,
      lastName,
      password: hashedPassword,
      isActive: false, // User needs to activate account via email
    });

    await newUser.save();

    // Generate activation token
    const activationToken = generateToken(newUser._id);
    const activationLink = `${process.env.BASE_URL}/api/auth/activate/${activationToken}`;

    // Send activation email
    // Activation Email Template
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: username,
      subject: "Activate Your Account",
      html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="text-align: center; color: #4CAF50;">Welcome to Our URL Shortener Service</h2>
      <p style="font-size: 16px; color: #333;">
        Hello ${firstName || "User"},<br><br>
        Thank you for registering! Please activate your account by clicking the button below:
      </p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${activationLink}" style="text-decoration: none; padding: 12px 20px; background-color: #4CAF50; color: #fff; border-radius: 4px; font-size: 16px;">
          Activate Account
        </a>
      </div>
      <p style="font-size: 14px; color: #777;">
        If you did not request this, please ignore this email.
      </p>
      <p style="font-size: 14px; color: #777; text-align: center;">&copy; ${new Date().getFullYear()} URL Shortener</p>
    </div>
  `,
    });

    res.status(201).json({
      message:
        "User registered. Please check your email to activate your account.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login User
exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (!user.isActive) {
      return res
        .status(403)
        .json({ message: "Account not activated. Check your email." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = generateToken(user._id);
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Activate Account
exports.activateAccount = async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(400).json({ message: "Invalid activation link" });
    }

    user.isActive = true;
    await user.save();

    res.status(200).json({ message: "Account activated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    console.log("Request body:", req.body); // Log the entire request body
    const { username } = req.body; // Change this to username
    console.log("Extracted username:", username); // Log the extracted username

    if (!username) {
      return res.status(400).json({ message: "Email (username) is required" });
    }

    const user = await User.findOne({ username }); // Use username here
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetLink = `${process.env.BASE_URL}/api/auth/reset-password/${resetToken}`;

    // Send reset password email
    // Activation Email Template
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: username,
      subject: "Activate Your Account",
      html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="text-align: center; color: #4CAF50;">Welcome to Our URL Shortener Service</h2>
      <p style="font-size: 16px; color: #333;">
        Hello ${firstName || "User"},<br><br>
        Thank you for registering! Please activate your account by clicking the button below:
      </p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${activationLink}" style="text-decoration: none; padding: 12px 20px; background-color: #4CAF50; color: #fff; border-radius: 4px; font-size: 16px;">
          Activate Account
        </a>
      </div>
      <p style="font-size: 14px; color: #777;">
        If you did not request this, please ignore this email.
      </p>
      <p style="font-size: 14px; color: #777; text-align: center;">&copy; ${new Date().getFullYear()} URL Shortener</p>
    </div>
  `,
    });

    res.status(200).json({ message: "Password reset link sent to your email" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();
    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
