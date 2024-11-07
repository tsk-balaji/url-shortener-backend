const resetPassword = require("express").Router();
const User = require("../database/schema/user.schema");
const bcrypt = require("bcrypt");
require("dotenv").config();

resetPassword.post("/", async (req, res) => {
  try {
    const { password, token, userId } = req.body;

    // Find the user by ID
    const user = await User.findById(userId);

    // Check if user exists
    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    // Check if reset token exists
    if (!user.resetPasswordToken) {
      return res.json({
        success: false,
        message: "No reset password request found",
      });
    }

    // Check if token matches
    if (user.resetPasswordToken !== token) {
      return res.json({
        success: false,
        message: "Invalid reset password token",
      });
    }

    // Check if the token has expired (2 hours limit)
    const currDateTime = new Date();
    const twoHoursInMs = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
    if (currDateTime - user.resetPasswordExpire > twoHoursInMs) {
      return res.json({
        success: false,
        message: "Reset Password link has expired!",
      });
    }

    // Hash the new password and update the user record
    const salt = await bcrypt.genSalt(process.env.NumSaltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    user.resetPasswordToken = null; // Clear the reset token
    user.resetPasswordExpires = null; // Clear the token expiration

    await user.save();

    res.json({
      success: true,
      message: "Your password reset was successful!",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "An error occurred while resetting the password.",
    });
  }
});

module.exports = resetPassword;
