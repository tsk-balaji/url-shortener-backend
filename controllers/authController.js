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
    const activationLink = `https://url-shortener-tsk.netlify.app/api/auth/activate/${activationToken}`;

    // Send activation email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: username,
      subject: "Activate Your Account",
      html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #333;">Welcome to Our Service!</h2>
      <p style="color: #555;">
        Hi ${user.firstName},<br><br>
        Thank you for registering with us. Please confirm your email to activate your account and start using our service.
      </p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${activationLink}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
          Activate Account
        </a>
      </div>
      <p style="color: #555;">
        If you didn’t request this email, please ignore it.<br><br>
        Thank you,<br>
        The Team
      </p>
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

    const resetLink = `https://url-shortener-tsk.netlify.app/reset-password/${resetToken}`;

    // Send reset password email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: username,
      subject: "Password Reset Request",
      html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p style="color: #555;">
        Hi ${user.firstName},<br><br>
        We received a request to reset your password. Click the button below to set a new password.
      </p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${resetLink}" style="background-color: #FF5722; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
          Reset Password
        </a>
      </div>
      <p style="color: #555;">
        This link will expire in 1 hour. If you didn’t request a password reset, you can ignore this email.
      </p>
      <p style="color: #555;">
        Thank you,<br>
        The Team
      </p>
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
