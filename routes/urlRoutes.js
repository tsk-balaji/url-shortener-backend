const express = require("express");
const {
  createShortUrl,
  redirectUrl,
  getUrlStats,
} = require("../controllers/urlController");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/create", authMiddleware, createShortUrl);
router.get("/:shortUrl", redirectUrl);
router.get("/stats", getUrlStats);

module.exports = router;
