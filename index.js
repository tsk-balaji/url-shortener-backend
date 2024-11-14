require("dotenv").config();
const initialise_Mongo_Connectivity = require("./database/connection.mongodb");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

// Connect to MongoDB
initialise_Mongo_Connectivity();

const app = express();

//To Parse Json Request
app.use(bodyParser.json());

app.use(cors());

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/", require("./routes/urlRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on port ${PORT}`)
);
