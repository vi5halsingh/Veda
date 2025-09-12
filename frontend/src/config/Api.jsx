import axios from "axios";

// Create axios instance
const api = axios.create({
  baseURL: "https:localhost/api", 
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, 
});

export default api;
