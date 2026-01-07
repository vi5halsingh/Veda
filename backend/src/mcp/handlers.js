/**
 * Tool Handlers for Veda AI MCP Server
 * Implements the logic for each MCP tool
 */

const userModel = require("../models/user.model");
const {
    getSystemTimezone,
    isValidTimezone,
    formatTimeForTimezone,
} = require("./timezoneUtils");

// In-memory session store (replace with Redis in production)
const sessionStore = new Map();

/**
 * Initialize or update a session
 * @param {string} sessionId - Session identifier
 * @returns {object} Session data
 */
function getOrCreateSession(sessionId) {
    if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    if (!sessionStore.has(sessionId)) {
        sessionStore.set(sessionId, {
            id: sessionId,
            startedAt: new Date(),
            lastActivityAt: new Date(),
            interactionCount: 0,
            platform: "unknown",
        });
    }

    const session = sessionStore.get(sessionId);
    session.lastActivityAt = new Date();
    session.interactionCount++;
    return session;
}

/**
 * Handler: getCurrentTime
 * Returns the exact current time, date, day of week, and timezone
 */
async function handleGetCurrentTime() {
    const now = new Date();
    const systemTz = getSystemTimezone();
    const formatted = formatTimeForTimezone(now, systemTz);

    return {
        success: true,
        data: {
            currentTime: now.toISOString(),
            localTime: formatted.localTime,
            formattedTime: formatted.formattedTime,
            formattedDate: formatted.formattedDate,
            dayOfWeek: formatted.dayOfWeek,
            timezone: formatted.timezone,
            utcOffset: formatted.utcOffset,
            timestamp: now.getTime(),
        },
    };
}

/**
 * Handler: getUserTimezone
 * Detects user's timezone from profile or request metadata
 * @param {object} args - { userId, requestMetadata }
 */
async function handleGetUserTimezone(args = {}) {
    const { userId, requestMetadata } = args;
    let timezone = null;
    let source = "system_default";

    // Priority 1: Check user profile
    if (userId) {
        try {
            const user = await userModel.findById(userId).select("timezone");
            if (user && user.timezone && isValidTimezone(user.timezone)) {
                timezone = user.timezone;
                source = "user_profile";
            }
        } catch (error) {
            // User not found or DB error, continue to fallbacks
        }
    }

    // Priority 2: Check request metadata
    if (!timezone && requestMetadata) {
        // Check for explicit timezone header
        if (requestMetadata.timezone && isValidTimezone(requestMetadata.timezone)) {
            timezone = requestMetadata.timezone;
            source = "request_header";
        }
        // Check Accept-Language for regional hints (simplified)
        else if (requestMetadata.acceptLanguage) {
            // This is a simplified approach - in production you'd want proper locale parsing
            const lang = requestMetadata.acceptLanguage.split(",")[0];
            // Map common language codes to timezones (simplified)
            const langToTz = {
                "en-IN": "Asia/Kolkata",
                "en-US": "America/New_York",
                "en-GB": "Europe/London",
                "de-DE": "Europe/Berlin",
                "fr-FR": "Europe/Paris",
                "ja-JP": "Asia/Tokyo",
                "zh-CN": "Asia/Shanghai",
            };
            if (langToTz[lang]) {
                timezone = langToTz[lang];
                source = "accept_language";
            }
        }
    }

    // Priority 3: Fall back to system timezone
    if (!timezone) {
        timezone = getSystemTimezone();
        source = "system_default";
    }

    return {
        success: true,
        data: {
            timezone,
            source,
            isUserPreference: source === "user_profile",
        },
    };
}

/**
 * Handler: getSystemContext
 * Returns live system/environment data
 * @param {object} args - { sessionId }
 */
async function handleGetSystemContext(args = {}) {
    const { sessionId } = args;
    const session = getOrCreateSession(sessionId);

    // Calculate session duration
    const now = new Date();
    const durationMs = now - session.startedAt;
    const durationSeconds = Math.floor(durationMs / 1000);
    const durationMinutes = Math.floor(durationSeconds / 60);

    // Determine interaction state
    let interactionState = "new_session";
    if (session.interactionCount > 1) {
        const idleMs = now - session.lastActivityAt;
        if (idleMs > 300000) { // 5 minutes
            interactionState = "returning_after_idle";
        } else {
            interactionState = "active_conversation";
        }
    }

    return {
        success: true,
        data: {
            sessionId: session.id,
            sessionDuration: {
                milliseconds: durationMs,
                seconds: durationSeconds,
                minutes: durationMinutes,
                formatted: `${durationMinutes}m ${durationSeconds % 60}s`,
            },
            platform: session.platform,
            environment: process.env.NODE_ENV || "development",
            interactionState,
            interactionCount: session.interactionCount,
            serverTime: now.toISOString(),
        },
    };
}

/**
 * Handler: fetchLiveData
 * Fetches real-time data from external APIs
 * @param {object} args - { endpoint, method, headers, query, body, timeout }
 */
async function handleFetchLiveData(args = {}) {
    const {
        endpoint,
        method = "GET",
        headers = {},
        query = {},
        body = null,
        timeout = 10000,
    } = args;

    // Validate endpoint
    if (!endpoint || typeof endpoint !== "string") {
        return {
            success: false,
            error: "Invalid endpoint: must be a non-empty string",
        };
    }

    // Validate URL format
    let url;
    try {
        url = new URL(endpoint);
    } catch (e) {
        return {
            success: false,
            error: `Invalid URL format: ${endpoint}`,
        };
    }

    // Security: Block localhost and private IPs in production
    if (process.env.NODE_ENV === "production") {
        const hostname = url.hostname.toLowerCase();
        if (
            hostname === "localhost" ||
            hostname === "127.0.0.1" ||
            hostname.startsWith("192.168.") ||
            hostname.startsWith("10.") ||
            hostname.startsWith("172.")
        ) {
            return {
                success: false,
                error: "Access to internal/private endpoints is not allowed",
            };
        }
    }

    // Append query parameters
    Object.entries(query).forEach(([key, value]) => {
        url.searchParams.append(key, value);
    });

    // Prepare fetch options
    const fetchOptions = {
        method: method.toUpperCase(),
        headers: {
            "Accept": "application/json",
            "User-Agent": "VedaAI-MCP/1.0",
            ...headers,
        },
    };

    // Add body for POST requests
    if (method.toUpperCase() === "POST" && body) {
        fetchOptions.headers["Content-Type"] = "application/json";
        fetchOptions.body = JSON.stringify(body);
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    fetchOptions.signal = controller.signal;

    try {
        const response = await fetch(url.toString(), fetchOptions);
        clearTimeout(timeoutId);

        // Get response data
        let data;
        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        // Validate response size (limit to 1MB)
        const dataStr = JSON.stringify(data);
        if (dataStr.length > 1048576) {
            return {
                success: false,
                error: "Response too large (exceeds 1MB limit)",
            };
        }

        return {
            success: true,
            data: {
                status: response.status,
                statusText: response.statusText,
                contentType,
                data,
                fetchedAt: new Date().toISOString(),
            },
        };
    } catch (error) {
        clearTimeout(timeoutId);

        if (error.name === "AbortError") {
            return {
                success: false,
                error: `Request timeout after ${timeout}ms`,
            };
        }

        return {
            success: false,
            error: `Fetch failed: ${error.message}`,
        };
    }
}

/**
 * Update session platform info
 * @param {string} sessionId - Session ID
 * @param {string} platform - Platform identifier
 */
function updateSessionPlatform(sessionId, platform) {
    if (sessionStore.has(sessionId)) {
        sessionStore.get(sessionId).platform = platform;
    }
}

module.exports = {
    handleGetCurrentTime,
    handleGetUserTimezone,
    handleGetSystemContext,
    handleFetchLiveData,
    getOrCreateSession,
    updateSessionPlatform,
};
