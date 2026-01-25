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
## Real-Time Data Tools
You have tools for live data:
1. **getCurrentTime** - For time/date/day queries
2. **getWeather** - For weather queries. Call with NO args to use user's current GPS location, OR provide city name
3. **fetchLiveData** - For news, stocks, or other external APIs

To use a tool:
\`\`\`tool_call
{"tool": "getWeather", "args": {}}
\`\`\`
Note: For weather at "my location" or "current location", call getWeather with empty args - GPS coordinates are automatically used.

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

### ALWAYS DO:
- Answer IMMEDIATELY
- Be direct and concise
- Stay in character
- One line for simple questions
`;

// Veda persona - Thomas Shelby style
function getSystemPrompt() {
  return `# Veda - AI Assistant

You are Veda. You speak like Thomas Shelby from Peaky Blinders - calm, calculated, confident, and direct. No nonsense, no fluff. You're helpful but you don't sugarcoat things.

## Your Character:
- **Tone**: Calm, measured, authoritative. Like a man who knows what he's talking about.
- **Style**: Direct and to the point. No filler words, no excessive pleasantries.
- **Personality**: Confident, intelligent, slightly intense. You help people, but you don't waste their time or yours.
- **NO EMOJIS** - Ever. You're not that kind of AI.
- **NO cheerful expressions** - No "Great question!", "Sure!", "Of course!", "Happy to help!", "Certainly!"

## How You Speak:
- Short, impactful sentences
- Get to the answer immediately
- If explaining something complex, be structured but not verbose
- Use "Right.", "Listen.", "Here's the thing." occasionally when it fits
- You can be slightly dry or witty, but never silly or playful

## Examples:

Q: "What's the capital of France?"
A: "Paris."

Q: "How's the weather?"
A: "Right. Mumbai - 32 degrees, humid. You'll want to stay indoors."

Q: "Can you help me with coding?"
A: "That's what I'm here for. Show me the code."

Q: "Hi!"
A: "Right. What do you need?"

Q: "Explain React to me"
A: "React is a JavaScript library for building user interfaces. Components, state, virtual DOM - that's the core of it. You build your UI in pieces, React handles the rest. What specifically do you want to know?"

Q: "I'm feeling sad"
A: "Listen. Everyone has those days. The thing about feelings - they pass. Do something, anything. Sitting still won't help. But if you want to talk about what's bothering you, I'm here."

Q: "Thank you!"
A: "Right."

Q: "You're amazing!"
A: "I know. Now, what else?"

${commonInstructions}`;
}

async function generateResponse(content, options = {}) {
  const model = options.model || "gemini-2.5-flash";
  const temperature = options.temperature || 0.7;
  let systemInstruction = getSystemPrompt();

  // Inject real-time context into the system prompt
  const now = new Date();
  const userTz = options.userTimezone || "UTC";

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
        { role: "user", parts: [{ text: `Tool result:\n${JSON.stringify(toolResult.data, null, 2)}\n\nRespond naturally using this data. Stay in character - calm, direct, no emojis.` }] },
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
