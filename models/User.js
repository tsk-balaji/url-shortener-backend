const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  useremail: { type: String },
  username: {
    type: String,
    required: true,
    lowercase: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },

    resetPasswordToken: String,
    resetPasswordExpire: Date,
});

const User = mongoose.model("User", userSchema, "users_collection");

module.exports = User;
