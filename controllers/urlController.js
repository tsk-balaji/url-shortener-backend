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

    // Check if URL already exists for this user
    const existingUrl = await Url.findOne({ originalUrl, userId });
    if (existingUrl) {
      return res.status(200).json({
        shortUrl: `${process.env.BASE_URL}/${existingUrl.shortUrl}`,
        originalUrl: existingUrl.originalUrl, // Add originalUrl to response
      });
    }

    // Generate a unique short URL
    const shortUrl = shortid.generate();

    // Create and save the new shortened URL
    const newUrl = new Url({
      originalUrl,
      shortUrl,
      userId,
      clicks: 0, // Initialize clicks counter
    });

    const savedUrl = await newUrl.save();

    // Verify URL was saved successfully
    if (!savedUrl) {
      return res.status(500).json({ message: "Failed to save URL" });
    }

    // Respond with the shortened URL
    res.status(201).json({
      shortUrl: `${process.env.BASE_URL}/${shortUrl}`,
      originalUrl: savedUrl.originalUrl, // Add originalUrl to response
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
    // Get daily stats for all users
    const dailyStats = await Url.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, // Group by day
          totalUrls: { $sum: 1 }, // Count the total URLs created on that day
        },
      },
      { $sort: { _id: -1 } }, // Sort by day in descending order
    ]);

    // Get monthly stats for all users
    const monthlyStats = await Url.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, // Group by month
          totalUrls: { $sum: 1 }, // Count the total URLs created in that month
        },
      },
      { $sort: { _id: -1 } }, // Sort by month in descending order
    ]);

    res.status(200).json({ dailyStats, monthlyStats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch URL statistics" });
  }
};
