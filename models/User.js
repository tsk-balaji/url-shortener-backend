const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    useremail: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    password: { type: String, required: true },
    isActive: { type: Boolean, default: false },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

// Specify the custom collection name as the third argument
module.exports = mongoose.model("User", userSchema, "users_collection");
