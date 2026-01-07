/**
 * MCP Tool Definitions for Veda AI
 * Real-time contextual awareness tools
 */

const tools = [
    {
        name: "getCurrentTime",
        description: "Get the exact current time, date, day of week, and timezone. Always call this tool for time-related queries - never assume or guess time.",
        inputSchema: {
            type: "object",
            properties: {},
            required: [],
        },
    },
    {
        name: "getUserTimezone",
        description: "Detect user's timezone from profile or request metadata. Falls back to system timezone if unavailable.",
        inputSchema: {
            type: "object",
            properties: {
                userId: {
                    type: "string",
                    description: "Optional user ID to lookup timezone from profile",
                },
                requestMetadata: {
                    type: "object",
                    description: "Optional request metadata with timezone hints (e.g., timezone header)",
                },
            },
            required: [],
        },
    },
    {
        name: "getSystemContext",
        description: "Get live system/environment data including session info, platform, environment mode, and interaction state.",
        inputSchema: {
            type: "object",
            properties: {
                sessionId: {
                    type: "string",
                    description: "Session ID to get context for",
                },
            },
            required: [],
        },
    },
    {
        name: "fetchLiveData",
        description: "Fetch real-time data from external APIs. Use for weather, news, stats, or any live data needs. Validates and safely returns response to the model.",
        inputSchema: {
            type: "object",
            properties: {
                endpoint: {
                    type: "string",
                    description: "The API endpoint URL to fetch from",
                },
                method: {
                    type: "string",
                    enum: ["GET", "POST"],
                    description: "HTTP method (defaults to GET)",
                },
                headers: {
                    type: "object",
                    description: "Optional request headers as key-value pairs",
                },
                query: {
                    type: "object",
                    description: "Optional query parameters as key-value pairs",
                },
                body: {
                    type: "object",
                    description: "Optional request body for POST requests",
                },
                timeout: {
                    type: "number",
                    description: "Request timeout in milliseconds (default: 10000)",
                },
            },
            required: ["endpoint"],
        },
    },
];

module.exports = { tools };
