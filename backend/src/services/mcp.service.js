/**
 * MCP Service - Exposes MCP tool functionality for use in the application
 * This bridges the MCP handlers with the rest of the backend
 */

const {
  handleGetCurrentTime,
  handleGetUserTimezone,
  handleGetSystemContext,
  handleFetchLiveData,
} = require("../mcp/handlers");

/**
 * Get current time with timezone info
 */
async function getCurrentTime() {
  return handleGetCurrentTime();
}

/**
 * Get user timezone
 * @param {string} userId - Optional user ID
 * @param {object} requestMetadata - Optional request metadata
 */
async function getUserTimezone(userId, requestMetadata) {
  return handleGetUserTimezone({ userId, requestMetadata });
}

/**
 * Get system/session context
 * @param {string} sessionId - Session identifier
 */
async function getSystemContext(sessionId) {
  return handleGetSystemContext({ sessionId });
}

/**
 * Fetch live data from external API
 * @param {object} options - { endpoint, method, headers, query, body, timeout }
 */
async function fetchLiveData(options) {
  return handleFetchLiveData(options);
}

module.exports = {
  getCurrentTime,
  getUserTimezone,
  getSystemContext,
  fetchLiveData,
};
