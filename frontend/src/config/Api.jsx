import axios from "axios";

// Create axios instance
const api = axios.create({
  baseURL: "https://veda-kx60.onrender.com/api",
  // For local development, uncomment below:
  // baseURL: "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  credentials: 'include'
});

export default api;
