const forgotPassword = require("express").Router();
const User = require("../database/schema/user.schema");
const crypto = require("crypto");

require("dotenv").config();
const { sendEmail, mailTemplate } = require("./email.controller");

forgotPassword.post("/", async (req, res) => {
  try {
    const email = req.body.email;
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        success: false,
        message: "You are not registered!",
      });
    }

    // Generate a random token and hash it
    const token = crypto.randomBytes(20).toString("hex");
    const resetToken = crypto.createHash("sha256").update(token).digest("hex");

    // Set reset token and expiry time (e.g., 1 hour from now)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 7200000; // 1 hour
    await user.save();

    // Set up the email with a link to reset the password
    const mailOption = {
      email: user.email,
      subject: "Forgot Password Link",
      message: mailTemplate(
        "We have received a request to reset your password. Please reset your password using the link below.",
        `${process.env.FRONTEND_URL}/resetPassword?id=${user._id}&token=${resetToken}`,
        "Reset Password"
      ),
    };
    await sendEmail(mailOption);

    res.json({
      success: true,
      message: "A password reset link has been sent to your email.",
    });
  } catch (err) {
    console.error("Error in forgotPassword route:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = forgotPassword;
