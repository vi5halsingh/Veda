# Veda AI - High-Performance Intelligent Chat Ecosystem

<p align="center">
  <img src="./frontend/public/logo.svg" alt="Veda AI Logo" width="120" />
</p>

<p align="center">
  <strong>A production-grade, real-time AI chat application powered by Google Gemini, Pinecone Vector Memory, and the Model Context Protocol (MCP).</strong>
</p>

---

## 🏗️ Industry-Level Architecture

Veda AI is built using a modern, scalable micro-architecture designed for persistence, intelligence, and real-time interaction.

### System Overview
- **Core Engine:** Node.js Express Server handling authentication, chat orchestration, and AI service integration.
- **Real-time Layer:** Socket.io for low-latency, bi-directional communication between the client and server.
- **Intelligence Layer:** Google Gemini 1.5/2.0 Pro for LLM capabilities, integrated via `@google/genai`.
- **Memory Layer:** Pinecone Vector Database for long-term "semantic" memory, enabling context-aware retrieval (RAG).
- **Extensibility:** Integrated **Model Context Protocol (MCP)** server for standardized tool-calling and system awareness.
- **Persistence:** MongoDB with Mongoose for structured data (Users, Chat History, Metadata).

---

## ✨ Key Features

- 🧠 **Persistent AI Memory:** Uses Pinecone to store and retrieve conversation embeddings, giving the AI long-term memory across sessions.
- 🛠️ **MCP Integration:** A dedicated MCP server allows the AI to interact with system tools, fetch live data, and understand user context (Time, Timezone, System Context).
- ⚡ **Real-Time Streaming:** Fluid chat experience with Socket.io and AI response streaming.
- 🔐 **Enterprise Auth:** Secure JWT-based authentication with HTTP-only cookie storage and protected route middleware.
- 🎨 **Premium UI/UX:** Built with React 19, Vite, and Tailwind CSS 4.0, featuring:
  - Markdown Support with Syntax Highlighting.
  - Dark/Light Mode.
  - Responsive Sidebar & Chat Management.
  - **PWA Ready:** Mobile-friendly Progressive Web App integration.
- 📊 **Usage Management:** Built-in token/message limits per user (Default: 30 messages/day).

---

## 🛠️ Tech Stack & Versions

| Layer | Technology | Version |
| :--- | :--- | :--- |
| **Frontend** | React | `^19.1.1` |
| | Vite | `^7.1.2` |
| | Tailwind CSS | `^4.1.12` |
| | Socket.io Client | `^4.8.1` |
| **Backend** | Node.js | `^18.x / 20.x` |
| | Express | `^5.1.0` |
| | Mongoose | `^8.17.1` |
| | Socket.io | `^4.8.1` |
| **AI/ML** | Google GenAI | `^1.14.0` |
| | Pinecone SDK | `^6.1.2` |
| | MCP SDK | `^1.25.1` |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **MongoDB** (Local instance or Atlas)
- **Google AI Studio API Key** (for Gemini)
- **Pinecone API Key & Index** (Index name: `veda`)

### 📦 Installation

1. **Clone the Project**
   ```bash
   git clone https://github.com/vi5halsingh/Veda.git
   cd Veda
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend/` directory:
   ```env
   PORT=3000
   MONGO_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   GEMINI_API_KEY=your_google_gemini_key
   PINECONE_API_KEY=your_pinecone_key
   MCP_API_KEY=your_internal_mcp_api_key
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```
   Create a `.env` file in the `frontend/` directory:
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```

---

## ⚙️ Running the Application

### Development Mode
Run the backend and frontend simultaneously:

**Terminal 1: Backend**
```bash
cd backend
npm run dev
```

**Terminal 2: Frontend**
```bash
cd frontend
npm run dev
```

**Terminal 3: MCP Server (Optional/Inspection)**
```bash
cd backend
npm run mcp
# Or use inspector
npm run inspect
```

The application will be available at `http://localhost:5173`.

---

## 📁 Project Structure

```text
Veda/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   ├── db/               # Database connection
│   │   ├── mcp/              # MCP tool definitions & handlers
│   │   ├── models/           # Mongoose schemas (User, Chat, Message)
│   │   ├── routes/           # Express routes (Auth, Chat, MCP)
│   │   ├── services/         # Business logic (AI, Vector, MCP)
│   │   ├── sockets/          # Socket.io events
│   │   └── server.js         # Entry point
│   └── public/               # Static assets
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # View components (Login, Dashboard)
│   │   ├── services/         # API integration
│   │   ├── config/           # Axios & Route configs
│   │   └── App.jsx           # Main application logic
│   └── public/               # Frontend assets
└── README.md
```

---

## 🛡️ Security Features
- **CORS Protection:** Configured with specific origins and credentials.
- **JWT Auth:** Token-based security for all sensitive endpoints.
- **Rate Limiting:** Message limits to prevent API abuse.
- **Error Handling:** Centralized server-side error management.

---

## 📜 License
This project is licensed under the MIT License.

---
<p align="center">
  Built with ❤️ by <a href="https://github.com/vi5halsingh">Vishal Singh</a>
</p>