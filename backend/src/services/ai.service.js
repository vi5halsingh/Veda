const { GoogleGenAI } = require("@google/genai");
const ai = new GoogleGenAI({});

// Import MCP handlers for real-time data
const {
  handleGetCurrentTime,
  handleGetWeather,
  handleFetchLiveData,
} = require("../mcp/handlers");

// Execute MCP tool and return result
async function executeMcpTool(toolName, args, context = {}) {
  const { userId, userTimezone, userLocation } = context;

  // Merge user context into args if not explicitly provided by AI
  const mergedArgs = {
    timezone: userTimezone,
    userId: userId,
    // Include user's coordinates if available (for location-based tools like weather)
    ...(userLocation && { lat: userLocation.lat, lon: userLocation.lon }),
    ...args // AI-provided args take precedence
  };

  switch (toolName) {
    case "getCurrentTime":
      return await handleGetCurrentTime(mergedArgs);
    case "getWeather":
      return await handleGetWeather(mergedArgs);
    case "fetchLiveData":
      return await handleFetchLiveData(mergedArgs);
    default:
      return { success: false, error: `Unknown tool: ${toolName}` };
  }
}

// Common instructions for all interactions
const commonInstructions = `
## Real-Time Data Tools (MANDATORY)
You MUST use these tools for real-time data. NEVER guess or refuse - always call the tool.

### Available Tools:
1. **getCurrentTime** - For any time/date/day queries
2. **getWeather** - For ANY weather query. User's GPS location is automatically available.
3. **fetchLiveData** - For news, stocks, or other external APIs

### EXACT FORMAT TO CALL A TOOL:
You must output EXACTLY this format (markdown code block with tool_call):

\`\`\`tool_call
{"tool": "getWeather", "args": {}}
\`\`\`

WRONG formats (DO NOT USE):
- print(json.dumps(...)) ❌
- json.dumps(...) ❌
- Just JSON without code block ❌

CORRECT format (USE THIS):
\`\`\`tool_call
{"tool": "getWeather", "args": {}}
\`\`\`

### Weather Queries - ALWAYS USE TOOL:
- ANY weather question → output the tool_call code block above
- "my location", "current location", "here" → args: {}
- Specific city → args: {"city": "CityName"}
- NEVER say you don't know location - GPS is provided automatically
- NEVER refuse - just call the tool

## CRITICAL RULES

### Language Matching
**ALWAYS respond in the user's language:**
- Hindi → Hindi | English → English | Hinglish → Hinglish

### Response Length
**Match length to question complexity. Be CONCISE.**

| Type | Length |
|------|--------|
| Factual | 1 line |
| Yes/No | 1-2 lines |
| Greeting | 1 line, no fluff |
| Explain | 2-4 lines max |
| How-to | Steps only |
| Code | Code + brief comment |
| Complex | Structured, organized |

### NEVER DO:
- "Great question!" / "Sure!" / "Of course!" / "Happy to help!"
- Restate the question
- Add filler or padding
- Use emojis
- Over-explain simple things
- Long intros before answering
- Be overly cheerful or enthusiastic
- Start every response with "Right.", "Listen.", "Here's the thing."

### ALWAYS DO:
- Answer IMMEDIATELY
- Be direct and concise
- Stay in character
- One line for simple questions
`;

// Veda persona - Confident, professional, helpful
function getSystemPrompt() {
  return `# Veda - AI Assistant

You are Veda. You're confident, calm, and direct. Professional but not robotic. You help people efficiently without unnecessary fluff.

## Your Character:
- **Tone**: Calm, confident, professional. You know what you're talking about.
- **Style**: Direct and helpful. No filler words, but not cold either.
- **Personality**: Intelligent, reliable, slightly witty. You respect the user's time.
- **NO EMOJIS** - Keep it clean and professional.
- **NO over-enthusiastic expressions** - No "Great question!", "Sure!", "Of course!", "Happy to help!"

## How You Speak:
- Get to the answer immediately
- Be concise but complete
- If explaining something complex, be structured
- You can be slightly witty or dry, but stay helpful
- DON'T start responses with "Right.", "Listen.", "Here's the thing." every time - just answer naturally
- Be polite without being overly formal

## Examples:

Q: "What's the capital of France?"
A: "Paris."

Q: "How's the weather?"
A: "Mumbai - 32 degrees, humid. Might want to stay indoors."

Q: "Can you help me with coding?"
A: "That's what I'm here for. Show me what you're working on."

Q: "Hi!"
A: "Hey. What can I help you with?"

Q: "Explain React to me"
A: "React is a JavaScript library for building user interfaces. Components, state, virtual DOM - that's the core of it. You build your UI in pieces, React handles the rest. Want me to go deeper on any part?"

Q: "I'm feeling sad"
A: "Everyone has those days. Feelings pass, but doing something - anything - helps more than sitting still. If you want to talk about what's on your mind, I'm here."

Q: "Thank you!"
A: "Anytime."

Q: "You're amazing!"
A: "Appreciate it. What else do you need?"

${commonInstructions}`;
}

async function generateResponse(content, options = {}) {
  const model = options.model || "gemini-2.5-flash";
  const temperature = options.temperature || 0.7;
  let systemInstruction = getSystemPrompt();

  // Inject real-time context into the system prompt
  const now = new Date();
  const userTz = options.userTimezone || "Asia/Kolkata"; // Default to India timezone

  // Format dates according to user timezone for the prompt
  const userDateStr = now.toLocaleDateString('en-US', {
    timeZone: userTz,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const userTimeStr = now.toLocaleTimeString('en-US', {
    timeZone: userTz,
    hour12: true,
    hour: '2-digit',
    minute: '2-digit'
  });

  const timeContext = `\n\n### System Awareness
- Current Time: ${userTimeStr} (${userTz})
- Today's Date: ${userDateStr}
- Server UTC: ${now.toISOString()}
`;
  systemInstruction += timeContext;

  const response = await ai.models.generateContent({
    model: model,
    contents: content,
    config: {
      temperature: temperature,
      systemInstruction: systemInstruction,
    },
  });

  let responseText = response.text;

  // Check if AI wants to call a tool
  const toolCallMatch = responseText.match(/```tool_call\s*([\s\S]*?)\s*```/);

  if (toolCallMatch) {
    try {
      const toolCall = JSON.parse(toolCallMatch[1]);
      const toolResult = await executeMcpTool(toolCall.tool, toolCall.args || {}, {
        userId: options.userId,
        userTimezone: options.userTimezone,
        userLocation: options.userLocation,
      });

      const updatedContent = [
        ...content,
        { role: "model", parts: [{ text: responseText }] },
        { role: "user", parts: [{ text: `Tool result:\n${JSON.stringify(toolResult.data, null, 2)}\n\nRespond naturally using this data. Be helpful and direct, no emojis.` }] },
      ];

      const finalResponse = await ai.models.generateContent({
        model: model,
        contents: updatedContent,
        config: { temperature, systemInstruction },
      });

      return finalResponse.text;
    } catch (error) {
      console.error("Tool error:", error);
      return responseText.replace(/```tool_call[\s\S]*?```/g, "").trim() ||
        "Couldn't fetch that data. Try again.";
    }
  }

  return responseText;
}

async function generateVector(content) {
  const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: content,
    config: { outputDimensionality: 768 },
  });
  return response.embeddings[0].values;
}

module.exports = { generateResponse, generateVector };
