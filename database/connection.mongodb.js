const mongoose = require("mongoose");

const initialise_Mongo_Connectivity = () => {
  try {
    mongoose.connect(process.env.DATABASE_URL);

    // Add event listeners to monitor connection status
    mongoose.connection.on("connected", () => {
      console.log("Connected to MongoDB");
    });

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
      process.exit(1);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected");
    });
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1); // Exit the app if there's an error connecting to MongoDB
  }
};

module.exports = initialise_Mongo_Connectivity;

mongoose.set("debug", true);
