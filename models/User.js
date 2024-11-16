
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true // Ensure it's unique and properly indexed
  },
  firstName: { type: String },
  lastName: { type: String },
  password: { type: String },
  isActive: { type: Boolean, default: false }
});



// Specify the custom collection name as the third argument
module.exports = mongoose.model("User", userSchema, "users_collection");
