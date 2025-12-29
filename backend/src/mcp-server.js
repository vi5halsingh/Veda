const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");
const mongoose = require("mongoose");
const connectDB = require("./db/db");
const userModel = require("./models/user.model");
const chatModel = require("./models/chat.model");
const messageModel = require("./models/message.model");
require("dotenv").config();

// Connect to Database
connectDB();

/**
 * MCP Server Implementation
 */
const server = new Server(
    {
        name: "veda-chatbot-server",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

/**
 * Define Tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "list_users",
                description: "List all registered users in the system",
                inputSchema: {
                    type: "object",
                    properties: {
                        apiKey: { type: "string", description: "Security API Key defined in .env" }
                    },
                    required: ["apiKey"],
                },
            },
            {
                name: "get_user_chats",
                description: "Get all chat titles for a specific user email",
                inputSchema: {
                    type: "object",
                    properties: {
                        email: { type: "string", description: "User's email" },
                        apiKey: { type: "string", description: "Security API Key defined in .env" }
                    },
                    required: ["email", "apiKey"],
                },
            },
            {
                name: "get_chat_messages",
                description: "Get message history for a specific chat ID",
                inputSchema: {
                    type: "object",
                    properties: {
                        chatId: { type: "string", description: "The ID of the chat" },
                        apiKey: { type: "string", description: "Security API Key defined in .env" }
                    },
                    required: ["chatId", "apiKey"],
                },
            },
        ],
    };
});

/**
 * Handle Tool Calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    // Security Check: Only allow requests with valid API key if configured
    const allowedApiKey = process.env.MCP_API_KEY;
    if (allowedApiKey && args.apiKey !== allowedApiKey) {
        return {
            isError: true,
            content: [{ type: "text", text: "Unauthorized: Invalid or missing apiKey argument." }],
        };
    }

    try {
        switch (name) {
            case "list_users": {
                const users = await userModel.find({}, "email fullname");
                return {
                    content: [{ type: "text", text: JSON.stringify(users, null, 2) }],
                };
            }

            case "get_user_chats": {
                const user = await userModel.findOne({ email: args.email });
                if (!user) throw new Error("User not found");
                const chats = await chatModel.find({ user: user._id });
                return {
                    content: [{ type: "text", text: JSON.stringify(chats, null, 2) }],
                };
            }

            case "get_chat_messages": {
                const messages = await messageModel.find({ chat: args.chatId }).sort({ createdAt: 1 });
                return {
                    content: [{ type: "text", text: JSON.stringify(messages, null, 2) }],
                };
            }

            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    } catch (error) {
        return {
            isError: true,
            content: [{ type: "text", text: error.message }],
        };
    }
});

/**
 * Start Server
 */
async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Veda MCP Server running on stdio");
}

runServer().catch(console.error);
