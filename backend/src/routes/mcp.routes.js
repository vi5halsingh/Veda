/**
 * MCP Routes - REST API endpoints for MCP tools
 */

const express = require("express");
const router = express.Router();
const mcpService = require("../services/mcp.service");
const { authUser: authMiddleware } = require("../middlewares/auth.middleware");

// Get current time (public - no auth needed)
router.get("/time", async (req, res) => {
  try {
    const result = await mcpService.getCurrentTime();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user timezone (requires auth for user-specific timezone)
router.get("/timezone", authMiddleware, async (req, res) => {
  try {
    const result = await mcpService.getUserTimezone(
      req.user?._id?.toString(),
      { timezone: req.headers["x-timezone"] }
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get system context
router.get("/context", authMiddleware, async (req, res) => {
  try {
    const sessionId = req.query.sessionId || req.headers["x-session-id"];
    const result = await mcpService.getSystemContext(sessionId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Fetch live data (protected - requires auth)
router.post("/fetch", authMiddleware, async (req, res) => {
  try {
    const { endpoint, method, headers, query, body, timeout } = req.body;
    
    if (!endpoint) {
      return res.status(400).json({ success: false, error: "Endpoint is required" });
    }
    
    const result = await mcpService.fetchLiveData({
      endpoint,
      method,
      headers,
      query,
      body,
      timeout,
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
