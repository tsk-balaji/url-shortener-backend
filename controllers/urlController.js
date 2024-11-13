const Url = require("../models/Url");
const shortid = require("shortid");

// Create Short URL
exports.createShortUrl = async (req, res) => {
  try {
    // Ensure originalUrl is provided in the body
    const { originalUrl } = req.body;
    if (!originalUrl || !/^https?:\/\//.test(originalUrl)) {
      return res.status(400).json({ message: "Invalid URL format" });
    }

    // Ensure the user is authenticated and req.user is set correctly
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const userId = req.user.id; // Assuming user is authenticated and user ID is available

    // Generate a unique short URL
    const shortUrl = shortid.generate();

    // Create and save the new shortened URL
    const newUrl = new Url({
      originalUrl,
      shortUrl,
      userId, // Associate the shortened URL with the authenticated user
    });

    await newUrl.save();

    // Respond with the shortened URL
    res.status(201).json({
      shortUrl: `${process.env.BASE_URL}/${shortUrl}`, // Adjust if needed
    });
  } catch (error) {
    console.error(error); // For debugging purposes
    res
      .status(500)
      .json({ message: "An error occurred while creating the short URL" });
  }
};

// Redirect Short URL
exports.redirectUrl = async (req, res) => {
  try {
    const { shortUrl } = req.params;

    const url = await Url.findOne({ shortUrl });
    if (!url) {
      return res.status(404).json({ message: "URL not found" });
    }

    url.clicks++;
    await url.save();
    res.redirect(url.originalUrl);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get URL Stats
exports.getUrlStats = async (req, res) => {
  try {
    const userId = req.user.id; // Assume req.user is set after JWT authentication

    const urls = await Url.find({ userId }).select(
      "originalUrl shortUrl clicks createdAt"
    );
    res.status(200).json(urls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
