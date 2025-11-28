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
app.use(cors({
  origin: ["http://localhost:5173", "https://veda-kx60.onrender.com", "http://localhost:4173"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  exposedHeaders: ["set-cookie"]
}));
const authRoutes = require("./routes/auth.routes");
const chatRoutes = require("./routes/chat.routes");

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

app.get('*name', (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
})

module.exports = app;
