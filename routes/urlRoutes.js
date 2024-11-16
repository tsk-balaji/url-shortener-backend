const express = require("express");
const {
  createShortUrl,
  redirectUrl,
  getUrlStats,
} = require("../controllers/urlController");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/create", authMiddleware, createShortUrl);
router.get("/stats", getUrlStats);
router.get("/:shortUrl", redirectUrl);

module.exports = router;
