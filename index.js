require("dotenv").config();
const initialise_Mongo_Connectivity = require("./database/connection.mongodb");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Connect to MongoDB
initialise_Mongo_Connectivity();

const app = express();
app.use(express.json());
app.use(cors());

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/", require("./routes/urlRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
