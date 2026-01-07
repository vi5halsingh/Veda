/**
 * MCP Service - Frontend client for MCP tools
 * Provides contextual awareness features to the chat application
 */

import api from "../config/Api.jsx";

/**
 * Get current server time with timezone info
 * @returns {Promise<{success: boolean, data: object}>}
 */
export async function getCurrentTime() {
  const response = await api.get("/mcp/time");
  return response.data;
}

/**
 * Get user's timezone (from profile or detected)
 * @param {string} localTimezone - Browser's detected timezone
 * @returns {Promise<{success: boolean, data: object}>}
 */
export async function getUserTimezone(localTimezone) {
  const response = await api.get("/mcp/timezone", {
    headers: { "x-timezone": localTimezone },
  });
  return response.data;
}

/**
 * Get system/session context
 * @param {string} sessionId - Optional session identifier
 * @returns {Promise<{success: boolean, data: object}>}
 */
export async function getSystemContext(sessionId) {
  const response = await api.get("/mcp/context", {
    params: { sessionId },
  });
  return response.data;
}

/**
 * Fetch live data from external API (proxied through backend)
 * @param {object} options - { endpoint, method, headers, query, body, timeout }
 * @returns {Promise<{success: boolean, data: object}>}
 */
export async function fetchLiveData(options) {
  const response = await api.post("/mcp/fetch", options);
  return response.data;
}

/**
 * Helper: Get formatted current time string
 */
export async function getFormattedTime() {
  const result = await getCurrentTime();
  if (result.success) {
    return result.data.formattedTime;
  }
  return null;
}

/**
 * Helper: Get browser timezone
 */
export function getBrowserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
