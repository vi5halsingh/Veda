const express = require("express");
const cookieParser = require("cookie-parser");
const connectDB = require("./db/db");
const cors = require("cors");
const path = require("path");
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "../public")));
connectDB();
// CORS configuration - simplified for local development
app.use(cors({
  origin: [
    "http://localhost:5173",      // Local Vite dev
    "http://localhost:4173",      // Local Vite preview
    "https://veda-kx60.onrender.com", // Backend URL
    // Add your deployed frontend URL here when deploying:
    // "https://your-frontend-app.vercel.app",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));
const authRoutes = require("./routes/auth.routes");
const chatRoutes = require("./routes/chat.routes");

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

app.get('*name', (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
})

module.exports = app;
