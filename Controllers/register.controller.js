const register = require("express").Router();
const User = require("../database/schema/user.schema");
const bcrypt = require("bcrypt");
require("dotenv").config();

// Add a new user route
register.post("/", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(process.env.NumSaltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      email,
      password: hashedPassword,
      firstName: firstName,
      lastName: lastName,
    });

    // Save user to database
    await user.save();

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({
      success: false,
      message: "Error creating user",
    });
  }
});

module.exports = register;
