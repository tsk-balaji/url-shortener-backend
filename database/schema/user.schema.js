const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  id: Number,
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: String,
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
